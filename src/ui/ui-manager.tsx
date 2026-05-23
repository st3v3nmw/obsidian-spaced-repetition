import "src/ui/styles.css";
import { Menu, MenuItem, Platform, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";

import { DataManager } from "src/data/data-manager";
import { DataStore } from "src/data/data-store/base/data-store";
import { appIcon } from "src/icons/app-icon";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { RepItemState, ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { FlashcardReviewMode } from "src/scheduling/flashcard-review-sequencer";
import ContentManager from "src/ui/obsidian-ui-components/content-container/content-manager";
import { SRTabView } from "src/ui/obsidian-ui-components/item-views/sr-tab-view";
import { ConfirmationModal } from "src/ui/obsidian-ui-components/modals/confirmation-modal";
import { SRModalView } from "src/ui/obsidian-ui-components/modals/sr-modal-view";
import { SRSettingTab } from "src/ui/obsidian-ui-components/settings-tab";
import { ReviewQueueLoader } from "src/ui/review-queue-loader";
import { SidebarManager } from "src/ui/sidebar-manager";
import StatusBarManager from "src/ui/status-bar-manager";
import TabViewManager from "src/ui/tab-view-manager";
import EmulatedPlatform from "src/utils/platform-detector";

/**
 * Represents the different states of the UI.
 *
 * @type {ReadonlyArray<UIState>}
 */
export enum UIState {
    Closed,
    DeckList,
    CardFront,
    CardBack,
    EditModal,
}

/**
 * Manages all the UI systems of the Spaced Repetition plugin & exposes them to the other parts of the plugin.
 *
 * @property {SRPlugin} plugin - The main plugin instance.
 * @property {TabViewManager} tabViewManager - The tab view manager responsible for managing the SR tab view.
 * @property {SidebarManager} sidebarManager - The sidebar manager responsible for managing the sidebar.
 * @property {StatusBarManager} statusBarManager - The status bar manager responsible for managing the status bar.
 * @property {HTMLElement} ribbonIcon - The ribbon icon element.
 * @property {boolean} isSRInFocus - A flag indicating whether the SR tab view is currently in focus.
 * @property {MutationObserver} externalModalObserver - The mutation observer responsible for monitoring external modals.
 *
 * @method openDeckContainer - Opens the deck container for the specified review mode and optional single note.
 * @method openFlashcardModal - Opens the flashcard modal for the specified review mode and optional single note.
 * @method setSRViewInFocus - Sets the SR tab view in focus state.
 */
export class UIManager {
    private dataManager: DataManager;
    public tabViewManager: TabViewManager;
    public sidebarManager: SidebarManager;
    public statusBarManager: StatusBarManager;
    public uiState: UIState = UIState.Closed;
    public isSRInFocus: boolean = false;
    public contentManager: ContentManager | null = null;

    private plugin: SRPlugin;
    private ribbonIcon: HTMLElement | null = null;
    private externalModalObserver: MutationObserver | null = null;

    constructor(plugin: SRPlugin, dataManager: DataManager) {
        this.plugin = plugin;
        this.dataManager = dataManager;
        appIcon();

        // Closes all still open tab views when the plugin is loaded, because it causes bugs / empty windows otherwise
        this.tabViewManager = new TabViewManager(this.plugin);

        if (this.plugin.nextNoteReviewHandler === null)
            throw new Error("Next note review handler not initialized!!!");
        if (this.dataManager.data === null) throw new Error("SR plugin or data not initialized!!!");

        this.sidebarManager = new SidebarManager(
            this.plugin,
            this.dataManager.data.settings,
            this.plugin.nextNoteReviewHandler,
        );
        this.sidebarManager.init();
        this.plugin.app.workspace.onLayoutReady(async () => {
            this.tabViewManager.closeAllTabViews();
            await this.sidebarManager.activateReviewQueueViewPanel();
            await this.dataManager.sync();
        });

        this.statusBarManager = new StatusBarManager(this.plugin);

        this.showRibbonIcon(this.dataManager.data.settings.showRibbonIcon);
        this.plugin.registerEvent(
             
            this.plugin.app.workspace.on("file-menu", this.fileMenuHandler.bind(this)),
        );
        this.plugin.addSettingTab(
            new SRSettingTab(this.plugin.app, this.plugin, this.dataManager, this),
        );

        this.registerSRFocusListener();
    }

    public destroy() {
        this.removeSRFocusListener();
        // @ts-expect-error - TS2339: Property 'fileMenuHandler' does not exist on type 'UIManager'.
        this.plugin.app.workspace.off("file-menu", this.fileMenuHandler.bind(this));
        this.tabViewManager.closeAllTabViews();
    }

    public updateStatusBar() {
        if (this.dataManager.data === null) throw new Error("SR plugin or data not initialized!!!");
        if (this.dataManager.osrCore === null)
            throw new Error("SR plugin or OSR app core not initialized!!!");

        const settings = this.dataManager.data.settings;

        this.statusBarManager.showStatusBarItems(
            settings.showStatusBar,
            settings.showCardStatusBarItem,
            settings.showNoteStatusBarItem,
            settings.showUpdateAvailableStatusBarItem,
        );

        if (settings.showStatusBar) {
            this.statusBarManager.setCount(
                this.dataManager.osrCore.remainingDeckTree
                    ? this.dataManager.osrCore.remainingDeckTree.getRepItemCount(
                          RepItemState.AnyItem,
                          true,
                      )
                    : 0,
                settings.showStatusBar && settings.showCardStatusBarItem,
                "card-review",
            );
            this.statusBarManager.setCount(
                this.dataManager.osrCore.noteReviewQueue.dueNotesCount,
                settings.showStatusBar && settings.showNoteStatusBarItem,
                "note-review",
            );
        }
    }

    public registerSRFocusListener() {
        this.plugin.registerEvent(
             
            this.plugin.app.workspace.on("active-leaf-change", this.handleFocusChange.bind(this)),
        );
         
        this.externalModalObserver = new MutationObserver(this.handleExternalModalOpen.bind(this));
        this.externalModalObserver.observe(activeDocument.body, {
            childList: true,
            subtree: true,
        });
    }

    public removeSRFocusListener() {
        this.setSRViewInFocus(false);
        // @ts-expect-error - TS2339: Property 'handleFocusChange' does not exist on type 'UIManager'.
        this.plugin.app.workspace.off("active-leaf-change", this.handleFocusChange.bind(this));
    }

    public handleFocusChange(leaf: WorkspaceLeaf | null) {
        this.setSRViewInFocus(
            leaf !== null && leaf !== undefined && leaf.view instanceof SRTabView,
        );
    }

    public handleExternalModalOpen(mutationList: MutationRecord[]) {
        if (this.dataManager.data === null) throw new Error("SR plugin or data not initialized!!!");

        if (
            this.dataManager.data.settings.openViewInNewTab && // Is a modal opening relevant for focus?
            mutationList.length > 0 &&
            mutationList.filter(
                (mutation) =>
                    mutation.type === "childList" &&
                    (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0),
            ).length > 0
        ) {
            const modal = activeDocument.querySelector(".modal-container"); // Check your modal selector
            // Only set focus if it was already in focus, as that is the only case where the tab would be covered by the modal
            this.setSRViewInFocus(
                (modal === null || modal === undefined) &&
                    this.plugin.app.workspace.getActiveViewOfType(SRTabView) !== null &&
                    this.plugin.app.workspace.getActiveViewOfType(SRTabView) !== undefined,
            );
        }
    }

    public setUIState(state: UIState) {
        this.uiState = state;
    }

    public setContentManager(contentManager: ContentManager) {
        // TODO: Find a better way to do this, without having to pass the ContentManager around
        this.contentManager = contentManager;
    }

    public async openDeckContainer(mode: FlashcardReviewMode, singleNote?: TFile): Promise<void> {
        if (this.dataManager.osrCore === null)
            throw new Error("SR plugin or OSR app core not initialized!!!");
        if (this.dataManager.data === null) throw new Error("SR plugin or data not initialized!!!");

        if (this.dataManager.syncLock) {
            return;
        }
        await this.dataManager.sync();

        const settings = this.dataManager.data.settings;

        const isMobile = Platform.isMobile || EmulatedPlatform().isMobile;
        const openInNewTab =
            (!isMobile && settings.openViewInNewTab) ||
            (isMobile && settings.openViewInNewTabMobile);

        const reviewQueueLoader = new ReviewQueueLoader(
            this.plugin,
            this.dataManager.osrCore,
            singleNote ?? null,
            mode,
        );

        if (openInNewTab) {
            await this.tabViewManager.openSRTabView(reviewQueueLoader);
        } else {
            this.openFlashcardModal(reviewQueueLoader);
        }
    }

    public openFlashcardModal(reviewQueueLoader: ReviewQueueLoader): void {
        if (this.dataManager.data === null) throw new Error("SR plugin or data not initialized!!!");

        this.setSRViewInFocus(true);
        new SRModalView(
            this.plugin.app,
            this.plugin,
            this.dataManager.data.settings,
            reviewQueueLoader,
        ).open();
    }

    public setSRViewInFocus(value: boolean) {
        this.isSRInFocus = value;
    }

    public getSRInFocusState(): boolean {
        return this.isSRInFocus;
    }

    showRibbonIcon(status: boolean) {
        // if it does not exist, we create it
        if (!this.ribbonIcon) {
            this.ribbonIcon = this.plugin.addRibbonIcon(
                "SpacedRepIcon",
                t("REVIEW_CARDS"),
                async () => {
                    await this.openDeckContainer(FlashcardReviewMode.Review);
                },
            );
        }

        this.ribbonIcon.setCssProps({ display: status ? "" : "none" });
    }

    private fileMenuHandler(menu: Menu, file: TAbstractFile) {
        if (this.dataManager.data === null) throw new Error("SR plugin or data not initialized!!!");
        if (!(file instanceof TFile && file.extension === "md")) return;

        const settings = this.dataManager.data.settings;

        if (settings.showFileMenuReviewOptions) {
            menu.addItem((item: MenuItem) => {
                item.setTitle(
                    t("REVIEW_DIFFICULTY_FILE_MENU", {
                        difficulty: settings.flashcardEasyText,
                    }),
                )
                    .setIcon("SpacedRepIcon")
                    .onClick(() => {
                        if (this.dataManager.data === null)
                            throw new Error("SR plugin or data not initialized!!!");
                        void this.dataManager.saveNoteReviewResponse(file, ReviewResponse.Easy);
                    });
            });

            menu.addItem((item) => {
                item.setTitle(
                    t("REVIEW_DIFFICULTY_FILE_MENU", {
                        difficulty: settings.flashcardGoodText,
                    }),
                )
                    .setIcon("SpacedRepIcon")
                    .onClick(() => {
                        if (this.dataManager.data === null)
                            throw new Error("SR plugin or data not initialized!!!");
                        void this.dataManager.saveNoteReviewResponse(file, ReviewResponse.Good);
                    });
            });

            menu.addItem((item) => {
                item.setTitle(
                    t("REVIEW_DIFFICULTY_FILE_MENU", {
                        difficulty: settings.flashcardHardText,
                    }),
                )
                    .setIcon("SpacedRepIcon")
                    .onClick(() => {
                        if (this.dataManager.data === null)
                            throw new Error("SR plugin or data not initialized!!!");
                        void this.dataManager.saveNoteReviewResponse(file, ReviewResponse.Hard);
                    });
            });
        }

        if (settings.showFileMenuReviewOptions && settings.showDeleteButtonInFileMenu) {
            menu.addSeparator();
        }

        if (settings.showDeleteButtonInFileMenu) {
            menu.addItem((item) => {
                item.setTitle(t("DELETE_NOTE_SCHEDULING_DATA_IN_NOTE"))
                    .setIcon("trash")
                    .setWarning(true)
                    .onClick(() => {
                        new ConfirmationModal(
                            this.plugin.app,
                            t("DELETE_NOTE_SCHEDULING_DATA_IN_NOTE"),
                            t("CONFIRM_NOTE_SCHEDULING_DATA_IN_NOTE_DELETION"),
                            t("NOTE_SCHEDULING_DATA_IN_NOTE_DELETION_IN_PROGRESS"),
                            async () => {
                                if (this.dataManager.data === null)
                                    throw new Error("SR plugin or data not initialized!!!");
                                const settings = this.dataManager.data.settings;
                                await DataStore.instance.fileModifier.deleteNoteSchedulingDataInNote(
                                    file,
                                    settings.deleteTagsOnSchedulingDataDeletion,
                                    settings.tagsToReview,
                                );
                            },
                        ).open();
                    });
            });

            menu.addItem((item) => {
                item.setTitle(t("DELETE_SCHEDULING_DATA_OF_CARDS_IN_NOTE"))
                    .setIcon("trash")
                    .setWarning(true)
                    .onClick(() => {
                        new ConfirmationModal(
                            this.plugin.app,
                            t("DELETE_SCHEDULING_DATA_OF_CARDS_IN_NOTE"),
                            t("CONFIRM_SCHEDULING_DATA_OF_CARDS_IN_NOTE_DELETION"),
                            t("SCHEDULING_DATA_OF_CARDS_IN_NOTE_DELETION_IN_PROGRESS"),
                            async () => {
                                if (this.dataManager.data === null)
                                    throw new Error("SR plugin or data not initialized!!!");
                                const settings = this.dataManager.data.settings;
                                await DataStore.instance.fileModifier.deleteAllSchedulingDataOfCardsInNote(
                                    file,
                                    settings.deleteTagsOnSchedulingDataDeletion,
                                    settings.flashcardTags,
                                );
                            },
                        ).open();
                    });
            });
        }
    }
}
