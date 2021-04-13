import {
    Notice,
    Plugin,
    addIcon,
    ItemView,
    PluginSettingTab,
    Setting,
    WorkspaceLeaf,
    Menu,
    App,
    TFile,
} from "obsidian";
import * as graph from "pagerank.js";

const SCHEDULING_INFO_REGEX = /^---\n((?:.*\n)*)sr-due: ([0-9A-Za-z ]+)\nsr-interval: ([0-9]+)\nsr-ease: ([0-9]+)\n((?:.*\n)*)---/;
const YAML_FRONT_MATTER_REGEX = /^---\n((?:.*\n)*)---/;
const REVIEW_QUEUE_VIEW_TYPE = "review-queue-list-view";

interface SRSettings {
    baseEase: number;
    maxLinkFactor: number;
    openRandomNote: boolean;
    lapsesIntervalChange: number;
    autoNextNote: boolean;
    reviewCertainTags: boolean;
    tagsToReview: string[];
}

interface PluginData {
    settings: SRSettings;
}

const DEFAULT_SETTINGS: SRSettings = {
    baseEase: 250,
    maxLinkFactor: 1.0,
    openRandomNote: false,
    lapsesIntervalChange: 0.5,
    autoNextNote: false,
    reviewCertainTags: false,
    tagsToReview: [],
};

const DEFAULT_DATA: PluginData = {
    settings: DEFAULT_SETTINGS,
};

interface SchedNote {
    note: TFile;
    dueUnix: number;
}

interface LinkStat {
    sourcePath: string;
    linkCount: number;
}

export default class SRPlugin extends Plugin {
    private statusBar: HTMLElement;
    private reviewQueueView: ReviewQueueListView;
    public data: PluginData;

    public newNotes: TFile[] = [];
    public scheduledNotes: SchedNote[] = [];
    private easeByPath: Record<string, number> = {};
    private incomingLinks: Record<string, LinkStat[]> = {};
    private pageranks: Record<string, number> = {};
    private dueNotesCount: number = 0;

    async onload() {
        await this.loadPluginData();

        addIcon("crosshairs", crossHairsIcon);

        this.statusBar = this.addStatusBarItem();
        this.statusBar.classList.add("mod-clickable");
        this.statusBar.setAttribute("aria-label", "Open a note for review");
        this.statusBar.setAttribute("aria-label-position", "top");
        this.statusBar.addEventListener("click", (_: any) => {
            this.reviewNextNote();
        });

        this.addRibbonIcon("crosshairs", "Sync notes scheduling", async () => {
            await this.sync();
            new Notice("Sync done.");
        });

        this.registerView(
            REVIEW_QUEUE_VIEW_TYPE,
            (leaf) =>
                (this.reviewQueueView = new ReviewQueueListView(leaf, this))
        );

        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file: TFile) => {
                menu.addItem((item) => {
                    item.setTitle("Review: Easy")
                        .setIcon("crosshairs")
                        .onClick((evt) => {
                            if (file.extension == "md")
                                this.saveReviewResponse(file, true);
                        });
                });

                menu.addItem((item) => {
                    item.setTitle("Review: Hard")
                        .setIcon("crosshairs")
                        .onClick((evt) => {
                            if (file.extension == "md")
                                this.saveReviewResponse(file, false);
                        });
                });

                menu.addItem((item) => {
                    item.setTitle("Review: Ignore file")
                        .setIcon("crosshairs")
                        .onClick((evt) => {
                            if (file.extension == "md") this.ignoreFile(file);
                        });
                });
            })
        );

        this.addCommand({
            id: "note-review-open-note",
            name: "Open a note for review",
            callback: () => {
                this.reviewNextNote();
            },
        });

        this.addSettingTab(new SRSettingTab(this.app, this));

        this.app.workspace.onLayoutReady(() => {
            this.initView();
            setTimeout(() => this.sync(), 2000);
        });
    }

    async sync() {
        let notes = this.app.vault.getMarkdownFiles();

        graph.reset();
        this.scheduledNotes = [];
        this.easeByPath = {};
        this.newNotes = [];
        this.incomingLinks = {};
        this.pageranks = {};
        this.dueNotesCount = 0;

        let now = Date.now();
        for (let note of notes) {
            if (this.incomingLinks[note.path] == undefined)
                this.incomingLinks[note.path] = [];

            let links = this.app.metadataCache.resolvedLinks[note.path] || {};
            for (let targetPath in links) {
                if (this.incomingLinks[targetPath] == undefined)
                    this.incomingLinks[targetPath] = [];

                // markdown files only
                if (targetPath.split(".").pop().toLowerCase() == "md") {
                    this.incomingLinks[targetPath].push({
                        sourcePath: note.path,
                        linkCount: links[targetPath],
                    });

                    graph.link(note.path, targetPath, links[targetPath]);
                }
            }

            let fileCachedData =
                this.app.metadataCache.getFileCache(note) || {};
            let frontmatter = fileCachedData.frontmatter || {};

            if (this.data.settings.reviewCertainTags) {
                let tags = fileCachedData.tags || [];
                let shouldIgnore = true;
                for (let tagObj of tags) {
                    if (this.data.settings.tagsToReview.includes(tagObj.tag)) {
                        shouldIgnore = false;
                        break;
                    }
                }

                if (shouldIgnore) continue;
            }

            // checks if note should be ignored
            if (frontmatter["sr-review"] != false) {
                // file has no scheduling information
                if (
                    !(
                        frontmatter.hasOwnProperty("sr-due") &&
                        frontmatter.hasOwnProperty("sr-interval") &&
                        frontmatter.hasOwnProperty("sr-ease")
                    )
                ) {
                    this.newNotes.push(note);
                    continue;
                }

                let dueUnix = Date.parse(frontmatter["sr-due"]);
                this.scheduledNotes.push({
                    note,
                    dueUnix,
                });

                this.easeByPath[note.path] = frontmatter["sr-ease"];

                if (dueUnix <= now) this.dueNotesCount++;
            }
        }

        graph.rank(0.85, 0.000001, (node: string, rank: number) => {
            this.pageranks[node] = rank * 10000;
        });

        // sort new notes by importance
        this.newNotes = this.newNotes.sort(
            (a: TFile, b: TFile) =>
                (this.pageranks[b.path] || 0) - (this.pageranks[a.path] || 0)
        );

        // sort scheduled notes by date & within those days, sort them by importance
        this.scheduledNotes = this.scheduledNotes.sort(
            (a: SchedNote, b: SchedNote) => {
                let result = a.dueUnix - b.dueUnix;
                if (result != 0) return result;
                return (
                    (this.pageranks[b.note.path] || 0) -
                    (this.pageranks[a.note.path] || 0)
                );
            }
        );

        this.statusBar.setText(`Review: ${this.dueNotesCount} due`);
        this.reviewQueueView.redraw();
    }

    async saveReviewResponse(note: TFile, easy: boolean) {
        let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        let frontmatter = fileCachedData.frontmatter || {};

        if (this.data.settings.reviewCertainTags) {
            let tags = fileCachedData.tags || [];
            let shouldIgnore = true;
            for (let tagObj of tags) {
                if (this.data.settings.tagsToReview.includes(tagObj.tag)) {
                    shouldIgnore = false;
                    break;
                }
            }

            if (shouldIgnore) {
                new Notice(
                    "Please tag the note appropriately since you have the `Review notes with certain tags` turned on in settings"
                );
                return;
            }
        }

        // check if note should be ignored
        if (frontmatter["sr-review"] != false) {
            let fileText = await this.app.vault.read(note);
            let ease, interval;
            // new note
            if (
                !(
                    frontmatter.hasOwnProperty("sr-due") &&
                    frontmatter.hasOwnProperty("sr-interval") &&
                    frontmatter.hasOwnProperty("sr-ease")
                )
            ) {
                let linkTotal = 0,
                    linkPGTotal = 0,
                    totalLinkCount = 0;

                for (let statObj of this.incomingLinks[note.path]) {
                    let ease = this.easeByPath[statObj.sourcePath];
                    if (ease) {
                        linkTotal +=
                            statObj.linkCount *
                            this.pageranks[statObj.sourcePath] *
                            ease;
                        linkPGTotal +=
                            this.pageranks[statObj.sourcePath] *
                            statObj.linkCount;
                        totalLinkCount += statObj.linkCount;
                    }
                }

                let outgoingLinks =
                    this.app.metadataCache.resolvedLinks[note.path] || {};
                for (let linkedFilePath in outgoingLinks) {
                    let ease = this.easeByPath[linkedFilePath];
                    if (ease) {
                        linkTotal +=
                            outgoingLinks[linkedFilePath] *
                            this.pageranks[linkedFilePath] *
                            ease;
                        linkPGTotal +=
                            this.pageranks[linkedFilePath] *
                            outgoingLinks[linkedFilePath];
                        totalLinkCount += outgoingLinks[linkedFilePath];
                    }
                }

                let linkContribution =
                    this.data.settings.maxLinkFactor *
                    Math.min(
                        1.0,
                        Math.log(totalLinkCount + 0.5) / Math.log(64)
                    );
                ease = Math.round(
                    (1.0 - linkContribution) * this.data.settings.baseEase +
                        (totalLinkCount > 0
                            ? (linkContribution * linkTotal) / linkPGTotal
                            : linkContribution * this.data.settings.baseEase)
                );
                interval = 1;
            } else {
                interval = frontmatter["sr-interval"];
                ease = frontmatter["sr-ease"];
            }

            ease = easy ? ease + 20 : Math.max(130, ease - 20);
            interval = Math.max(
                1,
                easy
                    ? (interval * ease) / 100
                    : interval * this.data.settings.lapsesIntervalChange
            );
            // fuzz
            if (interval >= 8) {
                let fuzz = [-0.05 * interval, 0, 0.05 * interval];
                interval += fuzz[Math.floor(Math.random() * fuzz.length)];
            }
            interval = Math.round(interval);

            let due = new Date(Date.now() + interval * 24 * 3600 * 1000);

            // check if scheduling info exists
            if (SCHEDULING_INFO_REGEX.test(fileText)) {
                let schedulingInfo = SCHEDULING_INFO_REGEX.exec(fileText);
                fileText = fileText.replace(
                    SCHEDULING_INFO_REGEX,
                    `---\n${
                        schedulingInfo[1]
                    }sr-due: ${due.toDateString()}\nsr-interval: ${interval}\nsr-ease: ${ease}\n${
                        schedulingInfo[5]
                    }---`
                );

                // new note with existing YAML front matter
            } else if (YAML_FRONT_MATTER_REGEX.test(fileText)) {
                let existingYaml = YAML_FRONT_MATTER_REGEX.exec(fileText);
                fileText = fileText.replace(
                    YAML_FRONT_MATTER_REGEX,
                    `---\n${
                        existingYaml[1]
                    }sr-due: ${due.toDateString()}\nsr-interval: ${interval}\nsr-ease: ${ease}\n---`
                );
            } else {
                fileText = `---\nsr-due: ${due.toDateString()}\nsr-interval: ${interval}\nsr-ease: ${ease}\n---\n\n${fileText}`;
            }

            this.app.vault.modify(note, fileText);

            new Notice("Response received.");
        } else {
            new Notice("Note marked as IGNORE or has no content.");
        }

        setTimeout(() => {
            this.sync();
            if (this.data.settings.autoNextNote) this.reviewNextNote();
        }, 500);
    }

    async reviewNextNote() {
        if (this.dueNotesCount > 0) {
            let index = this.data.settings.openRandomNote
                ? Math.floor(Math.random() * this.dueNotesCount)
                : 0;
            this.app.workspace.activeLeaf.openFile(
                this.scheduledNotes[index].note
            );
            return;
        }

        if (this.newNotes.length > 0) {
            let index = this.data.settings.openRandomNote
                ? Math.floor(Math.random() * this.newNotes.length)
                : 0;
            this.app.workspace.activeLeaf.openFile(this.newNotes[index]);
            return;
        }

        new Notice("You're done for the day :D.");
    }

    async ignoreFile(note: TFile) {
        let frontmatter =
            this.app.metadataCache.getFileCache(note).frontmatter || {};

        let fileText = await this.app.vault.read(note);
        if (Object.keys(frontmatter).length == 0) {
            fileText = `---\nsr-review: false\n---\n\n${fileText}`;
        } else if (frontmatter["sr-review"] == undefined) {
            let existingYaml = YAML_FRONT_MATTER_REGEX.exec(fileText);
            fileText = fileText.replace(
                YAML_FRONT_MATTER_REGEX,
                `---\n${existingYaml[1]}sr-review: false\n---`
            );
        } else if (frontmatter["sr-review"] != false) {
            fileText = fileText.replace(
                /sr-review: [0-9A-Za-z ]+/,
                "sr-review: false"
            );
        }

        this.app.vault.modify(note, fileText);
        setTimeout(() => this.sync(), 500);
    }

    async loadPluginData() {
        this.data = Object.assign({}, DEFAULT_DATA, await this.loadData());
    }

    async savePluginData() {
        await this.saveData(this.data);
    }

    initView() {
        if (this.app.workspace.getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE).length) {
            return;
        }

        this.app.workspace.getRightLeaf(false).setViewState({
            type: REVIEW_QUEUE_VIEW_TYPE,
            active: true,
        });
    }
}

class SRSettingTab extends PluginSettingTab {
    plugin: SRPlugin;

    constructor(app: App, plugin: SRPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        let { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Review notes with certain tags")
            .setDesc(
                "When you turn this on, only notes with certain tags will be available for review"
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.reviewCertainTags)
                    .onChange(async (value) => {
                        this.plugin.data.settings.reviewCertainTags = value;
                        await this.plugin.savePluginData();
                        this.plugin.sync();
                    })
            );

        new Setting(containerEl)
            .setName("Tags to review")
            .setDesc(
                "Enter tags separated by spaces i.e. #review #tag2 #tag3. For this to work, the setting above must be turned on"
            )
            .addTextArea((text) =>
                text
                    .setValue(
                        `${this.plugin.data.settings.tagsToReview.join(" ")}`
                    )
                    .onChange(async (value) => {
                        this.plugin.data.settings.tagsToReview = value.split(
                            " "
                        );
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Open a random note for review")
            .setDesc(
                "When you turn this off, notes are ordered by importance (PageRank)"
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.openRandomNote)
                    .onChange(async (value) => {
                        this.plugin.data.settings.openRandomNote = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Open next note automatically after a review")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.autoNextNote)
                    .onChange(async (value) => {
                        this.plugin.data.settings.autoNextNote = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Base ease")
            .setDesc("minimum = 130, preferrably approximately 250")
            .addText((text) =>
                text
                    .setValue(`${this.plugin.data.settings.baseEase}`)
                    .onChange(async (value) => {
                        let numValue: number = Number.parseInt(value);
                        if (!isNaN(numValue)) {
                            if (numValue < 130) {
                                new Notice(
                                    "The base ease must be at least 130."
                                );
                                text.setValue(
                                    `${this.plugin.data.settings.baseEase}`
                                );
                                return;
                            }

                            this.plugin.data.settings.baseEase = numValue;
                            await this.plugin.savePluginData();
                        } else {
                            new Notice("Please provide a valid number.");
                        }
                    })
            );

        new Setting(containerEl)
            .setName("Interval change when you review a note/concept as hard")
            .setDesc(
                "newInterval = oldInterval * intervalChange / 100, 0% < intervalChange < 100%"
            )
            .addText((text) =>
                text
                    .setValue(
                        `${
                            this.plugin.data.settings.lapsesIntervalChange * 100
                        }`
                    )
                    .onChange(async (value) => {
                        let numValue: number = Number.parseInt(value) / 100;
                        if (!isNaN(numValue)) {
                            if (numValue < 0.01 || numValue > 0.99) {
                                new Notice(
                                    "The load balancing threshold must be in the range 0% < intervalChange < 100%."
                                );
                                text.setValue(
                                    `${
                                        this.plugin.data.settings
                                            .lapsesIntervalChange * 100
                                    }`
                                );
                                return;
                            }

                            this.plugin.data.settings.lapsesIntervalChange = numValue;
                            await this.plugin.savePluginData();
                        } else {
                            new Notice("Please provide a valid number.");
                        }
                    })
            );

        new Setting(containerEl)
            .setName("Maximum link contribution")
            .setDesc(
                "Max. contribution of the weighted ease of linked notes to the initial ease (0% <= maxLinkFactor <= 100%)"
            )
            .addText((text) =>
                text
                    .setValue(
                        `${this.plugin.data.settings.maxLinkFactor * 100}`
                    )
                    .onChange(async (value) => {
                        let numValue: number = Number.parseInt(value) / 100;
                        if (!isNaN(numValue)) {
                            if (numValue < 0 || numValue > 1.0) {
                                new Notice(
                                    "The link factor must be in the range 0% <= maxLinkFactor <= 100%."
                                );
                                text.setValue(
                                    `${
                                        this.plugin.data.settings
                                            .maxLinkFactor * 100
                                    }`
                                );
                                return;
                            }

                            this.plugin.data.settings.maxLinkFactor = numValue;
                            await this.plugin.savePluginData();
                        } else {
                            new Notice("Please provide a valid number.");
                        }
                    })
            );

        let helpEl = containerEl.createDiv("help-div");
        helpEl.innerHTML =
            '<a href="https://github.com/st3v3nmw/obsidian-spaced-repetition/blob/master/README.md">For more information, check the README.</a>';
    }
}

class ReviewQueueListView extends ItemView {
    plugin: SRPlugin;
    activeFolders: Set<string>;

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
        collapseIconEl.innerHTML = collapseIcon;

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

const crossHairsIcon = `<path style=" stroke:none;fill-rule:nonzero;fill:currentColor;fill-opacity:1;" d="M 99.921875 47.941406 L 93.074219 47.941406 C 92.84375 42.03125 91.390625 36.238281 88.800781 30.921875 L 85.367188 32.582031 C 87.667969 37.355469 88.964844 42.550781 89.183594 47.84375 L 82.238281 47.84375 C 82.097656 44.617188 81.589844 41.417969 80.734375 38.304688 L 77.050781 39.335938 C 77.808594 42.089844 78.261719 44.917969 78.40625 47.769531 L 65.871094 47.769531 C 64.914062 40.507812 59.144531 34.832031 51.871094 33.996094 L 51.871094 21.386719 C 54.816406 21.507812 57.742188 21.960938 60.585938 22.738281 L 61.617188 19.058594 C 58.4375 18.191406 55.164062 17.691406 51.871094 17.570312 L 51.871094 10.550781 C 57.164062 10.769531 62.355469 12.066406 67.132812 14.363281 L 68.789062 10.929688 C 63.5 8.382812 57.738281 6.953125 51.871094 6.734375 L 51.871094 0.0390625 L 48.054688 0.0390625 L 48.054688 6.734375 C 42.179688 6.976562 36.417969 8.433594 31.132812 11.007812 L 32.792969 14.441406 C 37.566406 12.140625 42.761719 10.84375 48.054688 10.625 L 48.054688 17.570312 C 44.828125 17.714844 41.628906 18.21875 38.515625 19.078125 L 39.546875 22.757812 C 42.324219 21.988281 45.175781 21.53125 48.054688 21.386719 L 48.054688 34.03125 C 40.796875 34.949219 35.089844 40.679688 34.203125 47.941406 L 21.5 47.941406 C 21.632812 45.042969 22.089844 42.171875 22.855469 39.375 L 19.171875 38.34375 C 18.3125 41.457031 17.808594 44.65625 17.664062 47.882812 L 10.664062 47.882812 C 10.882812 42.589844 12.179688 37.394531 14.480469 32.621094 L 11.121094 30.921875 C 8.535156 36.238281 7.078125 42.03125 6.847656 47.941406 L 0 47.941406 L 0 51.753906 L 6.847656 51.753906 C 7.089844 57.636719 8.542969 63.402344 11.121094 68.695312 L 14.554688 67.035156 C 12.257812 62.261719 10.957031 57.066406 10.738281 51.773438 L 17.742188 51.773438 C 17.855469 55.042969 18.34375 58.289062 19.191406 61.445312 L 22.871094 60.414062 C 22.089844 57.5625 21.628906 54.632812 21.5 51.679688 L 34.203125 51.679688 C 35.058594 58.96875 40.773438 64.738281 48.054688 65.660156 L 48.054688 78.308594 C 45.105469 78.1875 42.183594 77.730469 39.335938 76.957031 L 38.304688 80.636719 C 41.488281 81.511719 44.757812 82.015625 48.054688 82.144531 L 48.054688 89.144531 C 42.761719 88.925781 37.566406 87.628906 32.792969 85.328125 L 31.132812 88.765625 C 36.425781 91.3125 42.183594 92.742188 48.054688 92.960938 L 48.054688 99.960938 L 51.871094 99.960938 L 51.871094 92.960938 C 57.75 92.71875 63.519531 91.265625 68.808594 88.6875 L 67.132812 85.253906 C 62.355469 87.550781 57.164062 88.851562 51.871094 89.070312 L 51.871094 82.125 C 55.09375 81.980469 58.292969 81.476562 61.40625 80.617188 L 60.378906 76.9375 C 57.574219 77.703125 54.695312 78.15625 51.792969 78.289062 L 51.792969 65.679688 C 59.121094 64.828125 64.910156 59.0625 65.796875 51.734375 L 78.367188 51.734375 C 78.25 54.734375 77.789062 57.710938 76.992188 60.605469 L 80.675781 61.636719 C 81.558594 58.40625 82.066406 55.082031 82.183594 51.734375 L 89.261719 51.734375 C 89.042969 57.03125 87.742188 62.222656 85.445312 66.996094 L 88.878906 68.65625 C 91.457031 63.367188 92.910156 57.597656 93.152344 51.71875 L 100 51.71875 Z M 62.019531 51.734375 C 61.183594 56.945312 57.085938 61.023438 51.871094 61.828125 L 51.871094 57.515625 L 48.054688 57.515625 L 48.054688 61.808594 C 42.910156 60.949219 38.886719 56.902344 38.058594 51.753906 L 42.332031 51.753906 L 42.332031 47.941406 L 38.058594 47.941406 C 38.886719 42.789062 42.910156 38.746094 48.054688 37.886719 L 48.054688 42.179688 L 51.871094 42.179688 L 51.871094 37.847656 C 57.078125 38.648438 61.179688 42.71875 62.019531 47.921875 L 57.707031 47.921875 L 57.707031 51.734375 Z M 62.019531 51.734375 "/>`;
const collapseIcon = `<svg viewBox="0 0 100 100" width="8" height="8" class="right-triangle"><path fill="currentColor" stroke="currentColor" d="M94.9,20.8c-1.4-2.5-4.1-4.1-7.1-4.1H12.2c-3,0-5.7,1.6-7.1,4.1c-1.3,2.4-1.2,5.2,0.2,7.6L43.1,88c1.5,2.3,4,3.7,6.9,3.7 s5.4-1.4,6.9-3.7l37.8-59.6C96.1,26,96.2,23.2,94.9,20.8L94.9,20.8z"></path></svg>`;
