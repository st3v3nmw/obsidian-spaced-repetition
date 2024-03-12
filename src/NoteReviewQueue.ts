import { App, Notice, Workspace } from "obsidian";
import { DueDateHistogram } from "./DueDateHistogram";
import { NoteReviewDeck, SchedNote } from "./NoteReviewDeck";
import { ISRFile } from "./SRFile";
import { RepItemScheduleInfo } from "./algorithms/base/RepItemScheduleInfo";
import { OsrNoteGraph } from "./algorithms/osr/OsrNoteGraph";
import { globalDateProvider } from "./util/DateProvider";
import { SRSettings } from "./settings";

export class NoteReviewQueue {
    private _reviewDecks: Map<string, NoteReviewDeck>;
    private _dueNotesCount: number = 0;
    private _dueDatesHistogram: DueDateHistogram;

    get reviewDecks(): Map<string, NoteReviewDeck> {
        return this._reviewDecks;
    }

    get dueNotesCount(): number {
        return this._dueNotesCount;
    }

    get dueDatesHistogram(): DueDateHistogram {
        return this._dueDatesHistogram;
    }

    init(): void {
        this._reviewDecks = new Map<string, NoteReviewDeck>();
        this._dueNotesCount = 0;
        this._dueDatesHistogram = new DueDateHistogram();
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
    
    determineScheduleInfo(osrNoteGraph: OsrNoteGraph): void {
        this._dueNotesCount = 0;
        this._dueDatesHistogram = new DueDateHistogram();

        const today = globalDateProvider.today;
        Object.values(this.reviewDecks).forEach((reviewDeck: NoteReviewDeck) => {
            reviewDeck.dueNotesCount = 0;
            reviewDeck.scheduledNotes.forEach((scheduledNote: SchedNote) => {
                if (scheduledNote.dueUnix <= today.valueOf()) {
                    reviewDeck.dueNotesCount++;
                    this._dueNotesCount++;
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
}