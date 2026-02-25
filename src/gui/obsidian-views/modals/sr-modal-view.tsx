import { App, Modal, Platform } from "obsidian";

import {
    FlashcardReviewMode,
    IFlashcardReviewSequencer as IFlashcardReviewSequencer,
} from "src/card/flashcard-review-sequencer";
import { Question } from "src/card/questions/question";
import { Deck } from "src/deck/deck";
import { CardContainer } from "src/gui/content-container/card-container/card-container";
import { DeckContainer } from "src/gui/content-container/deck-container";
import { FlashcardEditModal } from "src/gui/obsidian-views/modals/edit-modal";
import type SRPlugin from "src/main";
import { SRSettings } from "src/settings";
import EmulatedPlatform from "src/utils/platform-detector";

export enum FlashcardMode {
    Deck,
    Front,
    Back,
    Closed,
}

export class SRModalView extends Modal {
    public plugin: SRPlugin;
    public mode: FlashcardMode;
    private reviewSequencer: IFlashcardReviewSequencer;
    private settings: SRSettings;
    private reviewMode: FlashcardReviewMode;
    private deckContainer: DeckContainer;
    private cardContainer: CardContainer;

    constructor(
        app: App,
        plugin: SRPlugin,
        settings: SRSettings,
        reviewSequencer: IFlashcardReviewSequencer,
        reviewMode: FlashcardReviewMode,
    ) {
        super(app);

        // Init properties
        this.plugin = plugin;
        this.settings = settings;
        this.reviewSequencer = reviewSequencer;
        this.reviewMode = reviewMode;

        // Setup base containers
        if (Platform.isMobile || EmulatedPlatform().isMobile) {
            this.modalEl.style.height = this.settings.flashcardHeightPercentageMobile + "%";
            this.modalEl.style.maxHeight = this.settings.flashcardHeightPercentageMobile + "%";
            this.modalEl.style.width = this.settings.flashcardWidthPercentageMobile + "%";
            this.modalEl.style.maxWidth = this.settings.flashcardWidthPercentageMobile + "%";
        } else {
            this.modalEl.style.height = this.settings.flashcardHeightPercentage + "%";
            this.modalEl.style.maxHeight = this.settings.flashcardHeightPercentage + "%";
            this.modalEl.style.width = this.settings.flashcardWidthPercentage + "%";
            this.modalEl.style.maxWidth = this.settings.flashcardWidthPercentage + "%";
        }
        this.modalEl.setAttribute("id", "sr-modal-view");
        this.modalEl.addClass("sr-view");

        if (
            parseInt(this.modalEl.style.height.split("%")[0]) >= 100 ||
            parseInt(this.modalEl.style.width.split("%")[0]) >= 100
        ) {
            this.modalEl.style.borderRadius = "0";
        }

        this.contentEl.addClass("sr-modal-content");

        // Init static elements in views
        this.deckContainer = new DeckContainer(
            this.plugin,
            this.settings,
            this.reviewSequencer,
            this.contentEl.createDiv(),
            this._startReviewOfDeck.bind(this),
            this.close.bind(this),
        );

        this.cardContainer = new CardContainer(
            this.app,
            this.plugin,
            this.settings,
            this.reviewSequencer,
            this.reviewMode,
            this.contentEl.createDiv(),
            this._showDecksList.bind(this),
            this._doEditQuestionText.bind(this),
            this.close.bind(this),
        );
    }

    onOpen(): void {
        this._showDecksList();
    }

    onClose(): void {
        this.plugin.setSRViewInFocus(false);
        this.mode = FlashcardMode.Closed;
        this.deckContainer.close();
        this.cardContainer.close();
    }

    private _showDecksList(): void {
        this._hideFlashcard();
        this.deckContainer.show();
    }

    private _hideDecksList(): void {
        this.deckContainer.hide();
    }

    private _showFlashcard(deck: Deck): void {
        this._hideDecksList();
        this.cardContainer.show(deck);
    }

    private _hideFlashcard(): void {
        this.cardContainer.hide();
    }

    private _startReviewOfDeck(deck: Deck) {
        this.reviewSequencer.setCurrentDeck(deck.getTopicPath());
        if (this.reviewSequencer.hasCurrentCard) {
            this._showFlashcard(deck);
        } else {
            this._showDecksList();
        }
    }

    private async _doEditQuestionText(): Promise<void> {
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
                this.reviewSequencer.updateCurrentQuestionText(modifiedCardText);
            })
            .catch((reason) => console.log(reason));
    }
}
