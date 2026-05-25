import { QuestionPostponementList } from "src/data/data-structures/card/questions/question-postponement-list";
import { Deck, DeckTreeFilter } from "src/data/data-structures/deck/deck";
import { DeckTreeStatsCalculator } from "src/data/data-structures/deck/deck-tree-stats-calculator";
import { Stats } from "src/data/data-structures/deck/stats";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { ISRNoteTFile } from "src/data/data-structures/file/note-file";
import { SettingsUtil, SRSettings } from "src/data/settings";
import { Note } from "src/note/note";
import { NoteFileLoader } from "src/note/note-file-loader";
import { CardDueDateHistogram } from "src/scheduling/due-date-histogram";
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
    private dataChangedHandler: () => Promise<void>;
    private _questionPostponementList: QuestionPostponementList;

    private fullDeckTree: Deck | null = null;
    private _reviewableDeckTree: Deck = new Deck("root", null);
    private _remainingDeckTree: Deck | null = null;
    private _cardStats: Stats | null = null;
    private _dueDateFlashcardHistogram: CardDueDateHistogram;

    constructor(
        questionPostponementList: QuestionPostponementList,
        settings: SRSettings,
        dataChangedHandler: () => Promise<void>,
        defaultTextDirection: TextDirection,
    ) {
        this.settings = settings;
        this.dataChangedHandler = dataChangedHandler;
        this._questionPostponementList = questionPostponementList;
        this._dueDateFlashcardHistogram = new CardDueDateHistogram();
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
     */
    initUnitTestCore(
        questionPostponementList: QuestionPostponementList,
        settings: SRSettings,
        dataChangedHandler: () => Promise<void>,
        defaultTextDirection: TextDirection,
    ) {
        this.settings = settings;
        this.dataChangedHandler = dataChangedHandler;
        this._questionPostponementList = questionPostponementList;
        this.defaultTextDirection = defaultTextDirection;
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
        const tags = noteFile.getAllTagsFromCache();
        // Does the note contain any tags that are specified as flashcard tags in the settings
        const topicPath: TopicPath = this.findTopicPath(noteFile);
        if (topicPath.hasPath && !SettingsUtil.isAnyTagIgnoredForFlashcards(this.settings, tags)) {
            const note = await this.loadNote(noteFile, topicPath);
            if (note !== null && this.fullDeckTree !== null)
                note.appendCardsToDeck(this.fullDeckTree);
        }
    }

    /**
     * Finalizes the loading of the OSR core.
     *
     * @returns {void}
     */
    public async finalizeLoad(): Promise<void> {
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

        // Generate the histogram for the due dates for all the cards
        this._dueDateFlashcardHistogram.calculateFromDeckTree(this._reviewableDeckTree);

        // Tell the interested party that the data has changed
        if (this.dataChangedHandler) await this.dataChangedHandler();
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
