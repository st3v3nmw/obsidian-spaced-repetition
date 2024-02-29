import { App, TFile } from "obsidian";
import { Deck, DeckTreeFilter } from "./Deck";
import { NoteEaseList } from "./NoteEaseList";
import { NoteReviewQueue } from "./NoteReviewQueue";
import { PluginData } from "./PluginData";
import { QuestionPostponementList } from "./QuestionPostponementList";
import { ISRFile, SrTFile } from "./SRFile";
import { ObsidianVaultNoteLinkInfoFinder, OsrNoteGraph } from "./algorithms/osr/OsrNoteGraph";
import { Stats } from "./stats";
import { SRSettings, SettingsUtil } from "./settings";
import { TopicPath } from "./TopicPath";
import { SrsAlgorithm } from "./algorithms/base/SrsAlgorithm";
import { Note } from "./Note";
import { RepItemScheduleInfo } from "./algorithms/base/RepItemScheduleInfo";
import { DataStoreAlgorithm } from "./dataStoreAlgorithm/DataStoreAlgorithm";
import { FlashcardReviewMode } from "./FlashcardReviewSequencer";
import { DeckTreeStatsCalculator } from "./DeckTreeStatsCalculator";
import { t } from "./lang/helpers";
import SRPlugin from "./main";
import { NoteFileLoader } from "./NoteFileLoader";
import { ReviewResponse } from "./algorithms/base/RepetitionItem";

export interface IOsrVaultEvents {
    dataChanged: () => void;
}

export class OsrVaultData {
    private app: App;
    private settings: SRSettings;
    private _syncLock = false;
    private _easeByPath: NoteEaseList;
    private _questionPostponementList: QuestionPostponementList;
    private osrNoteGraph: OsrNoteGraph;
    private _noteReviewQueue: NoteReviewQueue;

    private fullDeckTree: Deck;
    private _reviewableDeckTree: Deck = new Deck("root", null);
    private _remainingDeckTree: Deck;
    private _cardStats: Stats;

    get syncLock(): boolean {
        return 
    }

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

    init(plugin: SRPlugin, settings: SRSettings, buryList: string[]): void {
        this._noteReviewQueue = new NoteReviewQueue();
        this._questionPostponementList = new QuestionPostponementList(
            plugin,
            settings,
            buryList,
        );

    }

    clearPostponementListIfNewDay(data: PluginData): boolean {
        const now = window.moment(Date.now());
        const todayDate: string = now.format("YYYY-MM-DD");

        // clear bury list if we've changed dates
        const newDay: boolean = todayDate !== data.buryDate;
        if (newDay) {
            data.buryDate = todayDate;
            this._questionPostponementList.clear();
        }  
        return newDay;      
    }
    
    async sync(app: App, settings: SRSettings): Promise<void> {
        if (this._syncLock) {
            return;
        }
        this._syncLock = true;
        this.app = app;
        this.settings = settings;

        try {
            const notes: TFile[] = app.vault.getMarkdownFiles();
            for (const noteFile of notes) {
                if (SettingsUtil.isPathInNoteIgnoreFolder(settings, noteFile.path)) {
                    continue;
                }
    
                // Does the note contain any tags that are specified as flashcard tags in the settings
                // (Doing this check first saves us from loading and parsing the note if not necessary)
                const file: SrTFile = this.createSrTFile(noteFile);
                await this.processFile(file);
            }
        } finally {
            this._syncLock = false;
        }        
    }

    private loadInit(): void {
        // reset notes stuff
        this.osrNoteGraph = new OsrNoteGraph(new ObsidianVaultNoteLinkInfoFinder(this.app.metadataCache));
        this._noteReviewQueue.init();

        // reset flashcards stuff
        this.fullDeckTree = new Deck("root", null);

    }
    
    private async processFile(noteFile: ISRFile): Promise<void> {

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

    private finaliseLoad(): void {

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

        this.updateAndSortDueNotes();
    }

    async saveNoteReviewResponse(noteFile: ISRFile, response: ReviewResponse, settings: SRSettings, buryList: string[]): Promise<boolean> {
        const noteSchedule: RepItemScheduleInfo = await DataStoreAlgorithm.getInstance().noteGetSchedule(noteFile);
        const updatedNoteSchedule: RepItemScheduleInfo = SrsAlgorithm.getInstance().noteCalcUpdatedSchedule(noteFile.path, noteSchedule, response);
        await DataStoreAlgorithm.getInstance().noteSetSchedule(noteFile, updatedNoteSchedule);

        // Common
        let result: boolean = false;
        if (settings.burySiblingCards) {
            const topicPath: TopicPath = this.findTopicPath(noteFile);
            const noteX: Note = await this.loadNote(noteFile, topicPath);
            for (const question of noteX.questionList) {
                buryList.push(question.questionText.textHash);
            }
            result = true;
        }
        return result;
    }

    async loadNote(noteFile: ISRFile, topicPath: TopicPath): Promise<Note> {
        const loader: NoteFileLoader = new NoteFileLoader(this.settings);
        const note: Note = await loader.load(noteFile, topicPath);
        if (note.hasChanged) {
            note.writeNoteFile(this.settings);
        }
        return note;
    }
    
    createSrTFile(note: TFile): SrTFile {
        return new SrTFile(this.app.vault, this.app.metadataCache, note);
    }

    private findTopicPath(note: ISRFile): TopicPath {
        return TopicPath.getTopicPathOfFile(note, this.settings);
    }

}