import { Notice, Plugin, addIcon, TFile, HeadingCache } from "obsidian";
import * as graph from "pagerank.js";
import { SRSettings, SRSettingTab, DEFAULT_SETTINGS } from "./settings";
import { FlashcardModal } from "./flashcard-modal";
import { ReviewQueueListView, REVIEW_QUEUE_VIEW_TYPE } from "./sidebar";
import {
    CROSS_HAIRS_ICON,
    SCHEDULING_INFO_REGEX,
    YAML_FRONT_MATTER_REGEX,
    SINGLELINE_CARD_REGEX,
    MULTILINE_CARD_REGEX,
} from "./constants";

interface PluginData {
    settings: SRSettings;
}

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

enum ReviewResponse {
    Easy,
    Good,
    Hard,
}

export interface Card {
    due?: string;
    ease?: number;
    interval?: number;
    context?: string;
    note: TFile;
    front: string;
    back: string;
    match: any;
    isSingleLine: boolean;
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

    public newFlashcards: Card[] = [];
    public dueFlashcards: Card[] = [];

    async onload() {
        await this.loadPluginData();

        addIcon("crosshairs", CROSS_HAIRS_ICON);

        this.statusBar = this.addStatusBarItem();
        this.statusBar.classList.add("mod-clickable");
        this.statusBar.setAttribute("aria-label", "Open a note for review");
        this.statusBar.setAttribute("aria-label-position", "top");
        this.statusBar.addEventListener("click", (_: any) => {
            this.reviewNextNote();
        });

        this.addRibbonIcon("crosshairs", "Review flashcards", async () => {
            await this.sync();
            new FlashcardModal(this.app, this).open();
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
                                this.saveReviewResponse(
                                    file,
                                    ReviewResponse.Easy
                                );
                        });
                });

                menu.addItem((item) => {
                    item.setTitle("Review: Good")
                        .setIcon("crosshairs")
                        .onClick((evt) => {
                            if (file.extension == "md")
                                this.saveReviewResponse(
                                    file,
                                    ReviewResponse.Good
                                );
                        });
                });

                menu.addItem((item) => {
                    item.setTitle("Review: Hard")
                        .setIcon("crosshairs")
                        .onClick((evt) => {
                            if (file.extension == "md")
                                this.saveReviewResponse(
                                    file,
                                    ReviewResponse.Hard
                                );
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

        this.addCommand({
            id: "note-review-easy",
            name: "Review note as easy",
            callback: () => {
                const openFile = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension == "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Easy);
            },
        });

        this.addCommand({
            id: "note-review-good",
            name: "Review note as good",
            callback: () => {
                const openFile = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension == "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Good);
            },
        });

        this.addCommand({
            id: "note-review-hard",
            name: "Review note as hard",
            callback: () => {
                const openFile = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension == "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Hard);
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

        this.newFlashcards = [];
        this.dueFlashcards = [];

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
            let frontmatter =
                fileCachedData.frontmatter || <Record<string, any>>{};

            let tags = fileCachedData.tags || [];
            let shouldIgnore = true;
            for (let tagObj of tags) {
                if (tagObj.tag == "#flashcards") {
                    await this.findFlashcards(note);
                    break;
                }

                if (this.data.settings.tagsToReview.includes(tagObj.tag)) {
                    shouldIgnore = false;
                    break;
                }
            }

            if (shouldIgnore) continue;

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

            let dueUnix: number = Date.parse(frontmatter["sr-due"]);
            this.scheduledNotes.push({
                note,
                dueUnix,
            });

            this.easeByPath[note.path] = frontmatter["sr-ease"];

            if (dueUnix <= now) this.dueNotesCount++;
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

        this.statusBar.setText(`Review: ${this.dueNotesCount} notes due`);
        this.reviewQueueView.redraw();
    }

    async saveReviewResponse(note: TFile, response: ReviewResponse) {
        let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        let frontmatter = fileCachedData.frontmatter || <Record<string, any>>{};

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
                "Please tag the note appropriately for reviewing (in settings)."
            );
            return;
        }

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
                        this.pageranks[statObj.sourcePath] * statObj.linkCount;
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
                Math.min(1.0, Math.log(totalLinkCount + 0.5) / Math.log(64));
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

        if (response != ReviewResponse.Good) {
            ease =
                response == ReviewResponse.Easy
                    ? ease + 20
                    : Math.max(130, ease - 20);
        }

        if (response == ReviewResponse.Hard)
            interval = Math.max(
                1,
                interval * this.data.settings.lapsesIntervalChange
            );
        else if (response == ReviewResponse.Good)
            interval = (interval * ease) / 100;
        else interval = (1.3 * (interval * ease)) / 100;

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

    async findFlashcards(note: TFile) {
        let fileText = await this.app.vault.read(note);
        let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        let headings = fileCachedData.headings || [];

        let now = Date.now();
        for (let regex of [SINGLELINE_CARD_REGEX, MULTILINE_CARD_REGEX]) {
            let isSingleLine = regex == SINGLELINE_CARD_REGEX;
            for (let match of fileText.matchAll(regex)) {
                match[0] = match[0].trim();
                match[1] = match[1].trim();
                match[2] = match[2].trim();

                let cardObj: Card;
                // flashcard already scheduled
                if (match[3]) {
                    if (Date.parse(match[3]) <= now) {
                        cardObj = {
                            front: match[1],
                            back: match[2],
                            note,
                            due: match[3],
                            interval: parseInt(match[4]),
                            ease: parseInt(match[5]),
                            match,
                            isSingleLine,
                        };
                        this.dueFlashcards.push(cardObj);
                    } else continue;
                } else {
                    cardObj = {
                        front: match[1],
                        back: match[2],
                        match,
                        note,
                        isSingleLine,
                    };
                    this.newFlashcards.push(cardObj);
                }

                let cardOffset = match.index;
                let stack: HeadingCache[] = [];
                for (let heading of headings) {
                    if (heading.position.start.offset > cardOffset) break;

                    while (
                        stack.length > 0 &&
                        stack[stack.length - 1].level >= heading.level
                    )
                        stack.pop();

                    stack.push(heading);
                }

                cardObj.context = "";
                for (let headingObj of stack)
                    cardObj.context += headingObj.heading + " > ";
                cardObj.context = cardObj.context.slice(0, -3);
            }
        }
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
