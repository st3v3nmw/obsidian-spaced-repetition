import {
    Notice,
    Plugin,
    addIcon,
    iterateCacheRefs,
    getLinkpath,
    ItemView,
    PluginSettingTab,
    Setting,
    WorkspaceLeaf,
    Menu,
    App,
    TFile,
} from "obsidian";
import * as graph from "pagerank.js";

const SCHEDULING_INFO_REGEX = /^---\n((?:.*\n)*)due: ([0-9A-Za-z ]+)\ninterval: ([0-9]+)\nease: ([0-9]+)\n((?:.*\n)*)---/;
const YAML_FRONT_MATTER_REGEX = /^---\n((?:.*\n)*)---/;
const REVIEW_QUEUE_VIEW_TYPE = "review-queue-list-view";

interface SRSettings {
    base_ease: number;
    max_link_factor: number;
    open_random_note: boolean;
    lapses_interval_change: number;
    auto_next_note: boolean;
}

interface PluginData {
    settings: SRSettings;
}

const DEFAULT_SETTINGS: SRSettings = {
    base_ease: 250,
    max_link_factor: 1.0,
    open_random_note: false,
    lapses_interval_change: 0.5,
    auto_next_note: false,
};

const DEFAULT_DATA: PluginData = {
    settings: DEFAULT_SETTINGS,
};

export default class SRPlugin extends Plugin {
    private statusBar: HTMLElement;
    public data: PluginData;
    private due_view: ReviewQueueListView;

    public scheduled_notes;
    public due_notes: SchedNote[];
    public new_notes: TFile[];
    private incoming_links;
    private outgoing_links;
    private pageranks: Map<string, number>;

    async onload() {
        await this.loadPluginData();

        addIcon("crosshairs", crossHairsIcon);

        this.scheduled_notes = new Map();
        this.due_notes = [];
        this.new_notes = [];
        this.pageranks = new Map();
        this.incoming_links = {};
        this.outgoing_links = {};

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
            (leaf) => (this.due_view = new ReviewQueueListView(leaf, this))
        );

        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file: TFile) => {
                menu.addItem((item) => {
                    item.setTitle("Review: Easy")
                        .setIcon("crosshairs")
                        .onClick((evt) => {
                            if (file.extension == "md")
                                this.saveReviewResponse(file, 1);
                        });
                });

                menu.addItem((item) => {
                    item.setTitle("Review: Hard")
                        .setIcon("crosshairs")
                        .onClick((evt) => {
                            if (file.extension == "md")
                                this.saveReviewResponse(file, 0);
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
            this.sync();
        });
    }

    async sync() {
        let notes = this.app.vault.getMarkdownFiles();
        this.scheduled_notes = {};
        this.due_notes = [];
        this.new_notes = [];
        this.pageranks = new Map();
        this.incoming_links = {};
        this.outgoing_links = {};

        for (let file of notes) {
            this.incoming_links[file.path] = { list: {} };
            this.outgoing_links[file.path] = { list: {} };
        }

        let now = Date.now();
        for (let note of notes) {
            let { frontmatter } =
                this.app.metadataCache.getFileCache(note) || {};
            frontmatter = frontmatter || {};

            // checks if note should be ignored
            if (frontmatter["review"] != false) {
                let file_text = await this.app.vault.cachedRead(note);
                // file has no scheduling information
                if (
                    !(
                        frontmatter.hasOwnProperty("due") &&
                        frontmatter.hasOwnProperty("interval") &&
                        frontmatter.hasOwnProperty("ease")
                    )
                ) {
                    this.new_notes.push(note);
                    continue;
                }

                let due_unix = Date.parse(frontmatter["due"]);
                let interval = frontmatter["interval"];
                let ease = frontmatter["ease"];

                if (!(due_unix in this.scheduled_notes))
                    this.scheduled_notes[due_unix] = {};
                let note_obj = new SchedNote(note, due_unix, interval, ease);
                this.scheduled_notes[due_unix][note.path] = note_obj;
                this.incoming_links[note.path]["ease"] = ease;
                this.outgoing_links[note.path]["ease"] = ease;

                if (due_unix <= now) this.due_notes.push(note_obj);
            }
        }

        for (let source of notes) {
            let links = this.app.metadataCache.resolvedLinks[source.path];
            for (let target_path in links) {
                // Markdown files only
                if (target_path.split(".").pop().toLowerCase() == "md") {
                    this.outgoing_links[source.path]["list"][target_path] =
                        links[target_path];
                    this.incoming_links[target_path]["list"][source.path] =
                        links[target_path];
                }
            }
        }

        graph.reset();
        for (let source in this.outgoing_links) {
            for (let target in this.outgoing_links[source]["list"])
                graph.link(
                    source,
                    target,
                    this.outgoing_links[source]["list"][target]
                );
        }

        graph.rank(0.85, 0.000001, (node: string, rank: number) => {
            this.pageranks.set(node, rank * 10000);
        });

        // sort dates
        this.scheduled_notes = Object.keys(this.scheduled_notes)
            .sort()
            .reduce((obj, key) => {
                obj[key] = this.scheduled_notes[key];
                return obj;
            }, {});

        // sort per day entries by importance
        let temp = {};
        for (let due_unix in this.scheduled_notes) {
            temp[due_unix] = Object.fromEntries(
                Object.entries(this.scheduled_notes[due_unix]).sort(
                    ([, a], [, b]) =>
                        (this.pageranks.get(b.note.path) || 0) -
                        (this.pageranks.get(a.note.path) || 0)
                )
            );
        }
        this.scheduled_notes = temp;

        // sort due notes by importance
        this.due_notes = this.due_notes.sort(
            (a: SchedNote, b: SchedNote) =>
                (this.pageranks.get(b.note.path) || 0) -
                (this.pageranks.get(a.note.path) || 0)
        );

        // sort new notes by importance
        this.new_notes = this.new_notes.sort(
            (a: TFile, b: TFile) =>
                (this.pageranks.get(b.path) || 0) -
                (this.pageranks.get(a.path) || 0)
        );

        this.statusBar.setText(`Review: ${this.due_notes.length} due`);
        this.due_view.redraw();
    }

    async saveReviewResponse(note: TFile, quality: number) {
        let { frontmatter } = this.app.metadataCache.getFileCache(note) || {};
        frontmatter = frontmatter || {};

        // check if note should be ignored
        if (frontmatter["review"] != false) {
            let file_text = await this.app.vault.read(note);
            let ease, interval;
            // new note
            if (
                !(
                    frontmatter.hasOwnProperty("due") &&
                    frontmatter.hasOwnProperty("interval") &&
                    frontmatter.hasOwnProperty("ease")
                )
            ) {
                let link_total = 0,
                    link_pg_total = 0,
                    total_link_count = 0;
                for (let linked_file in this.incoming_links[note.path][
                    "list"
                ]) {
                    let ease =
                        this.pageranks.get(linked_file) *
                        this.incoming_links[linked_file]["ease"];
                    if (ease) {
                        let link_count = this.incoming_links[note.path]["list"][
                            linked_file
                        ];
                        link_total += ease * link_count;
                        link_pg_total +=
                            this.pageranks.get(linked_file) * link_count;
                        total_link_count += link_count;
                    }
                }

                for (let linked_file in this.outgoing_links[note.path][
                    "list"
                ]) {
                    let ease =
                        this.pageranks.get(linked_file) *
                        this.outgoing_links[linked_file]["ease"];
                    if (ease) {
                        let link_count = this.outgoing_links[note.path]["list"][
                            linked_file
                        ];
                        link_total += ease * link_count;
                        link_pg_total +=
                            this.pageranks.get(linked_file) * link_count;
                        total_link_count += link_count;
                    }
                }

                let link_contribution =
                    this.data.settings.max_link_factor *
                    Math.min(
                        1.0,
                        Math.log(total_link_count + 0.5) / Math.log(64)
                    );
                ease = Math.round(
                    (1.0 - link_contribution) * this.data.settings.base_ease +
                        (total_link_count > 0
                            ? (link_contribution * link_total) / link_pg_total
                            : link_contribution * this.data.settings.base_ease)
                );
                interval = 1;
            } else {
                interval = frontmatter["interval"];
                ease = frontmatter["ease"];
            }

            ease = quality == 1 ? ease + 20 : Math.max(130, ease - 20);
            interval = Math.max(
                1,
                quality == 1
                    ? (interval * ease) / 100
                    : interval * this.data.settings.lapses_interval_change
            );
            // fuzz
            if (interval >= 8) {
                let fuzz = [-0.05 * interval, 0, 0.05 * interval];
                interval += fuzz[Math.floor(Math.random() * fuzz.length)];
            }
            interval = Math.round(interval);

            let due = new Date(Date.now() + interval * 24 * 3600 * 1000);

            // check if scheduling info exists
            if (SCHEDULING_INFO_REGEX.test(file_text)) {
                let scheduling_info = SCHEDULING_INFO_REGEX.exec(file_text);
                file_text = file_text.replace(
                    SCHEDULING_INFO_REGEX,
                    `---\n${
                        scheduling_info[1]
                    }due: ${due.toDateString()}\ninterval: ${interval}\nease: ${ease}\n${
                        scheduling_info[5]
                    }---`
                );

                // new note with existing YAML front matter
            } else if (YAML_FRONT_MATTER_REGEX.test(file_text)) {
                let existing_yaml = YAML_FRONT_MATTER_REGEX.exec(file_text);
                file_text = file_text.replace(
                    YAML_FRONT_MATTER_REGEX,
                    `---\n${
                        existing_yaml[1]
                    }due: ${due.toDateString()}\ninterval: ${interval}\nease: ${ease}\n---`
                );
            } else {
                file_text = `---\ndue: ${due.toDateString()}\ninterval: ${interval}\nease: ${ease}\n---\n\n${file_text}`;
            }

            this.app.vault.modify(note, file_text);

            new Notice("Response received.");
        } else {
            new Notice("Note marked as IGNORE or has no content.");
        }

        await this.sync();
        if (this.data.settings.auto_next_note) this.reviewNextNote();
    }

    async reviewNextNote() {
        if (this.due_notes.length == 0 && this.new_notes.length == 0) {
            new Notice("You're done for the day :D.");
            return;
        }

        if (this.due_notes.length > 0) {
            let cNote = this.due_notes[
                this.data.settings.open_random_note
                    ? Math.floor(Math.random() * this.due_notes.length)
                    : 0
            ];
            for (let note of this.due_notes) {
                if (note.due_unix < cNote.due_unix) cNote = note;
            }
            this.app.workspace.activeLeaf.openFile(cNote.note);
            return;
        }

        if (this.new_notes.length > 0) {
            let note = this.new_notes[
                this.data.settings.open_random_note
                    ? Math.floor(Math.random() * this.new_notes.length)
                    : 0
            ];
            this.app.workspace.activeLeaf.openFile(note[0]);
        }
    }

    async ignoreFile(note: TFile) {
        let { frontmatter } = this.app.metadataCache.getFileCache(note) || {};
        frontmatter = frontmatter || {};

        let file_text = await this.app.vault.read(note);
        if (Object.entries(frontmatter).length == 0) {
            file_text = `---\nreview: false\n---\n\n${file_text}`;
        } else if (frontmatter["review"] == undefined) {
            let existing_yaml = YAML_FRONT_MATTER_REGEX.exec(file_text);
            file_text = file_text.replace(
                YAML_FRONT_MATTER_REGEX,
                `---\n${existing_yaml[1]}review: false\n---`
            );
        } else if (frontmatter["review"] != false) {
            file_text = file_text.replace(
                /review: [0-9A-Za-z ]+/,
                "review: false"
            );
        }
        this.app.vault.modify(note, file_text);
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

class SchedNote {
    public note: TFile;
    public due_unix: number;
    public interval: number;
    public ease: number;

    constructor(note: TFile, due_unix: number, interval: number, ease: number) {
        this.note = note;
        this.due_unix = due_unix;
        this.interval = interval;
        this.ease = ease;
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
            .setName("Open a random note for review")
            .setDesc(
                "When you turn this off, notes are ordered by importance (PageRank)"
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.open_random_note)
                    .onChange(async (value) => {
                        this.plugin.data.settings.open_random_note = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Open next note automatically after a review")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.auto_next_note)
                    .onChange(async (value) => {
                        this.plugin.data.settings.auto_next_note = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Base ease")
            .setDesc("minimum = 130, preferrably approximately 250")
            .addText((text) =>
                text
                    .setValue(`${this.plugin.data.settings.base_ease}`)
                    .onChange(async (value) => {
                        let num_value: number = Number.parseInt(value);
                        if (!isNaN(num_value)) {
                            if (num_value < 130) {
                                new Notice(
                                    "The base ease must be at least 130."
                                );
                                text.setValue(
                                    `${this.plugin.data.settings.base_ease}`
                                );
                                return;
                            }

                            this.plugin.data.settings.base_ease = num_value;
                            await this.plugin.savePluginData();
                        } else {
                            new Notice("Please provide a valid number.");
                        }
                    })
            );

        new Setting(containerEl)
            .setName("Interval change when you review a note/concept as hard")
            .setDesc(
                "new_interval = old_interval * interval_change / 100, 0% < interval_change < 100%"
            )
            .addText((text) =>
                text
                    .setValue(
                        `${
                            this.plugin.data.settings.lapses_interval_change *
                            100
                        }`
                    )
                    .onChange(async (value) => {
                        let num_value: number = Number.parseInt(value) / 100;
                        if (!isNaN(num_value)) {
                            if (num_value < 0.01 || num_value > 0.99) {
                                new Notice(
                                    "The load balancing threshold must be in the range 0% < interval_change < 100%."
                                );
                                text.setValue(
                                    `${
                                        this.plugin.data.settings
                                            .lapses_interval_change * 100
                                    }`
                                );
                                return;
                            }

                            this.plugin.data.settings.lapses_interval_change = num_value;
                            await this.plugin.savePluginData();
                        } else {
                            new Notice("Please provide a valid number.");
                        }
                    })
            );

        new Setting(containerEl)
            .setName("Maximum link contribution")
            .setDesc(
                "Max. contribution of the weighted ease of linked notes to the initial ease (0% <= max_link_factor <= 100%)"
            )
            .addText((text) =>
                text
                    .setValue(
                        `${this.plugin.data.settings.max_link_factor * 100}`
                    )
                    .onChange(async (value) => {
                        let num_value: number = Number.parseInt(value) / 100;
                        if (!isNaN(num_value)) {
                            if (num_value < 0 || num_value > 1.0) {
                                new Notice(
                                    "The link factor must be in the range 0% <= max_link_factor <= 100%."
                                );
                                text.setValue(
                                    `${
                                        this.plugin.data.settings
                                            .max_link_factor * 100
                                    }`
                                );
                                return;
                            }

                            this.plugin.data.settings.max_link_factor = num_value;
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
        this.redraw();
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

        if (this.plugin.new_notes.length > 0) {
            let newNotesFolderEl = this.createRightPaneFolder(
                childrenEl,
                "New",
                !this.activeFolders.has("New")
            );

            for (let currentFile of this.plugin.new_notes) {
                this.createRightPaneFile(
                    newNotesFolderEl,
                    currentFile,
                    openFile,
                    !this.activeFolders.has("New")
                );
            }
        }

        let now: number = Date.now();
        for (let due_unix in this.plugin.scheduled_notes) {
            let due_on_date = this.plugin.scheduled_notes[due_unix];
            let due = new Date(Number.parseInt(due_unix));

            let n_days = Math.ceil((due_unix - now) / (24 * 3600 * 1000));
            let folderTitle =
                n_days == -1
                    ? "Yesterday"
                    : n_days == 0
                    ? "Today"
                    : n_days == 1
                    ? "Tomorrow"
                    : due.toDateString();

            let folderEl = this.createRightPaneFolder(
                childrenEl,
                folderTitle,
                !this.activeFolders.has(folderTitle)
            );

            for (let currentFile in due_on_date) {
                let navFileTitle = this.createRightPaneFile(
                    folderEl,
                    due_on_date[currentFile].note,
                    openFile,
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
        openFile: TFile,
        hidden: boolean
    ) {
        const navFile = folderEl.createDiv("nav-file");
        if (hidden) navFile.style.display = "none";

        const navFileTitle = navFile.createDiv("nav-file-title");
        if (openFile && file.path === openFile.path)
            navFileTitle.addClass("is-active");

        navFileTitle.createDiv("nav-file-title-content").setText(file.basename);
        navFileTitle.addEventListener(
            "click",
            (event) => {
                event.preventDefault();
                this.app.workspace.activeLeaf.openFile(file);
                return false;
            },
            false
        );

        navFileTitle.addEventListener(
            "contextmenu",
            (event) => {
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
