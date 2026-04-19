import { now } from "moment";
import { App, MarkdownView, Notice, Platform } from "obsidian";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { Card } from "src/card/card";
import {
    DeckStats,
    FlashcardReviewMode,
    IFlashcardReviewSequencer,
} from "src/card/flashcard-review-sequencer";
import { Question } from "src/card/questions/question";
import { Deck } from "src/deck/deck";
import SRPlugin from "src/main";
import { Note } from "src/note/note";
import { SRSettings } from "src/settings";
import { CardContainer } from "src/ui/obsidian-ui-components/content-container/card-container/card-container";
import CardInfoNotice from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar-buttons/card-info-notice";
import { DeckContainer } from "src/ui/obsidian-ui-components/content-container/deck-container/deck-container";
import { FlashcardEditModal } from "src/ui/obsidian-ui-components/modals/edit-modal";
import { ReviewQueueLoader } from "src/ui/review-queue-loader";
import { globalDateProvider } from "src/utils/dates";
import EmulatedPlatform from "src/utils/platform-detector";

export enum ContentState {
    Deck,
    CardFront,
    CardBack,
    Closed,
}

export enum CardState {
    Front,
    Back,
    Closed,
}

export interface CardData {
    currentCard: Card;
    currentCardState: CardState;
}

export interface DeckData {
    chosenDeck: Deck;
    currentDeck: Deck | null;
    previousDeck: Deck | null;
    currentDeckTotalCardsInQueue: number;
    currentDeckStats: DeckStats;
    previousDeckStats: DeckStats | null;
    chosenDeckStats: DeckStats;
}

export interface SessionData {
    cardData: CardData;
    deckData: DeckData;

    totalDecksInSession: number;
    totalCardsInSession: number;

    currentQuestion: Question;
    currentNote: Note;
}

/**
 * Manages the content of the deck and flashcard views, by determining their behavior.
 *
 * @method open - Opens the content manager, loading the review queue and initializing the deck and flashcard views.
 * @method close - Closes the content manager, shutting down the deck and flashcard views.
 */
export default class ContentManager {
    private app: App;
    private plugin: SRPlugin;
    private reviewSequencer: IFlashcardReviewSequencer | null = null;
    private settings: SRSettings;
    private reviewMode: FlashcardReviewMode;
    private deckContainer: DeckContainer;
    private cardContainer: CardContainer;

    private reviewQueueLoader: ReviewQueueLoader;
    private sessionData: SessionData | null = null;

    private lastPressedOnProcessReview: number = 0;

    constructor(
        app: App,
        plugin: SRPlugin,
        reviewQueueLoader: ReviewQueueLoader,
        settings: SRSettings,
        parentEl: HTMLElement,
        closeModal?: () => void,
    ) {
        this.app = app;
        this.plugin = plugin;
        this.reviewQueueLoader = reviewQueueLoader;
        this.settings = settings;
        this.reviewMode = reviewQueueLoader.getReviewMode();

        this.deckContainer = new DeckContainer(
            parentEl,
            this._changeReviewMode.bind(this),
            this._startReviewOfDeck.bind(this),
            closeModal,
        );

        this.cardContainer = new CardContainer(
            this.app,
            this.plugin,
            this.settings,
            parentEl,
            this._showDecksList.bind(this),
            this._doEditQuestionText.bind(this),
            this._processReview.bind(this),
            this._skipCurrentCard.bind(this),
            this._showAnswer.bind(this),
            this._jumpToCurrentCard.bind(this),
            this._displayCurrentCardInfoNotice.bind(this),
            closeModal,
        );
    }

    public close() {
        this.plugin.uiManager.setSRViewInFocus(false);
        this.deckContainer.closeList();
        this.cardContainer.closeSession();
    }

    public async open() {
        // Prepare a review queue to display
        this.reviewSequencer = await this.reviewQueueLoader.loadReviewQueue();

        // Determine if the card view should be opened immediately
        const subdecksWithCardsInQueue: Deck[] = this.reviewSequencer.getSubDecksWithCardsInQueue(
            this.reviewSequencer.originalDeckTree,
        );

        let openImmediately: boolean = false;
        let deckWithCards: Deck | null = null;

        // Loop through all decks and determine if any have cards in queue
        for (const subdeck of subdecksWithCardsInQueue) {
            const hasNewCards: boolean = subdeck.newFlashcards.length > 0;
            const hasDueCards: boolean = subdeck.dueFlashcards.length > 0;
            const hasDueCardsToday: boolean =
                hasDueCards &&
                subdeck.dueFlashcards.some((card) => {
                    const dueDate: number = card.scheduleInfo.dueDateAsUnix;
                    const today: number = globalDateProvider.today.valueOf();
                    return dueDate < today;
                });

            const hasCardsToday: boolean = hasNewCards || hasDueCardsToday;

            if (
                openImmediately &&
                (hasCardsToday || this.reviewMode === FlashcardReviewMode.Cram)
            ) {
                openImmediately = false;
                break;
            }

            if (hasCardsToday || this.reviewMode === FlashcardReviewMode.Cram) {
                openImmediately = true;
                deckWithCards = subdeck;
            }
        }

        if (openImmediately && deckWithCards !== null) {
            this._reviewDeck(deckWithCards);
        } else {
            this._showDecksList();
        }
    }

    // MARK: Content Manager

    private async _showDecksList(reloadReviewQueue: boolean = false): Promise<void> {
        if (reloadReviewQueue) {
            this.reviewSequencer = await this.reviewQueueLoader.loadReviewQueue();
        }
        if (this.reviewSequencer === null) return;
        this.cardContainer.closeSession();
        this.deckContainer.showList(this.reviewSequencer, this.settings, this.reviewMode);
    }

    private _reviewDeck(deck: Deck): void {
        this.deckContainer.closeList();
        this.sessionData = this._getNewSessionData(deck);
        if (this.sessionData === null) return;
        this.cardContainer.openSession(this.sessionData, this.settings);
    }

    private async _showNextCard(): Promise<void> {
        if (
            this.sessionData === null ||
            this.reviewSequencer === null ||
            this.reviewSequencer.currentDeck === null
        ) {
            this._showDecksList(true);
            return;
        }

        this.sessionData.deckData.previousDeck = this.sessionData.deckData.currentDeck;
        this.sessionData.deckData.currentDeck = this.reviewSequencer.currentDeck;
        this.sessionData.deckData.previousDeckStats = this.sessionData.deckData.currentDeckStats;

        const currentDeckStats = this.reviewSequencer.getDeckStats(
            this.reviewSequencer.currentDeck.getTopicPath(),
        );

        this.sessionData.deckData.currentDeckStats = currentDeckStats;

        this.sessionData.deckData.currentDeckTotalCardsInQueue =
            currentDeckStats.cardsInQueueOfThisDeckCount;

        this.sessionData.currentNote = this.reviewSequencer.currentNote;
        this.sessionData.currentQuestion = this.reviewSequencer.currentQuestion;

        this.sessionData.cardData.currentCard = this.reviewSequencer.currentCard;
        this.sessionData.cardData.currentCardState = CardState.Front;

        if (
            this.sessionData.cardData.currentCard !== null &&
            this.sessionData.cardData.currentCard !== undefined
        ) {
            await this.cardContainer.drawCardFront(this.sessionData, this.settings);
        } else {
            this._showDecksList(true);
        }
    }

    private _getNewSessionData(deck: Deck): SessionData | null {
        if (this.reviewSequencer === null) return null;
        const deckStats = this.reviewSequencer.getDeckStats(deck.getTopicPath());
        const totalCardsInSession: number = deckStats.cardsInQueueCount;
        const totalDecksInSession: number = deckStats.decksInQueueOfThisDeckCount;
        const currentCardState: CardState = CardState.Front;

        const currentDeckStats = this.reviewSequencer.getDeckStats(
            this.reviewSequencer.currentDeck.getTopicPath(),
        );

        const chosenDeckStats = this.reviewSequencer.getDeckStats(deck.getTopicPath());

        return {
            cardData: {
                currentCard: this.reviewSequencer.currentCard,
                currentCardState,
            },
            deckData: {
                chosenDeck: deck,
                currentDeck: this.reviewSequencer.currentDeck,
                previousDeck: null,
                currentDeckTotalCardsInQueue: currentDeckStats.cardsInQueueOfThisDeckCount,
                currentDeckStats: currentDeckStats,
                previousDeckStats: null,
                chosenDeckStats: chosenDeckStats,
            },
            totalCardsInSession,
            totalDecksInSession,
            currentQuestion: this.reviewSequencer.currentQuestion,
            currentNote: this.reviewSequencer.currentNote,
        };
    }

    // MARK: Card button handlers

    private _showAnswer() {
        if (this.sessionData === null) return;

        const timeNow = now();
        if (
            this.lastPressedOnProcessReview &&
            timeNow - this.lastPressedOnProcessReview < this.plugin.data.settings.reviewButtonDelay
        ) {
            return;
        }
        this.lastPressedOnProcessReview = timeNow;

        this.sessionData.cardData.currentCardState = CardState.Back;

        this.cardContainer.drawBack(
            this.sessionData,
            this.reviewMode,
            this.settings,
            this._determineButtonInterval.bind(this),
        );
    }

    private async _doEditQuestionText(): Promise<void> {
        if (this.reviewSequencer === null) return;
        const currentQ: Question = this.reviewSequencer.currentQuestion;

        // Just the question/answer text; without any preceding topic tag
        const textPrompt = currentQ.questionText.actualQuestion;

        const editModal = FlashcardEditModal.Prompt(
            this.app,
            textPrompt,
            currentQ.questionText.textDirection,
        );
        editModal
            .then(async (modifiedCardText) => {
                if (this.reviewSequencer === null) return;
                this.reviewSequencer.updateCurrentQuestionText(modifiedCardText);
            })
            .catch((reason) => console.log(reason));
    }

    private async _jumpToCurrentCard(): Promise<void> {
        if (this.reviewSequencer === null) return;
        const currentQuestion = this.reviewSequencer.currentQuestion;
        if (!currentQuestion) return;

        if (
            (!this.settings.openViewInNewTab &&
                !(Platform.isMobile || EmulatedPlatform().isMobile)) ||
            (!this.settings.openViewInNewTabMobile &&
                (Platform.isMobile || EmulatedPlatform().isMobile))
        ) {
            new Notice("Note was opened in new tab in the background");
        }

        const file = currentQuestion.note.file.tfile;
        const blockId = currentQuestion.questionText.obsidianBlockId;
        const line = Math.max(0, currentQuestion.lineNo ?? 0);

        if (blockId) {
            await this.app.workspace.openLinkText(`${file.path}#${blockId}`, file.path, false);
            return;
        }

        // If the file is already open in another leaf, open it in the current one to prevent duplicates
        const existingLeaf = this.app.workspace.getLeavesOfType("markdown").find((leaf) => {
            const view = leaf.view as MarkdownView;
            return view.file?.path === file.path;
        });

        if (existingLeaf) {
            await existingLeaf.openFile(file, { eState: { line } });
            this.app.workspace.setActiveLeaf(existingLeaf);
            const markdownView = existingLeaf.view as MarkdownView;
            if (markdownView?.editor) {
                markdownView.editor.setCursor({ line, ch: 0 });
                markdownView.editor.scrollIntoView({ from: { line, ch: 0 }, to: { line, ch: 0 } });
            }
            return;
        }

        const leaf = this.app.workspace.getLeaf("tab");
        await leaf.openFile(file, { eState: { line } });

        const markdownView = leaf.view as MarkdownView;
        if (markdownView?.editor) {
            markdownView.editor.setCursor({ line, ch: 0 });
            markdownView.editor.scrollIntoView({ from: { line, ch: 0 }, to: { line, ch: 0 } });
        }
    }

    private _skipCurrentCard() {
        if (this.reviewSequencer === null) return;
        this.reviewSequencer.skipCurrentCard();
        this._showNextCard();
    }

    private _displayCurrentCardInfoNotice() {
        if (this.sessionData === null) return;
        new CardInfoNotice(
            this.sessionData.cardData.currentCard.scheduleInfo,
            this.sessionData.currentNote.file.path,
        );
    }

    private async _processReview(response: ReviewResponse): Promise<void> {
        if (this.reviewSequencer === null) return;
        const timeNow = now();
        if (
            timeNow - this.lastPressedOnProcessReview <
            this.plugin.data.settings.reviewButtonDelay
        ) {
            return;
        }
        this.lastPressedOnProcessReview = timeNow;

        await this.reviewSequencer.processReview(response);
        await this._showNextCard();
    }

    // MARK: Deck button handlers

    private _startReviewOfDeck(deck: Deck) {
        if (this.reviewSequencer === null) return;
        this.reviewSequencer.setCurrentDeck(deck.getTopicPath());
        if (this.reviewSequencer.hasCurrentCard) {
            this._reviewDeck(deck);
        } else {
            this._showDecksList();
        }
    }

    private async _changeReviewMode(reviewMode: FlashcardReviewMode) {
        this.reviewQueueLoader.setReviewMode(reviewMode);
        this.reviewMode = reviewMode;
        this.reviewSequencer = await this.reviewQueueLoader.loadReviewQueue();
        this.deckContainer.closeList();
        this._showDecksList();
    }

    // MARK: Utils

    private _determineButtonInterval(reviewResponse: ReviewResponse): number {
        if (this.sessionData === null) return 0;
        if (this.reviewSequencer === null) return 0;
        const schedule: RepItemScheduleInfo = this.reviewSequencer.determineCardSchedule(
            reviewResponse,
            this.sessionData.cardData.currentCard,
        );
        return schedule.interval;
    }
}
