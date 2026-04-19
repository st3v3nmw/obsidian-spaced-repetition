import "src/ui/obsidian-ui-components/item-views/tab-view.css";
import { ItemView, Platform, WorkspaceLeaf } from "obsidian";

import { SR_TAB_VIEW } from "src/constants";
import SRPlugin from "src/main";
import { SRSettings } from "src/settings";
import ContentManager from "src/ui/obsidian-ui-components/content-container/content-manager";
import { ReviewQueueLoader } from "src/ui/review-queue-loader";
import EmulatedPlatform from "src/utils/platform-detector";

/**
 * Represents a tab view for spaced repetition plugin.
 *
 * This class extends the ItemView and is used to display the deck and flashcard uis.
 *
 * @property {SRPlugin} plugin - The main plugin instance.
 * @property {SRPlugin} leaf - The leaf instance for the view.
 * @property {ReviewQueueLoader} reviewQueueLoader - The review queue loader instance.
 *
 * @method getViewType - Returns the view type identifier.
 * @method getIcon - Returns the icon identifier for the view.
 * @method getDisplayText - Returns the display text for the view.
 * @method onOpen - Initializes the view and loads necessary data when opened.
 * @method onClose - Cleans up resources when the view is closed.
 */
export class SRTabView extends ItemView {
    private reviewQueueLoader: ReviewQueueLoader | null = null;
    private contentManager: ContentManager | null = null;

    private plugin: SRPlugin;
    private viewContainerEl: HTMLElement | null = null;
    private viewContentEl: HTMLElement | null = null;
    private settings: SRSettings;

    constructor(
        leaf: WorkspaceLeaf,
        plugin: SRPlugin,
        reviewQueueLoader: ReviewQueueLoader | null,
    ) {
        super(leaf);
        // Init properties
        this.plugin = plugin;
        this.navigation = false;
        this.settings = plugin.data.settings;
        this.reviewQueueLoader = reviewQueueLoader;

        // Build ui
        const viewContent = this.containerEl.getElementsByClassName("view-content");

        if (viewContent.length === 0) return;

        this.viewContainerEl = viewContent[0] as HTMLElement;
        this.viewContainerEl.addClass("sr-tab-view");
        this.viewContainerEl.addClass("sr-view");

        this.viewContentEl = this.viewContainerEl.createDiv("sr-tab-view-content");

        if (Platform.isMobile || EmulatedPlatform().isMobile) {
            this.viewContentEl.style.height = this.settings.flashcardHeightPercentageMobile + "%";
            this.viewContentEl.style.maxHeight =
                this.settings.flashcardHeightPercentageMobile + "%";
            this.viewContentEl.style.width = this.settings.flashcardWidthPercentageMobile + "%";
            this.viewContentEl.style.maxWidth = this.settings.flashcardWidthPercentageMobile + "%";
        } else {
            this.viewContentEl.style.height = this.settings.flashcardHeightPercentage + "%";
            this.viewContentEl.style.maxHeight = this.settings.flashcardHeightPercentage + "%";
            this.viewContentEl.style.width = this.settings.flashcardWidthPercentage + "%";
            this.viewContentEl.style.maxWidth = this.settings.flashcardWidthPercentage + "%";
        }

        if (
            this.settings.flashcardHeightPercentage < 100 ||
            this.settings.flashcardWidthPercentage < 100
        ) {
            this.viewContentEl.addClass("sr-center-view");
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
     */
    async onOpen() {
        // This happens when the tab was open before the plugin was loaded -> Closing and reopening the obsidian window
        // So we have to wait for the plugin to load and just ignore this
        if (
            this.viewContainerEl === null ||
            this.viewContentEl === null ||
            this.reviewQueueLoader === null
        )
            return;

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

        this.contentManager = new ContentManager(
            this.app,
            this.plugin,
            this.reviewQueueLoader,
            this.settings,
            this.viewContentEl,
        );

        this.contentManager.open();
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

        if (this.contentManager) this.contentManager.close();
    }
}
