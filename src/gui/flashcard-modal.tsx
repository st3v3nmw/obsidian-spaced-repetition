import { App, Modal } from "obsidian";

import { Deck } from "src/deck";
import {
    FlashcardReviewMode,
    IFlashcardReviewSequencer as IFlashcardReviewSequencer,
} from "src/flashcard-review-sequencer";
import { DeckListView } from "src/gui/deck-list-view";
import { FlashcardEditModal } from "src/gui/edit-modal";
import { FlashcardReviewView } from "src/gui/flashcard-review-view";
import type SRPlugin from "src/main";
import { Question } from "src/question";
import { SRSettings } from "src/settings";

export enum FlashcardModalMode {
    DecksList,
    Front,
    Back,
    Closed,
}

export class FlashcardModal extends Modal {
    public plugin: SRPlugin;
    public mode: FlashcardModalMode;
    private reviewSequencer: IFlashcardReviewSequencer;
    private settings: SRSettings;
    private reviewMode: FlashcardReviewMode;
    private deckView: DeckListView;
    private flashcardView: FlashcardReviewView;

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
        this.modalEl.style.height = this.settings.flashcardHeightPercentage + "%";
        this.modalEl.style.maxHeight = this.settings.flashcardHeightPercentage + "%";
        this.modalEl.style.width = this.settings.flashcardWidthPercentage + "%";
        this.modalEl.style.maxWidth = this.settings.flashcardWidthPercentage + "%";
        this.modalEl.setAttribute("id", "sr-modal");

        this.contentEl.addClass("sr-modal-content");

        // Init static elements in views
        this.deckView = new DeckListView(
            this.plugin,
            this.settings,
            this.reviewSequencer,
            this.contentEl,
            this._startReviewOfDeck.bind(this),
        );

        this.flashcardView = new FlashcardReviewView(
            this.app,
            this.plugin,
            this.settings,
            this.reviewSequencer,
            this.reviewMode,
            this.contentEl,
            this.modalEl,
            this._showDecksList.bind(this),
            this._doEditQuestionText.bind(this),
        );
    }

    onOpen(): void {
        this._showDecksList();
    }

    onClose(): void {
        this.deckView.close();
        this.flashcardView.close();
        this.mode = FlashcardModalMode.Closed;
    }

    private _showDecksList(): void {
        this._hideFlashcard();
        this.deckView.show();
    }

    private _hideDecksList(): void {
        this.deckView.hide();
    }

    private _showFlashcard(): void {
        this._hideDecksList();
        this.flashcardView.show();
    }

    private _hideFlashcard(): void {
        this.flashcardView.hide();
    }

    private _startReviewOfDeck(deck: Deck) {
        this.reviewSequencer.setCurrentDeck(deck.getTopicPath());
        if (this.reviewSequencer.hasCurrentCard) {
            this._showFlashcard();
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
