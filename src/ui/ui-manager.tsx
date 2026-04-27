import "src/ui/styles.css";
import { Menu, MenuItem, Platform, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { FlashcardReviewMode } from "src/card/flashcard-review-sequencer";
import { CardListType } from "src/deck/deck";
import {
    deleteAllSchedulingDataOfCardsInNote,
    deleteNoteSchedulingDataInNote,
} from "src/delete-scheduling-data";
import { appIcon } from "src/icons/app-icon";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
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

export enum UIState {
    Closed,
    DeckList,
    CardFront,
    CardBack,
    EditModal,
}

/**
 * Manages the UI elements of the Spaced Repetition plugin, including the status bar, sidebar, and tab views.
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
    public tabViewManager: TabViewManager;
    public sidebarManager: SidebarManager;
    public statusBarManager: StatusBarManager;
    public uiState: UIState = UIState.Closed;
    public isSRInFocus: boolean = false;
    public contentManager: ContentManager | null = null;

    private plugin: SRPlugin;
    private ribbonIcon: HTMLElement | null = null;
    private externalModalObserver: MutationObserver | null = null;
    private areFileMenuItemsShown: boolean = false;

    constructor(plugin: SRPlugin) {
        this.plugin = plugin;
        appIcon();

        // Closes all still open tab views when the plugin is loaded, because it causes bugs / empty windows otherwise
        this.tabViewManager = new TabViewManager(this.plugin);
        this.plugin.app.workspace.onLayoutReady(async () => {
            this.tabViewManager.closeAllTabViews();
        });

        this.sidebarManager = new SidebarManager(
            this.plugin,
            this.plugin.data.settings,
            this.plugin.nextNoteReviewHandler,
        );
        this.sidebarManager.init();
        this.plugin.app.workspace.onLayoutReady(async () => {
            await this.sidebarManager.activateReviewQueueViewPanel();
            setTimeout(async () => {
                if (!this.plugin.osrAppCore.syncLock) {
                    await this.plugin.sync();
                }
            }, 2000);
        });

        this.statusBarManager = new StatusBarManager(this.plugin);

        this.showRibbonIcon(this.plugin.data.settings.showRibbonIcon);
        this.plugin.registerEvent(
            this.plugin.app.workspace.on("file-menu", this.fileMenuHandler.bind(this)),
        );
        this.plugin.addSettingTab(new SRSettingTab(this.plugin.app, this.plugin));
        this.registerSRFocusListener();
    }

    public destroy() {
        this.removeSRFocusListener();
        this.plugin.app.workspace.off("file-menu", this.fileMenuHandler.bind(this));
        this.tabViewManager.closeAllTabViews();
    }

    public updateStatusBar() {
        this.statusBarManager.showStatusBarItems(this.plugin.data.settings.showStatusBar);

        if (this.plugin.data.settings.showStatusBar) {
            this.statusBarManager.setCount(
                this.plugin.osrAppCore.remainingDeckTree.getCardCount(CardListType.All, true),
                this.plugin.data.settings.showStatusBar,
                "card-review",
            );
            this.statusBarManager.setCount(
                this.plugin.osrAppCore.noteReviewQueue.dueNotesCount,
                this.plugin.data.settings.showStatusBar,
                "note-review",
            );
            this.statusBarManager.showUpdateAvailableItemIfAvailable();
        }
    }

    public registerSRFocusListener() {
        this.plugin.registerEvent(
            this.plugin.app.workspace.on("active-leaf-change", this.handleFocusChange.bind(this)),
        );
        this.externalModalObserver = new MutationObserver(this.handleExternalModalOpen.bind(this));
        this.externalModalObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    public removeSRFocusListener() {
        this.setSRViewInFocus(false);
        this.plugin.app.workspace.off("active-leaf-change", this.handleFocusChange.bind(this));
    }

    public handleFocusChange(leaf: WorkspaceLeaf | null) {
        this.setSRViewInFocus(
            leaf !== null && leaf !== undefined && leaf.view instanceof SRTabView,
        );
    }

    public handleExternalModalOpen(mutationList: MutationRecord[]) {
        if (
            this.plugin.data.settings.openViewInNewTab && // Is a modal opening relevant for focus?
            mutationList.length > 0 &&
            mutationList.filter(
                (mutation) =>
                    mutation.type === "childList" &&
                    (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0),
            ).length > 0
        ) {
            const modal = document.querySelector(".modal-container"); // Check your modal selector
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
        if (this.plugin.osrAppCore.syncLock) {
            return;
        }
        await this.plugin.sync();

        const isMobile = Platform.isMobile || EmulatedPlatform().isMobile;
        const openInNewTab =
            (!isMobile && this.plugin.data.settings.openViewInNewTab) ||
            (isMobile && this.plugin.data.settings.openViewInNewTabMobile);

        const reviewQueueLoader = new ReviewQueueLoader(
            this.plugin,
            this.plugin.osrAppCore,
            singleNote ?? null,
            mode,
        );

        if (openInNewTab) {
            this.tabViewManager.openSRTabView(reviewQueueLoader);
        } else {
            this.openFlashcardModal(reviewQueueLoader);
        }
    }

    public async openFlashcardModal(reviewQueueLoader: ReviewQueueLoader): Promise<void> {
        this.setSRViewInFocus(true);
        new SRModalView(
            this.plugin.app,
            this.plugin,
            this.plugin.data.settings,
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
        if (status) {
            this.ribbonIcon.style.display = "";
        } else {
            this.ribbonIcon.style.display = "none";
        }
    }

    private fileMenuHandler(menu: Menu, file: TAbstractFile) {
        if (!(file instanceof TFile && file.extension === "md")) return;

        if (this.plugin.data.settings.showFileMenuReviewOptions) {
            menu.addItem((item: MenuItem) => {
                item.setTitle(
                    t("REVIEW_DIFFICULTY_FILE_MENU", {
                        difficulty: this.plugin.data.settings.flashcardEasyText,
                    }),
                )
                    .setIcon("SpacedRepIcon")
                    .onClick(() => {
                        this.plugin.saveNoteReviewResponse(file, ReviewResponse.Easy);
                    });
            });

            menu.addItem((item) => {
                item.setTitle(
                    t("REVIEW_DIFFICULTY_FILE_MENU", {
                        difficulty: this.plugin.data.settings.flashcardGoodText,
                    }),
                )
                    .setIcon("SpacedRepIcon")
                    .onClick(() => {
                        this.plugin.saveNoteReviewResponse(file, ReviewResponse.Good);
                    });
            });

            menu.addItem((item) => {
                item.setTitle(
                    t("REVIEW_DIFFICULTY_FILE_MENU", {
                        difficulty: this.plugin.data.settings.flashcardHardText,
                    }),
                )
                    .setIcon("SpacedRepIcon")
                    .onClick(() => {
                        this.plugin.saveNoteReviewResponse(file, ReviewResponse.Hard);
                    });
            });
        }

        if (
            this.plugin.data.settings.showFileMenuReviewOptions &&
            this.plugin.data.settings.showDeleteButtonInFileMenu
        ) {
            menu.addSeparator();
        }

        if (this.plugin.data.settings.showDeleteButtonInFileMenu) {
            menu.addItem((item) => {
                item.setTitle(t("DELETE_NOTE_SCHEDULING_DATA_IN_NOTE"))
                    .setIcon("trash")
                    .setWarning(true)
                    .onClick(async () => {
                        new ConfirmationModal(
                            this.plugin.app,
                            t("DELETE_NOTE_SCHEDULING_DATA_IN_NOTE"),
                            t("CONFIRM_NOTE_SCHEDULING_DATA_IN_NOTE_DELETION"),
                            t("NOTE_SCHEDULING_DATA_IN_NOTE_DELETION_IN_PROGRESS"),
                            () => {
                                deleteNoteSchedulingDataInNote(
                                    file,
                                    this.plugin.data.settings.deleteTagsOnSchedulingDataDeletion,
                                    this.plugin.data.settings.tagsToReview,
                                );
                            },
                        ).open();
                    });
            });

            menu.addItem((item) => {
                item.setTitle(t("DELETE_SCHEDULING_DATA_OF_CARDS_IN_NOTE"))
                    .setIcon("trash")
                    .setWarning(true)
                    .onClick(async () => {
                        new ConfirmationModal(
                            this.plugin.app,
                            t("DELETE_SCHEDULING_DATA_OF_CARDS_IN_NOTE"),
                            t("CONFIRM_SCHEDULING_DATA_OF_CARDS_IN_NOTE_DELETION"),
                            t("SCHEDULING_DATA_OF_CARDS_IN_NOTE_DELETION_IN_PROGRESS"),
                            () => {
                                deleteAllSchedulingDataOfCardsInNote(
                                    file,
                                    this.plugin.data.settings.deleteTagsOnSchedulingDataDeletion,
                                    this.plugin.data.settings.flashcardTags,
                                );
                            },
                        ).open();
                    });
            });
        }
    }
}
