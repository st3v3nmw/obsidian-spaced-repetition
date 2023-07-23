import {
    Notice,
    Plugin,
    TAbstractFile,
    TFolder,
    TFile,
    HeadingCache,
    getAllTags,
    FrontMatterCache,
} from "obsidian";
import * as graph from "pagerank.js";

import { SRSettingTab, SRSettings, DEFAULT_SETTINGS, DataLocation } from "src/settings";
import { FlashcardModal, Deck } from "src/flashcard-modal-algo";
import { StatsModal, Stats } from "src/stats-modal";
import { ReviewQueueListView, REVIEW_QUEUE_VIEW_TYPE } from "src/sidebar";
import { Card, CardType, ReviewResponse, schedule } from "src/scheduling";
import {
    YAML_FRONT_MATTER_REGEX,
    SCHEDULING_INFO_REGEX,
    LEGACY_SCHEDULING_EXTRACTOR,
    MULTI_SCHEDULING_EXTRACTOR,
} from "src/constants";
import { escapeRegexString, cyrb53 } from "src/utils";
import { ReviewDeck, ReviewDeckSelectionModal } from "src/review-deck";
import { t } from "src/lang/helpers";
import { parse } from "src/parser";
import { appIcon } from "src/icons/appicon";

// https://github.com/martin-jw/obsidian-recall
import { DataStore } from "./data";
import Commands from "./commands";
import SrsAlgorithm from "./algorithms";
import { algorithms } from "src/settings";
import { reviewNoteResponseModal } from "./modals/reviewresponse-modal";
import { DateUtils } from "./utils_recall";

interface PluginData {
    settings: SRSettings;
    buryDate: string;
    // hashes of card texts
    // should work as long as user doesn't modify card's text
    // which covers most of the cases
    buryList: string[];
    historyDeck: string | null;
}

const DEFAULT_DATA: PluginData = {
    settings: DEFAULT_SETTINGS,
    buryDate: "",
    buryList: [],
    historyDeck: null,
};

export interface SchedNote {
    note: TFile;
    dueUnix: number;
}

export interface LinkStat {
    sourcePath: string;
    linkCount: number;
}

export default class SRPlugin extends Plugin {
    private statusBar: HTMLElement;
    private reviewQueueView: ReviewQueueListView;
    public data: PluginData;
    public syncLock = false;

    public reviewDecks: { [deckKey: string]: ReviewDeck } = {};
    public lastSelectedReviewDeck: string;

    public newNotes: TFile[] = [];
    public scheduledNotes: SchedNote[] = [];
    public easeByPath: Record<string, number> = {};
    private incomingLinks: Record<string, LinkStat[]> = {};
    private pageranks: Record<string, number> = {};
    public newNotesCount = 0;
    public dueNotesCount = 0;
    public dueNotesCount_real = 0;
    public shortestInterval = 0;
    public dueDatesNotes: Record<number, number> = {}; // Record<# of days in future, due count>

    public deckTree: Deck = new Deck("root", null);
    public dueDatesFlashcards: Record<number, number> = {}; // Record<# of days in future, due count>
    public cardStats: Stats;

    // https://github.com/martin-jw/obsidian-recall/blob/main/src/main.ts
    public store: DataStore;
    public commands: Commands;
    public algorithm: SrsAlgorithm;
    public reviewNoteFloatBar: reviewNoteResponseModal;

    async onload(): Promise<void> {
        await this.loadPluginData();

        appIcon();

        this.algorithm = algorithms[this.data.settings.algorithm];
        this.algorithm.updateSettings(
            this,
            this.data.settings.algorithmSettings[this.data.settings.algorithm]
        );

        this.store.buildQueue();
        this.commands = new Commands(this);
        this.commands.addCommands();
        if (this.data.settings.showDebugMessages) {
            this.commands.addDebugCommands();
        }

        this.reviewNoteFloatBar = new reviewNoteResponseModal(this);

        this.registerTrackFileEvents();

        if (this.data.settings.dataLocation != DataLocation.SaveOnNoteFile) {
            // save tracked_files.json
            this.registerInterval(
                window.setInterval(() => (this.sync(), this.store.save()), 5 * 60 * 1000)
            );
        }

        this.statusBar = this.addStatusBarItem();
        this.statusBar.classList.add("mod-clickable");
        this.statusBar.setAttribute("aria-label", t("OPEN_NOTE_FOR_REVIEW"));
        this.statusBar.setAttribute("aria-label-position", "top");
        this.statusBar.addEventListener("click", async () => {
            if (!this.syncLock) {
                await this.sync();
                this.reviewNextNoteModal();
            }
        });

        this.addRibbonIcon("SpacedRepIcon", t("REVIEW_CARDS"), async () => {
            if (!this.syncLock) {
                await this.sync();
                new FlashcardModal(this.app, this).open();
            }
        });

        if (!this.data.settings.disableFileMenuReviewOptions) {
            this.registerEvent(
                this.app.workspace.on("file-menu", (menu, fileish: TAbstractFile) => {
                    if (fileish instanceof TFile && fileish.extension === "md") {
                        menu.addItem((item) => {
                            item.setTitle(t("REVIEW_EASY_FILE_MENU"))
                                .setIcon("SpacedRepIcon")
                                .onClick(() => {
                                    this.saveReviewResponse(fileish, ReviewResponse.Easy);
                                });
                        });

                        menu.addItem((item) => {
                            item.setTitle(t("REVIEW_GOOD_FILE_MENU"))
                                .setIcon("SpacedRepIcon")
                                .onClick(() => {
                                    this.saveReviewResponse(fileish, ReviewResponse.Good);
                                });
                        });

                        menu.addItem((item) => {
                            item.setTitle(t("REVIEW_HARD_FILE_MENU"))
                                .setIcon("SpacedRepIcon")
                                .onClick(() => {
                                    this.saveReviewResponse(fileish, ReviewResponse.Hard);
                                });
                        });
                    }

                    if (fileish instanceof TFolder) {
                        const folder = fileish as TFolder;

                        menu.addItem((item) => {
                            item.setIcon("plus-with-circle");
                            item.setTitle("Track All Notes");
                            item.onClick((_evt) => {
                                this.store.trackFilesInFolder(folder);
                            });
                        });

                        menu.addItem((item) => {
                            item.setIcon("minus-with-circle");
                            item.setTitle("Untrack All Notes");
                            item.onClick((_evt) => {
                                this.store.untrackFilesInFolder(folder);
                            });
                        });
                    } else if (fileish instanceof TFile) {
                        if (this.store.isTracked(fileish.path)) {
                            menu.addItem((item) => {
                                item.setIcon("minus-with-circle");
                                item.setTitle("Untrack Note");
                                item.onClick(async (_evt) => {
                                    this.store.untrackFile(fileish.path);
                                    if (
                                        this.reviewNoteFloatBar.isDisplay() &&
                                        this.data.settings.autoNextNote
                                    ) {
                                        if (!this.syncLock) {
                                            await this.sync();
                                        }
                                        this.reviewNextNote(this.lastSelectedReviewDeck);
                                    }
                                });
                            });
                        } else {
                            menu.addItem((item) => {
                                item.setIcon("plus-with-circle");
                                item.setTitle("Track Note");
                                item.onClick((_evt) => {
                                    this.store.trackFile(
                                        fileish.path,
                                        this.store.getDefaultDackName()
                                    );
                                });
                            });
                        }
                    }
                })
            );
        }

        this.addCommand({
            id: "srs-note-review-open-note",
            name: t("OPEN_NOTE_FOR_REVIEW"),
            callback: async () => {
                if (!this.syncLock) {
                    await this.sync();
                    this.reviewNextNoteModal();
                }
            },
        });

        this.addCommand({
            id: "srs-note-review-easy",
            name: t("REVIEW_NOTE_EASY_CMD"),
            callback: () => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md") {
                    this.saveReviewResponse(openFile, ReviewResponse.Easy);
                }
            },
        });

        this.addCommand({
            id: "srs-note-review-good",
            name: t("REVIEW_NOTE_GOOD_CMD"),
            callback: () => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md") {
                    this.saveReviewResponse(openFile, ReviewResponse.Good);
                }
            },
        });

        this.addCommand({
            id: "srs-note-review-hard",
            name: t("REVIEW_NOTE_HARD_CMD"),
            callback: () => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md") {
                    this.saveReviewResponse(openFile, ReviewResponse.Hard);
                }
            },
        });

        this.addCommand({
            id: "srs-review-flashcards",
            name: t("REVIEW_ALL_CARDS"),
            callback: async () => {
                if (!this.syncLock) {
                    await this.sync();
                    new FlashcardModal(this.app, this).open();
                }
            },
        });

        this.addCommand({
            id: "srs-cram-flashcards",
            name: t("CRAM_ALL_CARDS"),
            callback: async () => {
                await this.sync(true);
                new FlashcardModal(this.app, this, true).open();
            },
        });

        this.addCommand({
            id: "srs-review-flashcards-in-note",
            name: t("REVIEW_CARDS_IN_NOTE"),
            callback: async () => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md") {
                    this.deckTree = new Deck("root", null);
                    const deckPath: string[] = this.findDeckPath(openFile);
                    await this.findFlashcardsInNote(openFile, deckPath);
                    new FlashcardModal(this.app, this).open();
                }
            },
        });

        this.addCommand({
            id: "srs-cram-flashcards-in-note",
            name: t("CRAM_CARDS_IN_NOTE"),
            callback: async () => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md") {
                    this.deckTree = new Deck("root", null);
                    const deckPath: string[] = this.findDeckPath(openFile);
                    await this.findFlashcardsInNote(openFile, deckPath, false, true);
                    new FlashcardModal(this.app, this, true).open();
                }
            },
        });

        this.addCommand({
            id: "srs-view-stats",
            name: t("VIEW_STATS"),
            callback: async () => {
                if (!this.syncLock) {
                    await this.sync();
                    new StatsModal(this.app, this).open();
                }
            },
        });

        this.addSettingTab(new SRSettingTab(this.app, this));

        this.app.workspace.onLayoutReady(() => {
            this.initView();
            setTimeout(async () => {
                if (!this.syncLock) {
                    await this.sync();
                }
            }, 2000);
        });
    }

    onunload(): void {
        console.log("Unloading Obsidian Recall. Saving tracked files...");
        this.store.save();
        this.app.workspace.getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE).forEach((leaf) => leaf.detach());
        console.log("tracked files saved.");
    }

    async sync(ignoreStats = false): Promise<void> {
        if (this.syncLock) {
            return;
        }
        this.syncLock = true;

        // reset notes stuff
        graph.reset();
        this.easeByPath = {};
        this.incomingLinks = {};
        this.pageranks = {};
        this.newNotesCount = 0;
        this.dueNotesCount = 0;
        this.dueDatesNotes = {};
        this.reviewDecks = {};

        // reset flashcards stuff
        this.deckTree = new Deck("root", null);
        this.dueDatesFlashcards = {};
        this.cardStats = {
            eases: {},
            intervals: {},
            newCount: 0,
            youngCount: 0,
            matureCount: 0,
        };

        const now = window.moment(Date.now());
        const todayDate: string = now.format("YYYY-MM-DD");
        // clear bury list if we've changed dates
        if (todayDate !== this.data.buryDate) {
            this.data.buryDate = todayDate;
            this.data.buryList = [];
            this.store.data.toDayAllQueue = {};
            this.store.data.toDayLatterQueue = {};
        }

        const notes: TFile[] = this.app.vault.getMarkdownFiles();
        for (const note of notes) {
            if (
                this.data.settings.noteFoldersToIgnore.some((folder) =>
                    // note.path.startsWith(folder)
                    note.path.contains(folder)
                )
            ) {
                continue;
            }

            if (this.incomingLinks[note.path] === undefined) {
                this.incomingLinks[note.path] = [];
            }

            const links = this.app.metadataCache.resolvedLinks[note.path] || {};
            for (const targetPath in links) {
                if (this.incomingLinks[targetPath] === undefined)
                    this.incomingLinks[targetPath] = [];

                // markdown files only
                if (targetPath.split(".").pop().toLowerCase() === "md") {
                    this.incomingLinks[targetPath].push({
                        sourcePath: note.path,
                        linkCount: links[targetPath],
                    });

                    graph.link(note.path, targetPath, links[targetPath]);
                }
            }

            const deckPath: string[] = this.findDeckPath(note);
            if (deckPath.length !== 0) {
                const flashcardsInNoteAvgEase: number = await this.findFlashcardsInNote(
                    note,
                    deckPath,
                    false,
                    ignoreStats
                );

                if (flashcardsInNoteAvgEase > 0) {
                    this.easeByPath[note.path] = flashcardsInNoteAvgEase;
                }
            }

            const fileCachedData = this.app.metadataCache.getFileCache(note) || {};

            const frontmatter: FrontMatterCache | Record<string, unknown> =
                fileCachedData.frontmatter || {};
            const tags = getAllTags(fileCachedData) || [];

            let shouldIgnore = true;
            const matchedNoteTags = [];

            for (const tagToReview of this.data.settings.tagsToReview) {
                if (tags.some((tag) => tag === tagToReview || tag.startsWith(tagToReview + "/"))) {
                    if (!Object.prototype.hasOwnProperty.call(this.reviewDecks, tagToReview)) {
                        this.reviewDecks[tagToReview] = new ReviewDeck(tagToReview);
                    }
                    matchedNoteTags.push(tagToReview);
                    shouldIgnore = false;
                    break;
                }
            }
            if (shouldIgnore) {
                continue;
            }

            // update single note deck data, only tagged reviewnote
            if (this.data.settings.dataLocation !== DataLocation.SaveOnNoteFile) {
                if (!this.store.isTracked(note.path)) {
                    this.store.trackFile(note.path, matchedNoteTags[0]);
                }
                if (
                    Object.prototype.hasOwnProperty.call(frontmatter, "sr-due") &&
                    Object.prototype.hasOwnProperty.call(frontmatter, "sr-interval") &&
                    Object.prototype.hasOwnProperty.call(frontmatter, "sr-ease")
                ) {
                    // file has scheduling information
                    const dueUnix: number = window
                        .moment(frontmatter["sr-due"], [
                            "YYYY-MM-DD",
                            "DD-MM-YYYY",
                            "ddd MMM DD YYYY",
                        ])
                        .valueOf();

                    const interval = frontmatter["sr-interval"] as number;
                    const ease = frontmatter["sr-ease"] as number;
                    const sched = [null, dueUnix, interval, ease];
                    this.store.syncheadertoDataItems(note, sched);
                    // this.deleteNoteSchedulingHeader(note);
                }

                this.store.syncRCDataToSRrevDeck(this.reviewDecks[matchedNoteTags[0]], note);
                continue;
            }
            // file has no scheduling information
            if (
                !(
                    Object.prototype.hasOwnProperty.call(frontmatter, "sr-due") &&
                    Object.prototype.hasOwnProperty.call(frontmatter, "sr-interval") &&
                    Object.prototype.hasOwnProperty.call(frontmatter, "sr-ease")
                )
            ) {
                for (const matchedNoteTag of matchedNoteTags) {
                    this.reviewDecks[matchedNoteTag].newNotes.push(note);
                    this.newNotesCount++;
                }
                continue;
            }

            // file has scheduling information
            const dueUnix: number = window
                .moment(frontmatter["sr-due"], ["YYYY-MM-DD", "DD-MM-YYYY", "ddd MMM DD YYYY"])
                .valueOf();

            for (const matchedNoteTag of matchedNoteTags) {
                this.reviewDecks[matchedNoteTag].scheduledNotes.push({ note, dueUnix });
                if (dueUnix <= now.valueOf()) {
                    this.reviewDecks[matchedNoteTag].dueNotesCount++;
                }
            }

            if (Object.prototype.hasOwnProperty.call(this.easeByPath, note.path)) {
                this.easeByPath[note.path] =
                    (this.easeByPath[note.path] + frontmatter["sr-ease"]) / 2;
            } else {
                this.easeByPath[note.path] = frontmatter["sr-ease"];
            }

            if (dueUnix <= now.valueOf()) {
                this.dueNotesCount++;
            }

            const nDays: number = Math.ceil((dueUnix - now.valueOf()) / (24 * 3600 * 1000));
            if (!Object.prototype.hasOwnProperty.call(this.dueDatesNotes, nDays)) {
                this.dueDatesNotes[nDays] = 0;
            }
            this.dueDatesNotes[nDays]++;
        }

        graph.rank(0.85, 0.000001, (node: string, rank: number) => {
            this.pageranks[node] = rank * 10000;
        });

        // Add Recall reviewnote deck
        if (this.data.settings.dataLocation != DataLocation.SaveOnNoteFile) {
            const dkname = this.store.getDefaultDackName();
            if (!Object.prototype.hasOwnProperty.call(this.reviewDecks, dkname)) {
                this.reviewDecks[dkname] = new ReviewDeck(dkname);
            }
            this.store.syncRCsrsDataToSRreviewDecks(this.reviewDecks[dkname]);
            this.savePluginData();
        }

        // sort the deck names
        this.deckTree.sortSubdecksList();
        if (this.data.settings.showDebugMessages) {
            console.log(`SR: ${t("EASES")}`, this.easeByPath);
            console.log(`SR: ${t("DECKS")}`, this.deckTree);
            console.log(`SR: NOTE ${t("DECKS")}`, this.reviewDecks);
            console.log(`SR: this.dueDatesNotes`, this.dueDatesNotes);
        }

        for (const deckKey in this.reviewDecks) {
            this.reviewDecks[deckKey].sortNotes(this.pageranks);
        }

        if (this.data.settings.showDebugMessages) {
            console.log(
                "SR: " +
                    t("SYNC_TIME_TAKEN", {
                        t: Date.now() - now.valueOf(),
                    })
            );
        }

        this.dueNotesCount_real = Object.keys(this.store.data.toDayAllQueue).length;
        this.statusBar.setText(
            t("STATUS_BAR", {
                dueNotesCount: this.dueNotesCount_real,
                dueFlashcardsCount: this.deckTree.dueFlashcardsCount,
            })
        );

        if (this.data.settings.enableNoteReviewPaneOnStartup) this.reviewQueueView.redraw();
        this.syncLock = false;
    }

    async saveReviewResponse(note: TFile, response: ReviewResponse): Promise<void> {
        const fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        const frontmatter: FrontMatterCache | Record<string, unknown> =
            fileCachedData.frontmatter || {};

        const tags = getAllTags(fileCachedData) || [];
        if (this.data.settings.noteFoldersToIgnore.some((folder) => note.path.startsWith(folder))) {
            new Notice(t("NOTE_IN_IGNORED_FOLDER"));
            return;
        }

        let shouldIgnore = true;
        let matchedNoteTag: string;
        for (const tag of tags) {
            if (
                this.data.settings.tagsToReview.some(
                    (tagToReview) =>
                        tag === (matchedNoteTag = tagToReview) || tag.startsWith(tagToReview + "/")
                )
            ) {
                shouldIgnore = false;
                // matchedNoteTag =  tagToReview;
                break;
            }
        }

        if (
            (shouldIgnore && this.data.settings.dataLocation === DataLocation.SaveOnNoteFile) ||
            (this.data.settings.dataLocation != DataLocation.SaveOnNoteFile &&
                !this.store.isTracked(note.path))
        ) {
            new Notice(t("PLEASE_TAG_NOTE"));
            return;
        }

        let fileText: string = await this.app.vault.read(note);
        let ease: number, interval: number, delayBeforeReview: number;
        const now: number = Date.now();
        // new note
        const fileId = this.store.getFileId(note.path);
        if (
            !(
                Object.prototype.hasOwnProperty.call(frontmatter, "sr-due") &&
                Object.prototype.hasOwnProperty.call(frontmatter, "sr-interval") &&
                Object.prototype.hasOwnProperty.call(frontmatter, "sr-ease")
            ) ||
            (this.data.settings.dataLocation != DataLocation.SaveOnNoteFile &&
                this.store.isNewAdd(fileId) >= 0)
        ) {
            // 新笔记，没有复习过的
            let linkTotal = 0,
                linkPGTotal = 0,
                totalLinkCount = 0;

            for (const statObj of this.incomingLinks[note.path] || []) {
                const ease: number = this.easeByPath[statObj.sourcePath];
                if (ease) {
                    linkTotal += statObj.linkCount * this.pageranks[statObj.sourcePath] * ease;
                    linkPGTotal += this.pageranks[statObj.sourcePath] * statObj.linkCount;
                    totalLinkCount += statObj.linkCount;
                }
            }

            const outgoingLinks = this.app.metadataCache.resolvedLinks[note.path] || {};
            for (const linkedFilePath in outgoingLinks) {
                const ease: number = this.easeByPath[linkedFilePath];
                if (ease) {
                    linkTotal +=
                        outgoingLinks[linkedFilePath] * this.pageranks[linkedFilePath] * ease;
                    linkPGTotal += this.pageranks[linkedFilePath] * outgoingLinks[linkedFilePath];
                    totalLinkCount += outgoingLinks[linkedFilePath];
                }
            }

            const linkContribution: number =
                this.data.settings.maxLinkFactor *
                Math.min(1.0, Math.log(totalLinkCount + 0.5) / Math.log(64));
            ease =
                (1.0 - linkContribution) * this.data.settings.baseEase +
                (totalLinkCount > 0
                    ? (linkContribution * linkTotal) / linkPGTotal
                    : linkContribution * this.data.settings.baseEase);
            // add note's average flashcard ease if available
            if (Object.prototype.hasOwnProperty.call(this.easeByPath, note.path)) {
                ease = (ease + this.easeByPath[note.path]) / 2;
            }
            ease = Math.round(ease);
            interval = 1.0;
            delayBeforeReview = 0;
        } else {
            // reviewedNote update
            interval = frontmatter["sr-interval"];
            ease = frontmatter["sr-ease"];
            delayBeforeReview =
                now -
                window
                    .moment(frontmatter["sr-due"], ["YYYY-MM-DD", "DD-MM-YYYY", "ddd MMM DD YYYY"])
                    .valueOf();
        }

        // reviewedNote update
        if (this.data.settings.dataLocation != DataLocation.SaveOnNoteFile) {
            if (this.store.isNewAdd(this.store.getFileId(note.path)) < 0) {
                let due: number;
                [, due, interval, ease] = this.store.getReviewNoteHeaderData(note.path);
                delayBeforeReview = due === 0 ? 0 : now - due; //just in case.
            }
        }

        //根据当前状态参数及反馈的选项，更新数据
        const schedObj: Record<string, number> = schedule(
            response,
            interval,
            ease,
            delayBeforeReview,
            this.data.settings,
            this.dueDatesNotes
        );
        interval = schedObj.interval;
        ease = schedObj.ease;

        const due = window.moment(now + interval * 24 * 3600 * 1000);
        const dueString: string = due.format("YYYY-MM-DD");
        let deleteheader = false;

        // check if scheduling info exists
        if (SCHEDULING_INFO_REGEX.test(fileText)) {
            deleteheader = true;
            const schedulingInfo = SCHEDULING_INFO_REGEX.exec(fileText);
            fileText = fileText.replace(
                SCHEDULING_INFO_REGEX,
                `---\n${schedulingInfo[1]}sr-due: ${dueString}\n` +
                    `sr-interval: ${interval}\nsr-ease: ${ease}\n` +
                    `${schedulingInfo[5]}---`
            );
        } else if (YAML_FRONT_MATTER_REGEX.test(fileText)) {
            // new note with existing YAML front matter
            const existingYaml = YAML_FRONT_MATTER_REGEX.exec(fileText);
            fileText = fileText.replace(
                YAML_FRONT_MATTER_REGEX,
                `---\n${existingYaml[1]}sr-due: ${dueString}\n` +
                    `sr-interval: ${interval}\nsr-ease: ${ease}\n---`
            );
        } else {
            fileText =
                `---\nsr-due: ${dueString}\nsr-interval: ${interval}\n` +
                `sr-ease: ${ease}\n---\n\n${fileText}`;
        }

        if (this.data.settings.burySiblingCards) {
            await this.findFlashcardsInNote(note, [], true); // bury all cards in current note
            await this.savePluginData();
        }

        // save changes
        if (this.data.settings.dataLocation === DataLocation.SaveOnNoteFile) {
            await this.app.vault.modify(note, fileText);
            await this.sync();
        } else if (fileId > -1) {
            this.deleteNoteSchedulingHeader(note, deleteheader);
            this.store.reviewId(fileId, response.toString());

            await this.store.save();

            //Sync update
            this.singleNoteSyncQueue(this, note, delayBeforeReview);
        }

        if (!this.lastSelectedReviewDeck) {
            this.lastSelectedReviewDeck = matchedNoteTag;
        }

        new Notice(t("RESPONSE_RECEIVED"));

        if (this.data.settings.autoNextNote) {
            this.reviewNextNote(this.lastSelectedReviewDeck);
        }
    }

    async saveReviewResponsebyAlgo(note: TFile, response: string): Promise<void> {
        const fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        const frontmatter: FrontMatterCache | Record<string, unknown> =
            fileCachedData.frontmatter || {};

        const tags = getAllTags(fileCachedData) || [];
        if (this.data.settings.noteFoldersToIgnore.some((folder) => note.path.startsWith(folder))) {
            new Notice(t("NOTE_IN_IGNORED_FOLDER"));
            return;
        }

        let shouldIgnore = true;
        let matchedNoteTag: string;
        for (const tag of tags) {
            if (
                this.data.settings.tagsToReview.some(
                    (tagToReview) =>
                        tag === (matchedNoteTag = tagToReview) || tag.startsWith(tagToReview + "/")
                )
            ) {
                shouldIgnore = false;
                // matchedNoteTag =  tagToReview;
                break;
            }
        }

        if (
            (shouldIgnore && this.data.settings.dataLocation === DataLocation.SaveOnNoteFile) ||
            (this.data.settings.dataLocation != DataLocation.SaveOnNoteFile &&
                !this.store.isTracked(note.path))
        ) {
            new Notice(t("PLEASE_TAG_NOTE"));
            return;
        }

        const fileText: string = await this.app.vault.read(note);
        let ease: number, interval: number, delayBeforeReview: number;
        const now: number = Date.now();
        // new note
        const fileId = this.store.getFileId(note.path);
        if (
            !(
                Object.prototype.hasOwnProperty.call(frontmatter, "sr-due") &&
                Object.prototype.hasOwnProperty.call(frontmatter, "sr-interval") &&
                Object.prototype.hasOwnProperty.call(frontmatter, "sr-ease")
            ) ||
            (this.data.settings.dataLocation != DataLocation.SaveOnNoteFile &&
                this.store.isNewAdd(fileId) >= 0)
        ) {
            // 新笔记，没有复习过的
            let linkTotal = 0,
                linkPGTotal = 0,
                totalLinkCount = 0;

            for (const statObj of this.incomingLinks[note.path] || []) {
                const ease: number = this.easeByPath[statObj.sourcePath];
                if (ease) {
                    linkTotal += statObj.linkCount * this.pageranks[statObj.sourcePath] * ease;
                    linkPGTotal += this.pageranks[statObj.sourcePath] * statObj.linkCount;
                    totalLinkCount += statObj.linkCount;
                }
            }

            const outgoingLinks = this.app.metadataCache.resolvedLinks[note.path] || {};
            for (const linkedFilePath in outgoingLinks) {
                const ease: number = this.easeByPath[linkedFilePath];
                if (ease) {
                    linkTotal +=
                        outgoingLinks[linkedFilePath] * this.pageranks[linkedFilePath] * ease;
                    linkPGTotal += this.pageranks[linkedFilePath] * outgoingLinks[linkedFilePath];
                    totalLinkCount += outgoingLinks[linkedFilePath];
                }
            }

            const linkContribution: number =
                this.data.settings.maxLinkFactor *
                Math.min(1.0, Math.log(totalLinkCount + 0.5) / Math.log(64));
            ease =
                (1.0 - linkContribution) * this.data.settings.baseEase +
                (totalLinkCount > 0
                    ? (linkContribution * linkTotal) / linkPGTotal
                    : linkContribution * this.data.settings.baseEase);
            // add note's average flashcard ease if available
            if (Object.prototype.hasOwnProperty.call(this.easeByPath, note.path)) {
                ease = (ease + this.easeByPath[note.path]) / 2;
            }
            ease = Math.round(ease);
            interval = 1.0;
            delayBeforeReview = 0;
        } else {
            // reviewedNote update
            interval = frontmatter["sr-interval"];
            ease = frontmatter["sr-ease"];
            delayBeforeReview =
                now -
                window
                    .moment(frontmatter["sr-due"], ["YYYY-MM-DD", "DD-MM-YYYY", "ddd MMM DD YYYY"])
                    .valueOf();
        }

        // reviewedNote update
        if (this.data.settings.dataLocation != DataLocation.SaveOnNoteFile) {
            if (this.store.isNewAdd(this.store.getFileId(note.path)) < 0) {
                const [, due, ,] = this.store.getReviewNoteHeaderData(note.path);
                delayBeforeReview = due === 0 ? 0 : now - due; //just in case.
            }
        }

        //根据当前状态参数及反馈的选项，更新数据
        this.store.reviewId(fileId, response);
        let deleteheader = false;

        // check if scheduling info exists
        if (SCHEDULING_INFO_REGEX.test(fileText)) {
            deleteheader = true;
        }
        if (this.data.settings.burySiblingCards) {
            await this.findFlashcardsInNote(note, [], true); // bury all cards in current note
            await this.savePluginData();
        }

        // save changes
        if (this.data.settings.dataLocation !== DataLocation.SaveOnNoteFile) {
            this.deleteNoteSchedulingHeader(note, deleteheader);

            const [, due, ,] = this.store.getReviewNoteHeaderData(note.path);

            //Sync update
            this.singleNoteSyncQueue(this, note, delayBeforeReview);
        }

        const nowToday: number =
            Math.ceil(Date.now() / DateUtils.DAYS_TO_MILLIS) * DateUtils.DAYS_TO_MILLIS;
        const item = this.store.getItembyID(fileId);
        if (
            Object.keys(this.store.data.toDayLatterQueue).length > 0 &&
            item.nextReview <= nowToday
        ) {
            if (
                this.shortestInterval === 0 ||
                this.shortestInterval < now ||
                this.shortestInterval > item.nextReview
            ) {
                console.debug(
                    "interval diff:should be - (",
                    this.shortestInterval - item.nextReview
                );
                this.shortestInterval = item.nextReview;
            }
        } else {
            this.shortestInterval = 0;
        }

        if (!this.lastSelectedReviewDeck) {
            this.lastSelectedReviewDeck = matchedNoteTag;
        }

        new Notice(t("RESPONSE_RECEIVED"));

        if (this.data.settings.autoNextNote) {
            this.reviewNextNote(this.lastSelectedReviewDeck);
        }
    }

    async reviewNextNoteModal(): Promise<void> {
        const reviewDeckNames: string[] = Object.keys(this.reviewDecks);
        if (this.data.settings.reviewingNoteDirectly) {
            const rdname = this.getDeckNameForReviewDirectly();
            this.reviewNextNote(rdname);
        } else if (reviewDeckNames.length === 1) {
            this.reviewNextNote(reviewDeckNames[0]);
        } else {
            //这里导致弹出选标签, 有浮栏可以评分然后下篇，这个就没有什么影响了
            const deckSelectionModal = new ReviewDeckSelectionModal(this.app, reviewDeckNames);
            deckSelectionModal.submitCallback = (deckKey: string) => this.reviewNextNote(deckKey);
            deckSelectionModal.open();
        }
    }

    async reviewNextNote(deckKey: string): Promise<void> {
        if (!Object.prototype.hasOwnProperty.call(this.reviewDecks, deckKey)) {
            new Notice(t("NO_DECK_EXISTS", { deckName: deckKey }));
            return;
        }

        this.lastSelectedReviewDeck = deckKey;
        const deck = this.reviewDecks[deckKey];
        let show = false;
        let path = null;
        let index = -1;

        if (deck.dueNotesCount > 0) {
            index = this.getNextDueNoteIndex(deck, deck.dueNotesCount);
        }
        if (index >= 0) {
            await this.app.workspace.getLeaf().openFile(deck.scheduledNotes[index].note);
            path = deck.scheduledNotes[index].note.path;
            show = true;
            // return;
        } else if (deck.newNotes.length > 0) {
            const index = this.data.settings.openRandomNote
                ? Math.floor(Math.random() * deck.newNotes.length)
                : 0;
            this.app.workspace.getLeaf().openFile(deck.newNotes[index]);
            path = deck.newNotes[index].path;
            show = true;
            // return;
        }
        if (show) {
            // reviewedNote update interval
            const fid = this.store.getFileId(path);
            const item = this.store.data.items[fid];
            // this.reviewNoteFloatBar.algoDisplay(show, this.store.calcReviewInterval(fid));
            this.reviewNoteFloatBar.algoDisplay(show, this.algorithm.calcAllOptsIntervals(item));

            return;
        }
        const queue = this.store.data.toDayAllQueue;
        const len = Object.keys(queue).length;
        this.dueNotesCount_real = len;
        if (
            this.data.settings.reviewingNoteDirectly &&
            this.dueNotesCount_real + this.newNotesCount > 0
        ) {
            const rdname: string = this.getDeckNameForReviewDirectly();
            this.reviewNextNote(rdname);
            return;
        }

        if (Object.keys(this.store.data.toDayLatterQueue).length > 0 && this.shortestInterval > 0) {
            const now = Date.now();
            const interval = Math.round((this.shortestInterval - now) / 1000 / 60);
            new Notice("可以在" + interval + "分钟后来复习");
        }

        this.statusBar.setText(
            t("STATUS_BAR", {
                dueNotesCount: this.dueNotesCount_real,
                dueFlashcardsCount: this.deckTree.dueFlashcardsCount,
            })
        );

        this.reviewNoteFloatBar.selfDestruct();
        this.reviewQueueView.redraw();
        new Notice(t("ALL_CAUGHT_UP"));
    }

    findDeckPath(note: TFile): string[] {
        let deckPath: string[] = [];
        if (this.data.settings.convertFoldersToDecks) {
            deckPath = note.path.split("/");
            deckPath.pop(); // remove filename
            if (deckPath.length === 0) {
                deckPath = ["/"];
            }
        } else {
            const fileCachedData = this.app.metadataCache.getFileCache(note) || {};
            const tags = getAllTags(fileCachedData) || [];

            outer: for (const tagToReview of this.data.settings.flashcardTags) {
                for (const tag of tags) {
                    if (tag === tagToReview || tag.startsWith(tagToReview + "/")) {
                        deckPath = tag.substring(1).split("/");
                        break outer;
                    }
                }
            }
            if (
                deckPath.length === 0 &&
                this.data.settings.dataLocation !== DataLocation.SaveOnNoteFile &&
                this.data.settings.trackedNoteToDecks &&
                (this.store.isTaged(note, "note") || this.store.isTrackedCardfile(note.path))
            ) {
                deckPath = note.path.split("/");
                deckPath.pop(); // remove filename
                if (deckPath.length === 0) {
                    deckPath = ["/"];
                }
            }
        }

        return deckPath;
    }

    async findFlashcardsInNote(
        note: TFile,
        deckPath: string[],
        buryOnly = false,
        ignoreStats = false
    ): Promise<number> {
        let fileText: string = await this.app.vault.read(note);
        const fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        const headings: HeadingCache[] = fileCachedData.headings || [];
        let fileChanged = false,
            totalNoteEase = 0,
            scheduledCount = 0;
        const settings: SRSettings = this.data.settings;
        const noteDeckPath = deckPath;

        const now: number = Date.now();
        const parsedCards: [CardType, string, number][] = parse(
            fileText,
            settings.singleLineCardSeparator,
            settings.singleLineReversedCardSeparator,
            settings.multilineCardSeparator,
            settings.multilineReversedCardSeparator,
            settings.convertHighlightsToClozes,
            settings.convertBoldTextToClozes,
            settings.convertCurlyBracketsToClozes
        );
        for (const parsedCard of parsedCards) {
            deckPath = noteDeckPath;
            const cardType: CardType = parsedCard[0],
                lineNo: number = parsedCard[2];
            let cardText: string = parsedCard[1];

            if (cardText.includes(settings.editLaterTag)) {
                continue;
            }

            if (!settings.convertFoldersToDecks) {
                const tagInCardRegEx = /^#[^\s#]+/gi;
                const cardDeckPath = cardText
                    .match(tagInCardRegEx)
                    ?.slice(-1)[0]
                    .replace("#", "")
                    .split("/");
                if (cardDeckPath) {
                    deckPath = cardDeckPath;
                    cardText = cardText.replaceAll(tagInCardRegEx, "");
                }
            }

            this.deckTree.createDeck([...deckPath]);

            let cardTextHash: string = cyrb53(cardText);

            if (buryOnly) {
                this.data.buryList.push(cardTextHash);
                continue;
            }

            const siblingMatches: [string, string][] = [];
            if (cardType === CardType.Cloze) {
                const siblings: RegExpMatchArray[] = [];
                if (settings.convertHighlightsToClozes) {
                    siblings.push(...cardText.matchAll(/==(.*?)==/gm));
                }
                if (settings.convertBoldTextToClozes) {
                    siblings.push(...cardText.matchAll(/\*\*(.*?)\*\*/gm));
                }
                if (settings.convertCurlyBracketsToClozes) {
                    siblings.push(...cardText.matchAll(/{{(.*?)}}/gm));
                }
                siblings.sort((a, b) => {
                    if (a.index < b.index) {
                        return -1;
                    }
                    if (a.index > b.index) {
                        return 1;
                    }
                    return 0;
                });

                let front: string, back: string;
                for (const m of siblings) {
                    const deletionStart: number = m.index,
                        deletionEnd: number = deletionStart + m[0].length;
                    front =
                        cardText.substring(0, deletionStart) +
                        "<span style='color:#2196f3'>[...]</span>" +
                        cardText.substring(deletionEnd);
                    front = front
                        .replace(/==/gm, "")
                        .replace(/\*\*/gm, "")
                        .replace(/{{/gm, "")
                        .replace(/}}/gm, "");
                    back =
                        cardText.substring(0, deletionStart) +
                        "<span style='color:#2196f3'>" +
                        cardText.substring(deletionStart, deletionEnd) +
                        "</span>" +
                        cardText.substring(deletionEnd);
                    back = back
                        .replace(/==/gm, "")
                        .replace(/\*\*/gm, "")
                        .replace(/{{/gm, "")
                        .replace(/}}/gm, "");
                    siblingMatches.push([front, back]);
                }
            } else {
                let idx: number;
                if (cardType === CardType.SingleLineBasic) {
                    idx = cardText.indexOf(settings.singleLineCardSeparator);
                    siblingMatches.push([
                        cardText.substring(0, idx),
                        cardText.substring(idx + settings.singleLineCardSeparator.length),
                    ]);
                } else if (cardType === CardType.SingleLineReversed) {
                    idx = cardText.indexOf(settings.singleLineReversedCardSeparator);
                    const side1: string = cardText.substring(0, idx),
                        side2: string = cardText.substring(
                            idx + settings.singleLineReversedCardSeparator.length
                        );
                    siblingMatches.push([side1, side2]);
                    siblingMatches.push([side2, side1]);
                } else if (cardType === CardType.MultiLineBasic) {
                    idx = cardText.indexOf("\n" + settings.multilineCardSeparator + "\n");
                    siblingMatches.push([
                        cardText.substring(0, idx),
                        cardText.substring(idx + 2 + settings.multilineCardSeparator.length),
                    ]);
                } else if (cardType === CardType.MultiLineReversed) {
                    idx = cardText.indexOf("\n" + settings.multilineReversedCardSeparator + "\n");
                    const side1: string = cardText.substring(0, idx),
                        side2: string = cardText.substring(
                            idx + 2 + settings.multilineReversedCardSeparator.length
                        );
                    siblingMatches.push([side1, side2]);
                    siblingMatches.push([side2, side1]);
                }
            }

            let scheduling: RegExpMatchArray[] = [...cardText.matchAll(MULTI_SCHEDULING_EXTRACTOR)];
            if (scheduling.length === 0)
                scheduling = [...cardText.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];

            // we have some extra scheduling dates to delete
            if (scheduling.length > siblingMatches.length) {
                const idxSched: number = cardText.lastIndexOf("<!--SR:") + 7;
                let newCardText: string = cardText.substring(0, idxSched);
                for (let i = 0; i < siblingMatches.length; i++)
                    newCardText += `!${scheduling[i][1]},${scheduling[i][2]},${scheduling[i][3]}`;
                newCardText += "-->";

                const replacementRegex = new RegExp(escapeRegexString(cardText), "gm");
                fileText = fileText.replace(replacementRegex, () => newCardText);
                fileChanged = true;
                scheduling.splice(siblingMatches.length, scheduling.length - siblingMatches.length);
            }

            //update scheduling by recall
            if (settings.dataLocation !== DataLocation.SaveOnNoteFile) {
                if (scheduling.length) {
                    // delete scheduling infos in note file.
                    const idxSched: number = cardText.lastIndexOf("<!--SR:");
                    const newCardText: string = cardText.substring(0, idxSched);
                    const replacementRegex = new RegExp(escapeRegexString(cardText), "gm");
                    fileText = fileText.replace(replacementRegex, () => newCardText);
                    fileChanged = true;
                    cardTextHash = cyrb53(newCardText);
                }
                this.store.syncTrackfileCardSched(
                    note,
                    lineNo,
                    cardTextHash,
                    siblingMatches.length,
                    scheduling
                );
            }
            const context: string = settings.showContextInCards
                ? getCardContext(lineNo, headings, note.basename)
                : "";
            const siblings: Card[] = [];
            for (let i = 0; i < siblingMatches.length; i++) {
                const front: string = siblingMatches[i][0].trim(),
                    back: string = siblingMatches[i][1].trim();

                const cardObj: Card = {
                    isDue: i < scheduling.length,
                    note,
                    lineNo,
                    front,
                    back,
                    cardText,
                    context,
                    cardType,
                    siblingIdx: i,
                    siblings,
                    editLater: false,
                };

                // card scheduled
                if (ignoreStats) {
                    this.cardStats.newCount++;
                    cardObj.isDue = true;
                    this.deckTree.insertFlashcard([...deckPath], cardObj);
                } else if (i < scheduling.length) {
                    const dueUnix: number = window
                        .moment(scheduling[i][1], ["YYYY-MM-DD", "DD-MM-YYYY"])
                        .valueOf();
                    const nDays: number = Math.ceil((dueUnix - now) / (24 * 3600 * 1000));
                    if (!Object.prototype.hasOwnProperty.call(this.dueDatesFlashcards, nDays)) {
                        this.dueDatesFlashcards[nDays] = 0;
                    }
                    this.dueDatesFlashcards[nDays]++;

                    const interval: number = parseInt(scheduling[i][2]),
                        ease: number = parseInt(scheduling[i][3]);
                    if (!Object.prototype.hasOwnProperty.call(this.cardStats.intervals, interval)) {
                        this.cardStats.intervals[interval] = 0;
                    }
                    this.cardStats.intervals[interval]++;
                    if (!Object.prototype.hasOwnProperty.call(this.cardStats.eases, ease)) {
                        this.cardStats.eases[ease] = 0;
                    }
                    this.cardStats.eases[ease]++;
                    totalNoteEase += ease;
                    scheduledCount++;

                    if (interval >= 32) {
                        this.cardStats.matureCount++;
                    } else {
                        this.cardStats.youngCount++;
                    }

                    if (this.data.buryList.includes(cardTextHash)) {
                        this.deckTree.countFlashcard([...deckPath]);
                        continue;
                    }

                    if (dueUnix <= now) {
                        cardObj.interval = interval;
                        cardObj.ease = ease;
                        cardObj.delayBeforeReview = now - dueUnix;
                        this.deckTree.insertFlashcard([...deckPath], cardObj);
                    } else {
                        this.deckTree.countFlashcard([...deckPath]);
                        continue;
                    }
                } else {
                    this.cardStats.newCount++;
                    if (this.data.buryList.includes(cyrb53(cardText))) {
                        this.deckTree.countFlashcard([...deckPath]);
                        continue;
                    }
                    this.deckTree.insertFlashcard([...deckPath], cardObj);
                }

                siblings.push(cardObj);
            }
        }

        if (fileChanged) {
            await this.app.vault.modify(note, fileText);
        }

        if (scheduledCount > 0) {
            const flashcardsInNoteAvgEase: number = totalNoteEase / scheduledCount;
            const flashcardContribution: number = Math.min(
                1.0,
                Math.log(scheduledCount + 0.5) / Math.log(64)
            );
            return (
                flashcardsInNoteAvgEase * flashcardContribution +
                settings.baseEase * (1.0 - flashcardContribution)
            );
        }

        return 0;
    }

    async loadPluginData(): Promise<void> {
        this.data = Object.assign({}, DEFAULT_DATA, await this.loadData());
        this.data.settings = Object.assign({}, DEFAULT_SETTINGS, this.data.settings);
        this.store = new DataStore(this);
        await this.store.load();
    }

    async savePluginData(): Promise<void> {
        await this.saveData(this.data);
        await this.store.save();
    }

    initView(): void {
        this.registerView(
            REVIEW_QUEUE_VIEW_TYPE,
            (leaf) => (this.reviewQueueView = new ReviewQueueListView(leaf, this))
        );

        if (
            this.data.settings.enableNoteReviewPaneOnStartup &&
            app.workspace.getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE).length == 0
        ) {
            this.app.workspace.getRightLeaf(false).setViewState({
                type: REVIEW_QUEUE_VIEW_TYPE,
                active: true,
            });
        }
    }

    async deleteNoteSchedulingHeader(note: TFile, deleteheader: boolean) {
        // delete yaml schedule
        if (!deleteheader) {
            return;
        }
        let fileText: string = await this.app.vault.read(note);
        if (SCHEDULING_INFO_REGEX.test(fileText)) {
            const schedulingInfo = SCHEDULING_INFO_REGEX.exec(fileText);
            if (schedulingInfo[1].length || schedulingInfo[5].length) {
                fileText = fileText.replace(
                    SCHEDULING_INFO_REGEX,
                    `---\n${schedulingInfo[1]}` + `${schedulingInfo[5]}---`
                );
            } else {
                fileText = fileText.replace(SCHEDULING_INFO_REGEX, ``);
            }
            await this.app.vault.modify(note, fileText);
        }
    }

    singleNoteSyncQueue(plugin: SRPlugin, note: TFile, delayBeforeReview: number) {
        if (!this.lastSelectedReviewDeck) {
            this.lastSelectedReviewDeck = this.store.getTrackedFile(note.path).tags[0];
        }
        const deck = plugin.reviewDecks[plugin.lastSelectedReviewDeck];
        const now = Date.now();
        if (delayBeforeReview === 0) {
            // isNew
            deck.newNotes.remove(note);
            plugin.newNotesCount--;
        } else {
            //isDued
            const index = deck.scheduledNotes.findIndex((sNote, _index) => {
                return sNote.note === note;
            });
            deck.scheduledNotes.splice(index, 1);
            if (deck.dueNotesCount > 0) {
                deck.dueNotesCount--;
                plugin.dueNotesCount--;
            }
        }
        plugin.store.syncRCDataToSRrevDeck(deck, note, now);
        deck.sortNotes(plugin.pageranks);

        this.dueNotesCount_real = Object.keys(this.store.data.toDayAllQueue).length;
        this.statusBar.setText(
            t("STATUS_BAR", {
                dueNotesCount: this.dueNotesCount_real,
                dueFlashcardsCount: this.deckTree.dueFlashcardsCount,
            })
        );
    }

    getDeckNameForReviewDirectly(): string {
        // this.lastSelectedReviewDeck = null;
        const reviewDeckNames: string[] = Object.keys(this.reviewDecks);
        let ind = null;
        let rdname = this.lastSelectedReviewDeck;
        let ndeck: ReviewDeck;
        let ncount = 0;

        if (this.lastSelectedReviewDeck != null && Object.keys(this.reviewDecks).includes(rdname)) {
            ndeck = this.reviewDecks[rdname];
            ncount = ndeck.dueNotesCount + ndeck.newNotes.length;
            if (ncount > 0) {
                return this.lastSelectedReviewDeck;
            }
        }

        do {
            rdname = reviewDeckNames[Math.round(Math.random() * (reviewDeckNames.length - 1))];
            ndeck = this.reviewDecks[rdname];
            ncount = ndeck.dueNotesCount + ndeck.newNotes.length;

            ind = reviewDeckNames.lastIndexOf(rdname);
            reviewDeckNames.splice(ind, 1);
        } while (ncount === 0 && reviewDeckNames.length);
        return rdname;
    }

    getNextDueNoteIndex(deck: ReviewDeck, NotesCount: number) {
        let index = 0;
        let isDue = false;
        const queue = this.store.data.toDayAllQueue;
        const queueLatter = this.store.data.toDayLatterQueue;
        const len = Object.keys(queue).length;
        this.dueNotesCount_real = len;

        if (len === 0) {
            deck.dueNotesCount = 0;
            return -1;
        }
        if (!this.data.settings.openRandomNote) {
            for (let i = 0; i < NotesCount; i++) {
                const note = deck.scheduledNotes[(index = i)].note;
                const fileid = this.store.getFileId(note.path);
                if (
                    Object.prototype.hasOwnProperty.call(queue, fileid) &&
                    !Object.prototype.hasOwnProperty.call(queueLatter, fileid)
                ) {
                    isDue = true;
                    break;
                }
            }
        } else {
            const indArr = Array.from(new Array(NotesCount).keys());
            do {
                index = indArr[Math.round(Math.random() * (indArr.length - 1))];
                const note = deck.scheduledNotes[index].note;
                const fileid = this.store.getFileId(note.path);
                if (
                    Object.prototype.hasOwnProperty.call(queue, fileid) ||
                    !Object.prototype.hasOwnProperty.call(queueLatter, fileid)
                ) {
                    isDue = true;
                }
                indArr.splice(indArr.indexOf(index), 1);
            } while (!isDue && indArr.length > 0);
        }
        if (!isDue) {
            deck.dueNotesCount = 0;
            index = -1;
        }
        if (!isDue && Object.values(queue).includes(deck.deckName)) {
            Object.keys(queue).forEach((key) => {
                const id = Number(key);
                if (queue[id] === deck.deckName) {
                    delete this.store.data.toDayAllQueue[id];
                }
            });
        }

        return index;
    }

    registerTrackFileEvents() {
        this.registerEvent(
            this.app.vault.on("rename", (file, old) => {
                this.store.renameTrackedFile(old, file.path);
            })
        );

        this.registerEvent(
            this.app.vault.on("delete", (file) => {
                this.store.untrackFile(file.path);
            })
        );

        this.registerEvent(
            this.app.vault.on("modify", async (file: TFile) => {
                if (file.extension === "md") {
                    if (this.data.settings.dataLocation === DataLocation.SaveOnNoteFile) {
                        return;
                    }
                    if (this.store.isTrackedCardfile(file.path)) {
                        if (
                            (this.data.settings.trackedNoteToDecks &&
                                this.store.isTaged(file, "all")) ||
                            (this.data.settings.trackedNoteToDecks &&
                                this.store.isTaged(file, "card"))
                        ) {
                            await this.store.syncNoteCardsIndex(file);
                        }
                    }
                }
            })
        );
    }
}

function getCardContext(cardLine: number, headings: HeadingCache[], note_title: string): string {
    const stack: HeadingCache[] = [];
    for (const heading of headings) {
        if (heading.position.start.line > cardLine) {
            break;
        }

        while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
            stack.pop();
        }

        stack.push(heading);
    }

    let context = `${note_title} > `;
    for (const headingObj of stack) {
        headingObj.heading = headingObj.heading.replace(/\[\^\d+\]/gm, "").trim();
        context += `${headingObj.heading} > `;
    }
    return context.slice(0, -3);
}
