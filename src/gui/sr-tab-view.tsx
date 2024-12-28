import { ItemView, setIcon, WorkspaceLeaf } from "obsidian";

import { SR_TAB_VIEW } from "src/constants";
import { Deck } from "src/deck";
import { FlashcardReviewMode, IFlashcardReviewSequencer } from "src/flashcard-review-sequencer";
import { CardUI } from "src/gui/card-ui";
import { DeckUI } from "src/gui/deck-ui";
import { FlashcardEditModal } from "src/gui/edit-modal";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { Question } from "src/question";
import { SRSettings } from "src/settings";

/**
 * Represents a tab view for spaced repetition plugin.
 *
 * This class extends the ItemView and is used to display the deck and flashcard uis.
 *
 * @property {SRPlugin} plugin - The main plugin instance.
 * @property {SRPlugin} leaf - The leaf instance for the view.
 * @property {() => Promise<{reviewSequencer: IFlashcardReviewSequencer;mode: FlashcardReviewMode;}>} loadReviewSequencerData - Callback for loading the reviewSequencer an the selected review mode.
 *
 * @method getViewType - Returns the view type identifier.
 * @method getIcon - Returns the icon identifier for the view.
 * @method getDisplayText - Returns the display text for the view.
 * @method onOpen - Initializes the view and loads necessary data when opened.
 * @method onClose - Cleans up resources when the view is closed.
 */
export class SRTabView extends ItemView {
    loadReviewSequencerData: () => Promise<{
        reviewSequencer: IFlashcardReviewSequencer;
        mode: FlashcardReviewMode;
    }>;

    private plugin: SRPlugin;
    private reviewMode: FlashcardReviewMode;
    private viewContainerEl: HTMLElement;
    private viewContentEl: HTMLElement;
    private reviewSequencer: IFlashcardReviewSequencer;
    private settings: SRSettings;
    private deckView: DeckUI;
    private flashcardView: CardUI;
    private openErrorCount: number = 0; // Counter for catching the first inevitable error but the letting the other through
    public backButton: HTMLDivElement;

    constructor(
        leaf: WorkspaceLeaf,
        plugin: SRPlugin,
        loadReviewSequencerData: () => Promise<{
            reviewSequencer: IFlashcardReviewSequencer;
            mode: FlashcardReviewMode;
        }>,
    ) {
        super(leaf);
        this.plugin = plugin;
        this.settings = plugin.data.settings;
        this.loadReviewSequencerData = loadReviewSequencerData;

        const viewContent = this.containerEl.getElementsByClassName("view-content");
        if (viewContent.length > 0) {
            this.viewContainerEl = viewContent[0] as HTMLElement;
            this.viewContainerEl.addClass("sr-tab-view");

            this.viewContentEl = this.viewContainerEl.createDiv("sr-tab-view-content");

            this.viewContentEl.style.height = this.settings.flashcardHeightPercentage + "%";
            this.viewContentEl.style.maxHeight = this.settings.flashcardHeightPercentage + "%";
            this.viewContentEl.style.width = this.settings.flashcardWidthPercentage + "%";
            this.viewContentEl.style.maxWidth = this.settings.flashcardWidthPercentage + "%";

            this.viewContainerEl.appendChild(this.viewContentEl);
        }
    }

    /**
     * Returns the view type identifier for the SRTabView.
     *
     * @returns {string} The view type identifier.
     */
    getViewType() {
        return SR_TAB_VIEW;
    }

    /**
     * Retrieves the icon identifier for the SRTabView.
     *
     * @returns {string} The tab icon identifier.
     */
    getIcon() {
        return "SpacedRepIcon";
    }

    /**
     * Returns the display text for the SRTabView.
     *
     * @returns {string} The display text for the SRTabView.
     */
    getDisplayText() {
        return "Spaced Repetition";
    }

    /**
     * Initializes the SRTabView when opened by loading the review sequencer data
     * and setting up the deck and flashcard views if they are not already initialized.
     * Catches and logs errors that occur during the initial loading process.
     */
    async onOpen() {
        try {
            this._createBackButton();
            const loadedData = await this.loadReviewSequencerData();

            this.reviewSequencer = loadedData.reviewSequencer;
            this.reviewMode = loadedData.mode;

            if (this.deckView === undefined) {
                // Init static elements in views
                this.deckView = new DeckUI(
                    this.plugin,
                    this.settings,
                    this.reviewSequencer,
                    this.viewContentEl.createDiv(),
                    this._startReviewOfDeck.bind(this),
                );
            }

            if (this.flashcardView === undefined) {
                this.flashcardView = new CardUI(
                    this.app,
                    this.plugin,
                    this.settings,
                    this.reviewSequencer,
                    this.reviewMode,
                    this.viewContentEl.createDiv(),
                    this._showDecksList.bind(this),
                    this._doEditQuestionText.bind(this),
                );
            }

            this._showDecksList();
        } catch (e) {
            /*
             * There will be an error, when opening obsidian, because if a tab is still open from the last session,
             * then it will be loaded before any plugin was loaded, so there is no possibility of cleaning it up fast enough.
             * This will cause an error, where the sr data structure wasn't initialized just yet.
             * Sadly there is no way to load the data before the plugin is loaded or close the tab on closing the window.
             * So we have to live with this error and just catch it the first time around.
             * Lets any other errors through that might occur.
             */
            if (this.openErrorCount > 0) {
                console.error(e);
            }
            this.openErrorCount++;
        }
    }

    /**
     * Closes the SRTabView by shutting down any active deck or flashcard views.
     * Ensures that resources associated with these views are properly released.
     */
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
            this.backButton.removeClass("sr-is-hidden");
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

    private _createBackButton() {
        this.backButton = this.viewContentEl.createDiv();
        this.backButton.addClasses(["sr-back-button", "sr-is-hidden"]);
        setIcon(this.backButton, "arrow-left");
        this.backButton.setAttribute("aria-label", t("BACK"));
        this.backButton.addEventListener("click", () => {
            this.backButton.addClass("sr-is-hidden");
            this._showDecksList();
        });
    }
}
