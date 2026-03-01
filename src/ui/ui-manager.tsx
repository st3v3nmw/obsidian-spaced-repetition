import { Menu, Platform, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { FlashcardReviewMode } from "src/card/flashcard-review-sequencer";
import { CardListType } from "src/deck/deck";
import { appIcon } from "src/icons/app-icon";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { SRTabView } from "src/ui/obsidian-ui-components/item-views/sr-tab-view";
import { SRSettingTab } from "src/ui/obsidian-ui-components/settings-tab";
import { SidebarManager } from "src/ui/sidebar-manager";
import StatusBarManager from "src/ui/status-bar-manager";
import TabViewManager from "src/ui/tab-view-manager";
import EmulatedPlatform from "src/utils/platform-detector";

export class UIManager {
    private plugin: SRPlugin;
    public tabViewManager: TabViewManager;
    public sidebarManager: SidebarManager;
    public statusBarManager: StatusBarManager | null = null;
    private ribbonIcon: HTMLElement | null = null;
    private isSRInFocus: boolean = false;
    private externalModalObserver: MutationObserver;

    private fileMenuHandler: (
        menu: Menu,
        file: TAbstractFile,
        source: string,
        leaf?: WorkspaceLeaf,
    ) => void;

    // TODO: FIX all missing functions after refactor

    constructor(plugin: SRPlugin) {
        this.plugin = plugin;
        appIcon();

        // Closes all still open tab views when the plugin is loaded, because it causes bugs / empty windows otherwise
        this.tabViewManager = new TabViewManager(this.plugin);
        this.plugin.app.workspace.onLayoutReady(async () => {
            this.tabViewManager.closeAllTabViews();
        });

        this.sidebarManager = new SidebarManager(this.plugin, this.plugin.data.settings, this.plugin.nextNoteReviewHandler);
        this.sidebarManager.init();
        this.plugin.app.workspace.onLayoutReady(async () => {
            await this.sidebarManager.activateReviewQueueViewPanel();
            setTimeout(async () => {
                if (!this.plugin.osrAppCore.syncLock) {
                    await this.plugin.sync();
                }
            }, 2000);
        });

        this.statusBarManager = new StatusBarManager(this.plugin, this.plugin.data.settings.showStatusBar);

        this.showRibbonIcon(this.plugin.data.settings.showRibbonIcon);
        this.showFileMenuItems(this.plugin.data.settings.disableFileMenuReviewOptions);
        this.plugin.addSettingTab(new SRSettingTab(this.plugin.app, this.plugin));
        this.registerSRFocusListener();
    }

    destroy() {
        this.removeSRFocusListener();
        this.plugin.app.workspace.off("file-menu", this.fileMenuHandler);
        this.tabViewManager.closeAllTabViews();
    }

    public updateStatusBar() {
        if (this.plugin.data.settings.showStatusBar) {
            this.statusBarManager.setText(
                `${this.plugin.osrAppCore.remainingDeckTree.getCardCount(
                    CardListType.All,
                    true,
                )} card(s) due`,
                "card-review",
            );
            this.statusBarManager.setText(
                `${this.plugin.osrAppCore.noteReviewQueue.dueNotesCount} note(s) due`,
                "note-review",
            );
        }

        this.statusBarManager.showStatusBarItems(this.plugin.data.settings.showStatusBar);
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
        this.setSRViewInFocus(leaf !== null && leaf.view instanceof SRTabView);
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
                modal === null && this.plugin.app.workspace.getActiveViewOfType(SRTabView) !== null,
            );
        }
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
            this.ribbonIcon = this.plugin.addRibbonIcon("SpacedRepIcon", t("REVIEW_CARDS"), async () => {
                if (!this.plugin.osrAppCore.syncLock) {
                    await this.plugin.sync();
                    const isMobile = Platform.isMobile || EmulatedPlatform().isMobile;
                    const openInNewTab =
                        (!isMobile && this.plugin.data.settings.openViewInNewTab) ||
                        (isMobile && this.plugin.data.settings.openViewInNewTabMobile);

                    if (openInNewTab) {
                        this.tabViewManager.openSRTabView(
                            this.plugin.osrAppCore,
                            FlashcardReviewMode.Review,
                        );
                    } else {
                        this.plugin.openFlashcardModal(
                            this.plugin.osrAppCore.reviewableDeckTree,
                            this.plugin.osrAppCore.remainingDeckTree,
                            FlashcardReviewMode.Review,
                        );
                    }
                }
            });
        }
        if (status) {
            this.ribbonIcon.style.display = "";
        } else {
            this.ribbonIcon.style.display = "none";
        }
    }

    showFileMenuItems(status: boolean) {
        // define the handler if it was not defined yet
        if (this.fileMenuHandler === undefined) {
            this.fileMenuHandler = (menu, fileish: TAbstractFile) => {
                if (fileish instanceof TFile && fileish.extension === "md") {
                    menu.addItem((item) => {
                        item.setTitle(
                            t("REVIEW_DIFFICULTY_FILE_MENU", {
                                difficulty: this.plugin.data.settings.flashcardEasyText,
                            }),
                        )
                            .setIcon("SpacedRepIcon")
                            .onClick(() => {
                                this.plugin.saveNoteReviewResponse(fileish, ReviewResponse.Easy);
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
                                this.plugin.saveNoteReviewResponse(fileish, ReviewResponse.Good);
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
                                this.plugin.saveNoteReviewResponse(fileish, ReviewResponse.Hard);
                            });
                    });
                }
            };
        }

        if (status) {
            this.plugin.registerEvent(this.plugin.app.workspace.on("file-menu", this.fileMenuHandler));
        } else {
            this.plugin.app.workspace.off("file-menu", this.fileMenuHandler);
        }
    }

}