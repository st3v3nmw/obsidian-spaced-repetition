import "src/ui/obsidian-ui-components/item-views/review-queue-list-view.css";
import { ItemView, Menu, setIcon, TFile, WorkspaceLeaf } from "obsidian";

import { TICKS_PER_DAY } from "src/data/constants";
import { DataStore } from "src/data/data-store/base/data-store";
import { SRSettings } from "src/data/settings";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { NextNoteReviewHandler } from "src/note/next-note-review-handler";
import { NoteReviewDeck } from "src/note/note-review-deck";
import { NoteReviewQueue } from "src/note/note-review-queue";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { ConfirmationModal } from "src/ui/obsidian-ui-components/modals/confirmation-modal";
import { formatDateWithMoment } from "src/utils/dates";

export const REVIEW_QUEUE_VIEW_TYPE = "review-queue-list-view";

export class ReviewQueueListView extends ItemView {
    private get noteReviewQueue(): NoteReviewQueue {
        return this.nextNoteReviewHandler.noteReviewQueue;
    }
    private settings: SRSettings;
    private nextNoteReviewHandler: NextNoteReviewHandler;
    private headerEl: HTMLElement | null = null;
    private treeEl: HTMLElement | null = null;
    private plugin: SRPlugin;

    constructor(
        leaf: WorkspaceLeaf,
        nextNoteReviewHandler: NextNoteReviewHandler,
        settings: SRSettings,
        plugin: SRPlugin,
    ) {
        super(leaf);

        this.nextNoteReviewHandler = nextNoteReviewHandler;
        this.settings = settings;
        this.plugin = plugin;

        if (this.settings.enableNoteReviewPaneOnStartup) {
            this.registerEvent(this.app.workspace.on("file-open", () => this.redraw()));
            this.registerEvent(this.app.vault.on("rename", () => this.redraw()));
        }
    }

    public getViewType(): string {
        return REVIEW_QUEUE_VIEW_TYPE;
    }

    public getDisplayText(): string {
        return t("NOTES_REVIEW_QUEUE");
    }

    public getIcon(): string {
        return "SpacedRepIcon";
    }

    protected onOpen(): Promise<void> {
        this.redraw();

        return Promise.resolve();
    }

    //DEAD  CODE ?
    public onHeaderMenu(menu: Menu): void {
        menu.addItem((item) => {
            item.setTitle(t("CLOSE"))
                .setIcon("cross")
                .onClick(() => {
                    this.app.workspace.detachLeavesOfType(REVIEW_QUEUE_VIEW_TYPE);
                });
        });
    }

    public redraw(): void {
        this.contentEl.empty();
        this.contentEl.addClass("sr-note-review-page");

        this.headerEl = this.contentEl.createDiv("sr-note-review-header");
        const titleWrapper = this.headerEl.createDiv("sr-note-review-header-title-wrapper");

        const titleIcon = titleWrapper.createDiv("sr-note-review-header-title-icon");
        setIcon(titleIcon, "lucide-file-clock");

        titleWrapper.createDiv("sr-note-review-header-title").setText(t("OPEN_NOTE_FOR_REVIEW"));

        const subTitleWrapper = this.contentEl.createDiv("sr-note-review-header-subtitle-wrapper");
        subTitleWrapper
            .createDiv("sr-note-review-header-subtitle")
            .setText(
                !this.noteReviewQueue.reviewDecks || this.noteReviewQueue.reviewDecks.size === 0
                    ? t("NOTE_REVIEW_QUEUE_EMPTY_HINT")
                    : t("NOTE_REVIEW_QUEUE_HINT"),
            );

        this.treeEl = this.contentEl.createDiv("tree-item nav-folder mod-root");

        if (!this.noteReviewQueue.reviewDecks) return;
        this.createTree(this.treeEl);
    }

    private createTree(parentEl: HTMLElement) {
        const childrenEl: HTMLElement = parentEl.createDiv(
            "tree-item-children nav-folder-children",
        );

        this.revealActiveNote();

        for (const [deckKey, deck] of this.noteReviewQueue.reviewDecks) {
            this.restoreDeckFoldingState(deckKey, deck);

            const deckCollapsed = !deck.activeFolders.has(deck.deckName);

            this.createDeckTreeItem(childrenEl, deckKey, deck, deckCollapsed);
        }
    }

    private revealActiveNote(): void {
        const activeFile: TFile | null = this.app.workspace.getActiveFile();
        if (activeFile === null) return;

        for (const deck of this.noteReviewQueue.reviewDecks.values()) {
            let folderTitle: string | null = null;

            if (deck.newNotes.some((newNote) => newNote.path === activeFile.path)) {
                folderTitle = t("NEW");
            } else {
                const scheduledNote = deck.scheduledNotes.find(
                    (note) => note.note.path === activeFile.path,
                );
                if (scheduledNote !== undefined) {
                    folderTitle = this.getScheduledFolderTitle(scheduledNote.dueUnix);
                }
            }

            if (folderTitle !== null) {
                deck.activeFolders.add(deck.deckName);
                deck.activeFolders.add(folderTitle);
            }
        }
    }

    private getScheduledFolderTitle(dueUnix: number): string | null {
        const now: number = Date.now();
        const nDays: number = Math.ceil((dueUnix - now) / TICKS_PER_DAY);

        if (nDays > this.settings.maxNDaysNotesReviewQueue) {
            return null;
        }
        if (nDays === -1) {
            return t("YESTERDAY");
        } else if (nDays === 0) {
            return t("TODAY");
        } else if (nDays === 1) {
            return t("TOMORROW");
        }
        return formatDateWithMoment(dueUnix, this.settings.preferredDateFormatForNoteReviewQueue);
    }

    private restoreDeckFoldingState(deckKey: string, deck: NoteReviewDeck): void {
        if (!this.settings.rememberDeckTreeState) return;

        const savedFolders = this.settings.noteReviewTreeExpandedState?.[deckKey];
        if (savedFolders !== undefined) {
            deck.setActiveFolders(savedFolders);
        }
    }

    private saveDeckTreeState(): void {
        if (!this.settings.rememberDeckTreeState) return;

        const state: Record<string, string[]> = {};
        for (const [deckKey, deck] of this.noteReviewQueue.reviewDecks) {
            state[deckKey] = [...deck.activeFolders];
        }
        this.settings.noteReviewTreeExpandedState = state;
        void this.plugin.dataManager.savePluginData();
    }

    private createDeckTreeItem(
        parentEl: HTMLElement,
        deckKey: string,
        deck: NoteReviewDeck,
        deckCollapsed: boolean,
    ) {
        const deckFolderEl: HTMLElement = this.createFolder(
            parentEl,
            deckKey,
            deckCollapsed,
            deck,
        ).getElementsByClassName("tree-item-children nav-folder-children")[0] as HTMLElement;

        if (deck.newNotes.length > 0) {
            this.createNewNotesFolder(deckFolderEl, deck);
        }
        if (deck.scheduledNotes.length > 0) {
            this.createScheduledNotesFolder(deckFolderEl, deck);
        }
    }

    private createNewNotesFolder(parentEl: HTMLElement, deck: NoteReviewDeck) {
        const newNotesFolderEl: HTMLElement = this.createFolder(
            parentEl,
            t("NEW"),
            !deck.activeFolders.has(t("NEW")),
            deck,
        );

        const activeFile: TFile | null = this.app.workspace.getActiveFile();
        for (const newFile of deck.newNotes) {
            const fileIsOpen =
                activeFile !== undefined && activeFile !== null && newFile.path === activeFile.path;
            this.createFile(newNotesFolderEl, newFile.tfile, fileIsOpen, deck);
        }
    }

    private createScheduledNotesFolder(parentEl: HTMLElement, deck: NoteReviewDeck) {
        const activeFile: TFile | null = this.app.workspace.getActiveFile();
        let currUnix = -1;
        let scheduleFolderEl: HTMLElement | null = null;

        for (const sNote of deck.scheduledNotes) {
            if (sNote.dueUnix !== currUnix) {
                const folderTitle = this.getScheduledFolderTitle(sNote.dueUnix) ?? "";
                if (folderTitle === "") {
                    break;
                }

                scheduleFolderEl = this.createFolder(
                    parentEl,
                    folderTitle,
                    !deck.activeFolders.has(folderTitle),
                    deck,
                );
                currUnix = sNote.dueUnix;
            }

            const fileIsOpen = activeFile !== null && sNote.note.path === activeFile.path;

            if (scheduleFolderEl) {
                this.createFile(scheduleFolderEl, sNote.note.tfile, fileIsOpen, deck);
            }
        }
    }

    private createFolder(
        parentEl: HTMLElement,
        folderTitle: string,
        collapsed: boolean,
        deck: NoteReviewDeck,
    ): HTMLElement {
        const folderEl: HTMLDivElement = parentEl.createDiv("tree-item nav-folder");
        const folderTitleEl: HTMLDivElement = folderEl.createDiv("tree-item-self nav-folder-title");
        folderTitleEl.classList.add("is-clickable");
        const childrenEl: HTMLDivElement = folderEl.createDiv(
            "tree-item-children nav-folder-children",
        );
        const collapseIconEl: HTMLDivElement = folderTitleEl.createDiv(
            "tree-item-icon collapse-icon nav-folder-collapse-indicator",
        );
        setIcon(collapseIconEl, "chevron-down");
        folderTitleEl.createDiv("tree-item-inner nav-folder-title-content").setText(folderTitle);

        const applyCollapsed = (value: boolean) => {
            if (value) {
                folderEl.addClass("is-collapsed");
                collapseIconEl.addClass("is-collapsed");
            } else {
                folderEl.removeClass("is-collapsed");
                collapseIconEl.removeClass("is-collapsed");
            }
            childrenEl.setCssProps({ display: value ? "none" : "block" });
        };

        applyCollapsed(collapsed);

        folderTitleEl.onClickEvent(() => {
            const nextCollapsed = !folderEl.hasClass("is-collapsed");
            applyCollapsed(nextCollapsed);

            if (nextCollapsed) {
                deck.activeFolders.delete(folderTitle);
            } else {
                deck.activeFolders.add(folderTitle);
            }

            this.saveDeckTreeState();
        });

        return folderEl;
    }

    private createFile(
        folderEl: HTMLElement,
        file: TFile,
        fileElActive: boolean,
        deck: NoteReviewDeck,
    ): void {
        const childrenEl: HTMLElement = folderEl.getElementsByClassName(
            "tree-item-children nav-folder-children",
        )[0] as HTMLElement;
        const navFileEl: HTMLElement = childrenEl.createDiv("nav-file");

        const navFileTitle: HTMLElement = navFileEl.createDiv("tree-item-self nav-file-title");
        navFileTitle.addClass("is-clickable");

        if (fileElActive) {
            navFileTitle.addClass("is-active");
        }

        const navFileTitleInner: HTMLElement = navFileTitle.createDiv(
            "tree-item-inner nav-file-title-content",
        );
        navFileTitleInner.setText(file.basename);
        navFileTitleInner.addEventListener(
            "click",
            (event: MouseEvent) => {
                event.preventDefault();
                void this.nextNoteReviewHandler.openNote(deck.deckName, file);
                return false;
            },
            false,
        );

        const navFileContextBtn: HTMLElement = navFileTitle.createDiv(
            "sr-review-context-btn clickable-icon",
        );
        setIcon(navFileContextBtn, "ellipsis-vertical");
        navFileContextBtn.addEventListener("click", (event: MouseEvent) => {
            event.preventDefault();
            const fileMenu: Menu = new Menu();
            fileMenu.addItem((item) => {
                item.setTitle(
                    t("REVIEW_DIFFICULTY_FILE_MENU", {
                        difficulty: this.plugin.dataManager.data.settings.flashcardEasyText,
                    }),
                )
                    .setIcon("SpacedRepIcon")
                    .onClick(() => {
                        void this.plugin.dataManager.saveNoteReviewResponse(
                            file,
                            ReviewResponse.Easy,
                        );
                    });
            });

            fileMenu.addItem((item) => {
                item.setTitle(
                    t("REVIEW_DIFFICULTY_FILE_MENU", {
                        difficulty: this.plugin.dataManager.data.settings.flashcardGoodText,
                    }),
                )
                    .setIcon("SpacedRepIcon")
                    .onClick(() => {
                        void this.plugin.dataManager.saveNoteReviewResponse(
                            file,
                            ReviewResponse.Good,
                        );
                    });
            });

            fileMenu.addItem((item) => {
                item.setTitle(
                    t("REVIEW_DIFFICULTY_FILE_MENU", {
                        difficulty: this.plugin.dataManager.data.settings.flashcardHardText,
                    }),
                )
                    .setIcon("SpacedRepIcon")
                    .onClick(() => {
                        void this.plugin.dataManager.saveNoteReviewResponse(
                            file,
                            ReviewResponse.Hard,
                        );
                    });
            });

            fileMenu.addSeparator();

            if (this.plugin.dataManager.data.settings.showDeleteButtonInFileMenu) {
                fileMenu.addItem((item) => {
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
                                    await DataStore.instance.fileModifier.deleteNoteSchedulingDataInNote(
                                        file,
                                        this.plugin.dataManager.data.settings
                                            .deleteTagsOnSchedulingDataDeletion,
                                        this.plugin.dataManager.data.settings.tagsToReview,
                                    );
                                },
                            ).open();
                        });
                });
            }

            fileMenu.showAtPosition({
                x: event.pageX,
                y: event.pageY,
            });
            fileMenu.showAtMouseEvent(event);

            return false;
        });
    }
}
