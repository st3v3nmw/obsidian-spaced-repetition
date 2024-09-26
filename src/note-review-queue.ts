import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ISRFile } from "src/file";
import { NoteReviewDeck, SchedNote } from "src/note-review-deck";

export class NoteReviewQueue {
    private _reviewDecks: Map<string, NoteReviewDeck>;
    private _dueNotesCount: number;

    get reviewDecks(): Map<string, NoteReviewDeck> {
        return this._reviewDecks;
    }

    get dueNotesCount(): number {
        return this._dueNotesCount;
    }

    get reviewDeckNameList(): string[] {
        return [...this._reviewDecks.keys()];
    }

    init(): void {
        this._reviewDecks = new Map<string, NoteReviewDeck>();
    }

    public calcDueNotesCount(todayUnix: number): void {
        this._dueNotesCount = 0;
        this._reviewDecks.forEach((reviewDeck: NoteReviewDeck) => {
            reviewDeck.calcDueNotesCount(todayUnix);
            this._dueNotesCount += reviewDeck.dueNotesCount;
        });
    }

    addNoteToQueue(
        noteFile: ISRFile,
        noteSchedule: RepItemScheduleInfo,
        matchedNoteTags: string[],
    ): void {
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
                this.reviewDecks
                    .get(matchedNoteTag)
                    .scheduledNotes.push(new SchedNote(noteFile, noteSchedule.dueDateAsUnix));
            }
        }
    }

    updateScheduleInfo(note: ISRFile, scheduleInfo: RepItemScheduleInfo): void {
        this.reviewDecks.forEach((reviewDeck: NoteReviewDeck) => {
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
                reviewDeck.scheduledNotes.push(new SchedNote(note, scheduleInfo.dueDate.valueOf()));
            }
        });
    }
}
