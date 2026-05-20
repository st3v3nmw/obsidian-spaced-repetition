import { App, TFile } from "obsidian";

import { FlashcardReviewMode } from "src/card/flashcard-review-sequencer";
import { QuestionPostponementList } from "src/card/questions/question-postponement-list";
import { Deck, DeckTreeFilter } from "src/deck/deck";
import { DeckTreeStatsCalculator } from "src/deck/deck-tree-stats-calculator";
import { Stats } from "src/deck/stats";
import { TopicPath } from "src/deck/topic-path";
import { CardDueDateHistogram } from "src/due-date-histogram";
import { ISRFile, SrTFile } from "src/file";
import { Note } from "src/note/note";
import { NoteFileLoader } from "src/note/note-file-loader";
import { SettingsUtil, SRSettings } from "src/settings";
import { globalDateProvider, IDayBoundary } from "src/utils/dates";
import { TextDirection } from "src/utils/strings";

export interface IOsrVaultEvents {
    dataChanged: () => void;
}

export class OsrCore {
    public defaultTextDirection: TextDirection;
    protected settings: SRSettings;
    private dataChangedHandler: () => void;
    private _questionPostponementList: QuestionPostponementList;

    private fullDeckTree: Deck;
    private _reviewableDeckTree: Deck = new Deck("root", null);
    private _remainingDeckTree: Deck;
    private _cardStats: Stats;
    private _dueDateFlashcardHistogram: CardDueDateHistogram;

    get remainingDeckTree(): Deck {
        return this._remainingDeckTree;
    }

    get reviewableDeckTree(): Deck {
        return this._reviewableDeckTree;
    }

    get questionPostponementList(): QuestionPostponementList {
        return this._questionPostponementList;
    }

    get dueDateFlashcardHistogram(): CardDueDateHistogram {
        return this._dueDateFlashcardHistogram;
    }

    get cardStats(): Stats {
        return this._cardStats;
    }

    init(
        questionPostponementList: QuestionPostponementList,
        settings: SRSettings,
        dataChangedHandler: () => void,
    ): void {
        this.settings = settings;
        this.dataChangedHandler = dataChangedHandler;
        this._questionPostponementList = questionPostponementList;
        this._dueDateFlashcardHistogram = new CardDueDateHistogram();
        try {
            const startOfDayElements: string[] = this.settings.startOfDay.split(":");
            if (startOfDayElements.length !== 3) {
                throw new Error("Invalid format for start of day");
            }
            const dayBoundary: IDayBoundary = {
                hour: parseInt(startOfDayElements[0]),
                minute: parseInt(startOfDayElements[1]),
                second: parseInt(startOfDayElements[2]),
            };
            globalDateProvider.setDayBoundary(dayBoundary);
        } catch (e) {
            console.error("Invalid format for start of day", e);
        }
    }

    protected loadInit(): void {
        // reset flashcards stuff
        this.fullDeckTree = new Deck("root", null);
    }

    protected async processFile(noteFile: ISRFile): Promise<void> {
        const tags = noteFile.getAllTagsFromCache();

        // Does the note contain any tags that are specified as flashcard tags in the settings
        // (Doing this check first saves us from loading and parsing the note if not necessary)
        const topicPath: TopicPath = this.findTopicPath(noteFile);
        if (topicPath.hasPath && !SettingsUtil.isAnyTagIgnoredForFlashcards(this.settings, tags)) {
            const note = await this.loadNote(noteFile, topicPath);
            if (note !== null) note.appendCardsToDeck(this.fullDeckTree);
        }
    }

    protected finalizeLoad(): void {
        // Reviewable cards are all except those with the "edit later" tag
        this._reviewableDeckTree = DeckTreeFilter.filterForReviewableCards(this.fullDeckTree);

        // sort the deck names
        this._reviewableDeckTree.sortSubdecksList();
        this._remainingDeckTree = DeckTreeFilter.filterForRemainingCards(
            this._questionPostponementList,
            this._reviewableDeckTree,
            FlashcardReviewMode.Review,
        );
        const calc: DeckTreeStatsCalculator = new DeckTreeStatsCalculator();
        this._cardStats = calc.calculate(this._reviewableDeckTree);

        // Generate the histogram for the due dates for all the cards
        this._dueDateFlashcardHistogram.calculateFromDeckTree(this._reviewableDeckTree);

        // Tell the interested party that the data has changed
        if (this.dataChangedHandler) this.dataChangedHandler();
    }

    async loadNote(noteFile: ISRFile, topicPath: TopicPath): Promise<Note | null> {
        const loader: NoteFileLoader = new NoteFileLoader(this.settings);
        const note: Note | null = await loader.load(noteFile, this.defaultTextDirection, topicPath);
        if (note !== null && note.hasChanged) {
            await note.writeNoteFile(this.settings);
        }
        return note;
    }

    private findTopicPath(note: ISRFile): TopicPath {
        return TopicPath.getTopicPathOfFile(note, this.settings);
    }
}

export class OsrAppCore extends OsrCore {
    private app: App;
    private _syncLock = false;

    get syncLock(): boolean {
        return this._syncLock;
    }

    constructor(app: App) {
        super();
        this.app = app;
    }

    async loadVault(): Promise<void> {
        if (this._syncLock) {
            return;
        }
        this._syncLock = true;

        try {
            this.loadInit();

            const notes: TFile[] = this.app.vault.getMarkdownFiles();
            for (const noteFile of notes) {
                if (SettingsUtil.isPathInNoteIgnoreFolder(this.settings, noteFile.path)) {
                    continue;
                }

                const file: SrTFile = this.createSrTFile(noteFile);
                await this.processFile(file);
            }

            this.finalizeLoad();
        } finally {
            this._syncLock = false;
        }
    }

    createSrTFile(note: TFile): SrTFile {
        return new SrTFile(this.app.vault, this.app.metadataCache, this.app.fileManager, note);
    }
}
