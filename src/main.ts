import {
    Notice,
    Plugin,
    addIcon,
    TAbstractFile,
    TFile,
    HeadingCache,
    getAllTags,
    moment,
} from "obsidian";
import * as graph from "pagerank.js";
import { SRSettingTab, SRSettings, DEFAULT_SETTINGS } from "src/settings";
import { FlashcardModal, Deck } from "src/flashcard-modal";
import { StatsModal } from "src/stats-modal";
import { ReviewQueueListView, REVIEW_QUEUE_VIEW_TYPE } from "src/sidebar";
import { CardType, Card, ReviewResponse, schedule } from "src/scheduling";
import {
    CROSS_HAIRS_ICON,
    YAML_FRONT_MATTER_REGEX,
    SCHEDULING_INFO_REGEX,
    LEGACY_SCHEDULING_EXTRACTOR,
    CLOZE_CARD_DETECTOR,
    CLOZE_DELETIONS_EXTRACTOR,
    MULTI_SCHEDULING_EXTRACTOR,
    CODEBLOCK_REGEX,
    INLINE_CODE_REGEX,
} from "src/constants";
import { escapeRegexString, cyrb53 } from "src/utils";
import { t } from "src/lang/helpers";
import { Logger } from "src/logger";

interface PluginData {
    settings: SRSettings;
    buryDate: string;
    // hashes of card texts
    // should work as long as user doesn't modify card's text
    // which covers most of the cases
    buryList: string[];
    cache: Record<string, SRFileCache>; // Record<last known path, SRFileCache>
}

const DEFAULT_DATA: PluginData = {
    settings: DEFAULT_SETTINGS,
    buryDate: "",
    buryList: [],
    cache: {},
};

interface SRFileCache {
    totalCards: number;
    hasNewCards: boolean;
    nextDueDate: string;
    lastUpdated: number;
}

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
    public logger;

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

    async onload(): Promise<void> {
        await this.loadPluginData();
        this.logger = Logger(console, this.data.settings.logLevel);

        addIcon("crosshairs", CROSS_HAIRS_ICON);

        this.statusBar = this.addStatusBarItem();
        this.statusBar.classList.add("mod-clickable");
        this.statusBar.setAttribute("aria-label", t("Open a note for review"));
        this.statusBar.setAttribute("aria-label-position", "top");
        this.statusBar.addEventListener("click", (_: any) => {
            if (!this.notesSyncLock) {
                this.sync();
                this.reviewNextNote();
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

        this.addRibbonIcon("crosshairs", t("Review flashcards"), async () => {
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
                this.app.workspace.on(
                    "file-menu",
                    (menu, fileish: TAbstractFile) => {
                        if (
                            fileish instanceof TFile &&
                            fileish.extension === "md"
                        ) {
                            menu.addItem((item) => {
                                item.setTitle(t("Review: Easy"))
                                    .setIcon("crosshairs")
                                    .onClick((_) => {
                                        this.saveReviewResponse(
                                            fileish,
                                            ReviewResponse.Easy
                                        );
                                    });
                            });

                            menu.addItem((item) => {
                                item.setTitle(t("Review: Good"))
                                    .setIcon("crosshairs")
                                    .onClick((_) => {
                                        this.saveReviewResponse(
                                            fileish,
                                            ReviewResponse.Good
                                        );
                                    });
                            });

                            menu.addItem((item) => {
                                item.setTitle(t("Review: Hard"))
                                    .setIcon("crosshairs")
                                    .onClick((_) => {
                                        this.saveReviewResponse(
                                            fileish,
                                            ReviewResponse.Hard
                                        );
                                    });
                            });
                        }
                    }
                )
            );
        }

        this.addCommand({
            id: "srs-note-review-open-note",
            name: t("Open a note for review"),
            callback: () => {
                if (!this.notesSyncLock) {
                    this.sync();
                    this.reviewNextNote();
                }
            },
        });

        this.addCommand({
            id: "srs-note-review-easy",
            name: t("Review note as easy"),
            callback: () => {
                let openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Easy);
            },
        });

        this.addCommand({
            id: "srs-note-review-good",
            name: t("Review note as good"),
            callback: () => {
                let openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Good);
            },
        });

        this.addCommand({
            id: "srs-note-review-hard",
            name: t("Review note as hard"),
            callback: () => {
                let openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Hard);
            },
        });

        this.addCommand({
            id: "srs-review-flashcards",
            name: t("Review flashcards"),
            callback: async () => {
                if (!this.flashcardsSyncLock) {
                    await this.flashcards_sync();
                    new FlashcardModal(this.app, this).open();
                }
            },
        });

        this.addCommand({
            id: "srs-view-stats",
            name: t("View statistics"),
            callback: () => {
                new StatsModal(this.app, this.dueDatesFlashcards, this).open();
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

    async sync(): Promise<void> {
        if (this.notesSyncLock) return;
        this.notesSyncLock = true;

        let notes: TFile[] = this.app.vault.getMarkdownFiles();

        graph.reset();
        this.scheduledNotes = [];
        this.easeByPath = {};
        this.newNotes = [];
        this.incomingLinks = {};
        this.pageranks = {};
        this.dueNotesCount = 0;
        this.dueDatesNotes = {};

        let now: number = Date.now();
        for (let note of notes) {
            if (this.incomingLinks[note.path] === undefined)
                this.incomingLinks[note.path] = [];

            let links = this.app.metadataCache.resolvedLinks[note.path] || {};
            for (let targetPath in links) {
                if (this.incomingLinks[targetPath] === undefined)
                    this.incomingLinks[targetPath] = [];

                // markdown files only
                if (targetPath.split(".").pop()!.toLowerCase() === "md") {
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
                        tag === tagToReview ||
                        tag.startsWith(tagToReview + "/")
                    ) {
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
                this.newNotes.push(note);
                continue;
            }

            let dueUnix: number = moment(frontmatter["sr-due"], [
                "YYYY-MM-DD",
                "DD-MM-YYYY",
                "ddd MMM DD YYYY",
            ]).valueOf();
            this.scheduledNotes.push({
                note,
                dueUnix,
            });

            this.easeByPath[note.path] = frontmatter["sr-ease"];

            if (dueUnix <= now) this.dueNotesCount++;
            let nDays: number = Math.ceil((dueUnix - now) / (24 * 3600 * 1000));
            if (!this.dueDatesNotes.hasOwnProperty(nDays))
                this.dueDatesNotes[nDays] = 0;
            this.dueDatesNotes[nDays]++;
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
                let result: number = a.dueUnix - b.dueUnix;
                if (result !== 0) return result;
                return (
                    (this.pageranks[b.note.path] || 0) -
                    (this.pageranks[a.note.path] || 0)
                );
            }
        );

        let noteCountText: string =
            this.dueNotesCount === 1 ? t("note") : t("notes");
        let cardCountText: string =
            this.deckTree.dueFlashcardsCount === 1 ? t("card") : t("cards");
        this.statusBar.setText(
            t("Review") +
                `: ${this.dueNotesCount} ${noteCountText}, ` +
                `${this.deckTree.dueFlashcardsCount} ${cardCountText} ` +
                t("due")
        );
        this.reviewQueueView.redraw();

        this.notesSyncLock = false;
    }

    async saveReviewResponse(
        note: TFile,
        response: ReviewResponse
    ): Promise<void> {
        let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        let frontmatter = fileCachedData.frontmatter || <Record<string, any>>{};

        let tags = getAllTags(fileCachedData) || [];
        let shouldIgnore: boolean = true;
        outer: for (let tag of tags) {
            for (let tagToReview of this.data.settings.tagsToReview) {
                if (tag === tagToReview || tag.startsWith(tagToReview + "/")) {
                    shouldIgnore = false;
                    break outer;
                }
            }
        }

        if (shouldIgnore) {
            new Notice(
                t(
                    "Please tag the note appropriately for reviewing (in settings)."
                )
            );
            return;
        }

        let fileText: string = await this.app.vault.read(note);
        let ease: number,
            interval: number,
            delayBeforeReview: number,
            now: number = Date.now();
        // new note
        if (
            !(
                frontmatter.hasOwnProperty("sr-due") &&
                frontmatter.hasOwnProperty("sr-interval") &&
                frontmatter.hasOwnProperty("sr-ease")
            )
        ) {
            let linkTotal: number = 0,
                linkPGTotal: number = 0,
                totalLinkCount: number = 0;

            for (let statObj of this.incomingLinks[note.path] || []) {
                let ease: number = this.easeByPath[statObj.sourcePath];
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
                let ease: number = this.easeByPath[linkedFilePath];
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

            let linkContribution: number =
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
                moment(frontmatter["sr-due"], [
                    "YYYY-MM-DD",
                    "DD-MM-YYYY",
                    "ddd MMM DD YYYY",
                ]).valueOf();
        }

        let schedObj: Record<string, number> = schedule(
            response,
            interval,
            ease,
            delayBeforeReview,
            this.data.settings,
            this.dueDatesNotes
        );
        interval = schedObj.interval;
        ease = schedObj.ease;

        let due: moment.Moment = moment(now + interval * 24 * 3600 * 1000);
        let dueString: string = due.format("YYYY-MM-DD");

        // check if scheduling info exists
        if (SCHEDULING_INFO_REGEX.test(fileText)) {
            let schedulingInfo = SCHEDULING_INFO_REGEX.exec(fileText)!;
            fileText = fileText.replace(
                SCHEDULING_INFO_REGEX,
                `---\n${schedulingInfo[1]}sr-due: ${dueString}\n` +
                    `sr-interval: ${interval}\nsr-ease: ${ease}\n` +
                    `${schedulingInfo[5]}---`
            );
        } else if (YAML_FRONT_MATTER_REGEX.test(fileText)) {
            // new note with existing YAML front matter
            let existingYaml = YAML_FRONT_MATTER_REGEX.exec(fileText)!;
            fileText = fileText.replace(
                YAML_FRONT_MATTER_REGEX,
                `---\n${existingYaml[1]}sr-due: ${dueString}\n` +
                    `sr-interval: ${interval}\nsr-ease: ${ease}\n---`
            );
        } else
            fileText =
                `---\nsr-due: ${dueString}\nsr-interval: ${interval}\n` +
                `sr-ease: ${ease}\n---\n\n${fileText}`;

        if (this.data.settings.burySiblingCards) {
            await this.findFlashcards(note, [], true); // bury all cards in current note
            await this.savePluginData();
        }
        await this.app.vault.modify(note, fileText);

        new Notice(t("Response received."));

        setTimeout(() => {
            if (!this.notesSyncLock) {
                this.sync();
                if (this.data.settings.autoNextNote) this.reviewNextNote();
            }
        }, 500);
    }

    async reviewNextNote(): Promise<void> {
        if (this.dueNotesCount > 0) {
            let index: number = this.data.settings.openRandomNote
                ? Math.floor(Math.random() * this.dueNotesCount)
                : 0;
            this.app.workspace.activeLeaf.openFile(
                this.scheduledNotes[index].note
            );
            return;
        }

        if (this.newNotes.length > 0) {
            let index: number = this.data.settings.openRandomNote
                ? Math.floor(Math.random() * this.newNotes.length)
                : 0;
            this.app.workspace.activeLeaf.openFile(this.newNotes[index]);
            return;
        }

        new Notice(t("You're all caught up now :D."));
    }

    async flashcards_sync(): Promise<void> {
        if (this.flashcardsSyncLock) return;
        this.flashcardsSyncLock = true;

        let notes: TFile[] = this.app.vault.getMarkdownFiles();

        this.deckTree = new Deck("root", null);
        this.dueDatesFlashcards = {};

        let now: moment.Moment = moment(Date.now());
        let todayDate: string = now.format("YYYY-MM-DD");
        // clear list if we've changed dates
        if (todayDate !== this.data.buryDate) {
            this.data.buryDate = todayDate;
            this.data.buryList = [];
        }

        for (let note of notes) {
            // find deck path
            let deckPath: string[] = [];
            if (this.data.settings.convertFoldersToDecks) {
                deckPath = note.path.split("/");
                deckPath.pop(); // remove filename
                if (deckPath.length === 0) deckPath = ["/"];
            } else {
                let fileCachedData =
                    this.app.metadataCache.getFileCache(note) || {};
                let tags = getAllTags(fileCachedData) || [];

                outer: for (let tag of tags) {
                    for (let tagToReview of this.data.settings.flashcardTags) {
                        if (
                            tag === tagToReview ||
                            tag.startsWith(tagToReview + "/")
                        ) {
                            deckPath = tag.substring(1).split("/");
                            break outer;
                        }
                    }
                }
            }

            if (deckPath.length === 0) continue;

            if (this.data.cache.hasOwnProperty(note.path)) {
                let fileCache: SRFileCache = this.data.cache[note.path];
                // Has file changed?
                if (fileCache.lastUpdated === note.stat.mtime) {
                    if (fileCache.totalCards == 0) continue;
                    else if (
                        !fileCache.hasNewCards &&
                        now.valueOf() <
                            moment(
                                fileCache.nextDueDate,
                                "YYYY-MM-DD"
                            ).valueOf()
                    ) {
                        this.deckTree.createDeck([...deckPath]);
                        this.deckTree.countFlashcard(
                            deckPath,
                            fileCache.totalCards
                        );
                    } else await this.findFlashcards(note, deckPath);
                } else await this.findFlashcards(note, deckPath);
            } else await this.findFlashcards(note, deckPath);
        }
        this.logger.info(`Flashcard sync took ${Date.now() - now.valueOf()}ms`);
        await this.savePluginData();

        // sort the deck names
        this.deckTree.sortSubdecksList();

        let noteCountText: string =
            this.dueNotesCount === 1 ? t("note") : t("notes");
        let cardCountText: string =
            this.deckTree.dueFlashcardsCount === 1 ? t("card") : t("cards");
        this.statusBar.setText(
            t("Review") +
                `: ${this.dueNotesCount} ${noteCountText}, ` +
                `${this.deckTree.dueFlashcardsCount} ${cardCountText} ` +
                t("due")
        );

        this.flashcardsSyncLock = false;
    }

    async findFlashcards(
        note: TFile,
        deckPath: string[],
        buryOnly: boolean = false
    ): Promise<void> {
        let fileText: string = await this.app.vault.read(note);
        let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        let headings: HeadingCache[] = fileCachedData.headings || [];
        let fileChanged: boolean = false,
            deckAdded = false;

        // info. for caching
        let hasNewCards: boolean = false,
            totalCards: number = 0,
            nextDueDate: number = Infinity; // 03:14:07 UTC, January 19 2038 haha

        // Add newline to file with text
        // Cloze cards require a newline
        if (fileText.slice(-1) !== "\n" && fileText.length > 0) {
            fileText += "\n";
            fileChanged = true;
        }

        // find all codeblocks
        let codeblocks: [number, number][] = [];
        for (let regex of [CODEBLOCK_REGEX, INLINE_CODE_REGEX]) {
            for (let match of fileText.matchAll(regex))
                codeblocks.push([match.index!, match.index! + match[0].length]);
        }

        let now: number = Date.now();
        for (let regexBundled of <Array<[RegExp, CardType]>>[
            [this.singlelineCardRegex, CardType.SingleLineBasic],
            [this.multilineCardRegex, CardType.MultiLineBasic],
            [CLOZE_CARD_DETECTOR, CardType.Cloze],
        ]) {
            let regex: RegExp = regexBundled[0];
            let cardType: CardType = regexBundled[1];

            if (
                cardType === CardType.Cloze &&
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
                if (cardType == CardType.Cloze) {
                    for (let m of cardText.matchAll(
                        CLOZE_DELETIONS_EXTRACTOR
                    )) {
                        if (
                            inCodeblock(
                                match.index! + m.index!,
                                m[0].trim().length,
                                codeblocks
                            )
                        )
                            continue;
                        siblingMatches.push(m);
                    }
                } else siblingMatches.push(match);

                let scheduling: RegExpMatchArray[] = [
                    ...cardText.matchAll(MULTI_SCHEDULING_EXTRACTOR),
                ];
                if (scheduling.length == 0)
                    scheduling = [
                        ...cardText.matchAll(LEGACY_SCHEDULING_EXTRACTOR),
                    ];

                // we have some extra scheduling dates to delete
                if (scheduling.length > siblingMatches.length) {
                    let idxSched: number = cardText.lastIndexOf("<!--SR:") + 7;
                    let newCardText: string = cardText.substring(0, idxSched);
                    for (let i = 0; i < siblingMatches.length; i++)
                        newCardText += `!${scheduling[i][1]},${scheduling[i][2]},${scheduling[i][3]}`;
                    newCardText += "-->\n";

                    let replacementRegex = new RegExp(
                        escapeRegexString(cardText),
                        "gm"
                    );
                    fileText = fileText.replace(
                        replacementRegex,
                        (_) => newCardText
                    );
                    fileChanged = true;
                }

                let context: string = this.data.settings.showContextInCards
                    ? getCardContext(match.index!, headings)
                    : "";
                let lineNo: number = fileText
                    .substring(0, match.index!)
                    .split("\n").length;
                let siblings: Card[] = [];
                for (let i = 0; i < siblingMatches.length; i++) {
                    let cardObj: Card;

                    let front: string, back: string;
                    if (cardType == CardType.Cloze) {
                        let deletionStart: number = siblingMatches[i].index!,
                            deletionEnd: number =
                                deletionStart + siblingMatches[i][0].length;
                        front =
                            cardText.substring(0, deletionStart) +
                            "<span style='color:#2196f3'>[...]</span>" +
                            cardText.substring(deletionEnd);
                        front = front.replace(/==/gm, "");
                        back =
                            cardText.substring(0, deletionStart) +
                            "<span style='color:#2196f3'>" +
                            cardText.substring(deletionStart, deletionEnd) +
                            "</span>" +
                            cardText.substring(deletionEnd);
                        back = back.replace(/==/gm, "");
                    } else {
                        front = siblingMatches[i][1].trim();
                        back = siblingMatches[i][2].trim();
                    }

                    totalCards++;

                    // card scheduled
                    if (i < scheduling.length) {
                        let dueUnix: number = moment(scheduling[i][1], [
                            "YYYY-MM-DD",
                            "DD-MM-YYYY",
                        ]).valueOf();
                        if (dueUnix < nextDueDate) nextDueDate = dueUnix;
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
                                cardText,
                                context,
                                cardType,
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
                        if (!hasNewCards) hasNewCards = true;
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
                            cardText,
                            context,
                            cardType,
                            siblingIdx: i,
                            siblings,
                        };

                        this.deckTree.insertFlashcard([...deckPath], cardObj);
                    }

                    siblings.push(cardObj);
                }
            }
        }

        if (!buryOnly)
            this.data.cache[note.path] = {
                totalCards,
                hasNewCards,
                nextDueDate:
                    nextDueDate !== Infinity
                        ? moment(nextDueDate).format("YYYY-MM-DD")
                        : "",
                lastUpdated: note.stat.mtime,
            };

        if (fileChanged) await this.app.vault.modify(note, fileText);
    }

    async loadPluginData(): Promise<void> {
        this.data = Object.assign({}, DEFAULT_DATA, await this.loadData());
        this.data.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            this.data.settings
        );
    }

    async savePluginData(): Promise<void> {
        await this.saveData(this.data);
    }

    initView(): void {
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
): boolean {
    for (let codeblock of codeblocks) {
        if (
            matchStart >= codeblock[0] &&
            matchStart + matchLength <= codeblock[1]
        )
            return true;
    }
    return false;
}
