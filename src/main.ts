import {
    Notice,
    Plugin,
    addIcon,
    TFile,
    HeadingCache,
    getAllTags,
    FuzzySuggestModal,
    SuggestModal,
} from "obsidian";
import * as graph from "pagerank.js";
import { SRSettingTab, DEFAULT_SETTINGS, SRSettings } from "./settings";
import { Deck, FlashcardModal } from "./flashcard-modal";
import { StatsModal } from "./stats-modal";
import { ReviewQueueListView, REVIEW_QUEUE_VIEW_TYPE } from "./sidebar";
import { CardType, Card, ReviewResponse, schedule } from "./scheduling";
import {
    CROSS_HAIRS_ICON,
    SCHEDULING_INFO_REGEX,
    YAML_FRONT_MATTER_REGEX,
    CLOZE_CARD_DETECTOR,
    CLOZE_DELETIONS_EXTRACTOR,
    MULTI_SCHEDULING_EXTRACTOR,
    CODEBLOCK_REGEX,
    INLINE_CODE_REGEX,
} from "./constants";
import { escapeRegexString, cyrb53 } from "./utils";
import { ReviewDeck, ReviewDeckSelectionModal } from "./review-deck";

interface PluginData {
    settings: SRSettings;
    buryDate: string;
    // hashes of card texts
    // should work as long as user doesn't modify card's text
    // covers most of the cases
    buryList: string[];
}

const DEFAULT_DATA: PluginData = {
    settings: DEFAULT_SETTINGS,
    buryDate: "",
    buryList: [],
};

// Notes

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

    public reviewDecks: { [deckKey: string]: ReviewDeck } = {};
    public lastSelectedReviewDeck: string;

    public newNotes: TFile[] = [];
    public scheduledNotes: SchedNote[] = [];
    private easeByPath: Record<string, number> = {};
    private incomingLinks: Record<string, LinkStat[]> = {};
    private pageranks: Record<string, number> = {};
    private dueNotesCount: number = 0;
    public dueDatesNotes: Record<number, number> = {}; // Record<# of days in future, due count>

    public deckTree: Deck = new Deck("root", null);
    public dueDatesFlashcards: Record<number, number> = {}; // Record<# of days in future, due count>

    public singlelineCardRegex: RegExp;
    public multilineCardRegex: RegExp;

    // prevent calling these functions if another instance is already running
    private notesSyncLock: boolean = false;
    private flashcardsSyncLock: boolean = false;

    async onload() {
        await this.loadPluginData();

        addIcon("crosshairs", CROSS_HAIRS_ICON);

        this.statusBar = this.addStatusBarItem();
        this.statusBar.classList.add("mod-clickable");
        this.statusBar.setAttribute("aria-label", "Open a note for review");
        this.statusBar.setAttribute("aria-label-position", "top");
        this.statusBar.addEventListener("click", (_: any) => {
            if (!this.notesSyncLock) {
                this.sync();
                this.reviewNextNoteModal();
            }
        });

        this.singlelineCardRegex = new RegExp(
            `^(.+)${escapeRegexString(
                this.data.settings.singlelineCardSeparator
            )}(.+?)\\n?(?:<!--SR:(.+),(\\d+),(\\d+)-->|$)`,
            "gm"
        );

        this.multilineCardRegex = new RegExp(
            `^((?:.+\\n)+)${escapeRegexString(
                this.data.settings.multilineCardSeparator
            )}\\n((?:.+?\\n?)+?)(?:<!--SR:(.+),(\\d+),(\\d+)-->|$)`,
            "gm"
        );

        this.addRibbonIcon("crosshairs", "Review flashcards", async () => {
            if (!this.flashcardsSyncLock) {
                await this.flashcards_sync();
                new FlashcardModal(this.app, this).open();
            }
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
            id: "srs-note-review-open-note",
            name: "Open a note for review",
            callback: () => {
                if (!this.notesSyncLock) {
                    this.sync();
                    this.reviewNextNoteModal();
                }
            },
        });

        this.addCommand({
            id: "srs-note-review-easy",
            name: "Review note as easy",
            callback: () => {
                const openFile = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension == "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Easy);
            },
        });

        this.addCommand({
            id: "srs-note-review-good",
            name: "Review note as good",
            callback: () => {
                const openFile = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension == "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Good);
            },
        });

        this.addCommand({
            id: "srs-note-review-hard",
            name: "Review note as hard",
            callback: () => {
                const openFile = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension == "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Hard);
            },
        });

        this.addCommand({
            id: "srs-review-flashcards",
            name: "Review flashcards",
            callback: async () => {
                if (!this.flashcardsSyncLock) {
                    await this.flashcards_sync();
                    new FlashcardModal(this.app, this).open();
                }
            },
        });

        this.addCommand({
            id: "srs-view-stats",
            name: "View statistics",
            callback: () => {
                new StatsModal(this.app, this.dueDatesFlashcards).open();
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
        if (this.notesSyncLock) return;
        this.notesSyncLock = true;

        let notes = this.app.vault.getMarkdownFiles();

        graph.reset();
        this.scheduledNotes = [];
        this.easeByPath = {};
        this.newNotes = [];
        this.incomingLinks = {};
        this.pageranks = {};
        this.dueNotesCount = 0;
        this.dueDatesNotes = {};
        this.reviewDecks = {};

        let now: number = Date.now();
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

            let shouldIgnore: boolean = true;
            outer: for (let tag of tags) {
                for (let tagToReview of this.data.settings.tagsToReview) {
                    if (
                        tag == tagToReview ||
                        tag.startsWith(tagToReview + "/")
                    ) {
                        if (!this.reviewDecks.hasOwnProperty(tag)) {
                            this.reviewDecks[tag] = new ReviewDeck(tag);
                        }
                        shouldIgnore = false;
                        break outer;
                    }
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
                for (let tag of tags) {
                    if (this.reviewDecks.hasOwnProperty(tag)) {
                        this.reviewDecks[tag].newNotes.push(note);
                    }
                }
                this.newNotes.push(note);
                continue;
            }

            let dueUnix: number = window
                .moment(frontmatter["sr-due"], [
                    "YYYY-MM-DD",
                    "DD-MM-YYYY",
                    "ddd MMM DD YYYY",
                ])
                .valueOf();
            this.scheduledNotes.push({
                note,
                dueUnix,
            });
            for (let tag of tags) {
                if (this.reviewDecks.hasOwnProperty(tag)) {
                    this.reviewDecks[tag].scheduledNotes.push({note, dueUnix});
                }
            }

            this.easeByPath[note.path] = frontmatter["sr-ease"];

            if (dueUnix <= now) {
                this.dueNotesCount++;

                for (let tag of tags) {
                    if (this.reviewDecks.hasOwnProperty(tag)) {
                        this.reviewDecks[tag].dueNotesCount++;
                    }
                }
            }

            let nDays: number = Math.ceil((dueUnix - now) / (24 * 3600 * 1000));
            if (!this.dueDatesNotes.hasOwnProperty(nDays))
                this.dueDatesNotes[nDays] = 0;
            this.dueDatesNotes[nDays]++;

            for (let tag of tags) {
                if (this.reviewDecks.hasOwnProperty(tag)) {
                    let deck = this.reviewDecks[tag];
                    if (!deck.dueDatesNotes.hasOwnProperty(nDays))
                        deck.dueDatesNotes[nDays] = 0;
                    deck.dueDatesNotes[nDays]++;
                }
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

        for (let deckKey in this.reviewDecks) {
            if (this.reviewDecks.hasOwnProperty(deckKey)) {
                this.reviewDecks[deckKey].sortNotes(this.pageranks);
            }
        }

        let noteCountText = this.dueNotesCount == 1 ? "note" : "notes";
        let cardCountText =
            this.deckTree.dueFlashcardsCount == 1 ? "card" : "cards";
        this.statusBar.setText(
            `Review: ${this.dueNotesCount} ${noteCountText}, ${this.deckTree.dueFlashcardsCount} ${cardCountText} due`
        );
        this.reviewQueueView.redraw();

        this.notesSyncLock = false;
    }

    async saveReviewResponse(note: TFile, response: ReviewResponse) {
        let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        let frontmatter = fileCachedData.frontmatter || <Record<string, any>>{};

        let tags = getAllTags(fileCachedData) || [];
        let shouldIgnore: boolean = true;
        outer: for (let tag of tags) {
            for (let tagToReview of this.data.settings.tagsToReview) {
                if (tag == tagToReview || tag.startsWith(tagToReview + "/")) {
                    shouldIgnore = false;
                    break outer;
                }
            }
        }

        if (shouldIgnore) {
            new Notice(
                "Please tag the note appropriately for reviewing (in settings)."
            );
            return;
        }

        let fileText: string = await this.app.vault.read(note);
        let ease, interval, delayBeforeReview;
        let now: number = Date.now();
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

            for (let statObj of this.incomingLinks[note.path] || []) {
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
            delayBeforeReview = 0;
        } else {
            interval = frontmatter["sr-interval"];
            ease = frontmatter["sr-ease"];
            delayBeforeReview =
                now -
                window
                    .moment(frontmatter["sr-due"], [
                        "YYYY-MM-DD",
                        "DD-MM-YYYY",
                        "ddd MMM DD YYYY",
                    ])
                    .valueOf();
        }

        let schedObj = schedule(
            response,
            interval,
            ease,
            delayBeforeReview,
            this.data.settings,
            this.dueDatesNotes
        );
        interval = schedObj.interval;
        ease = schedObj.ease;

        let due = window.moment(now + interval * 24 * 3600 * 1000);
        let dueString = due.format("YYYY-MM-DD");

        // check if scheduling info exists
        if (SCHEDULING_INFO_REGEX.test(fileText)) {
            let schedulingInfo = SCHEDULING_INFO_REGEX.exec(fileText);
            fileText = fileText.replace(
                SCHEDULING_INFO_REGEX,
                `---\n${schedulingInfo[1]}sr-due: ${dueString}\nsr-interval: ${interval}\nsr-ease: ${ease}\n${schedulingInfo[5]}---`
            );
        } else if (YAML_FRONT_MATTER_REGEX.test(fileText)) {
            // new note with existing YAML front matter
            let existingYaml = YAML_FRONT_MATTER_REGEX.exec(fileText);
            fileText = fileText.replace(
                YAML_FRONT_MATTER_REGEX,
                `---\n${existingYaml[1]}sr-due: ${dueString}\nsr-interval: ${interval}\nsr-ease: ${ease}\n---`
            );
        } else {
            fileText = `---\nsr-due: ${dueString}\nsr-interval: ${interval}\nsr-ease: ${ease}\n---\n\n${fileText}`;
        }

        if (this.data.settings.burySiblingCards) {
            await this.findFlashcards(note, "", true); // bury all cards in current note
            await this.savePluginData();
        }
        await this.app.vault.modify(note, fileText);

        new Notice("Response received.");

        setTimeout(() => {
            if (!this.notesSyncLock) {
                this.sync();
                if (this.data.settings.autoNextNote) this.reviewNextNote(this.lastSelectedReviewDeck);
            }
        }, 500);
    }

    async reviewNextNoteModal() {
        let deckSelectionModal = new ReviewDeckSelectionModal(this.app, Object.keys(this.reviewDecks));
        deckSelectionModal.submitCallback = (deckKey: string) => this.reviewNextNote(deckKey);
        deckSelectionModal.open();
    }

    async reviewNextNote(deckKey: string) {
        if (!this.reviewDecks.hasOwnProperty(deckKey)) {
            new Notice("No deck exists for " + deckKey);
            return;
        }

        this.lastSelectedReviewDeck = deckKey;
        let deck = this.reviewDecks[deckKey];

        if (deck.dueNotesCount > 0) {
            let index = this.data.settings.openRandomNote
                ? Math.floor(Math.random() * deck.dueNotesCount)
                : 0;
            this.app.workspace.activeLeaf.openFile(
                deck.scheduledNotes[index].note
            );
            return;
        }

        if (deck.newNotes.length > 0) {
            let index = this.data.settings.openRandomNote
                ? Math.floor(Math.random() * deck.newNotes.length)
                : 0;
            this.app.workspace.activeLeaf.openFile(deck.newNotes[index]);
            return;
        }

        new Notice("You're done for the day :D.");
    }

    async flashcards_sync() {
        if (this.flashcardsSyncLock) return;
        this.flashcardsSyncLock = true;

        let notes = this.app.vault.getMarkdownFiles();

        this.deckTree = new Deck("root", null);
        this.dueDatesFlashcards = {};

        let todayDate = window.moment(Date.now()).format("YYYY-MM-DD");
        // clear list if we've changed dates
        if (todayDate != this.data.buryDate) {
            this.data.buryDate = todayDate;
            this.data.buryList = [];
            await this.savePluginData();
        }

        for (let note of notes) {
            if (this.data.settings.convertFoldersToDecks) {
                let path: string[] = note.path.split("/");
                path.pop(); // remove filename
                await this.findFlashcards(note, "#" + path.join("/"));
                continue;
            }

            let fileCachedData =
                this.app.metadataCache.getFileCache(note) || {};
            let frontmatter =
                fileCachedData.frontmatter || <Record<string, any>>{};
            let tags = getAllTags(fileCachedData) || [];

            outer: for (let tag of tags) {
                for (let tagToReview of this.data.settings.flashcardTags) {
                    if (
                        tag == tagToReview ||
                        tag.startsWith(tagToReview + "/")
                    ) {
                        await this.findFlashcards(note, tag);
                        break outer;
                    }
                }
            }
        }

        // sort the deck names
        this.deckTree.sortSubdecksList();

        let noteCountText: string = this.dueNotesCount == 1 ? "note" : "notes";
        let cardCountText: string =
            this.deckTree.dueFlashcardsCount == 1 ? "card" : "cards";
        this.statusBar.setText(
            `Review: ${this.dueNotesCount} ${noteCountText}, ${this.deckTree.dueFlashcardsCount} ${cardCountText} due`
        );

        this.flashcardsSyncLock = false;
    }

    async findFlashcards(
        note: TFile,
        deckPathStr: string,
        buryOnly: boolean = false
    ) {
        let fileText = await this.app.vault.read(note);
        let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        let headings = fileCachedData.headings || [];
        let fileChanged: boolean = false;

        let deckAdded: boolean = false;
        let deckPath: string[] = deckPathStr.substring(1).split("/");
        if (deckPath.length == 1 && deckPath[0] == "") deckPath = ["/"];

        // find all codeblocks
        let codeblocks: [number, number][] = [];
        for (let regex of [CODEBLOCK_REGEX, INLINE_CODE_REGEX]) {
            for (let match of fileText.matchAll(regex))
                codeblocks.push([match.index, match.index + match[0].length]);
        }

        let now = Date.now();
        // basic cards
        for (let regexBundled of <Array<[RegExp, CardType]>>[
            [this.singlelineCardRegex, CardType.SingleLineBasic],
            [this.multilineCardRegex, CardType.MultiLineBasic],
        ]) {
            let regex = regexBundled[0];
            let cardType: CardType = regexBundled[1];
            for (let match of fileText.matchAll(regex)) {
                if (
                    inCodeblock(match.index, match[0].trim().length, codeblocks)
                )
                    continue;

                let cardText: string = match[0].trim();
                let cardTextHash: string = cyrb53(cardText);

                if (buryOnly) {
                    this.data.buryList.push(cardTextHash);
                    continue;
                }

                if (!deckAdded) {
                    this.deckTree.createDeck([...deckPath]);
                    deckAdded = true;
                }

                let cardObj: Card;
                let front = match[1].trim();
                let back = match[2].trim();
                let context: string = this.data.settings.showContextInCards
                    ? getCardContext(match.index, headings)
                    : "";
                let lineNo: number = fileText
                    .substring(0, match.index)
                    .split("\n").length;
                // flashcard already scheduled
                if (match[3]) {
                    let dueUnix: number = window
                        .moment(match[3], [
                            "YYYY-MM-DD",
                            "DD-MM-YYYY",
                            "ddd MMM DD YYYY",
                        ])
                        .valueOf();
                    let nDays: number = Math.ceil(
                        (dueUnix - now) / (24 * 3600 * 1000)
                    );
                    if (!this.dueDatesFlashcards.hasOwnProperty(nDays))
                        this.dueDatesFlashcards[nDays] = 0;
                    this.dueDatesFlashcards[nDays]++;
                    if (this.data.buryList.includes(cardTextHash)) {
                        this.deckTree.countFlashcard([...deckPath]);
                        continue;
                    }

                    if (dueUnix <= now) {
                        cardObj = {
                            isDue: true,
                            interval: parseInt(match[4]),
                            ease: parseInt(match[5]),
                            delayBeforeReview: now - dueUnix,
                            note,
                            lineNo,
                            front,
                            back,
                            cardText,
                            context,
                            cardType,
                        };

                        this.deckTree.insertFlashcard([...deckPath], cardObj);
                    } else {
                        this.deckTree.countFlashcard([...deckPath]);
                        continue;
                    }
                } else {
                    cardObj = {
                        isDue: false,
                        note,
                        lineNo,
                        front,
                        back,
                        cardText,
                        context,
                        cardType,
                    };

                    this.deckTree.insertFlashcard([...deckPath], cardObj);
                }
            }
        }

        for (let regexBundled of <Array<[RegExp, CardType]>>[
            [CLOZE_CARD_DETECTOR, CardType.Cloze],
        ]) {
            let regex: RegExp = regexBundled[0];
            let cardType: CardType = regexBundled[1];

            if (
                cardType == CardType.Cloze &&
                this.data.settings.disableClozeCards
            )
                continue;

            for (let match of fileText.matchAll(regex)) {
                match[0] = match[0].trim();

                let cardText: string = match[0];
                let cardTextHash: string = cyrb53(cardText);

                if (buryOnly) {
                    this.data.buryList.push(cardTextHash);
                    continue;
                }

                if (!deckAdded) {
                    this.deckTree.createDeck([...deckPath]);
                    deckAdded = true;
                }

                let siblingMatches: RegExpMatchArray[] = [];
                for (let m of cardText.matchAll(CLOZE_DELETIONS_EXTRACTOR)) {
                    if (
                        inCodeblock(
                            match.index + m.index,
                            m[0].trim().length,
                            codeblocks
                        )
                    )
                        continue;
                    siblingMatches.push(m);
                }
                let scheduling: RegExpMatchArray[] = [
                    ...cardText.matchAll(MULTI_SCHEDULING_EXTRACTOR),
                ];

                // we have some extra scheduling dates to delete
                if (scheduling.length > siblingMatches.length) {
                    let idxSched = cardText.lastIndexOf("<!--SR:") + 7;
                    let newCardText = cardText.substring(0, idxSched);
                    for (let i = 0; i < siblingMatches.length; i++)
                        newCardText += `!${scheduling[i][1]},${scheduling[i][2]},${scheduling[i][3]}`;
                    newCardText += "-->\n";

                    let replacementRegex = new RegExp(
                        escapeRegexString(cardText),
                        "gm"
                    );
                    fileText = fileText.replace(replacementRegex, newCardText);
                    fileChanged = true;
                }

                let context: string = this.data.settings.showContextInCards
                    ? getCardContext(match.index, headings)
                    : "";
                let lineNo: number = fileText
                    .substring(0, match.index)
                    .split("\n").length;
                let siblings: Card[] = [];
                for (let i = 0; i < siblingMatches.length; i++) {
                    let cardObj: Card;

                    let deletionStart = siblingMatches[i].index;
                    let deletionEnd =
                        deletionStart + siblingMatches[i][0].length;
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
                            .moment(scheduling[i][1], [
                                "YYYY-MM-DD",
                                "DD-MM-YYYY",
                            ])
                            .valueOf();
                        let nDays: number = Math.ceil(
                            (dueUnix - now) / (24 * 3600 * 1000)
                        );
                        if (!this.dueDatesFlashcards.hasOwnProperty(nDays))
                            this.dueDatesFlashcards[nDays] = 0;
                        this.dueDatesFlashcards[nDays]++;
                        if (this.data.buryList.includes(cardTextHash)) {
                            this.deckTree.countFlashcard([...deckPath]);
                            continue;
                        }

                        if (dueUnix <= now) {
                            cardObj = {
                                isDue: true,
                                interval: parseInt(scheduling[i][2]),
                                ease: parseInt(scheduling[i][3]),
                                delayBeforeReview: now - dueUnix,
                                note,
                                lineNo,
                                front,
                                back,
                                cardText: match[0],
                                context,
                                cardType: CardType.Cloze,
                                siblingIdx: i,
                                siblings,
                            };

                            this.deckTree.insertFlashcard(
                                [...deckPath],
                                cardObj
                            );
                        } else {
                            this.deckTree.countFlashcard([...deckPath]);
                            continue;
                        }
                    } else {
                        if (this.data.buryList.includes(cyrb53(cardText))) {
                            this.deckTree.countFlashcard([...deckPath]);
                            continue;
                        }

                        // new card
                        cardObj = {
                            isDue: false,
                            note,
                            lineNo,
                            front,
                            back,
                            cardText: match[0],
                            context,
                            cardType: CardType.Cloze,
                            siblingIdx: i,
                            siblings,
                        };

                        this.deckTree.insertFlashcard([...deckPath], cardObj);
                    }

                    siblings.push(cardObj);
                }
            }
        }

        if (fileChanged) await this.app.vault.modify(note, fileText);
    }

    async loadPluginData() {
        this.data = Object.assign({}, DEFAULT_DATA, await this.loadData());
        this.data.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            this.data.settings
        );
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

function getCardContext(cardOffset: number, headings: HeadingCache[]): string {
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

    let context: string = "";
    for (let headingObj of stack) context += headingObj.heading + " > ";
    return context.slice(0, -3);
}

function inCodeblock(
    matchStart: number,
    matchLength: number,
    codeblocks: [number, number][]
) {
    for (let codeblock of codeblocks) {
        if (
            matchStart >= codeblock[0] &&
            matchStart + matchLength <= codeblock[1]
        )
            return true;
    }
    return false;
}
