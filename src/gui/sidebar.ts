import { ItemView, WorkspaceLeaf, Menu, TFile, App } from "obsidian";

import { COLLAPSE_ICON } from "src/constants";
import { NoteReviewDeck } from "src/NoteReviewDeck";
import { t } from "src/lang/helpers";
import { NoteReviewQueue } from "src/NoteReviewQueue";
import { SRSettings } from "src/settings";
import { SrTFile } from "src/SRFile";

export const REVIEW_QUEUE_VIEW_TYPE = "review-queue-list-view";

export class ReviewQueueListView extends ItemView {
    private noteReviewQueue: NoteReviewQueue;
    private settings: SRSettings;

    constructor(leaf: WorkspaceLeaf, app: App, noteReviewQueue: NoteReviewQueue, settings: SRSettings) {
        super(leaf);

        this.noteReviewQueue = noteReviewQueue;
        this.settings = settings;
        this.registerEvent(this.app.workspace.on("file-open", () => this.redraw()));
        this.registerEvent(this.app.vault.on("rename", () => this.redraw()));
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
        const activeFile: TFile | null = this.app.workspace.getActiveFile();

        const rootEl: HTMLElement = createDiv("nav-folder mod-root");
        const childrenEl: HTMLElement = rootEl.createDiv("nav-folder-children");

        for (const deckKey in this.noteReviewQueue.reviewDecks) {
            const deck: NoteReviewDeck = this.noteReviewQueue.reviewDecks.get(deckKey);

            const deckCollapsed = !deck.activeFolders.has(deck.deckName);

            const deckFolderEl: HTMLElement = this.createRightPaneFolder(
                childrenEl,
                deckKey,
                deckCollapsed,
                false,
                deck,
            ).getElementsByClassName("nav-folder-children")[0] as HTMLElement;

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
                        this.changeFolderIconToExpanded(newNotesFolderEl);
                        this.changeFolderIconToExpanded(deckFolderEl);
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
                        const nDays: number = Math.ceil((sNote.dueUnix - now) / (24 * 3600 * 1000));

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
                        this.changeFolderIconToExpanded(schedFolderEl);
                        this.changeFolderIconToExpanded(deckFolderEl);
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
        const folderEl: HTMLDivElement = parentEl.createDiv("nav-folder");
        const folderTitleEl: HTMLDivElement = folderEl.createDiv("nav-folder-title");
        const childrenEl: HTMLDivElement = folderEl.createDiv("nav-folder-children");
        const collapseIconEl: HTMLDivElement = folderTitleEl.createDiv(
            "nav-folder-collapse-indicator collapse-icon",
        );

        collapseIconEl.innerHTML = COLLAPSE_ICON;
        if (collapsed) {
            (collapseIconEl.childNodes[0] as HTMLElement).style.transform = "rotate(-90deg)";
        }

        folderTitleEl.createDiv("nav-folder-title-content").setText(folderTitle);

        if (hidden) {
            folderEl.style.display = "none";
        }

        folderTitleEl.onClickEvent(() => {
            for (const child of childrenEl.childNodes as NodeListOf<HTMLElement>) {
                if (child.style.display === "block" || child.style.display === "") {
                    child.style.display = "none";
                    (collapseIconEl.childNodes[0] as HTMLElement).style.transform =
                        "rotate(-90deg)";
                    deck.activeFolders.delete(folderTitle);
                } else {
                    child.style.display = "block";
                    (collapseIconEl.childNodes[0] as HTMLElement).style.transform = "";
                    deck.activeFolders.add(folderTitle);
                }
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
        const navFileEl: HTMLElement = folderEl
            .getElementsByClassName("nav-folder-children")[0]
            .createDiv("nav-file");
        if (hidden) {
            navFileEl.style.display = "none";
        }

        const navFileTitle: HTMLElement = navFileEl.createDiv("nav-file-title");
        if (fileElActive) {
            navFileTitle.addClass("is-active");
        }

        navFileTitle.createDiv("nav-file-title-content").setText(file.basename);
        navFileTitle.addEventListener(
            "click",
            async (event: MouseEvent) => {
                event.preventDefault();
                this.noteReviewQueue.lastSelectedReviewDeck = deck.deckName;
                await this.app.workspace.getLeaf().openFile(file);
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

    private changeFolderIconToExpanded(folderEl: HTMLElement): void {
        const collapseIconEl = folderEl.find("div.nav-folder-collapse-indicator");
        (collapseIconEl.childNodes[0] as HTMLElement).style.transform = "";
    }
}
