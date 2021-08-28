import { ItemView, WorkspaceLeaf, Menu, TFile } from "obsidian";

import type SRPlugin from "src/main";
import { COLLAPSE_ICON } from "src/constants";
import { ReviewDeck } from "src/review-deck";
import { t } from "src/lang/helpers";

export const REVIEW_QUEUE_VIEW_TYPE = "review-queue-list-view";

export class ReviewQueueListView extends ItemView {
    private plugin: SRPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: SRPlugin) {
        super(leaf);

        this.plugin = plugin;
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
        const openFile: TFile | null = this.app.workspace.getActiveFile();

        const rootEl: HTMLElement = createDiv("nav-folder mod-root"),
            childrenEl: HTMLElement = rootEl.createDiv("nav-folder-children");

        for (const deckKey in this.plugin.reviewDecks) {
            const deck: ReviewDeck = this.plugin.reviewDecks[deckKey];

            const deckFolderEl: HTMLElement = this.createRightPaneFolder(
                childrenEl,
                deckKey,
                false,
                deck
            ).getElementsByClassName("nav-folder-children")[0] as HTMLElement;

            if (deck.newNotes.length > 0) {
                const newNotesFolderEl: HTMLElement = this.createRightPaneFolder(
                    deckFolderEl,
                    t("NEW"),
                    !deck.activeFolders.has(t("NEW")),
                    deck
                );

                for (const newFile of deck.newNotes) {
                    this.createRightPaneFile(
                        newNotesFolderEl,
                        newFile,
                        openFile && newFile.path === openFile.path,
                        !deck.activeFolders.has(t("NEW"))
                    );
                }
            }

            if (deck.scheduledNotes.length > 0) {
                const now: number = Date.now();
                let currUnix = -1;
                let schedFolderEl: HTMLElement | null = null,
                    folderTitle = "";
                const maxDaysToRender: number = this.plugin.data.settings.maxNDaysNotesReviewQueue;

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
                            deck
                        );
                        currUnix = sNote.dueUnix;
                    }

                    this.createRightPaneFile(
                        schedFolderEl,
                        sNote.note,
                        openFile && sNote.note.path === openFile.path,
                        !deck.activeFolders.has(folderTitle)
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
        deck: ReviewDeck
    ): HTMLElement {
        const folderEl: HTMLDivElement = parentEl.createDiv("nav-folder"),
            folderTitleEl: HTMLDivElement = folderEl.createDiv("nav-folder-title"),
            childrenEl: HTMLDivElement = folderEl.createDiv("nav-folder-children"),
            collapseIconEl: HTMLDivElement = folderTitleEl.createDiv(
                "nav-folder-collapse-indicator collapse-icon"
            );

        collapseIconEl.innerHTML = COLLAPSE_ICON;
        if (collapsed) {
            (collapseIconEl.childNodes[0] as HTMLElement).style.transform = "rotate(-90deg)";
        }

        folderTitleEl.createDiv("nav-folder-title-content").setText(folderTitle);

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
        hidden: boolean
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
            (event: MouseEvent) => {
                event.preventDefault();
                this.app.workspace.activeLeaf.openFile(file);
                return false;
            },
            false
        );

        navFileTitle.addEventListener(
            "contextmenu",
            (event: MouseEvent) => {
                event.preventDefault();
                const fileMenu: Menu = new Menu(this.app);
                this.app.workspace.trigger("file-menu", fileMenu, file, "my-context-menu", null);
                fileMenu.showAtPosition({
                    x: event.pageX,
                    y: event.pageY,
                });
                return false;
            },
            false
        );
    }
}
