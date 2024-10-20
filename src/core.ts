import { App, TFile } from "obsidian";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import { IOsrVaultNoteLinkInfoFinder } from "src/algorithms/osr/obsidian-vault-notelink-info-finder";
import { OsrNoteGraph } from "src/algorithms/osr/osr-note-graph";
import { DataStoreAlgorithm } from "src/data-store-algorithm/data-store-algorithm";
import { Deck, DeckTreeFilter } from "src/deck";
import { DeckTreeStatsCalculator } from "src/deck-tree-stats-calculator";
import { CardDueDateHistogram, NoteDueDateHistogram } from "src/due-date-histogram";
import { ISRFile, SrTFile } from "src/file";
import { FlashcardReviewMode } from "src/flashcard-review-sequencer";
import { Note } from "src/note";
import { NoteFileLoader } from "src/note-file-loader";
import { NoteReviewQueue } from "src/note-review-queue";
import { QuestionPostponementList } from "src/question-postponement-list";
import { SettingsUtil, SRSettings } from "src/settings";
import { Stats } from "src/stats";
import { TopicPath } from "src/topic-path";
import { globalDateProvider } from "src/utils/dates";
import { TextDirection } from "src/utils/strings";

export interface IOsrVaultEvents {
    dataChanged: () => void;
}

export class OsrCore {
    public defaultTextDirection: TextDirection;
    protected settings: SRSettings;
    private dataChangedHandler: () => void;
    protected osrNoteGraph: OsrNoteGraph;
    private osrNoteLinkInfoFinder: IOsrVaultNoteLinkInfoFinder;
    private _questionPostponementList: QuestionPostponementList;
    private _noteReviewQueue: NoteReviewQueue;

    private fullDeckTree: Deck;
    private _reviewableDeckTree: Deck = new Deck("root", null);
    private _remainingDeckTree: Deck;
    private _cardStats: Stats;
    private _dueDateFlashcardHistogram: CardDueDateHistogram;
    private _dueDateNoteHistogram: NoteDueDateHistogram;

    get noteReviewQueue(): NoteReviewQueue {
        return this._noteReviewQueue;
    }

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

    get dueDateNoteHistogram(): NoteDueDateHistogram {
        return this._dueDateNoteHistogram;
    }

    get cardStats(): Stats {
        return this._cardStats;
    }

    init(
        questionPostponementList: QuestionPostponementList,
        osrNoteLinkInfoFinder: IOsrVaultNoteLinkInfoFinder,
        settings: SRSettings,
        dataChangedHandler: () => void,
        noteReviewQueue: NoteReviewQueue,
    ): void {
        this.settings = settings;
        this.osrNoteLinkInfoFinder = osrNoteLinkInfoFinder;
        this.dataChangedHandler = dataChangedHandler;
        this._noteReviewQueue = noteReviewQueue;
        this._questionPostponementList = questionPostponementList;
        this._dueDateFlashcardHistogram = new CardDueDateHistogram();
        this._dueDateNoteHistogram = new NoteDueDateHistogram();
    }

    protected loadInit(): void {
        // reset notes stuff
        this.osrNoteGraph = new OsrNoteGraph(this.osrNoteLinkInfoFinder);
        this._noteReviewQueue.init();

        // reset flashcards stuff
        this.fullDeckTree = new Deck("root", null);
    }

    protected async processFile(noteFile: ISRFile): Promise<void> {
        const schedule: RepItemScheduleInfo =
            await DataStoreAlgorithm.getInstance().noteGetSchedule(noteFile);
        let note: Note = null;

        // Update the graph of links between notes
        // (Performance note: This only requires accessing Obsidian's metadata cache and not loading the file)
        this.osrNoteGraph.processLinks(noteFile.path);

        // Does the note contain any tags that are specified as flashcard tags in the settings
        // (Doing this check first saves us from loading and parsing the note if not necessary)
        const topicPath: TopicPath = this.findTopicPath(noteFile);
        if (topicPath.hasPath) {
            note = await this.loadNote(noteFile, topicPath);
            note.appendCardsToDeck(this.fullDeckTree);
        }

        // Give the algorithm a chance to do something with the loaded note
        // e.g. OSR - calculate the average ease across all the questions within the note
        // TODO:  should this move to this.loadNote
        SrsAlgorithm.getInstance().noteOnLoadedNote(noteFile.path, note, schedule?.latestEase);

        const tags = noteFile.getAllTagsFromCache();

        const matchedNoteTags = SettingsUtil.filterForNoteReviewTag(this.settings, tags);
        if (matchedNoteTags.length == 0) {
            return;
        }
        const noteSchedule: RepItemScheduleInfo =
            await DataStoreAlgorithm.getInstance().noteGetSchedule(noteFile);
        this._noteReviewQueue.addNoteToQueue(noteFile, noteSchedule, matchedNoteTags);
    }

    protected finaliseLoad(): void {
        this.osrNoteGraph.generatePageRanks();

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

        // Generate the histogram for the due dates for (1) all the notes (2) all the cards
        this.calculateDerivedInfo();
        this._dueDateFlashcardHistogram.calculateFromDeckTree(this._reviewableDeckTree);

        // Tell the interested party that the data has changed
        if (this.dataChangedHandler) this.dataChangedHandler();
    }

    async saveNoteReviewResponse(
        noteFile: ISRFile,
        response: ReviewResponse,
        settings: SRSettings,
    ): Promise<void> {
        // Get the current schedule for the note (null if new note)
        const originalNoteSchedule: RepItemScheduleInfo =
            await DataStoreAlgorithm.getInstance().noteGetSchedule(noteFile);

        // Calculate the new/updated schedule
        let noteSchedule: RepItemScheduleInfo;
        if (originalNoteSchedule == null) {
            noteSchedule = SrsAlgorithm.getInstance().noteCalcNewSchedule(
                noteFile.path,
                this.osrNoteGraph,
                response,
                this._dueDateNoteHistogram,
            );
        } else {
            noteSchedule = SrsAlgorithm.getInstance().noteCalcUpdatedSchedule(
                noteFile.path,
                originalNoteSchedule,
                response,
                this._dueDateNoteHistogram,
            );
        }

        // Store away the new schedule info
        await DataStoreAlgorithm.getInstance().noteSetSchedule(noteFile, noteSchedule);

        // Generate the histogram for the due dates for all the notes
        // (This could be optimized to make the small adjustments to the histogram, but simpler to implement
        // by recalculating from scratch)
        this._noteReviewQueue.updateScheduleInfo(noteFile, noteSchedule);
        this.calculateDerivedInfo();

        // If configured in the settings, bury all cards within the note
        await this.buryAllCardsInNote(settings, noteFile);

        // Tell the interested party that the data has changed
        if (this.dataChangedHandler) this.dataChangedHandler();
    }

    private calculateDerivedInfo(): void {
        const todayUnix: number = globalDateProvider.today.valueOf();
        this.noteReviewQueue.calcDueNotesCount(todayUnix);
        this._dueDateNoteHistogram.calculateFromReviewDecksAndSort(
            this.noteReviewQueue.reviewDecks,
            this.osrNoteGraph,
        );
    }

    private async buryAllCardsInNote(settings: SRSettings, noteFile: ISRFile): Promise<void> {
        if (settings.burySiblingCards) {
            const topicPath: TopicPath = this.findTopicPath(noteFile);
            const noteX: Note = await this.loadNote(noteFile, topicPath);

            if (noteX.questionList.length > 0) {
                for (const question of noteX.questionList) {
                    this._questionPostponementList.add(question);
                }
                await this._questionPostponementList.write();
            }
        }
    }

    async loadNote(noteFile: ISRFile, topicPath: TopicPath): Promise<Note> {
        const loader: NoteFileLoader = new NoteFileLoader(this.settings);
        const note: Note = await loader.load(noteFile, this.defaultTextDirection, topicPath);
        if (note.hasChanged) {
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

            this.finaliseLoad();
        } finally {
            this._syncLock = false;
        }
    }

    createSrTFile(note: TFile): SrTFile {
        return new SrTFile(this.app.vault, this.app.metadataCache, note);
    }
}
