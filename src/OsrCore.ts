import { Deck, DeckTreeFilter } from "./Deck";
import { NoteEaseList } from "./NoteEaseList";
import { NoteReviewQueue } from "./NoteReviewQueue";
import { QuestionPostponementList } from "./QuestionPostponementList";
import { ISRFile, SrTFile } from "./SRFile";
import { IOsrVaultNoteLinkInfoFinder, ObsidianVaultNoteLinkInfoFinder, OsrNoteGraph } from "./algorithms/osr/OsrNoteGraph";
import { Stats } from "./stats";
import { SRSettings, SettingsUtil } from "./settings";
import { TopicPath } from "./TopicPath";
import { SrsAlgorithm } from "./algorithms/base/SrsAlgorithm";
import { Note } from "./Note";
import { RepItemScheduleInfo } from "./algorithms/base/RepItemScheduleInfo";
import { DataStoreAlgorithm } from "./dataStoreAlgorithm/DataStoreAlgorithm";
import { FlashcardReviewMode } from "./FlashcardReviewSequencer";
import { DeckTreeStatsCalculator } from "./DeckTreeStatsCalculator";
import { NoteFileLoader } from "./NoteFileLoader";
import { ReviewResponse } from "./algorithms/base/RepetitionItem";
import { NextNoteReviewHandler } from "./NextNoteReviewHandler";

export interface IOsrVaultEvents {
    dataChanged: () => void;
}

export class OsrCore {
    protected settings: SRSettings;
    // private vaultEvents: IOsrVaultEvents;
    private dataChangedHandler: () => void;
    private osrNoteGraph: OsrNoteGraph;
    private osrNoteLinkInfoFinder: IOsrVaultNoteLinkInfoFinder;
    private _easeByPath: NoteEaseList;
    private _questionPostponementList: QuestionPostponementList;
    private _noteReviewQueue: NoteReviewQueue;

    private fullDeckTree: Deck;
    private _reviewableDeckTree: Deck = new Deck("root", null);
    private _remainingDeckTree: Deck;
    private _cardStats: Stats;

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

    get easeByPath(): NoteEaseList {
        return this._easeByPath;
    }

    get cardStats(): Stats {
        return this._cardStats;
    }

    init(questionPostponementList: QuestionPostponementList, osrNoteLinkInfoFinder: IOsrVaultNoteLinkInfoFinder, settings: SRSettings, dataChangedHandler: () => void): void {
        this.settings = settings;
        this.osrNoteLinkInfoFinder = osrNoteLinkInfoFinder;
        this.dataChangedHandler = dataChangedHandler;
        this._noteReviewQueue = new NoteReviewQueue();
        this._questionPostponementList = questionPostponementList;
    }

    protected loadInit(): void {
        // reset notes stuff
        this.osrNoteGraph = new OsrNoteGraph(this.osrNoteLinkInfoFinder);
        this._noteReviewQueue.init();

        // reset flashcards stuff
        this.fullDeckTree = new Deck("root", null);
    }
    
    protected async processFile(noteFile: ISRFile): Promise<void> {

        // Does the note contain any tags that are specified as flashcard tags in the settings
        // (Doing this check first saves us from loading and parsing the note if not necessary)
        const topicPath: TopicPath = this.findTopicPath(noteFile);
        if (topicPath.hasPath) {
            const note: Note = await this.loadNote(noteFile, topicPath);
            note.appendCardsToDeck(this.fullDeckTree);

            // Give the algorithm a chance to do something with the loaded note
            // e.g. OSR - calculate the average ease across all the questions within the note
            // TODO:  should this move to this.loadNote
            SrsAlgorithm.getInstance().noteOnLoadedNote(note);
        }

        const tags = noteFile.getAllTags()

        const matchedNoteTags = SettingsUtil.filterForNoteReviewTag(this.settings, tags);
        if (matchedNoteTags.length == 0) {
            return;
        }

        const noteSchedule: RepItemScheduleInfo = await DataStoreAlgorithm.getInstance().noteGetSchedule(noteFile);
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

        // Generate the note review queue
        this.noteReviewQueue.determineScheduleInfo(this.osrNoteGraph);

        // Tell the interested party that the data has changed
        if (this.dataChangedHandler) this.dataChangedHandler();
    }

    async saveNoteReviewResponse(noteFile: ISRFile, response: ReviewResponse, settings: SRSettings, buryList: string[]): Promise<void> {

        // Get the current schedule for the note
        const noteSchedule: RepItemScheduleInfo = await DataStoreAlgorithm.getInstance().noteGetSchedule(noteFile);

        // Calculate the updated schedule
        const updatedNoteSchedule: RepItemScheduleInfo = SrsAlgorithm.getInstance().noteCalcUpdatedSchedule(noteFile.path, noteSchedule, response);

        // Store away the new schedule info
        await DataStoreAlgorithm.getInstance().noteSetSchedule(noteFile, updatedNoteSchedule);

        // Generate the note review queue
        this.noteReviewQueue.determineScheduleInfo(this.osrNoteGraph);

        // If configured in the settings, bury all cards within the note
        await this.buryAllCardsInNote(settings, noteFile);

        // Tell the interested party that the data has changed
        if (this.dataChangedHandler) this.dataChangedHandler();
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
        const note: Note = await loader.load(noteFile, topicPath);
        if (note.hasChanged) {
            note.writeNoteFile(this.settings);
        }
        return note;
    }

    private findTopicPath(note: ISRFile): TopicPath {
        return TopicPath.getTopicPathOfFile(note, this.settings);
    }

}
