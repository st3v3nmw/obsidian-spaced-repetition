import { Modal, App, Platform } from "obsidian";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import h from "vhtml";

import type SRPlugin from "src/main";
import { SRSettings } from "src/settings";

import { Deck } from "../Deck";
import { Question } from "../Question";
import {
    FlashcardReviewMode,
    IFlashcardReviewSequencer as IFlashcardReviewSequencer,
} from "src/FlashcardReviewSequencer";
import { FlashcardEditModal } from "./flashcards-edit-modal";
import { DecksListView } from "./DecksListView";
import { FlashcardReviewView } from "./FlashcardReviewView";

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
    private deckView: DecksListView;

    constructor(
        app: App,
        plugin: SRPlugin,
        settings: SRSettings,
        reviewSequencer: IFlashcardReviewSequencer,
        reviewMode: FlashcardReviewMode,
    ) {
        super(app);

        this.plugin = plugin;
        this.settings = settings;
        this.reviewSequencer = reviewSequencer;
        this.reviewMode = reviewMode;

        this.modalEl.style.height = this.settings.flashcardHeightPercentage + "%";
        this.modalEl.style.width = this.settings.flashcardWidthPercentage + "%";
        this.modalEl.addClass("sr-modal");

        this.contentEl.addClass("sr-modal-content");
        if (Platform.isMobile) {
            this.contentEl.style.display = "block";
        }

        this.deckView = new DecksListView(
            this.plugin,
            this.settings,
            this.reviewSequencer,
            this.contentEl,
            this.startReviewOfDeck.bind(this),
        );
    }

    onOpen(): void {
        this.showDecksList();
    }

    onClose(): void {
        this.mode = FlashcardModalMode.Closed;
    }

    showDecksList(): void {
        this.deckView.show();
    }

    hideDecksList(): void {
        this.deckView.hide();
    }

    startReviewOfDeck(deck: Deck) {
        this.hideDecksList();
        this.reviewSequencer.setCurrentDeck(deck.getTopicPath());
        if (this.reviewSequencer.hasCurrentCard) {
            new FlashcardReviewView(
                this.app,
                this.plugin,
                this.settings,
                this.reviewSequencer,
                this.reviewMode,
                this.titleEl,
                this.contentEl,
                this.showDecksList.bind(this),
                this.doEditQuestionText.bind(this),
            ).showCurrentCard();
        } else {
            this.showDecksList();
        }
    }

    async doEditQuestionText(): Promise<void> {
        const currentQ: Question = this.reviewSequencer.currentQuestion;

        // Just the question/answer text; without any preceding topic tag
        const textPrompt = currentQ.questionText.actualQuestion;

        const editModal = FlashcardEditModal.Prompt(this.app, textPrompt);
        editModal
            .then(async (modifiedCardText) => {
                this.reviewSequencer.updateCurrentQuestionText(modifiedCardText);
            })
            .catch((reason) => console.log(reason));
    }
}
