import { ItemView, Menu, setIcon, TFile, WorkspaceLeaf } from "obsidian";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { COLLAPSE_ICON, TICKS_PER_DAY } from "src/constants";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { NextNoteReviewHandler } from "src/note/next-note-review-handler";
import { NoteReviewDeck } from "src/note/note-review-deck";
import { NoteReviewQueue } from "src/note/note-review-queue";
import { SRSettings } from "src/settings";

export const REVIEW_QUEUE_VIEW_TYPE = "review-queue-list-view";

export class ReviewQueueListView extends ItemView {
    private get noteReviewQueue(): NoteReviewQueue {
        return this.nextNoteReviewHandler.noteReviewQueue;
    }
    private settings: SRSettings;
    private nextNoteReviewHandler: NextNoteReviewHandler;
    private headerEl: HTMLElement;
    private treeEl: HTMLElement;
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
        if (!this.noteReviewQueue.reviewDecks) return;
        this.contentEl.empty();
        this.contentEl.addClass("sr-note-review-page");

        this.headerEl = this.contentEl.createDiv("sr-note-review-header");
        const titleWrapper = this.headerEl.createDiv("sr-note-review-header-title-wrapper");

        const titleIcon = titleWrapper.createDiv("sr-note-review-header-title-icon");
        setIcon(titleIcon, "SpacedRepIcon");

        titleWrapper.createDiv("sr-note-review-header-title").setText(t("OPEN_NOTE_FOR_REVIEW"));

        this.treeEl = this.contentEl.createDiv("tree-item nav-folder mod-root");

        this.createTree(this.treeEl);
    }

    private createTree(parentEl: HTMLElement) {
        const childrenEl: HTMLElement = parentEl.createDiv(
            "tree-item-children nav-folder-children",
        );

        for (const [deckKey, deck] of this.noteReviewQueue.reviewDecks) {
            const deckCollapsed = !deck.activeFolders.has(deck.deckName);

            this.createDeckTreeItem(childrenEl, deckKey, deck, deckCollapsed);
        }
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
            false,
            deck,
        ).getElementsByClassName("tree-item-children nav-folder-children")[0] as HTMLElement;

        if (deck.newNotes.length > 0) {
            this.createNewNotesFolder(deckFolderEl, deck, deckCollapsed);
        }
        if (deck.scheduledNotes.length > 0) {
            this.createScheduledNotesFolder(deckFolderEl, deck, deckCollapsed);
        }
    }

    private createNewNotesFolder(
        parentEl: HTMLElement,
        deck: NoteReviewDeck,
        deckCollapsed: boolean,
    ) {
        const activeFile: TFile | null = this.app.workspace.getActiveFile();
        const newNotesFolderEl: HTMLElement = this.createFolder(
            parentEl,
            t("NEW"),
            !deck.activeFolders.has(t("NEW")),
            deckCollapsed,
            deck,
        );

        for (const newFile of deck.newNotes) {
            const fileIsOpen =
                activeFile !== undefined && activeFile !== null && newFile.path === activeFile.path;
            if (fileIsOpen) {
                deck.activeFolders.add(deck.deckName);
                deck.activeFolders.add(t("NEW"));
                this.changeFolderFolding(newNotesFolderEl);
                this.changeFolderFolding(parentEl);
            }
            this.createFile(
                newNotesFolderEl,
                newFile.tfile,
                fileIsOpen,
                !deck.activeFolders.has(t("NEW")),
                deck,
            );
        }
    }

    private createScheduledNotesFolder(
        parentEl: HTMLElement,
        deck: NoteReviewDeck,
        deckCollapsed: boolean,
    ) {
        const activeFile: TFile | null = this.app.workspace.getActiveFile();
        const now: number = Date.now();
        let currUnix = -1;
        let schedFolderEl: HTMLElement | null = null,
            folderTitle = "";
        const maxDaysToRender: number = this.settings.maxNDaysNotesReviewQueue;

        for (const sNote of deck.scheduledNotes) {
            if (sNote.dueUnix != currUnix) {
                const nDays: number = Math.ceil((sNote.dueUnix - now) / TICKS_PER_DAY);

                if (nDays > maxDaysToRender) {
                    break;
                }

                if (nDays === -1) {
                    folderTitle = t("YESTERDAY");
                } else if (nDays === 0) {
                    folderTitle = t("TODAY");
                } else if (nDays === 1) {
                    folderTitle = t("TOMORROW");
                } else {
                    folderTitle = new Date(sNote.dueUnix).toDateString();
                }

                schedFolderEl = this.createFolder(
                    parentEl,
                    folderTitle,
                    !deck.activeFolders.has(folderTitle),
                    deckCollapsed,
                    deck,
                );
                currUnix = sNote.dueUnix;
            }

            const fileIsOpen = activeFile && sNote.note.path === activeFile.path;
            if (fileIsOpen) {
                deck.activeFolders.add(deck.deckName);
                deck.activeFolders.add(folderTitle);
                this.changeFolderFolding(schedFolderEl);
                this.changeFolderFolding(parentEl);
            }

            this.createFile(
                schedFolderEl,
                sNote.note.tfile,
                fileIsOpen,
                !deck.activeFolders.has(folderTitle),
                deck,
            );
        }
    }

    private createFolder(
        parentEl: HTMLElement,
        folderTitle: string,
        collapsed: boolean,
        hidden: boolean,
        deck: NoteReviewDeck,
    ): HTMLElement {
        const folderEl: HTMLDivElement = parentEl.createDiv("tree-item nav-folder");
        const folderTitleEl: HTMLDivElement = folderEl.createDiv("tree-item-self nav-folder-title");
        const childrenEl: HTMLDivElement = folderEl.createDiv(
            "tree-item-children nav-folder-children",
        );
        const collapseIconEl: HTMLDivElement = folderTitleEl.createDiv(
            "tree-item-icon collapse-icon nav-folder-collapse-indicator",
        );

        collapseIconEl.innerHTML = COLLAPSE_ICON;
        folderTitleEl.createDiv("tree-item-inner nav-folder-title-content").setText(folderTitle);

        if (collapsed && !folderEl.hasClass("is-collapsed")) {
            folderEl.addClass("is-collapsed");
            collapseIconEl.addClass("is-collapsed");
        } else {
            folderEl.removeClass("is-collapsed");
            const collapseIconEl = folderEl.find("div.nav-folder-collapse-indicator");
            collapseIconEl.removeClass("is-collapsed");
        }

        if (hidden) {
            folderEl.style.display = "none";
        }

        folderTitleEl.onClickEvent(() => {
            this.changeFolderFolding(folderEl, !folderEl.hasClass("is-collapsed"));
            childrenEl.style.display = !folderEl.hasClass("is-collapsed") ? "block" : "none";

            if (!folderEl.hasClass("is-collapsed")) {
                deck.activeFolders.delete(folderTitle);
            } else {
                deck.activeFolders.add(folderTitle);
            }
        });

        return folderEl;
    }

    private createFile(
        folderEl: HTMLElement,
        file: TFile,
        fileElActive: boolean,
        hidden: boolean,
        deck: NoteReviewDeck,
    ): void {
        const childrenEl: HTMLElement = folderEl.getElementsByClassName(
            "tree-item-children nav-folder-children",
        )[0] as HTMLElement;
        const navFileEl: HTMLElement = childrenEl.createDiv("nav-file");
        if (hidden) {
            childrenEl.style.display = "none";
        }

        const navFileTitle: HTMLElement = navFileEl.createDiv("tree-item-self nav-file-title");
        if (fileElActive) {
            navFileTitle.addClass("is-active");
        }

        const navFileTitleInner: HTMLElement = navFileTitle.createDiv(
            "tree-item-inner nav-file-title-content",
        );
        navFileTitleInner.setText(file.basename);
        navFileTitleInner.addEventListener(
            "click",
            async (event: MouseEvent) => {
                event.preventDefault();
                await this.nextNoteReviewHandler.openNote(deck.deckName, file);
                return false;
            },
            false,
        );

        const navFileContextBtn: HTMLElement = navFileTitle.createDiv(
            "sr-review-context-btn clickable-icon",
        );
        setIcon(navFileContextBtn, "ellipsis-vertical");
        navFileContextBtn.addEventListener("click", async (event: MouseEvent) => {
            event.preventDefault();
            const fileMenu: Menu = new Menu();
            fileMenu.addItem((item) => {
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

            fileMenu.addItem((item) => {
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

            fileMenu.addItem((item) => {
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

            fileMenu.showAtPosition({
                x: event.pageX,
                y: event.pageY,
            });
            fileMenu.showAtMouseEvent(event);

            return false;
        });
    }

    private changeFolderFolding(folderEl: HTMLElement, collapsed = false): void {
        if (collapsed && !folderEl.hasClass("is-collapsed")) {
            folderEl.addClass("is-collapsed");
            folderEl.firstElementChild.firstElementChild.classList.add("is-collapsed");
        } else {
            folderEl.removeClass("is-collapsed");
            folderEl.firstElementChild.firstElementChild.classList.remove("is-collapsed");
        }
    }
}
