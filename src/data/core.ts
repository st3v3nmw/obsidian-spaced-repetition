import { QuestionPostponementList } from "src/data/data-structures/card/questions/question-postponement-list";
import { Deck, DeckTreeFilter } from "src/data/data-structures/deck/deck";
import { DeckTreeStatsCalculator } from "src/data/data-structures/deck/deck-tree-stats-calculator";
import { Stats } from "src/data/data-structures/deck/stats";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { ISRNoteTFile } from "src/data/data-structures/file/note-file";
import { SettingsUtil, SRSettings } from "src/data/settings";
import { Note } from "src/note/note";
import { NoteFileLoader } from "src/note/note-file-loader";
import { NoteReviewQueue } from "src/note/note-review-queue";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { SRAlgorithm } from "src/scheduling/algorithms/base/sr-algorithm";
import { IOsrVaultNoteLinkInfoFinder } from "src/scheduling/algorithms/osr/obsidian-vault-notelink-info-finder";
import { OsrNoteGraph } from "src/scheduling/algorithms/osr/osr-note-graph";
import { CardDueDateHistogram, NoteDueDateHistogram } from "src/scheduling/due-date-histogram";
import { FlashcardReviewMode } from "src/scheduling/flashcard-review-sequencer";
import { globalDateProvider, IDayBoundary } from "src/utils/dates";
import { TextDirection } from "src/utils/strings";

export interface IOsrVaultEvents {
    dataChanged: () => void;
}

/**
 * Manages the processing of notes and scheduling data in the Obsidian vault.
 *
 * @class OsrCore
 */
export class OsrCore {
    public defaultTextDirection: TextDirection;
    protected settings: SRSettings;
    private dataChangedHandler: () => void;
    protected osrNoteGraph: OsrNoteGraph | null = null;
    private osrNoteLinkInfoFinder: IOsrVaultNoteLinkInfoFinder;
    private _questionPostponementList: QuestionPostponementList;
    private _noteReviewQueue: NoteReviewQueue;

    private fullDeckTree: Deck | null = null;
    private _reviewableDeckTree: Deck = new Deck("root", null);
    private _remainingDeckTree: Deck | null = null;
    private _cardStats: Stats | null = null;
    private _dueDateFlashcardHistogram: CardDueDateHistogram;
    private _dueDateNoteHistogram: NoteDueDateHistogram;

    constructor(
        questionPostponementList: QuestionPostponementList,
        osrNoteLinkInfoFinder: IOsrVaultNoteLinkInfoFinder,
        settings: SRSettings,
        dataChangedHandler: () => void,
        noteReviewQueue: NoteReviewQueue,
        defaultTextDirection: TextDirection,
    ) {
        this.settings = settings;
        this.osrNoteLinkInfoFinder = osrNoteLinkInfoFinder;
        this.dataChangedHandler = dataChangedHandler;
        this._noteReviewQueue = noteReviewQueue;
        this._questionPostponementList = questionPostponementList;
        this._dueDateFlashcardHistogram = new CardDueDateHistogram();
        this._dueDateNoteHistogram = new NoteDueDateHistogram();
        this.defaultTextDirection = defaultTextDirection;

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

    /**
     * Initializes the OSR core for unit testing.
     *
     * @param {QuestionPostponementList} questionPostponementList - The question postponement list.
     * @param {IOsrVaultNoteLinkInfoFinder} osrNoteLinkInfoFinder - The OSR vault note link info finder.
     * @param {SRSettings} settings - The settings object.
     * @param {() => void} dataChangedHandler - A callback function that is called when the data has changed.
     * @param {NoteReviewQueue} noteReviewQueue - The note review queue.
     * @param {TextDirection} defaultTextDirection - The default text direction.
     * @returns {void}
     */
    initUnitTestCore(
        questionPostponementList: QuestionPostponementList,
        osrNoteLinkInfoFinder: IOsrVaultNoteLinkInfoFinder,
        settings: SRSettings,
        dataChangedHandler: () => void,
        noteReviewQueue: NoteReviewQueue,
        defaultTextDirection: TextDirection,
    ) {
        this.settings = settings;
        this.osrNoteLinkInfoFinder = osrNoteLinkInfoFinder;
        this.dataChangedHandler = dataChangedHandler;
        this._noteReviewQueue = noteReviewQueue;
        this._questionPostponementList = questionPostponementList;
        this._dueDateFlashcardHistogram = new CardDueDateHistogram();
        this._dueDateNoteHistogram = new NoteDueDateHistogram();
        this.defaultTextDirection = defaultTextDirection;

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

    /**
     * Gets the note review queue.
     *
     * @returns {NoteReviewQueue} - The note review queue.
     */
    get noteReviewQueue(): NoteReviewQueue {
        return this._noteReviewQueue;
    }

    /**
     * Gets the remaining deck tree.
     *
     * @returns {Deck} - The remaining deck tree.
     */
    get remainingDeckTree(): Deck | null {
        return this._remainingDeckTree;
    }

    /**
     * Gets the reviewable deck tree.
     *
     * @returns {Deck} - The reviewable deck tree.
     */
    get reviewableDeckTree(): Deck {
        return this._reviewableDeckTree;
    }

    /**
     * Gets the question postponement list.
     *
     * @returns {QuestionPostponementList} - The question postponement list.
     */
    get questionPostponementList(): QuestionPostponementList {
        return this._questionPostponementList;
    }

    /**
     * Gets the due date flashcard histogram.
     *
     * @returns {CardDueDateHistogram} - The due date flashcard histogram.
     */
    get dueDateFlashcardHistogram(): CardDueDateHistogram {
        return this._dueDateFlashcardHistogram;
    }

    /**
     * Gets the due date note histogram.
     *
     * @returns {NoteDueDateHistogram} - The due date note histogram.
     */
    get dueDateNoteHistogram(): NoteDueDateHistogram {
        return this._dueDateNoteHistogram;
    }

    /**
     * Gets the card stats.
     *
     * @returns {Stats} - The card stats.
     */
    get cardStats(): Stats | null {
        return this._cardStats;
    }

    /**
     * Loads the initial state of the OSR core.
     *
     * @returns {void}
     */
    public loadInitialStateOfCore(): void {
        // reset notes stuff
        this.osrNoteGraph = new OsrNoteGraph(this.osrNoteLinkInfoFinder);
        this._noteReviewQueue.init();

        // reset flashcards stuff
        this.fullDeckTree = new Deck("root", null);
    }

    /**
     * Processes a note file.
     *
     * @param {ISRNoteTFile} noteFile - The note file.
     * @returns {Promise<void>} - A promise that resolves when the note file is processed.
     */
    public async processFile(noteFile: ISRNoteTFile): Promise<void> {
        const schedule: RepItemScheduleInfo | null = await this.readNoteSchedule(noteFile);
        let note: Note | null = null;

        // Update the graph of links between notes
        // (Performance note: This only requires accessing Obsidian's metadata cache and not loading the file)
        if (this.osrNoteGraph !== null) this.osrNoteGraph.processLinks(noteFile.path);

        const tags = noteFile.getAllTagsFromCache();

        // Does the note contain any tags that are specified as flashcard tags in the settings
        // (Doing this check first saves us from loading and parsing the note if not necessary)
        const topicPath: TopicPath = this.findTopicPath(noteFile);
        if (topicPath.hasPath && !SettingsUtil.isAnyTagIgnoredForFlashcards(this.settings, tags)) {
            note = await this.loadNote(noteFile, topicPath);
            if (note !== null && this.fullDeckTree !== null)
                note.appendCardsToDeck(this.fullDeckTree);
        }

        // Give the algorithm a chance to do something with the loaded note
        // e.g. OSR - calculate the average ease across all the questions within the note
        // TODO:  should this move to this.loadNote
        if (schedule !== null) {
            SRAlgorithm.getInstance().noteOnLoadedNote(noteFile.path, note, schedule.latestEase);
        }

        const matchedNoteTags = SettingsUtil.filterForNoteReviewTag(this.settings, tags);
        if (matchedNoteTags.length === 0) {
            return;
        }

        if (SettingsUtil.isAnyTagIgnoredForNotes(this.settings, tags)) {
            return;
        }
        const noteSchedule: RepItemScheduleInfo | null = await this.readNoteSchedule(noteFile);
        this._noteReviewQueue.addNoteToQueue(noteFile, noteSchedule, matchedNoteTags);
    }

    /**
     * Reads the scheduling information for a note file.
     *
     * @param {ISRNoteTFile} noteFile - The note file.
     * @returns {Promise<RepItemScheduleInfo>} - A promise that resolves with the scheduling information for the note file.
     */
    private async readNoteSchedule(noteFile: ISRNoteTFile): Promise<RepItemScheduleInfo | null> {
        return await noteFile.getNoteSchedule();
    }

    /**
     * Writes the scheduling information for a note file.
     *
     * @param {ISRNoteTFile} noteFile - The note file.
     * @param {RepItemScheduleInfo} noteSchedule - The scheduling information for the note file.
     * @returns {Promise<void>} - A promise that resolves when the scheduling information is written.
     */
    private async writeNoteSchedule(
        noteFile: ISRNoteTFile,
        noteSchedule: RepItemScheduleInfo,
    ): Promise<void> {
        await noteFile.setNoteSchedule(noteSchedule);
    }

    /**
     * Finalizes the loading of the OSR core.
     *
     * @returns {void}
     */
    public finalizeLoad(): void {
        if (this.osrNoteGraph !== null) {
            this.osrNoteGraph.generatePageRanks();
        }

        if (this.fullDeckTree === null) {
            return;
        }
        this._reviewableDeckTree = this.fullDeckTree
            ? this.fullDeckTree.clone()
            : new Deck("root", null);

        // sort the deck names
        this._reviewableDeckTree.sortSubdecksList();
        this._remainingDeckTree = DeckTreeFilter.filterForRemainingRepItems(
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

    /**
     * Saves the review response for a note file.
     *
     * @param {ISRNoteTFile} noteFile - The note file.
     * @param {ReviewResponse} response - The review response.
     * @param {SRSettings} settings - The settings object.
     * @returns {Promise<void>} - A promise that resolves when the review response is saved.
     */
    async saveNoteReviewResponse(
        noteFile: ISRNoteTFile,
        response: ReviewResponse,
        settings: SRSettings,
    ): Promise<void> {
        // Get the current schedule for the note (null if new note)
        const originalNoteSchedule: RepItemScheduleInfo | null =
            await this.readNoteSchedule(noteFile);

        // Calculate the new/updated schedule
        let noteSchedule: RepItemScheduleInfo;
        if (originalNoteSchedule === null) {
            noteSchedule = SRAlgorithm.getInstance().noteCalcNewSchedule(
                noteFile.path,
                this.osrNoteGraph,
                response,
                this._dueDateNoteHistogram,
            );
        } else {
            noteSchedule = SRAlgorithm.getInstance().noteCalcUpdatedSchedule(
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

    /**
     * Calculates the derived information for the OSR core.
     *
     * @returns {void}
     */
    private calculateDerivedInfo(): void {
        const todayUnix: number = globalDateProvider.today.valueOf();
        this.noteReviewQueue.calcDueNotesCount(todayUnix);
        this._dueDateNoteHistogram.calculateFromReviewDecksAndSort(
            this.noteReviewQueue.reviewDecks,
            this.osrNoteGraph,
        );
    }

    /**
     * Buries all cards in a note.
     *
     * @param {SRSettings} settings - The settings object.
     * @param {ISRNoteTFile} noteFile - The note file.
     * @returns {Promise<void>} - A promise that resolves when the cards are buried.
     */
    private async buryAllCardsInNote(settings: SRSettings, noteFile: ISRNoteTFile): Promise<void> {
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

    /**
     * Loads a note from the Obsidian vault.
     *
     * @param {ISRNoteTFile} noteFile - The note file.
     * @param {TopicPath} topicPath - The topic path.
     * @returns {Promise<Note | null>} - A promise that resolves with the loaded note.
     */
    async loadNote(noteFile: ISRNoteTFile, topicPath: TopicPath): Promise<Note | null> {
        const loader: NoteFileLoader = new NoteFileLoader(this.settings);
        const note: Note | null = await loader.load(noteFile, this.defaultTextDirection, topicPath);
        if (note !== null && note.hasChanged) {
            await note.writeNoteFile(this.settings);
        }
        return note;
    }

    /**
     * Finds the topic path for a note.
     *
     * @param {ISRNoteTFile} note - The note file.
     * @returns {TopicPath} - The topic path.
     */
    private findTopicPath(note: ISRNoteTFile): TopicPath {
        return TopicPath.getTopicPathOfFile(note, this.settings);
    }
}
