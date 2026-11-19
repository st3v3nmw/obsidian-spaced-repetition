import { now } from "moment";
import { App, MarkdownView, Notice, Platform } from "obsidian";

import { DataManager } from "src/data/data-manager";
import { Card } from "src/data/data-structures/card/card";
import { Question } from "src/data/data-structures/card/questions/question";
import { Deck } from "src/data/data-structures/deck/deck";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { ISerializedScheduleEntry } from "src/data/plugin-data";
import { SRSettings } from "src/data/settings";
import {
    CardRef,
    CardReviewedPayload,
    CardSkippedPayload,
    CardSuspendedPayload,
    formatDeckForHistory,
    HistoryEventBase,
    HistoryEventPayload,
    reviewModeName,
    reviewResponseName,
} from "src/history/history-events";
import { generateSessionId } from "src/history/history-recorder";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { Note } from "src/note/note";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import {
    createCardMatch,
    DeckStats,
    FlashcardReviewMode,
    IFlashcardReviewSequencer,
    restoreUndoSnapshotPersistentState,
    ReviewUndoSnapshot,
} from "src/scheduling/flashcard-review-sequencer";
import { CardContainer } from "src/ui/obsidian-ui-components/content-container/card-container/card-container";
import CardInfoNotice from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar-buttons/card-info-notice";
import { DeckContainer } from "src/ui/obsidian-ui-components/content-container/deck-container/deck-container";
import { ConfirmationModal } from "src/ui/obsidian-ui-components/modals/confirmation-modal";
import { FlashcardEditModal } from "src/ui/obsidian-ui-components/modals/edit-modal";
import { ReviewQueueLoader } from "src/ui/review-queue-loader";
import { UIManager, UIState } from "src/ui/ui-manager";
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
    currentCard: Card | null;
    currentCardState: CardState;
}

export interface DeckData {
    chosenDeck: Deck;
    currentDeck: Deck | null;
    previousDeck: Deck | null;
    currentDeckTotalCardsInQueue: number;
    currentDeckStats: DeckStats | null;
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

type UndoableEvent = HistoryEventBase &
    (CardReviewedPayload | CardSkippedPayload | CardSuspendedPayload);

/**
 * An action on the current card that can be undone and redone (review, reset, skip, suspend).
 */
type UndoableAction =
    | { type: "card_reviewed"; response: ReviewResponse }
    | { type: "card_skipped" }
    | { type: "card_suspended" };

interface ReviewUndoEntry {
    snapshot: ReviewUndoSnapshot;
    // The review queue the action happened in. If the queue was reloaded since, only the stored state can be
    // restored, and the card is looked up in the new queue.
    sequencer: IFlashcardReviewSequencer;
    chosenDeckTopicPath: TopicPath;
    action: UndoableAction;
    // The recorded history event, null if recording the usage history is disabled
    event: UndoableEvent | null;
}

/**
 * An undone action, which can be redone as long as nothing else was done since.
 */
interface RedoEntry {
    action: UndoableAction;
    card: Card;
    // Redo is only possible within the review queue the action was undone in
    sequencer: IFlashcardReviewSequencer;
    sessionTopicPath: TopicPath;
    // The history event of the undone action, null if recording the usage history was disabled
    originalEvent: UndoableEvent | null;
}

interface RedoInfo {
    originalEvent: UndoableEvent | null;
}

// Undo is available for this many of the latest actions
const MAX_UNDO_ENTRIES = 100;

function serializeSchedule(
    scheduleInfo: RepItemScheduleInfo | null,
): ISerializedScheduleEntry | null {
    return scheduleInfo === null ? null : scheduleInfo.serializeSchedule();
}

// TODO: Refactor/integrate this code with the backend

/**
 * Manages the content of the deck and flashcard views, by determining their behavior.
 *
 * @method open - Opens the content manager, loading the review queue and initializing the deck and flashcard views.
 * @method close - Closes the content manager, shutting down the deck and flashcard views.
 */
export default class ContentManager {
    private app: App;
    private plugin: SRPlugin;
    private uiManager: UIManager;
    private dataManager: DataManager;
    private reviewSequencer: IFlashcardReviewSequencer | null = null;
    private settings: SRSettings;
    private reviewMode: FlashcardReviewMode;
    private deckContainer: DeckContainer;
    private cardContainer: CardContainer;

    private reviewQueueLoader: ReviewQueueLoader;
    private sessionData: SessionData | null = null;

    private lastPressedOnProcessReview: number = 0;
    private pendingResumeTimeout: number | null = null;

    // Usage history
    private sessionId: string | null = null;
    private cardShownAt: number | null = null;
    private answerShownAt: number | null = null;

    // Latest action last
    private undoStack: ReviewUndoEntry[] = [];
    // Latest undone action last
    private redoStack: RedoEntry[] = [];
    // Actions that change the review queue (review, skip, suspend, undo) run one after another
    private actionQueue: Promise<void> = Promise.resolve();

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

        this.uiManager = this.plugin.uiManager;
        this.dataManager = this.plugin.dataManager;

        this.deckContainer = new DeckContainer(
            parentEl,
            this._changeReviewMode.bind(this),
            this._startReviewOfDeck.bind(this),
            () => this._undoLastAction(),
            closeModal,
        );

        this.cardContainer = new CardContainer(
            this.app,
            this.plugin,
            this.settings,
            parentEl,
            this._deleteCurrentCard.bind(this),
            this._showDecksList.bind(this),
            this._doEditQuestionText.bind(this),
            this._processReview.bind(this),
            this._skipCurrentCard.bind(this),
            () => this._suspendCurrentCard(),
            this._showAnswer.bind(this),
            this._jumpToCurrentCard.bind(this),
            this._displayCurrentCardInfoNotice.bind(this),
            () => this._undoLastAction(),
            () => this._redoLastUndoneAction(),
            closeModal,
        );
        this._updateUndoAvailability();
    }

    public close() {
        this._clearPendingResumeTimeout();
        activeDocument.removeEventListener("keydown", this._undoKeydownHandler);
        this.uiManager.setSRViewInFocus(false);
        this.deckContainer.closeList();
        this.cardContainer.closeSession();
        this.uiManager.setUIState(UIState.Closed);
        if (this.sessionId !== null) {
            void this._recordEvent({ type: "session_ended" });
        }
    }

    public async open() {
        this.sessionId = generateSessionId();
        const singleNote = this.reviewQueueLoader.getSingleNote();
        await this._recordEvent({
            type: "session_started",
            mode: reviewModeName(this.reviewMode),
            singleNotePath: singleNote === null ? null : singleNote.path,
        });
        activeDocument.addEventListener("keydown", this._undoKeydownHandler);

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
            const subdeckStats = this.reviewSequencer.getDeckStats(subdeck.getTopicPath());

            if (
                openImmediately &&
                (subdeckStats.cardsInQueueOfThisDeckCount ||
                    this.reviewMode === FlashcardReviewMode.Cram)
            ) {
                openImmediately = false;
                break;
            }

            if (
                subdeckStats.cardsInQueueOfThisDeckCount ||
                this.reviewMode === FlashcardReviewMode.Cram
            ) {
                openImmediately = true;
                deckWithCards = subdeck;
            }
        }

        if (openImmediately && deckWithCards !== null) {
            await this._reviewDeck(deckWithCards);
        } else {
            await this._showDecksList();
        }
    }

    // MARK: Content Manager

    private async _showDecksList(reloadReviewQueue: boolean = false): Promise<void> {
        this._clearPendingResumeTimeout();
        if (reloadReviewQueue) {
            this.reviewSequencer = await this.reviewQueueLoader.loadReviewQueue();
        }
        if (this.reviewSequencer === null) return;
        this.cardContainer.closeSession();
        this.uiManager.setUIState(UIState.DeckList);
        this.deckContainer.showList(this.reviewSequencer, this.settings, this.reviewMode);
        // Leaving the cards ends the chance to redo, the cards may be reviewed in a different order now
        this._clearRedoStack();
        await this._recordEvent({ type: "deck_list_shown" });
    }

    private async _reviewDeck(deck: Deck): Promise<void> {
        this.deckContainer.closeList();
        this.sessionData = this._getNewSessionData(deck);
        if (this.sessionData === null) return;
        this.uiManager.setUIState(UIState.CardFront);
        await this._recordCardShown();
        await this.cardContainer.openSession(this.sessionData, this.settings);
        this._updateUndoAvailability();
    }

    private async _showNextCard(): Promise<void> {
        if (this.sessionData === null || this.reviewSequencer === null) {
            await this._showDecksList(true);
            return;
        }

        if (!this.reviewSequencer.hasCurrentCard) {
            // TODO: Re-enable pending state, once it is more integrated with the rest of the ui & once data refreshing is better implemented
            // if (this.reviewSequencer.hasPendingCards) {
            //     await this._showPendingState();
            // } else {
            //     await this._showDecksList(true);
            // }
            await this._showDecksList(true);
            return;
        }

        if (this.reviewSequencer.currentDeck === null) {
            await this._showDecksList(true);
            return;
        }

        const chosenDeckStats = this.reviewSequencer.getDeckStats(
            this.sessionData.deckData.chosenDeck.getTopicPath(),
        );
        this.sessionData.deckData.chosenDeckStats = chosenDeckStats;

        this.sessionData.deckData.previousDeck = this.sessionData.deckData.currentDeck;
        this.sessionData.deckData.previousDeckStats = this.sessionData.deckData.currentDeckStats;

        this.sessionData.deckData.currentDeck = this.reviewSequencer.currentDeck;

        const currentDeckStats = this.reviewSequencer.getDeckStats(
            this.reviewSequencer.currentDeck.getTopicPath(),
        );
        this.sessionData.deckData.currentDeckStats = currentDeckStats;

        if (this.sessionData.deckData.previousDeck !== this.sessionData.deckData.currentDeck) {
            this.sessionData.deckData.currentDeckTotalCardsInQueue =
                currentDeckStats.cardsInQueueOfThisDeckCount;
        }

        this.sessionData.currentNote = this.reviewSequencer.currentNote;
        this.sessionData.currentQuestion = this.reviewSequencer.currentQuestion;

        this.sessionData.cardData.currentCard = this.reviewSequencer.currentCard;
        this.uiManager.setUIState(UIState.CardFront);
        this.sessionData.cardData.currentCardState = CardState.Front;

        if (
            this.sessionData.cardData.currentCard !== null &&
            this.sessionData.cardData.currentCard !== undefined
        ) {
            await this._recordCardShown();
            await this.cardContainer.drawCardFront(this.sessionData, this.settings);
            this._updateUndoAvailability();
        } else {
            await this._showDecksList(true);
        }
    }

    private async _showPendingState(): Promise<void> {
        if (this.reviewSequencer === null) return;
        this._clearPendingResumeTimeout();
        const nextPendingDueUnix = this.reviewSequencer.nextPendingDueUnix;
        if (nextPendingDueUnix === null) {
            await this._showDecksList(true);
            return;
        }

        this.uiManager.setUIState(UIState.CardFront);
        this.cardContainer.drawPendingState(nextPendingDueUnix);

        const delayMs = Math.max(0, nextPendingDueUnix - Date.now());
        this.pendingResumeTimeout = window.setTimeout(() => {
            if (this.reviewSequencer === null) return;
            this.reviewSequencer.refreshCurrentDeck();
            void this._showNextCard();
        }, delayMs + 50);
    }

    private _getNewSessionData(deck: Deck): SessionData | null {
        if (this.reviewSequencer === null) return null;
        const chosenDeckStats = this.reviewSequencer.getDeckStats(deck.getTopicPath());
        const totalCardsInSession: number = chosenDeckStats.cardsInQueueCount;
        const totalDecksInSession: number = chosenDeckStats.decksInQueueOfThisDeckCount;
        const currentCardState: CardState = CardState.Front;

        const currentDeckStats =
            this.reviewSequencer.currentDeck === null
                ? null
                : this.reviewSequencer.getDeckStats(
                      this.reviewSequencer.currentDeck.getTopicPath(),
                  );

        return {
            cardData: {
                currentCard: this.reviewSequencer.currentCard,
                currentCardState,
            },
            deckData: {
                chosenDeck: deck,
                currentDeck: this.reviewSequencer.currentDeck,
                previousDeck: null,
                currentDeckTotalCardsInQueue:
                    currentDeckStats === null ? 0 : currentDeckStats.cardsInQueueOfThisDeckCount,
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

    public _deleteCurrentCard() {
        if (
            this.sessionData === null ||
            this.reviewSequencer === null ||
            this.dataManager.data === null
        )
            return;

        const timeNow = now();
        if (
            this.lastPressedOnProcessReview &&
            timeNow - this.lastPressedOnProcessReview <
                this.dataManager.data.settings.reviewButtonDelay
        ) {
            return;
        }
        this.lastPressedOnProcessReview = timeNow;

        new ConfirmationModal(
            this.app,
            t("DELETE_CARD"),
            t("DELETE_CARD_CONFIRMATION"),
            t("CANCEL"),
            async () => {
                if (this.sessionData === null || this.reviewSequencer === null) return;
                const card: Card = this._getCurrentCard();
                await this._recordCardEvent(card, this._getCurrentDeckTopicPath(), (ref) => ({
                    type: "card_deleted",
                    ...ref,
                }));
                await this.reviewSequencer.deleteCurrentCardFromNote();
                await this._showNextCard();
            },
        ).open();
    }

    public async _showAnswer() {
        if (this.sessionData === null) return;

        const timeNow = now();
        if (
            this.lastPressedOnProcessReview &&
            timeNow - this.lastPressedOnProcessReview <
                this.dataManager.data.settings.reviewButtonDelay
        ) {
            return;
        }
        this.lastPressedOnProcessReview = timeNow;

        this.uiManager.setUIState(UIState.CardBack);
        this.sessionData.cardData.currentCardState = CardState.Back;

        await this.cardContainer.drawBack(
            this.sessionData,
            this.reviewMode,
            this.settings,
            this._determineButtonSchedule.bind(this),
        );

        const msSinceCardShown: number = this._msSince(this.cardShownAt, "card shown");
        this.answerShownAt = Date.now();
        await this._recordCardEvent(
            this._getCurrentCard(),
            this._getCurrentDeckTopicPath(),
            (ref) => ({ type: "answer_shown", ...ref, msSinceCardShown }),
        );
    }

    private async _doEditQuestionText(): Promise<void> {
        if (this.reviewSequencer === null) return;
        const currentCard: Card | null = this.reviewSequencer.currentCard;
        const currentQ: Question = this.reviewSequencer.currentQuestion;

        // Just the question/answer text; without any preceding topic tag
        const textPrompt = currentQ.questionText.actualQuestion;
        const currentUIState = this.uiManager.uiState;
        this.uiManager.setUIState(UIState.EditModal);
        const editModal = FlashcardEditModal.Prompt(
            this.app,
            this.settings,
            currentCard,
            textPrompt,
            currentQ.questionText.textDirection,
        );
        await editModal
            .then(async (modifiedCardText) => {
                if (this.reviewSequencer === null) return;
                await this.reviewSequencer.updateCurrentQuestionTextAndCards(modifiedCardText);
                await this._recordCardEvent(
                    this._getCurrentCard(),
                    this._getCurrentDeckTopicPath(),
                    (ref) => ({ type: "card_edited", ...ref }),
                );
                this.uiManager.setUIState(currentUIState);

                if (this.sessionData !== null) {
                    if (this.uiManager.uiState === UIState.CardFront) {
                        await this.cardContainer.drawCardFront(this.sessionData, this.settings);
                    }

                    if (this.uiManager.uiState === UIState.CardBack) {
                        await this.cardContainer.drawBack(
                            this.sessionData,
                            this.reviewMode,
                            this.settings,
                            this._determineButtonSchedule.bind(this),
                        );
                    }
                }
            })
            .catch((reason) => console.log(reason));
    }

    public async _jumpToCurrentCard(): Promise<void> {
        if (this.reviewSequencer === null) return;
        const currentQuestion = this.reviewSequencer.currentQuestion;
        if (!currentQuestion) return;
        await this._recordCardEvent(
            this._getCurrentCard(),
            this._getCurrentDeckTopicPath(),
            (ref) => ({ type: "card_opened_in_note", ...ref }),
        );

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

    public async _skipCurrentCard() {
        if (this.reviewSequencer === null) return;
        await this._runSerialized(() => this._performAction({ type: "card_skipped" }, null));
    }

    public async _suspendCurrentCard(): Promise<void> {
        if (this.reviewSequencer === null)
            throw new Error("Cannot suspend card: no review session is open");

        const timeNow = now();
        if (
            timeNow - this.lastPressedOnProcessReview <
            this.dataManager.data.settings.reviewButtonDelay
        ) {
            return;
        }
        this.lastPressedOnProcessReview = timeNow;

        await this._runSerialized(() => this._performAction({ type: "card_suspended" }, null));
    }

    private _displayCurrentCardInfoNotice() {
        if (this.sessionData === null) return;
        new CardInfoNotice(
            this.sessionData.cardData.currentCard.scheduleInfo,
            this.sessionData.currentNote.file.path,
        );
        void this._recordCardEvent(
            this._getCurrentCard(),
            this._getCurrentDeckTopicPath(),
            (ref) => ({ type: "card_info_viewed", ...ref }),
        );
    }

    public async _processReview(response: ReviewResponse): Promise<void> {
        if (this.reviewSequencer === null) return;
        const timeNow = now();
        if (
            timeNow - this.lastPressedOnProcessReview <
            this.dataManager.data.settings.reviewButtonDelay
        ) {
            return;
        }
        this.lastPressedOnProcessReview = timeNow;

        await this._runSerialized(() =>
            this._performAction({ type: "card_reviewed", response }, null),
        );
    }

    /**
     * Performs an undoable action on the current card, records it, and shows the next card.
     *
     * @param {UndoableAction} action - The action.
     * @param {RedoInfo | null} redo - Set when redoing an undone action, null for a new action.
     */
    private async _performAction(action: UndoableAction, redo: RedoInfo | null): Promise<void> {
        if (this.reviewSequencer === null || !this.reviewSequencer.hasCurrentCard) return;
        // A new action makes the undone actions impossible to redo, like in any editor
        if (redo === null) this._clearRedoStack();

        const sequencer: IFlashcardReviewSequencer = this.reviewSequencer;
        const card: Card = this._getCurrentCard();
        const deck: TopicPath | null = this._getCurrentDeckTopicPath();
        const isNew: boolean = card.isNew;
        const scheduleBefore: RepItemScheduleInfo | null = card.scheduleInfo;
        // A redo repeats the original action, including the time it took
        const msSinceCardShown: number =
            redo !== null && redo.originalEvent !== null
                ? redo.originalEvent.msSinceCardShown
                : this._msSince(this.cardShownAt, "card shown");
        const msSinceAnswerShown: number | null =
            redo !== null && redo.originalEvent !== null
                ? redo.originalEvent.type === "card_reviewed"
                    ? redo.originalEvent.msSinceAnswerShown
                    : null
                : this.answerShownAt === null
                  ? null
                  : Date.now() - this.answerShownAt;
        const redone: { redoneEventId?: string } =
            redo !== null && redo.originalEvent !== null
                ? { redoneEventId: redo.originalEvent.id }
                : {};

        const snapshot: ReviewUndoSnapshot = sequencer.createUndoSnapshot();
        switch (action.type) {
            case "card_reviewed":
                await sequencer.processReview(action.response);
                break;
            case "card_skipped":
                sequencer.skipCurrentCard();
                break;
            case "card_suspended":
                await sequencer.suspendCurrentCard();
                break;
        }
        sequencer.completeUndoSnapshot(snapshot);

        let event: UndoableEvent | null;
        switch (action.type) {
            case "card_reviewed":
                event = await this._recordCardEvent(card, deck, (ref) => ({
                    type: "card_reviewed" as const,
                    ...ref,
                    mode: reviewModeName(this.reviewMode),
                    response: reviewResponseName(action.response),
                    isNew,
                    scheduleBefore: serializeSchedule(scheduleBefore),
                    scheduleAfter: serializeSchedule(card.scheduleInfo),
                    msSinceCardShown,
                    msSinceAnswerShown,
                    ...redone,
                }));
                break;
            case "card_skipped":
                event = await this._recordCardEvent(card, deck, (ref) => ({
                    type: "card_skipped" as const,
                    ...ref,
                    msSinceCardShown,
                    ...redone,
                }));
                break;
            case "card_suspended":
                event = await this._recordCardEvent(card, deck, (ref) => ({
                    type: "card_suspended" as const,
                    ...ref,
                    msSinceCardShown,
                    ...redone,
                }));
                new Notice(t("CARD_SUSPENDED"));
                break;
        }

        this._pushUndoEntry(snapshot, sequencer, action, event);
        await this._showNextCard();
    }

    // MARK: Undo & redo

    get canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    get canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    /**
     * Undoes the latest review, reset, skip or suspension, and shows that card again.
     */
    public async _undoLastAction(): Promise<void> {
        await this._runSerialized(async () => {
            const entry: ReviewUndoEntry | undefined = this.undoStack.pop();
            if (entry === undefined) {
                new Notice(t("NOTHING_TO_UNDO"));
                return;
            }
            this._updateUndoAvailability();

            const isSameQueue: boolean = entry.sequencer === this.reviewSequencer;
            let isCardInQueue: boolean = true;
            try {
                if (isSameQueue) {
                    await entry.sequencer.undo(entry.snapshot);
                } else {
                    // The review queue was reloaded since (e.g. after finishing a deck). Restore what is stored,
                    // then look the card up in the reloaded queue.
                    await restoreUndoSnapshotPersistentState(
                        entry.snapshot,
                        this.dataManager.osrCore.questionPostponementList,
                    );
                    this.reviewSequencer = await this.reviewQueueLoader.loadReviewQueue();
                    isCardInQueue = this.reviewSequencer.focusCard(
                        createCardMatch(entry.snapshot.card),
                        entry.snapshot.sessionTopicPath,
                    );
                }
            } catch (error) {
                // Undo is triggered from key presses and buttons, so without this the error would only show up in
                // the developer console
                new Notice(
                    t("UNDO_FAILED", {
                        error: error instanceof Error ? error.message : String(error),
                    }),
                );
                throw error;
            }

            if (entry.event !== null) {
                await this._recordEvent({
                    type: "action_undone",
                    undoneEventId: entry.event.id,
                    undoneEventType: entry.action.type,
                    cardId: entry.event.cardId,
                    notePath: entry.event.notePath,
                });
            }

            const actionName: string = this._getActionName(entry.action);
            if (!isCardInQueue) {
                new Notice(t("UNDO_DONE_CARD_NOT_IN_QUEUE", { action: actionName }));
                await this._showDecksList();
                return;
            }
            new Notice(t("UNDO_DONE", { action: actionName }));

            if (this.reviewSequencer === null) throw new Error("Undo: no review queue");
            const chosenDeck: Deck =
                this.reviewSequencer.originalDeckTree.getDeck(entry.chosenDeckTopicPath) ??
                this.reviewSequencer.originalDeckTree;
            const isCardViewOpen: boolean =
                this.uiManager.uiState === UIState.CardFront ||
                this.uiManager.uiState === UIState.CardBack;
            if (isCardViewOpen) {
                if (!isSameQueue || this.sessionData === null) {
                    this.sessionData = this._getNewSessionData(chosenDeck);
                }
                await this._showNextCard();
            } else {
                await this._reviewDeck(chosenDeck);
            }

            // Added after showing the card: showing the deck list clears the redo stack
            this.redoStack.push({
                action: entry.action,
                card: this._getCurrentCard(),
                sequencer: this.reviewSequencer,
                sessionTopicPath: entry.snapshot.sessionTopicPath,
                originalEvent: entry.event,
            });
            this._updateUndoAvailability();
        });
    }

    /**
     * Redoes the latest undone action (in the same review session, unless something else was done since).
     */
    public async _redoLastUndoneAction(): Promise<void> {
        await this._runSerialized(async () => {
            const entry: RedoEntry | undefined = this.redoStack.pop();
            if (entry === undefined) {
                new Notice(t("NOTHING_TO_REDO"));
                return;
            }
            this._updateUndoAvailability();

            const isCardViewOpen: boolean =
                this.uiManager.uiState === UIState.CardFront ||
                this.uiManager.uiState === UIState.CardBack;
            if (
                !isCardViewOpen ||
                this.reviewSequencer === null ||
                entry.sequencer !== this.reviewSequencer ||
                !this.reviewSequencer.focusCardObject(entry.card, entry.sessionTopicPath)
            ) {
                this._clearRedoStack();
                new Notice(t("REDO_NOT_POSSIBLE"));
                return;
            }

            await this._performAction(entry.action, { originalEvent: entry.originalEvent });
            new Notice(t("REDO_DONE", { action: this._getActionName(entry.action) }));
        });
    }

    private _getActionName(action: UndoableAction): string {
        switch (action.type) {
            case "card_reviewed":
                return t("UNDO_ACTION_REVIEW");
            case "card_skipped":
                return t("UNDO_ACTION_SKIP");
            case "card_suspended":
                return t("UNDO_ACTION_SUSPEND");
        }
    }

    private _pushUndoEntry(
        snapshot: ReviewUndoSnapshot,
        sequencer: IFlashcardReviewSequencer,
        action: UndoableAction,
        event: UndoableEvent | null,
    ): void {
        if (this.sessionData === null)
            throw new Error("Cannot add an undo entry without a session");
        this.undoStack.push({
            snapshot,
            sequencer,
            chosenDeckTopicPath: this.sessionData.deckData.chosenDeck.getTopicPath(),
            action,
            event,
        });
        if (this.undoStack.length > MAX_UNDO_ENTRIES) this.undoStack.shift();
        this._updateUndoAvailability();
    }

    private _clearRedoStack(): void {
        this.redoStack = [];
        this._updateUndoAvailability();
    }

    private _updateUndoAvailability(): void {
        this.cardContainer.setUndoAvailable(this.canUndo, this.canRedo);
        this.deckContainer.setUndoAvailable(this.canUndo);
    }

    private _undoKeydownHandler = (e: KeyboardEvent): void => {
        if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
        // Matched on the typed character, so that it is the key labeled "Z" (or "Y") on every keyboard layout
        // (e.g. QWERTZ). Redo: Ctrl+Shift+Z / Cmd+Shift+Z, and Ctrl+Y as on Windows.
        const key: string = e.key.toLowerCase();
        let command: "undo" | "redo" | null = null;
        if (key === "z") command = e.shiftKey ? "redo" : "undo";
        else if (key === "y" && e.ctrlKey && !e.metaKey && !e.shiftKey) command = "redo";
        if (command === null) return;

        // With custom hotkeys, the "Undo" & "Redo" commands (and their hotkeys) are used instead
        if (this.plugin.dataManager.data.settings.useCustomHotkeys) return;
        if (!this.uiManager.getSRInFocusState()) return;
        const uiState: UIState = this.uiManager.uiState;
        if (
            uiState !== UIState.DeckList &&
            uiState !== UIState.CardFront &&
            uiState !== UIState.CardBack
        ) {
            return;
        }
        // Keep the native undo & redo of text inputs (e.g. cloze inputs)
        if (
            activeDocument.activeElement !== null &&
            (activeDocument.activeElement.nodeName === "TEXTAREA" ||
                activeDocument.activeElement.nodeName === "INPUT")
        ) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) return;
        if (command === "undo") void this._undoLastAction();
        else void this._redoLastUndoneAction();
    };

    /**
     * Runs actions that change the review queue one after another, so that e.g. an undo pressed while a review is
     * still being saved applies to that review.
     */
    private _runSerialized(action: () => Promise<void>): Promise<void> {
        const result: Promise<void> = this.actionQueue.then(action);
        // The caller gets the error of a failed action. The queue itself continues with the next action.
        this.actionQueue = result.then(
            (): void => undefined,
            (): void => undefined,
        );
        return result;
    }

    // MARK: Usage history

    private async _recordEvent(payload: HistoryEventPayload): Promise<void> {
        await this.plugin.historyRecorder.record(payload, this.sessionId);
    }

    /**
     * Records an event about a card. The card gets an id first, if it doesn't have one yet.
     *
     * @returns The event, or null if recording the usage history is disabled.
     */
    private async _recordCardEvent<P extends HistoryEventPayload>(
        card: Card,
        deck: TopicPath | null,
        createPayload: (ref: CardRef) => P,
    ): Promise<(HistoryEventBase & P) | null> {
        const recorder = this.plugin.historyRecorder;
        if (!recorder.enabled) return null;
        const ref: CardRef = await recorder.cardRef(card, deck);
        return await recorder.record(createPayload(ref), this.sessionId);
    }

    private async _recordCardShown(): Promise<void> {
        const card: Card = this._getCurrentCard();
        await this._recordCardEvent(card, this._getCurrentDeckTopicPath(), (ref) => ({
            type: "card_shown",
            ...ref,
            mode: reviewModeName(this.reviewMode),
            isNew: card.isNew,
            schedule: serializeSchedule(card.scheduleInfo),
        }));
        this.cardShownAt = Date.now();
        this.answerShownAt = null;
    }

    private _getCurrentCard(): Card {
        if (this.reviewSequencer === null) throw new Error("No review queue");
        const card: Card | null = this.reviewSequencer.currentCard;
        if (card === null) throw new Error("No current card");
        return card;
    }

    private _getCurrentDeckTopicPath(): TopicPath | null {
        if (this.reviewSequencer === null) throw new Error("No review queue");
        const deck: Deck | null = this.reviewSequencer.currentDeck;
        return deck === null ? null : deck.getTopicPath();
    }

    private _msSince(ts: number | null, what: string): number {
        if (ts === null) throw new Error(`Usage history: time of "${what}" is unknown`);
        return Date.now() - ts;
    }

    // MARK: Deck button handlers

    private async _startReviewOfDeck(deck: Deck) {
        if (this.reviewSequencer === null) return;
        await this._recordEvent({
            type: "deck_review_started",
            deck: formatDeckForHistory(deck.getTopicPath()),
        });
        this.reviewSequencer.setCurrentDeck(deck.getTopicPath());
        if (this.reviewSequencer.hasCurrentCard) {
            await this._reviewDeck(deck);
        } else {
            await this._showDecksList();
        }
    }

    private async _changeReviewMode(reviewMode: FlashcardReviewMode) {
        this.reviewQueueLoader.setReviewMode(reviewMode);
        this.reviewMode = reviewMode;
        await this._recordEvent({ type: "review_mode_changed", mode: reviewModeName(reviewMode) });
        this.reviewSequencer = await this.reviewQueueLoader.loadReviewQueue();
        this.deckContainer.closeList();
        await this._showDecksList();
    }

    // MARK: Utils

    private _determineButtonSchedule(reviewResponse: ReviewResponse): RepItemScheduleInfo | null {
        if (this.sessionData === null) return null;
        if (this.reviewSequencer === null) return null;
        return this.reviewSequencer.determineCardSchedule(
            reviewResponse,
            this.sessionData.cardData.currentCard,
        );
    }

    private _clearPendingResumeTimeout(): void {
        if (this.pendingResumeTimeout !== null) {
            window.clearTimeout(this.pendingResumeTimeout);
            this.pendingResumeTimeout = null;
        }
    }
}
