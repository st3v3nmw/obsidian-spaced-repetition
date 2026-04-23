import { App, TFile } from "obsidian";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import { IOsrVaultNoteLinkInfoFinder } from "src/algorithms/osr/obsidian-vault-notelink-info-finder";
import { OsrNoteGraph } from "src/algorithms/osr/osr-note-graph";
import { FlashcardReviewMode } from "src/card/flashcard-review-sequencer";
import { QuestionPostponementList } from "src/card/questions/question-postponement-list";
import { DataStoreName } from "src/data-stores/base/data-store";
import { ScheduleDataRepository } from "src/data-stores/plugin-data/schedule-data-repository";
import { Deck, DeckTreeFilter } from "src/deck/deck";
import { DeckTreeStatsCalculator } from "src/deck/deck-tree-stats-calculator";
import { Stats } from "src/deck/stats";
import { TopicPath } from "src/deck/topic-path";
import { CardDueDateHistogram, NoteDueDateHistogram } from "src/due-date-histogram";
import { ISRFile, SrTFile } from "src/file";
import { Note } from "src/note/note";
import { NoteFileLoader } from "src/note/note-file-loader";
import { NoteReviewQueue } from "src/note/note-review-queue";
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
    protected osrNoteGraph: OsrNoteGraph;
    private osrNoteLinkInfoFinder: IOsrVaultNoteLinkInfoFinder;
    private _questionPostponementList: QuestionPostponementList;
    private _noteReviewQueue: NoteReviewQueue;
    private scheduleDataRepository: ScheduleDataRepository | null = null;

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
        scheduleDataRepository: ScheduleDataRepository | null,
    ): void {
        this.settings = settings;
        this.osrNoteLinkInfoFinder = osrNoteLinkInfoFinder;
        this.dataChangedHandler = dataChangedHandler;
        this._noteReviewQueue = noteReviewQueue;
        this._questionPostponementList = questionPostponementList;
        this.scheduleDataRepository = scheduleDataRepository;
        this._dueDateFlashcardHistogram = new CardDueDateHistogram();
        this._dueDateNoteHistogram = new NoteDueDateHistogram();
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
        // reset notes stuff
        this.osrNoteGraph = new OsrNoteGraph(this.osrNoteLinkInfoFinder);
        this._noteReviewQueue.init();

        // reset flashcards stuff
        this.fullDeckTree = new Deck("root", null);
    }

    protected async processFile(noteFile: ISRFile): Promise<void> {
        const schedule: RepItemScheduleInfo = await this.readNoteSchedule(noteFile);
        let note: Note | null = null;

        // Update the graph of links between notes
        // (Performance note: This only requires accessing Obsidian's metadata cache and not loading the file)
        this.osrNoteGraph.processLinks(noteFile.path);

        // Does the note contain any tags that are specified as flashcard tags in the settings
        // (Doing this check first saves us from loading and parsing the note if not necessary)
        const topicPath: TopicPath = this.findTopicPath(noteFile);
        if (topicPath.hasPath) {
            note = await this.loadNote(noteFile, topicPath);
            if (note !== null) note.appendCardsToDeck(this.fullDeckTree);
        }

        // Give the algorithm a chance to do something with the loaded note
        // e.g. OSR - calculate the average ease across all the questions within the note
        // TODO:  should this move to this.loadNote
        SrsAlgorithm.getInstance().noteOnLoadedNote(noteFile.path, note, schedule?.latestEase);

        const tags = noteFile.getAllTagsFromCache();

        const matchedNoteTags = SettingsUtil.filterForNoteReviewTag(this.settings, tags);
        if (matchedNoteTags.length === 0) {
            return;
        }
        const noteSchedule: RepItemScheduleInfo = await this.readNoteSchedule(noteFile);
        this._noteReviewQueue.addNoteToQueue(noteFile, noteSchedule, matchedNoteTags);
    }

    private async readNoteSchedule(noteFile: ISRFile): Promise<RepItemScheduleInfo> {
        if (
            this.settings.dataStore !== DataStoreName.PLUGIN_DATA ||
            this.scheduleDataRepository === null
        ) {
            return await noteFile.getNoteSchedule();
        }

        if (this.scheduleDataRepository.hasNoteSchedule(noteFile.path)) {
            return this.scheduleDataRepository.getNoteSchedule(noteFile.path);
        }

        // Fallback to frontmatter to preserve existing users' schedules when switching mode.
        const legacy = await noteFile.getNoteSchedule();
        if (legacy) {
            await this.scheduleDataRepository.setNoteSchedule(noteFile.path, legacy);
        }
        return legacy;
    }

    private async writeNoteSchedule(
        noteFile: ISRFile,
        noteSchedule: RepItemScheduleInfo,
    ): Promise<void> {
        if (
            this.settings.dataStore !== DataStoreName.PLUGIN_DATA ||
            this.scheduleDataRepository === null
        ) {
            await noteFile.setNoteSchedule(noteSchedule);
            return;
        }

        await this.scheduleDataRepository.setNoteSchedule(noteFile.path, noteSchedule);
    }

    protected finalizeLoad(): void {
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
        const originalNoteSchedule: RepItemScheduleInfo = await this.readNoteSchedule(noteFile);

        // Calculate the new/updated schedule
        let noteSchedule: RepItemScheduleInfo;
        if (originalNoteSchedule === null) {
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
        await this.writeNoteSchedule(noteFile, noteSchedule);

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
            const noteX: Note | null = await this.loadNote(noteFile, topicPath);

            if (noteX !== null && noteX.questionList.length > 0) {
                for (const question of noteX.questionList) {
                    this._questionPostponementList.add(question);
                }
                await this._questionPostponementList.write();
            }
        }
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
