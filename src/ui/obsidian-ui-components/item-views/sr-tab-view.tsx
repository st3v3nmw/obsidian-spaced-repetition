import "src/ui/obsidian-ui-components/item-views/tab-view.css";
import { ItemView, Platform, WorkspaceLeaf } from "obsidian";

import { SR_TAB_VIEW } from "src/data/constants";
import { SRSettings } from "src/data/settings";
import SRPlugin from "src/main";
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
        if (plugin.dataManager === null || plugin.dataManager.data === null)
            throw new Error("SR plugin or data not initialized!!!");
        // Init properties
        this.plugin = plugin;
        this.navigation = false;
        this.settings = plugin.dataManager.data.settings;
        this.reviewQueueLoader = reviewQueueLoader;

        // Build ui
        const viewContent = this.containerEl.getElementsByClassName("view-content");

        if (viewContent.length === 0) return;

        this.viewContainerEl = viewContent[0] as HTMLElement;
        this.viewContainerEl.addClass("sr-tab-view");
        this.viewContainerEl.addClass("sr-view");

        this.viewContentEl = this.viewContainerEl.createDiv("sr-tab-view-content");
        const isMobile: boolean = Platform.isMobile || EmulatedPlatform().isMobile;
        const heightPercent: number = isMobile
            ? this.settings.flashcardHeightPercentageMobile
            : this.settings.flashcardHeightPercentage;

        const widthPercent: number = isMobile
            ? this.settings.flashcardWidthPercentageMobile
            : this.settings.flashcardWidthPercentage;

        this.setSize(widthPercent, heightPercent);

        if (heightPercent < 100 || widthPercent < 100) {
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
        if (activeDocument.body.classList.contains("is-mobile")) {
            const mobileNavbar = activeDocument.getElementsByClassName("mobile-navbar")[0];
            if (mobileNavbar) {
                (mobileNavbar as HTMLElement).setCssProps({ position: "relative" });
            }
        }

        // Removes the bottom fade mask if it's mobile and floating nav, because else it overlaps the bottom part of the flashcard and makes it hard to read
        if (
            activeDocument.body.classList.contains("is-phone") &&
            activeDocument.body.classList.contains("is-floating-nav")
        ) {
            activeDocument.body.style.setProperty(
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
        if (this.plugin.uiManager === null) throw new Error("UI manager not initialized!!!");
        this.plugin.uiManager.setContentManager(this.contentManager);

        await this.contentManager.open();
    }

    /**
     * Closes the SRTabView by shutting down any active deck or flashcard views.
     * Ensures that resources associated with these views are properly released.
     */

    async onClose() {
        // Resets the changes made in onOpen
        if (activeDocument.body.classList.contains("is-mobile")) {
            const mobileNavbar = activeDocument.getElementsByClassName("mobile-navbar")[0];
            if (mobileNavbar) {
                (mobileNavbar as HTMLElement).setCssProps({ position: "unset" });
            }
        }

        // Resets the changes made in onOpen
        if (
            activeDocument.body.classList.contains("is-phone") &&
            activeDocument.body.classList.contains("is-floating-nav")
        ) {
            activeDocument.body.style.setProperty(
                "--view-bottom-fade-mask",
                "linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, #000000 calc(34px - 0px + 12px))",
            );
        }

        if (this.contentManager) this.contentManager.close();
    }

    private setSize(widthPercent: number, heightPercent: number) {
        if (!this.viewContentEl) return;
        this.viewContentEl.setCssProps({
            width: widthPercent + "%",
            "max-width": widthPercent + "%",
            height: heightPercent + "%",
            "max-height": heightPercent + "%",
        });
    }
}
