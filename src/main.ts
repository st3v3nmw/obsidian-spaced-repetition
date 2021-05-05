import {
    Notice,
    Plugin,
    addIcon,
    TFile,
    HeadingCache,
    getAllTags,
} from "obsidian";
import * as graph from "pagerank.js";
import { SRSettings, SRSettingTab, DEFAULT_SETTINGS } from "./settings";
import { FlashcardModal } from "./flashcard-modal";
import { ReviewQueueListView, REVIEW_QUEUE_VIEW_TYPE } from "./sidebar";
import { ReviewResponse, schedule } from "./sched";
import { Card, CardType } from "./types";
import {
    CROSS_HAIRS_ICON,
    SCHEDULING_INFO_REGEX,
    YAML_FRONT_MATTER_REGEX,
    SINGLELINE_CARD_REGEX,
    MULTILINE_CARD_REGEX,
    CLOZE_CARD_DETECTOR,
    CLOZE_DELETIONS_EXTRACTOR,
    CLOZE_SCHEDULING_EXTRACTOR,
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
            this.sync();
            this.reviewNextNote();
        });

        this.addRibbonIcon("crosshairs", "Review flashcards", async () => {
            await this.flashcards_sync();
            new FlashcardModal(this.app, this).open();
        });

        this.registerView(
            REVIEW_QUEUE_VIEW_TYPE,
            (leaf) =>
                (this.reviewQueueView = new ReviewQueueListView(leaf, this))
        );

        if (!this.data.settings.disableFileMenuReviewOptions) {
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
        }

        this.addCommand({
            id: "note-review-open-note",
            name: "Open a note for review",
            callback: () => {
                this.sync();
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
            setTimeout(() => this.flashcards_sync(), 2000);
        });
    }

    onunload(): void {
        this.app.workspace
            .getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE)
            .forEach((leaf) => leaf.detach());
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

            let frontmatter =
                fileCachedData.frontmatter || <Record<string, any>>{};
            let tags = getAllTags(fileCachedData) || [];

            let shouldIgnore = true;
            for (let tag of tags) {
                if (this.data.settings.tagsToReview.includes(tag)) {
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

            let dueUnix: number = window
                .moment(frontmatter["sr-due"], [
                    "DD-MM-YYYY",
                    "ddd MMM DD YYYY",
                ])
                .valueOf();
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

        this.statusBar.setText(
            `Review: ${this.dueNotesCount} notes, ${this.dueFlashcards.length} cards due`
        );
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

        let schedObj = schedule(
            response,
            interval,
            ease,
            this.data.settings.lapsesIntervalChange,
            this.data.settings.easyBonus
        );
        interval = Math.round(schedObj.interval);
        ease = schedObj.ease;

        let due = window.moment(Date.now() + interval * 24 * 3600 * 1000);
        let dueString = due.format("DD-MM-YYYY");

        // check if scheduling info exists
        if (SCHEDULING_INFO_REGEX.test(fileText)) {
            let schedulingInfo = SCHEDULING_INFO_REGEX.exec(fileText);
            fileText = fileText.replace(
                SCHEDULING_INFO_REGEX,
                `---\n${schedulingInfo[1]}sr-due: ${dueString}\nsr-interval: ${interval}\nsr-ease: ${ease}\n${schedulingInfo[5]}---`
            );

            // new note with existing YAML front matter
        } else if (YAML_FRONT_MATTER_REGEX.test(fileText)) {
            let existingYaml = YAML_FRONT_MATTER_REGEX.exec(fileText);
            fileText = fileText.replace(
                YAML_FRONT_MATTER_REGEX,
                `---\n${existingYaml[1]}sr-due: ${dueString}\nsr-interval: ${interval}\nsr-ease: ${ease}\n---`
            );
        } else {
            fileText = `---\nsr-due: ${dueString}\nsr-interval: ${interval}\nsr-ease: ${ease}\n---\n\n${fileText}`;
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

    async flashcards_sync() {
        let notes = this.app.vault.getMarkdownFiles();

        this.newFlashcards = [];
        this.dueFlashcards = [];

        for (let note of notes) {
            let fileCachedData =
                this.app.metadataCache.getFileCache(note) || {};
            let frontmatter =
                fileCachedData.frontmatter || <Record<string, any>>{};
            let tags = getAllTags(fileCachedData) || [];

            for (let tag of tags) {
                if (tag == this.data.settings.flashcardsTag) {
                    await this.findFlashcards(note, "#" + tag);
                    break;
                }
            }
        }

        this.statusBar.setText(
            `Review: ${this.dueNotesCount} notes, ${this.dueFlashcards.length} cards due`
        );
    }

    async findFlashcards(note: TFile, deck: string) {
        let fileText = await this.app.vault.read(note);
        let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        let headings = fileCachedData.headings || [];
        let fileChanged = false;

        let now = Date.now();
        // basic cards
        for (let regex of [SINGLELINE_CARD_REGEX, MULTILINE_CARD_REGEX]) {
            let cardType: CardType =
                regex == SINGLELINE_CARD_REGEX
                    ? CardType.SingleLineBasic
                    : CardType.MultiLineBasic;
            for (let match of fileText.matchAll(regex)) {
                match[0] = match[0].trim();
                match[1] = match[1].trim();
                match[2] = match[2].trim();
                let cardObj: Card;
                // flashcard already scheduled
                if (match[3]) {
                    let dueUnix: number = window
                        .moment(match[3], ["DD-MM-YYYY", "ddd MMM DD YYYY"])
                        .valueOf();
                    if (dueUnix <= now) {
                        cardObj = {
                            isDue: true,
                            interval: parseInt(match[4]),
                            ease: parseInt(match[5]),
                            note,
                            front: match[1],
                            back: match[2],
                            cardText: match[0],
                            context: "",
                            deck,
                            cardType,
                        };
                        this.dueFlashcards.push(cardObj);
                    } else continue;
                } else {
                    cardObj = {
                        isDue: false,
                        note,
                        front: match[1],
                        back: match[2],
                        cardText: match[0],
                        context: "",
                        cardType,
                        deck,
                    };
                    this.newFlashcards.push(cardObj);
                }

                addContextToCard(cardObj, match.index, headings);
            }
        }

        // cloze deletion cards
        for (let match of fileText.matchAll(CLOZE_CARD_DETECTOR)) {
            match[0] = match[0].trim();

            let cardText = match[0];
            let deletions = [...cardText.matchAll(CLOZE_DELETIONS_EXTRACTOR)];
            let scheduling = [...cardText.matchAll(CLOZE_SCHEDULING_EXTRACTOR)];

            // we have some extra scheduling dates to delete
            if (scheduling.length > deletions.length) {
                let idxSched = cardText.lastIndexOf("<!--SR:") + 7;
                let newCardText = cardText.substring(0, idxSched);
                for (let i = 0; i < deletions.length; i++)
                    newCardText += `!${scheduling[i][1]},${scheduling[i][2]},${scheduling[i][3]}`;
                newCardText += "-->\n";

                let replacementRegex = new RegExp(
                    cardText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), // escape string
                    "gm"
                );
                fileText = fileText.replace(replacementRegex, newCardText);
                fileChanged = true;
            }

            let relatedCards: Card[] = [];
            for (let i = 0; i < deletions.length; i++) {
                let cardObj: Card;

                let deletionStart = deletions[i].index;
                let deletionEnd = deletionStart + deletions[i][0].length;
                let front =
                    cardText.substring(0, deletionStart) +
                    "<span style='color:#2196f3'>[...]</span>" +
                    cardText.substring(deletionEnd);
                front = front.replace(/==/gm, "");
                let back =
                    cardText.substring(0, deletionStart) +
                    "<span style='color:#2196f3'>" +
                    cardText.substring(deletionStart, deletionEnd) +
                    "</span>" +
                    cardText.substring(deletionEnd);
                back = back.replace(/==/gm, "");

                // card deletion scheduled
                if (i < scheduling.length) {
                    let dueUnix: number = window
                        .moment(scheduling[i][1], "DD-MM-YYYY")
                        .valueOf();
                    if (dueUnix <= now) {
                        cardObj = {
                            isDue: true,
                            interval: parseInt(scheduling[i][2]),
                            ease: parseInt(scheduling[i][3]),
                            note,
                            front,
                            back,
                            cardText: match[0],
                            context: "",
                            deck,
                            cardType: CardType.Cloze,
                            clozeDeletionIdx: i,
                            relatedCards,
                        };

                        this.dueFlashcards.push(cardObj);
                    } else continue;
                } else {
                    // new card
                    cardObj = {
                        isDue: false,
                        note,
                        front,
                        back,
                        cardText: match[0],
                        context: "",
                        deck,
                        cardType: CardType.Cloze,
                        clozeDeletionIdx: i,
                        relatedCards,
                    };

                    this.newFlashcards.push(cardObj);
                }

                relatedCards.push(cardObj);
                addContextToCard(cardObj, match.index, headings);
            }
        }

        if (fileChanged) await this.app.vault.modify(note, fileText);
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

function addContextToCard(
    cardObj: Card,
    cardOffset: number,
    headings: HeadingCache[]
) {
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

    for (let headingObj of stack) cardObj.context += headingObj.heading + " > ";
    cardObj.context = cardObj.context.slice(0, -3);
}
