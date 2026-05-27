import "src/ui/styles.css";
import { Menu, MenuItem, Notice, Platform, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";

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
    public tabViewManager: TabViewManager;
    public sidebarManager: SidebarManager;
    public statusBarManager: StatusBarManager;
    public uiState: UIState = UIState.Closed;
    public isSRInFocus: boolean = false;
    public contentManager: ContentManager | null = null;

    private plugin: SRPlugin;
    private ribbonIcon: HTMLElement | null = null;
    private externalModalObserver: MutationObserver | null = null;

    constructor(plugin: SRPlugin) {
        this.plugin = plugin;
        appIcon();

        // Closes all still open tab views when the plugin is loaded, because it causes bugs / empty windows otherwise
        this.tabViewManager = new TabViewManager(this.plugin);

        this.sidebarManager = new SidebarManager(this.plugin);

        this.statusBarManager = new StatusBarManager(this.plugin);

        this.plugin.registerEvent(
            this.plugin.app.workspace.on("file-menu", this.fileMenuHandler.bind(this)),
        );
        this.plugin.addSettingTab(new SRSettingTab(this.plugin.app, this.plugin, this));
    }

    public async onLayoutReady() {
        this.tabViewManager.closeAllTabViews();
        await this.sidebarManager.activateReviewQueueViewPanel();
        await this.plugin.dataManager.sync();

        await this.statusBarManager.createStatusBarItems();

        this.sidebarManager.init();

        this.showRibbonIcon(this.plugin.dataManager.data.settings.showRibbonIcon);
        this.registerSRFocusListener();
    }

    public destroy() {
        this.removeSRFocusListener();
        this.plugin.app.workspace.off("file-menu", this.fileMenuHandler.bind(this));
    }

    public async updateStatusBar() {
        if (this.plugin.dataManager.data === null)
            throw new Error("SR plugin or data not initialized!!!");
        if (this.plugin.dataManager.osrCore === null)
            throw new Error("SR plugin or OSR app core not initialized!!!");

        const settings = this.plugin.dataManager.data.settings;

        await this.statusBarManager.showStatusBarItems(
            settings.showStatusBar,
            settings.showCardStatusBarItem,
            settings.showNoteStatusBarItem,
            settings.showUpdateAvailableStatusBarItem,
        );

        if (settings.showStatusBar) {
            this.statusBarManager.setCount(
                this.plugin.dataManager.osrCore.remainingDeckTree.getRepItemCount(
                    RepItemState.AnyItem,
                    true,
                ),
                settings.showStatusBar && settings.showCardStatusBarItem,
                "card-review",
            );
            this.statusBarManager.setCount(
                this.plugin.dataManager.osrCore.noteReviewQueue.dueNotesCount,
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
        this.plugin.app.workspace.off("active-leaf-change", this.handleFocusChange.bind(this));
    }

    public handleFocusChange(leaf: WorkspaceLeaf | null) {
        this.setSRViewInFocus(
            leaf !== null && leaf !== undefined && leaf.view instanceof SRTabView,
        );
    }

    public handleExternalModalOpen(mutationList: MutationRecord[]) {
        if (this.plugin.dataManager.data === null)
            throw new Error("SR plugin or data not initialized!!!");

        if (
            this.plugin.dataManager.data.settings.openViewInNewTab && // Is a modal opening relevant for focus?
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

    /**
     * Brings the current Obsidian window to the foreground on desktop.
     *
     * Reminders can optionally auto-open review, so we try to focus the existing app window
     * instead of spawning a detached-looking modal behind another application.
     */
    public focusObsidianWindow(): void {
        if (!Platform.isDesktopApp) {
            return;
        }

        const activeLeaf = this.plugin.app.workspace.activeLeaf;
        if (activeLeaf !== null) {
            this.plugin.app.workspace.setActiveLeaf(activeLeaf, { focus: true });
            activeLeaf.getContainer()?.win?.focus();
        }
        activeDocument.defaultView?.focus();

        const electronWindow = this.getElectronWindow();
        if (electronWindow !== null) {
            if (electronWindow.isMinimized?.()) {
                electronWindow.restore?.();
            }
            electronWindow.show?.();
            electronWindow.focus?.();
            electronWindow.moveTop?.();
        }
    }

    /**
     * Resolves the current Electron window using either the modern or legacy remote bridge.
     *
     * Different Obsidian/Electron combinations expose window APIs through `@electron/remote`
     * or `electron.remote`, so the reminder feature probes both paths and degrades quietly.
     */
    private getElectronWindow(): {
        isMinimized?: () => boolean;
        restore?: () => void;
        show?: () => void;
        focus?: () => void;
        moveTop?: () => void;
    } | null {
        type RequireFn = (moduleName: string) => unknown;
        const requireFn: RequireFn | undefined = (
            activeDocument.defaultView as (Window & { require?: RequireFn }) | null
        )?.require;

        if (requireFn === undefined) {
            return null;
        }

        try {
            const remoteModule = requireFn("@electron/remote") as {
                getCurrentWindow?: () => unknown;
            };
            const currentWindow = remoteModule?.getCurrentWindow?.();
            if (currentWindow !== null && currentWindow !== undefined) {
                return currentWindow as {
                    isMinimized?: () => boolean;
                    restore?: () => void;
                    show?: () => void;
                    focus?: () => void;
                    moveTop?: () => void;
                };
            }
        } catch {
            // ignore
        }

        try {
            const electronModule = requireFn("electron") as {
                remote?: { getCurrentWindow?: () => unknown };
            };
            const currentWindow = electronModule?.remote?.getCurrentWindow?.();
            if (currentWindow !== null && currentWindow !== undefined) {
                return currentWindow as {
                    isMinimized?: () => boolean;
                    restore?: () => void;
                    show?: () => void;
                    focus?: () => void;
                    moveTop?: () => void;
                };
            }
        } catch {
            // ignore
        }

        return null;
    }

    /**
     * Dispatches the configured reminder attention signals.
     *
     * Notice, sound, dock bounce, and optional auto-open are deliberately separated so users can
     * enable only the channels that make sense for their workflow.
     */
    public async notifyReviewReminder(): Promise<void> {
        const settings = this.plugin.dataManager.data.settings;
        const reminderMessage =
            settings.reviewReminderMessage.trim() || t("REVIEW_REMINDER_NOTICE");
        // This method only dispatches reminder channels. The decision to auto-open review remains
        // in the scheduler layer so the UI manager is not responsible for reminder policy.
        if (settings.reviewReminderShowNotice) {
            new Notice(reminderMessage, 5000);
        }
        if (settings.reviewReminderPlaySound) {
            await this.playReviewReminderBeep();
        }
        if (settings.reviewReminderBounceDock) {
            this.bounceDockIcon();
        }
    }

    /**
     * Plays a short synthesized alert tone for desktop reminders.
     *
     * Web Audio availability differs across Electron environments, so this stays best-effort and
     * exits silently when audio cannot be initialized or resumed.
     */
    private async playReviewReminderBeep(): Promise<void> {
        if (!Platform.isDesktopApp) {
            return;
        }

        const windowObject = activeDocument.defaultView as
            | (Window & {
                  AudioContext?: typeof AudioContext;
                  webkitAudioContext?: typeof AudioContext;
              })
            | null;
        const AudioContextCtor =
            windowObject?.AudioContext ?? windowObject?.webkitAudioContext ?? null;
        if (AudioContextCtor === null) {
            return;
        }

        let context: AudioContext | null = null;
        try {
            context = new AudioContextCtor();
            if (context.state === "suspended") {
                await context.resume();
            }
            if (context.state !== "running") {
                return;
            }
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            oscillator.type = "sine";
            oscillator.frequency.value = 880;
            gainNode.gain.setValueAtTime(0.0001, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.35);
            await new Promise<void>((resolve) => {
                oscillator.onended = () => resolve();
            });
        } catch {
            // ignore
        } finally {
            if (context !== null && context.state !== "closed") {
                void context.close().catch(() => {
                    // ignore
                });
            }
        }
    }

    /**
     * Requests a dock bounce on desktop when reminders fire.
     *
     * As with window focusing, we support both remote APIs because plugin hosts may expose either
     * `@electron/remote` or the legacy `electron.remote` bridge.
     */
    private bounceDockIcon(): void {
        if (!Platform.isDesktopApp) {
            return;
        }

        type DockApi = { bounce?: (type?: "critical" | "informational") => number };
        type ElectronApp = { dock?: DockApi };
        const requireFn = (
            activeDocument.defaultView as
                | (Window & {
                      require?: (moduleName: string) => unknown;
                  })
                | null
        )?.require;
        if (requireFn === undefined) {
            return;
        }

        let electronApp: ElectronApp | null = null;
        try {
            const remoteModule = requireFn("@electron/remote") as { app?: ElectronApp };
            electronApp = remoteModule?.app ?? null;
        } catch {
            // ignore
        }

        if (electronApp === null) {
            try {
                const electronModule = requireFn("electron") as { remote?: { app?: ElectronApp } };
                electronApp = electronModule?.remote?.app ?? null;
            } catch {
                // ignore
            }
        }

        electronApp?.dock?.bounce?.("informational");
    }

    public async openDeckContainer(mode: FlashcardReviewMode, singleNote?: TFile): Promise<void> {
        if (this.plugin.dataManager.osrCore === null)
            throw new Error("SR plugin or OSR app core not initialized!!!");
        if (this.plugin.dataManager.data === null)
            throw new Error("SR plugin or data not initialized!!!");

        if (this.plugin.dataManager.syncLock) {
            return;
        }
        // We foreground Obsidian before and after opening review so reminder-driven auto-open is
        // less likely to leave the tab or modal hidden behind another desktop app.
        this.focusObsidianWindow();
        await this.plugin.dataManager.sync();

        const settings = this.plugin.dataManager.data.settings;

        const isMobile = Platform.isMobile || EmulatedPlatform().isMobile;
        const openInNewTab =
            (!isMobile && settings.openViewInNewTab) ||
            (isMobile && settings.openViewInNewTabMobile);

        const reviewQueueLoader = new ReviewQueueLoader(
            this.plugin,
            this.plugin.dataManager.osrCore,
            singleNote ?? null,
            mode,
        );

        if (openInNewTab) {
            await this.tabViewManager.openSRTabView(reviewQueueLoader);
        } else {
            this.openFlashcardModal(reviewQueueLoader);
        }
        this.focusObsidianWindow();
    }

    public openFlashcardModal(reviewQueueLoader: ReviewQueueLoader): void {
        if (this.plugin.dataManager.data === null)
            throw new Error("SR plugin or data not initialized!!!");

        this.setSRViewInFocus(true);
        this.focusObsidianWindow();
        new SRModalView(
            this.plugin.app,
            this.plugin,
            this.plugin.dataManager.data.settings,
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
        if (this.plugin.dataManager.data === null)
            throw new Error("SR plugin or data not initialized!!!");
        if (!(file instanceof TFile && file.extension === "md")) return;

        const settings = this.plugin.dataManager.data.settings;

        if (settings.showFileMenuReviewOptions) {
            menu.addItem((item: MenuItem) => {
                item.setTitle(
                    t("REVIEW_DIFFICULTY_FILE_MENU", {
                        difficulty: settings.flashcardEasyText,
                    }),
                )
                    .setIcon("SpacedRepIcon")
                    .onClick(() => {
                        if (this.plugin.dataManager.data === null)
                            throw new Error("SR plugin or data not initialized!!!");
                        void this.plugin.dataManager.saveNoteReviewResponse(
                            file,
                            ReviewResponse.Easy,
                        );
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
                        if (this.plugin.dataManager.data === null)
                            throw new Error("SR plugin or data not initialized!!!");
                        void this.plugin.dataManager.saveNoteReviewResponse(
                            file,
                            ReviewResponse.Good,
                        );
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
                        if (this.plugin.dataManager.data === null)
                            throw new Error("SR plugin or data not initialized!!!");
                        void this.plugin.dataManager.saveNoteReviewResponse(
                            file,
                            ReviewResponse.Hard,
                        );
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
                                if (this.plugin.dataManager.data === null)
                                    throw new Error("SR plugin or data not initialized!!!");
                                const settings = this.plugin.dataManager.data.settings;
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
                                if (this.plugin.dataManager.data === null)
                                    throw new Error("SR plugin or data not initialized!!!");
                                const settings = this.plugin.dataManager.data.settings;
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
