import { ItemView, WorkspaceLeaf, Menu, TFile } from "obsidian";

import type SRPlugin from "src/main";
import { COLLAPSE_ICON } from "src/constants";
import { t } from "src/lang/helpers";

export const REVIEW_QUEUE_VIEW_TYPE: string = "review-queue-list-view";

export class ReviewQueueListView extends ItemView {
    private plugin: SRPlugin;
    private activeFolders: Set<string>;

    constructor(leaf: WorkspaceLeaf, plugin: SRPlugin) {
        super(leaf);

        this.plugin = plugin;
        this.activeFolders = new Set([t("Today")]);
        this.registerEvent(
            this.app.workspace.on("file-open", (_: any) => this.redraw())
        );
        this.registerEvent(
            this.app.vault.on("rename", (_: any) => this.redraw())
        );
    }

    public getViewType(): string {
        return REVIEW_QUEUE_VIEW_TYPE;
    }

    public getDisplayText(): string {
        return t("Notes Review Queue");
    }

    public getIcon(): string {
        return "crosshairs";
    }

    public onHeaderMenu(menu: Menu): void {
        menu.addItem((item) => {
            item.setTitle(t("Close"))
                .setIcon("cross")
                .onClick(() => {
                    this.app.workspace.detachLeavesOfType(
                        REVIEW_QUEUE_VIEW_TYPE
                    );
                });
        });
    }

    public redraw(): void {
        let openFile: TFile | null = this.app.workspace.getActiveFile();

        let rootEl: HTMLElement = createDiv("nav-folder mod-root"),
            childrenEl: HTMLElement = rootEl.createDiv("nav-folder-children");

        if (this.plugin.newNotes.length > 0) {
            let newNotesFolderEl: HTMLElement = this.createRightPaneFolder(
                childrenEl,
                t("New"),
                !this.activeFolders.has(t("New"))
            );

            for (let newFile of this.plugin.newNotes) {
                this.createRightPaneFile(
                    newNotesFolderEl,
                    newFile,
                    openFile !== null && newFile.path === openFile.path,
                    !this.activeFolders.has(t("New"))
                );
            }
        }

        if (this.plugin.scheduledNotes.length > 0) {
            let now: number = Date.now(),
                currUnix: number = -1;
            let folderEl: HTMLElement | null = null,
                folderTitle: string = "";
            let maxDaysToRender: number =
                this.plugin.data.settings.maxNDaysNotesReviewQueue;

            for (let sNote of this.plugin.scheduledNotes) {
                if (sNote.dueUnix !== currUnix) {
                    let nDays: number = Math.ceil(
                        (sNote.dueUnix - now) / (24 * 3600 * 1000)
                    );

                    if (nDays > maxDaysToRender) break;

                    folderTitle =
                        nDays === -1
                            ? t("Yesterday")
                            : nDays === 0
                            ? t("Today")
                            : nDays === 1
                            ? t("Tomorrow")
                            : new Date(sNote.dueUnix).toDateString();

                    folderEl = this.createRightPaneFolder(
                        childrenEl,
                        folderTitle,
                        !this.activeFolders.has(folderTitle)
                    );
                    currUnix = sNote.dueUnix;
                }

                this.createRightPaneFile(
                    folderEl!,
                    sNote.note,
                    openFile !== null && sNote.note.path === openFile.path,
                    !this.activeFolders.has(folderTitle)
                );
            }
        }

        let contentEl: Element = this.containerEl.children[1];
        contentEl.empty();
        contentEl.appendChild(rootEl);
    }

    private createRightPaneFolder(
        parentEl: HTMLElement,
        folderTitle: string,
        collapsed: boolean
    ): HTMLElement {
        let folderEl: HTMLDivElement = parentEl.createDiv("nav-folder"),
            folderTitleEl: HTMLDivElement =
                folderEl.createDiv("nav-folder-title"),
            childrenEl: HTMLDivElement = folderEl.createDiv(
                "nav-folder-children"
            ),
            collapseIconEl: HTMLDivElement = folderTitleEl.createDiv(
                "nav-folder-collapse-indicator collapse-icon"
            );

        collapseIconEl.innerHTML = COLLAPSE_ICON;
        if (collapsed)
            (collapseIconEl.childNodes[0] as HTMLElement).style.transform =
                "rotate(-90deg)";

        folderTitleEl
            .createDiv("nav-folder-title-content")
            .setText(folderTitle);

        folderTitleEl.onClickEvent((_) => {
            for (let child of childrenEl.childNodes as NodeListOf<HTMLElement>) {
                if (
                    child.style.display === "block" ||
                    child.style.display === ""
                ) {
                    child.style.display = "none";
                    (
                        collapseIconEl.childNodes[0] as HTMLElement
                    ).style.transform = "rotate(-90deg)";
                    this.activeFolders.delete(folderTitle);
                } else {
                    child.style.display = "block";
                    (
                        collapseIconEl.childNodes[0] as HTMLElement
                    ).style.transform = "";
                    this.activeFolders.add(folderTitle);
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
        let navFileEl: HTMLElement = folderEl
            .getElementsByClassName("nav-folder-children")[0]
            .createDiv("nav-file");
        if (hidden) navFileEl.style.display = "none";

        let navFileTitle: HTMLElement = navFileEl.createDiv("nav-file-title");
        if (fileElActive) navFileTitle.addClass("is-active");

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
                let fileMenu: Menu = new Menu(this.app);
                this.app.workspace.trigger(
                    "file-menu",
                    fileMenu,
                    file,
                    "my-context-menu",
                    null
                );
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
