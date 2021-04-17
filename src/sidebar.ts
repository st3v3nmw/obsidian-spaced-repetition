import { ItemView, WorkspaceLeaf, Menu, TFile } from "obsidian";
import type SRPlugin from "./main";
import { COLLAPSE_ICON, REVIEW_QUEUE_VIEW_TYPE } from "./constants";

export class ReviewQueueListView extends ItemView {
    private plugin: SRPlugin;
    private activeFolders: Set<string>;

    constructor(leaf: WorkspaceLeaf, plugin: SRPlugin) {
        super(leaf);

        this.plugin = plugin;
        this.activeFolders = new Set(["Today"]);
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
        return "Review Queue";
    }

    public getIcon(): string {
        return "crosshairs";
    }

    public onHeaderMenu(menu: Menu) {
        menu.addItem((item) => {
            item.setTitle("Close")
                .setIcon("cross")
                .onClick(() => {
                    this.app.workspace.detachLeavesOfType(
                        REVIEW_QUEUE_VIEW_TYPE
                    );
                });
        });
    }

    public redraw() {
        const openFile = this.app.workspace.getActiveFile();

        const rootEl = createDiv("nav-folder mod-root");
        const childrenEl = rootEl.createDiv("nav-folder-children");

        if (this.plugin.newNotes.length > 0) {
            let newNotesFolderEl = this.createRightPaneFolder(
                childrenEl,
                "New",
                !this.activeFolders.has("New")
            );

            for (let newFile of this.plugin.newNotes) {
                this.createRightPaneFile(
                    newNotesFolderEl,
                    newFile,
                    openFile && newFile.path === openFile.path,
                    !this.activeFolders.has("New")
                );
            }
        }

        if (this.plugin.scheduledNotes.length > 0) {
            let now: number = Date.now();
            let currUnix = -1;
            let folderEl, folderTitle;

            for (let sNote of this.plugin.scheduledNotes) {
                if (sNote.dueUnix != currUnix) {
                    let nDays = Math.ceil(
                        (sNote.dueUnix - now) / (24 * 3600 * 1000)
                    );
                    folderTitle =
                        nDays == -1
                            ? "Yesterday"
                            : nDays == 0
                            ? "Today"
                            : nDays == 1
                            ? "Tomorrow"
                            : new Date(sNote.dueUnix).toDateString();

                    folderEl = this.createRightPaneFolder(
                        childrenEl,
                        folderTitle,
                        !this.activeFolders.has(folderTitle)
                    );
                    currUnix = sNote.dueUnix;
                }

                this.createRightPaneFile(
                    folderEl,
                    sNote.note,
                    openFile && sNote.note.path === openFile.path,
                    !this.activeFolders.has(folderTitle)
                );
            }
        }

        const contentEl = this.containerEl.children[1];
        contentEl.empty();
        contentEl.appendChild(rootEl);
    }

    private createRightPaneFolder(
        parentEl: any,
        folderTitle: string,
        collapsed: boolean
    ): any {
        const folderEl = parentEl.createDiv("nav-folder");
        const folderTitleEl = folderEl.createDiv("nav-folder-title");
        const childrenEl = folderEl.createDiv("nav-folder-children");
        const collapseIconEl = folderTitleEl.createDiv(
            "nav-folder-collapse-indicator collapse-icon"
        );
        collapseIconEl.innerHTML = COLLAPSE_ICON;

        if (collapsed)
            collapseIconEl.childNodes[0].style.transform = "rotate(-90deg)";

        folderTitleEl
            .createDiv("nav-folder-title-content")
            .setText(folderTitle);

        folderTitleEl.onClickEvent((_: any) => {
            for (let child of childrenEl.childNodes) {
                if (
                    child.style.display == "block" ||
                    child.style.display == ""
                ) {
                    child.style.display = "none";
                    collapseIconEl.childNodes[0].style.transform =
                        "rotate(-90deg)";
                    this.activeFolders.delete(folderTitle);
                } else {
                    child.style.display = "block";
                    collapseIconEl.childNodes[0].style.transform = "";
                    this.activeFolders.add(folderTitle);
                }
            }
        });

        return childrenEl;
    }

    private createRightPaneFile(
        folderEl: any,
        file: TFile,
        fileElActive: boolean,
        hidden: boolean
    ) {
        const navFileEl = folderEl.createDiv("nav-file");
        if (hidden) navFileEl.style.display = "none";

        const navFileTitle = navFileEl.createDiv("nav-file-title");
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
                const fileMenu = new Menu(this.app);
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
