import { ItemView, WorkspaceLeaf } from "obsidian";
import { FlashcardReviewMode, IFlashcardReviewSequencer } from "src/flashcard-review-sequencer";
import SRPlugin from "src/main";
import { SRSettings } from "src/settings";
import { DeckListView } from "src/gui/deck-list-view";
import { FlashcardReviewView } from "src/gui/flashcard-review-view";
import { Question } from "src/question";
import { Deck } from "src/deck";
import { FlashcardEditModal } from "src/gui/edit-modal";

export const TABBED_SR_ITEM_VIEW = "tabbed-spaced-repetition-item-view";

export class TabbedSRItemView extends ItemView {
    loadReviewSequencer: () => Promise<{
        reviewSequencer: IFlashcardReviewSequencer;
        mode: FlashcardReviewMode;
    }>;
    viewContainerEl: HTMLElement;
    viewContentEl: HTMLElement;

    public plugin: SRPlugin;
    public reviewMode: FlashcardReviewMode;
    private reviewSequencer: IFlashcardReviewSequencer;
    private settings: SRSettings;
    private deckView: DeckListView;
    private flashcardView: FlashcardReviewView;

    constructor(
        leaf: WorkspaceLeaf,
        plugin: SRPlugin,
        loadReviewSequencer: () => Promise<{
            reviewSequencer: IFlashcardReviewSequencer;
            mode: FlashcardReviewMode;
        }>,
    ) {
        super(leaf);
        this.plugin = plugin;
        this.settings = plugin.data.settings;
        this.loadReviewSequencer = loadReviewSequencer;

        const viewContent = this.containerEl.getElementsByClassName("view-content");
        if (viewContent.length > 0) {
            this.viewContainerEl = viewContent[0] as HTMLElement;
            this.viewContainerEl.addClass("sr-tab-view");
            this.viewContentEl = this.viewContainerEl.createDiv("sr-tab-view-content");
            this.viewContainerEl.appendChild(this.viewContentEl);
        }
    }

    getViewType() {
        return TABBED_SR_ITEM_VIEW;
    }

    getIcon() {
        return "SpacedRepIcon";
    }

    getDisplayText() {
        return "Spaced Repetition";
    }

    async onOpen() {
        try {
            const loadedData = await this.loadReviewSequencer();

            this.reviewSequencer = loadedData.reviewSequencer;
            this.reviewMode = loadedData.mode;

            if (this.deckView === undefined) {
                // Init static elements in views
                this.deckView = new DeckListView(
                    this.plugin,
                    this.settings,
                    this.reviewSequencer,
                    this.viewContentEl,
                    this._startReviewOfDeck.bind(this),
                );

                this.flashcardView = new FlashcardReviewView(
                    this.app,
                    this.plugin,
                    this.settings,
                    this.reviewSequencer,
                    this.reviewMode,
                    this.viewContentEl,
                    this.viewContainerEl,
                    this._showDecksList.bind(this),
                    this._doEditQuestionText.bind(this),
                );
            }

            this._showDecksList();
        } catch {
            this.unload();
        }
    }

    async onClose() {
        if (this.deckView) this.deckView.close();
        if (this.flashcardView) this.flashcardView.close();
    }

    private _showDecksList(): void {
        this._hideFlashcard();
        this.deckView.show();
    }

    private _hideDecksList(): void {
        this.deckView.hide();
    }

    private _showFlashcard(deck: Deck): void {
        this._hideDecksList();
        this.flashcardView.show(deck);
    }

    private _hideFlashcard(): void {
        this.flashcardView.hide();
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
