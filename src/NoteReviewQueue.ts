import { App, Notice, Workspace } from "obsidian";
import { CardListType } from "./Deck";
import { DueDateHistogram } from "./DueDateHistogram";
import { NoteReviewDeck, ReviewDeckSelectionModal, SchedNote } from "./NoteReviewDeck";
import { ISRFile } from "./SRFile";
import { RepItemScheduleInfo } from "./algorithms/base/RepItemScheduleInfo";
import { OsrNoteGraph } from "./algorithms/osr/OsrNoteGraph";
import { globalDateProvider } from "./util/DateProvider";
import { t } from "./lang/helpers";
import { SRSettings } from "./settings";

export class NoteReviewQueue {
    private app: App;
    public reviewDecks: Map<string, NoteReviewDeck>;
    public dueNotesCount: number = 0;
    public dueDatesHistogram: DueDateHistogram;
    public lastSelectedReviewDeck: string;
    private settings: SRSettings;
    private workspace: Workspace;

    init() {
        this.reviewDecks = new Map<string, NoteReviewDeck>();
        this.dueNotesCount = 0;
        this.dueDatesHistogram = new DueDateHistogram();
    }

    addNoteToQueue(noteFile: ISRFile, noteSchedule: RepItemScheduleInfo, matchedNoteTags: string[]): void {
        for (const matchedNoteTag of matchedNoteTags) {
            if (!this.reviewDecks.has(matchedNoteTag)) {
                this.reviewDecks.set(matchedNoteTag, new NoteReviewDeck(matchedNoteTag));
            }
        }
        if (noteSchedule == null) {
            for (const matchedNoteTag of matchedNoteTags) {
                this.reviewDecks.get(matchedNoteTag).newNotes.push(noteFile);
            }
        } else {
            // schedule the note
            for (const matchedNoteTag of matchedNoteTags) {
                this.reviewDecks.get(matchedNoteTag).scheduledNotes.push({ note: noteFile, dueUnix: noteSchedule.dueDateAsUnix });
            }
        }
    }
    
    determineScheduleInfo(osrNoteGraph: OsrNoteGraph) {
        this.dueNotesCount = 0;
        this.dueDatesHistogram = new DueDateHistogram();

        const today = globalDateProvider.today;
        Object.values(this.reviewDecks).forEach((reviewDeck: NoteReviewDeck) => {
            reviewDeck.dueNotesCount = 0;
            reviewDeck.scheduledNotes.forEach((scheduledNote: SchedNote) => {
                if (scheduledNote.dueUnix <= today.valueOf()) {
                    reviewDeck.dueNotesCount++;
                    this.dueNotesCount++;
                }

                const nDays: number = Math.ceil(
                    (scheduledNote.dueUnix - today.valueOf()) / (24 * 3600 * 1000),
                );
                this.dueDatesHistogram.increment(nDays);
            });

            reviewDeck.sortNotesByDateAndImportance(osrNoteGraph.pageranks);
        });
    }

    updateScheduleInfo(note: ISRFile, scheduleInfo: RepItemScheduleInfo): void {
        Object.values(this.reviewDecks).forEach((reviewDeck: NoteReviewDeck) => {
            let wasDueInDeck = false;
            for (const scheduledNote of reviewDeck.scheduledNotes) {
                if (scheduledNote.note.path === note.path) {
                    scheduledNote.dueUnix = scheduleInfo.dueDate.valueOf();
                    wasDueInDeck = true;
                    break;
                }
            }

            // It was a new note, remove it from the new notes and schedule it.
            if (!wasDueInDeck) {
                reviewDeck.newNotes.splice(
                    reviewDeck.newNotes.findIndex((newNote: ISRFile) => newNote.path === note.path),
                    1,
                );
                reviewDeck.scheduledNotes.push({ note, dueUnix: scheduleInfo.dueDate.valueOf() });
            }
        });

    }

    async autoReviewNextNote(): Promise<void> {
        if (this.settings.autoNextNote) {
            if (!this.lastSelectedReviewDeck) {
                const reviewDeckKeys: string[] = Object.keys(this.reviewDecks);
                if (reviewDeckKeys.length > 0) this.lastSelectedReviewDeck = reviewDeckKeys[0];
                else {
                    new Notice(t("ALL_CAUGHT_UP"));
                    return;
                }
            }
            this.reviewNextNote(this.lastSelectedReviewDeck);
        }
    }

    async reviewNextNoteModal(): Promise<void> {
        const reviewDeckNames: string[] = Object.keys(this.reviewDecks);

        if (reviewDeckNames.length === 1) {
            this.reviewNextNote(reviewDeckNames[0]);
        } else {
            const deckSelectionModal = new ReviewDeckSelectionModal(this.app, reviewDeckNames);
            deckSelectionModal.submitCallback = (deckKey: string) => this.reviewNextNote(deckKey);
            deckSelectionModal.open();
        }
    }

    async reviewNextNote(deckKey: string): Promise<void> {
        if (!Object.prototype.hasOwnProperty.call(this.reviewDecks, deckKey)) {
            new Notice(t("NO_DECK_EXISTS", { deckName: deckKey }));
            return;
        }

        this.lastSelectedReviewDeck = deckKey;
        const deck = this.reviewDecks.get(deckKey);

        if (deck.dueNotesCount > 0) {
            const index = this.settings.openRandomNote
                ? Math.floor(Math.random() * deck.dueNotesCount)
                : 0;
            await this.workspace.getLeaf().openFile(deck.scheduledNotes[index].note.tfile);
            return;
        }

        if (deck.newNotes.length > 0) {
            const index = this.settings.openRandomNote
                ? Math.floor(Math.random() * deck.newNotes.length)
                : 0;
            this.workspace.getLeaf().openFile(deck.newNotes[index].tfile);
            return;
        }

        new Notice(t("ALL_CAUGHT_UP"));
    }
}