import { ItemView, Menu, TFile, WorkspaceLeaf } from "obsidian";

import { COLLAPSE_ICON, TICKS_PER_DAY } from "src/constants";
import { t } from "src/lang/helpers";
import { NextNoteReviewHandler } from "src/next-note-review-handler";
import { NoteReviewDeck } from "src/note-review-deck";
import { NoteReviewQueue } from "src/note-review-queue";
import { SRSettings } from "src/settings";

export const REVIEW_QUEUE_VIEW_TYPE = "review-queue-list-view";

export class ReviewQueueListView extends ItemView {
    private get noteReviewQueue(): NoteReviewQueue {
        return this.nextNoteReviewHandler.noteReviewQueue;
    }
    private settings: SRSettings;
    private nextNoteReviewHandler: NextNoteReviewHandler;

    constructor(
        leaf: WorkspaceLeaf,
        nextNoteReviewHandler: NextNoteReviewHandler,
        settings: SRSettings,
    ) {
        super(leaf);

        this.nextNoteReviewHandler = nextNoteReviewHandler;
        this.settings = settings;

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

        const activeFile: TFile | null = this.app.workspace.getActiveFile();

        const rootEl: HTMLElement = createDiv("tree-item nav-folder mod-root");
        const childrenEl: HTMLElement = rootEl.createDiv("tree-item-children nav-folder-children");

        for (const [deckKey, deck] of this.noteReviewQueue.reviewDecks) {
            const deckCollapsed = !deck.activeFolders.has(deck.deckName);

            const deckFolderEl: HTMLElement = this.createRightPaneFolder(
                childrenEl,
                deckKey,
                deckCollapsed,
                false,
                deck,
            ).getElementsByClassName("tree-item-children nav-folder-children")[0] as HTMLElement;

            if (deck.newNotes.length > 0) {
                const newNotesFolderEl: HTMLElement = this.createRightPaneFolder(
                    deckFolderEl,
                    t("NEW"),
                    !deck.activeFolders.has(t("NEW")),
                    deckCollapsed,
                    deck,
                );

                for (const newFile of deck.newNotes) {
                    const fileIsOpen = activeFile && newFile.path === activeFile.path;
                    if (fileIsOpen) {
                        deck.activeFolders.add(deck.deckName);
                        deck.activeFolders.add(t("NEW"));
                        this.changeFolderFolding(newNotesFolderEl);
                        this.changeFolderFolding(deckFolderEl);
                    }
                    this.createRightPaneFile(
                        newNotesFolderEl,
                        newFile.tfile,
                        fileIsOpen,
                        !deck.activeFolders.has(t("NEW")),
                        deck,
                    );
                }
            }

            if (deck.scheduledNotes.length > 0) {
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

                        schedFolderEl = this.createRightPaneFolder(
                            deckFolderEl,
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
                        this.changeFolderFolding(deckFolderEl);
                    }

                    this.createRightPaneFile(
                        schedFolderEl,
                        sNote.note.tfile,
                        fileIsOpen,
                        !deck.activeFolders.has(folderTitle),
                        deck,
                    );
                }
            }
        }

        const contentEl: Element = this.containerEl.children[1];
        contentEl.empty();
        contentEl.appendChild(rootEl);
    }

    private createRightPaneFolder(
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
        this.changeFolderFolding(folderEl, collapsed);

        folderTitleEl.createDiv("tree-item-inner nav-folder-title-content").setText(folderTitle);

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

    private createRightPaneFile(
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

        navFileTitle.createDiv("tree-item-inner nav-file-title-content").setText(file.basename);
        navFileTitle.addEventListener(
            "click",
            async (event: MouseEvent) => {
                event.preventDefault();
                await this.nextNoteReviewHandler.openNote(deck.deckName, file);
                return false;
            },
            false,
        );

        navFileTitle.addEventListener(
            "contextmenu",
            (event: MouseEvent) => {
                event.preventDefault();
                const fileMenu: Menu = new Menu();
                this.app.workspace.trigger("file-menu", fileMenu, file, "my-context-menu", null);
                fileMenu.showAtPosition({
                    x: event.pageX,
                    y: event.pageY,
                });
                return false;
            },
            false,
        );
    }

    private changeFolderFolding(folderEl: HTMLElement, collapsed = false): void {
        if (collapsed) {
            folderEl.addClass("is-collapsed");
            const collapseIconEl = folderEl.find("div.nav-folder-collapse-indicator");
            collapseIconEl.addClass("is-collapsed");
        } else {
            folderEl.removeClass("is-collapsed");
            const collapseIconEl = folderEl.find("div.nav-folder-collapse-indicator");
            collapseIconEl.removeClass("is-collapsed");
        }
    }
}
