import { PaneType, TFile, WorkspaceLeaf } from "obsidian";

import { SR_TAB_VIEW } from "src/constants";
import { OsrAppCore } from "src/core";
import { Deck } from "src/deck";
import { FlashcardReviewMode } from "src/flashcard-review-sequencer";
import { SRTabView } from "src/gui/sr-tab-view";
import SRPlugin from "src/main";
import { TabViewType } from "src/utils/types";

/**
 * Manages tab views for the Spaced Repetition plugin, allowing for the opening and closing
 * of tabbed views within the application. Handles the registration of different tab view types
 * and facilitates the creation of new tab views based on the specified review mode and optional
 * single note. Ensures that tab views are properly initialized and revealed within the workspace.
 *
 * @property {SRPlugin} plugin - The main plugin instance.
 *
 * @method openSRTabView - Opens a new tab view for the specified review mode and optional single note.
 * @method closeAllTabViews - Closes all tab views.
 */
export default class TabViewManager {
    private plugin: SRPlugin;
    private osrAppCore: OsrAppCore;
    private shouldOpenSingeNoteTabView: boolean;
    private chosenReviewModeForTabbedView: FlashcardReviewMode;
    private chosenSingleNoteForTabbedView: TFile;

    // Add any new other tab view types to this, then they'll be automatically registered
    private tabViewTypes: TabViewType[] = [
        {
            type: SR_TAB_VIEW,
            viewCreator: (leaf) =>
                new SRTabView(leaf, this.plugin, async () => {
                    // Tabbed views cant get params on open call, so we have to do it here
                    // This allows us to load the data from inside the view when the open function is called
                    if (this.shouldOpenSingeNoteTabView) {
                        const singleNoteDeckData =
                            await this.plugin.getPreparedDecksForSingleNoteReview(
                                this.chosenSingleNoteForTabbedView,
                                this.chosenReviewModeForTabbedView,
                            );

                        return this.plugin.getPreparedReviewSequencer(
                            singleNoteDeckData.deckTree,
                            singleNoteDeckData.remainingDeckTree,
                            singleNoteDeckData.mode,
                        );
                    }

                    const fullDeckTree: Deck = this.osrAppCore.reviewableDeckTree;
                    const remainingDeckTree: Deck =
                        this.chosenReviewModeForTabbedView === FlashcardReviewMode.Cram
                            ? this.osrAppCore.reviewableDeckTree
                            : this.osrAppCore.remainingDeckTree;

                    return this.plugin.getPreparedReviewSequencer(
                        fullDeckTree,
                        remainingDeckTree,
                        this.chosenReviewModeForTabbedView,
                    );
                }),
        },
    ];

    // Add any needed resourced
    constructor(plugin: SRPlugin) {
        this.plugin = plugin;
        this.shouldOpenSingeNoteTabView = false;

        this.registerAllTabViews();
    }

    /**
     * Opens the Spaced Repetition tab view in the application.
     *
     * This method sets up the necessary state for the tab view and invokes the
     * internal method to open the tab view with the specified parameters.
     *
     * @param osrAppCore - The core application instance used for managing reviewable decks.
     * @param reviewMode - The mode of flashcard review.
     * @param singleNote - Optional parameter specifying a single note to review.
     *                     If provided, the tab view will focus on this note.
     *
     * @returns {Promise<void>} - A promise that resolves when the tab view is opened.
     */
    public async openSRTabView(
        osrAppCore: OsrAppCore,
        reviewMode: FlashcardReviewMode,
        singleNote?: TFile,
    ) {
        this.osrAppCore = osrAppCore;
        this.chosenReviewModeForTabbedView = reviewMode;
        this.shouldOpenSingeNoteTabView = singleNote !== undefined;
        if (singleNote) this.chosenSingleNoteForTabbedView = singleNote;

        await this.openTabView(SR_TAB_VIEW, true);
    }

    /**
     * Closes all open tab views in the application.
     *
     * This method iterates over all registered tab view types and detaches
     * their corresponding leaves from the workspace, effectively closing them.
     */
    public closeAllTabViews() {
        this.forEachTabViewType((viewType) => {
            this.plugin.app.workspace.detachLeavesOfType(viewType.type);
        });
    }

    public forEachTabViewType(callback: (type: TabViewType) => void) {
        this.tabViewTypes.forEach((type) => callback(type));
    }

    public registerAllTabViews() {
        this.forEachTabViewType((viewType) =>
            this.plugin.registerView(viewType.type, viewType.viewCreator),
        );
    }

    public async openTabView(type: string, newLeaf?: PaneType | boolean) {
        const { workspace } = this.plugin.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(type);

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            leaf = leaves[0];
        } else {
            // Our view could not be found in the workspace, create a new leaf as a tab
            leaf = workspace.getLeaf(newLeaf);
            if (leaf !== null) {
                await leaf.setViewState({ type: type, active: true });
            }
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        if (leaf !== null) {
            workspace.revealLeaf(leaf);
        }
    }
}
