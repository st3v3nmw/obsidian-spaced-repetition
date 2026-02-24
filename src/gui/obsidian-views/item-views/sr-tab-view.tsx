import { ButtonComponent, ItemView, WorkspaceLeaf } from "obsidian";

import { DEBUG_MODE_ENABLED, SR_TAB_VIEW } from "src/constants";
import { Deck } from "src/deck/deck";
import { FlashcardReviewMode, IFlashcardReviewSequencer } from "src/card/flashcard-review-sequencer";
import { CardContainer } from "src/gui/content-container/card-container/card-container";
import { DeckContainer } from "src/gui/content-container/deck-container";
import { FlashcardEditModal } from "src/gui/obsidian-views/modals/edit-modal";
import SRPlugin from "src/main";
import { Question } from "src/card/questions/question";
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
    private deckContainer: DeckContainer;
    private openErrorCount: number = 0; // Counter for catching the first inevitable error but the letting the other through
    public backButton: ButtonComponent;
    private cardContainer: CardContainer;

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
        this.navigation = false;
        this.settings = plugin.data.settings;
        this.loadReviewSequencerData = loadReviewSequencerData;

        const viewContent = this.containerEl.getElementsByClassName("view-content");
        if (viewContent.length > 0) {
            this.viewContainerEl = viewContent[0] as HTMLElement;
            this.viewContainerEl.addClass("sr-tab-view");
            this.viewContainerEl.addClass("sr-view");

            this.viewContentEl = this.viewContainerEl.createDiv("sr-tab-view-content");

            this.viewContentEl.style.height = this.settings.flashcardHeightPercentage + "%";
            this.viewContentEl.style.maxHeight = this.settings.flashcardHeightPercentage + "%";
            this.viewContentEl.style.width = this.settings.flashcardWidthPercentage + "%";
            this.viewContentEl.style.maxWidth = this.settings.flashcardWidthPercentage + "%";

            if (
                this.settings.flashcardHeightPercentage < 100 ||
                this.settings.flashcardWidthPercentage < 100
            ) {
                this.viewContentEl.addClass("sr-center-view");
            }
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
            // Reposition the navbar if it's mobile, because lese it overlaps the buttons in the tab view
            if (document.body.classList.contains("is-mobile")) {
                const mobileNavbar = document.getElementsByClassName("mobile-navbar")[0];
                if (mobileNavbar) {
                    (mobileNavbar as HTMLElement).style.position = "relative";
                }
            }

            // Removes the bottom fade mask if it's mobile and floating nav, because else it overlaps the bottom part of the flashcard and makes it hard to read
            if (
                document.body.classList.contains("is-phone") &&
                document.body.classList.contains("is-floating-nav")
            ) {
                document.body.style.setProperty(
                    "--view-bottom-fade-mask",
                    "linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, #000000 calc(16px - 0px))",
                );
            }

            // this._createBackButton();
            const loadedData = await this.loadReviewSequencerData();

            this.reviewSequencer = loadedData.reviewSequencer;
            this.reviewMode = loadedData.mode;

            if (this.deckContainer === undefined) {
                // Init static elements in views
                this.deckContainer = new DeckContainer(
                    this.plugin,
                    this.settings,
                    this.reviewSequencer,
                    this.viewContentEl.createDiv(),
                    this._startReviewOfDeck.bind(this),
                );
            }

            if (this.cardContainer === undefined) {
                this.cardContainer = new CardContainer(
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
            if (this.openErrorCount > 0 || DEBUG_MODE_ENABLED) {
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
        // Resets the changes made in onOpen
        if (document.body.classList.contains("is-mobile")) {
            const mobileNavbar = document.getElementsByClassName("mobile-navbar")[0];
            if (mobileNavbar) {
                (mobileNavbar as HTMLElement).style.position = "unset";
            }
        }

        // Resets the changes made in onOpen
        if (
            document.body.classList.contains("is-phone") &&
            document.body.classList.contains("is-floating-nav")
        ) {
            document.body.style.setProperty(
                "--view-bottom-fade-mask",
                "linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, #000000 calc(34px - 0px + 12px))",
            );
        }
        if (this.deckContainer) this.deckContainer.close();
        if (this.cardContainer) this.cardContainer.close();
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
        // this.backButton.buttonEl.removeClass("sr-is-hidden");
        this.cardContainer.show(deck);
    }

    private _hideFlashcard(): void {
        // this.backButton.buttonEl.addClass("sr-is-hidden");
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
