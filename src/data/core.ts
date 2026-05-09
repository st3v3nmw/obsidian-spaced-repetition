import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { SRAlgorithm } from "src/algorithms/base/sr-algorithm";
import { IOsrVaultNoteLinkInfoFinder } from "src/algorithms/osr/obsidian-vault-notelink-info-finder";
import { OsrNoteGraph } from "src/algorithms/osr/osr-note-graph";
import { StorageType } from "src/data/data-stores/base/data-store";
import { ScheduleDataRepository } from "src/data/data-stores/folder-data-store/schedule-data-repository";
import { QuestionPostponementList } from "src/data/data-structures/card/questions/question-postponement-list";
import { Deck, DeckTreeFilter } from "src/data/data-structures/deck/deck";
import { DeckTreeStatsCalculator } from "src/data/data-structures/deck/deck-tree-stats-calculator";
import { Stats } from "src/data/data-structures/deck/stats";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { ISRFile } from "src/data/file";
import { SettingsUtil, SRSettings } from "src/data/settings";
import { CardDueDateHistogram, NoteDueDateHistogram } from "src/due-date-histogram";
import { FlashcardReviewMode } from "src/flashcard-review-sequencer";
import { Note } from "src/note/note";
import { NoteFileLoader } from "src/note/note-file-loader";
import { NoteReviewQueue } from "src/note/note-review-queue";
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
    get remainingDeckTree(): Deck {
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
    get cardStats(): Stats {
        return this._cardStats;
    }

    /**
     * Initializes the OSR core.
     *
     * @param {QuestionPostponementList} questionPostponementList - The question postponement list.
     * @param {IOsrVaultNoteLinkInfoFinder} osrNoteLinkInfoFinder - The OSR vault note link info finder.
     * @param {SRSettings} settings - The settings object.
     * @param {() => void} dataChangedHandler - A callback function that is called when the data has changed.
     * @param {NoteReviewQueue} noteReviewQueue - The note review queue.
     * @param {ScheduleDataRepository | null} scheduleDataRepository - The schedule data repository.
     * @returns {void}
     */
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

    /**
     * Loads the initial state of the OSR core.
     *
     * @returns {void}
     */
    public loadInit(): void {
        // reset notes stuff
        this.osrNoteGraph = new OsrNoteGraph(this.osrNoteLinkInfoFinder);
        this._noteReviewQueue.init();

        // reset flashcards stuff
        this.fullDeckTree = new Deck("root", null);
    }

    /**
     * Processes a note file.
     *
     * @param {ISRFile} noteFile - The note file.
     * @returns {Promise<void>} - A promise that resolves when the note file is processed.
     */
    public async processFile(noteFile: ISRFile): Promise<void> {
        const schedule: RepItemScheduleInfo = await this.readNoteSchedule(noteFile);
        let note: Note | null = null;

        // Update the graph of links between notes
        // (Performance note: This only requires accessing Obsidian's metadata cache and not loading the file)
        this.osrNoteGraph.processLinks(noteFile.path);

        const tags = noteFile.getAllTagsFromCache();

        // Does the note contain any tags that are specified as flashcard tags in the settings
        // (Doing this check first saves us from loading and parsing the note if not necessary)
        const topicPath: TopicPath = this.findTopicPath(noteFile);
        if (topicPath.hasPath && !SettingsUtil.isAnyTagIgnoredForFlashcards(this.settings, tags)) {
            note = await this.loadNote(noteFile, topicPath);
            if (note !== null) note.appendCardsToDeck(this.fullDeckTree);
        }

        // Give the algorithm a chance to do something with the loaded note
        // e.g. OSR - calculate the average ease across all the questions within the note
        // TODO:  should this move to this.loadNote
        SRAlgorithm.getInstance().noteOnLoadedNote(noteFile.path, note, schedule?.latestEase);

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
     * @param {ISRFile} noteFile - The note file.
     * @returns {Promise<RepItemScheduleInfo>} - A promise that resolves with the scheduling information for the note file.
     */
    private async readNoteSchedule(noteFile: ISRFile): Promise<RepItemScheduleInfo | null> {
        if (
            this.settings.dataStore !== StorageType.PLUGIN_DATA ||
            this.scheduleDataRepository === null
        ) {
            return await noteFile.getNoteSchedule();
        }

        // UUID-based lookup (primary path for notes that have been stamped with sr-id).
        const noteId = await noteFile.getNoteId();
        if (noteId && this.scheduleDataRepository.hasNoteSchedule(noteId)) {
            return this.scheduleDataRepository.getNoteSchedule(noteId);
        }

        // Path-based fallback for entries created before UUID support — migrate on read.
        if (this.scheduleDataRepository.hasNoteSchedule(noteFile.path)) {
            const schedule = this.scheduleDataRepository.getNoteSchedule(noteFile.path);
            const newId = await noteFile.getOrCreateNoteId();
            await this.scheduleDataRepository.setNoteSchedule(newId, schedule);
            await this.scheduleDataRepository.deleteNoteSchedule(noteFile.path);
            return schedule;
        }

        // Fallback to frontmatter to preserve schedules when switching from notes mode.
        const legacy = await noteFile.getNoteSchedule();
        if (legacy) {
            const newId = await noteFile.getOrCreateNoteId();
            await this.scheduleDataRepository.setNoteSchedule(newId, legacy);
        }
        return legacy;
    }

    /**
     * Writes the scheduling information for a note file.
     *
     * @param {ISRFile} noteFile - The note file.
     * @param {RepItemScheduleInfo} noteSchedule - The scheduling information for the note file.
     * @returns {Promise<void>} - A promise that resolves when the scheduling information is written.
     */
    private async writeNoteSchedule(
        noteFile: ISRFile,
        noteSchedule: RepItemScheduleInfo,
    ): Promise<void> {
        if (
            this.settings.dataStore !== StorageType.PLUGIN_DATA ||
            this.scheduleDataRepository === null
        ) {
            await noteFile.setNoteSchedule(noteSchedule);
            return;
        }

        const noteId = await noteFile.getOrCreateNoteId();
        await this.scheduleDataRepository.setNoteSchedule(noteId, noteSchedule);
    }

    /**
     * Finalizes the loading of the OSR core.
     *
     * @returns {void}
     */
    public finalizeLoad(): void {
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

    /**
     * Saves the review response for a note file.
     *
     * @param {ISRFile} noteFile - The note file.
     * @param {ReviewResponse} response - The review response.
     * @param {SRSettings} settings - The settings object.
     * @returns {Promise<void>} - A promise that resolves when the review response is saved.
     */
    async saveNoteReviewResponse(
        noteFile: ISRFile,
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
     * @param {ISRFile} noteFile - The note file.
     * @returns {Promise<void>} - A promise that resolves when the cards are buried.
     */
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

    /**
     * Loads a note from the Obsidian vault.
     *
     * @param {ISRFile} noteFile - The note file.
     * @param {TopicPath} topicPath - The topic path.
     * @returns {Promise<Note | null>} - A promise that resolves with the loaded note.
     */
    async loadNote(noteFile: ISRFile, topicPath: TopicPath): Promise<Note | null> {
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
     * @param {ISRFile} note - The note file.
     * @returns {TopicPath} - The topic path.
     */
    private findTopicPath(note: ISRFile): TopicPath {
        return TopicPath.getTopicPathOfFile(note, this.settings);
    }
}
