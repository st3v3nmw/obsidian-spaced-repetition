import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ISRFile } from "src/file";
import { NoteReviewDeck, SchedNote } from "src/note/note-review-deck";

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
        for (const reviewDeck of this.reviewDecks.values()) {
            const isNewNoteInDeck = reviewDeck.newNotes.some(
                (newNote) => newNote.path === note.path,
            );
            const isScheduledNoteInDeck = reviewDeck.scheduledNotes.some(
                (scheduledNote) => scheduledNote.note.path === note.path,
            );
            const isInDeck = isNewNoteInDeck || isScheduledNoteInDeck;

            if (!isInDeck) continue;

            if (isNewNoteInDeck) {
                // It was a new note, remove it from the new notes and schedule it.
                const indexOfNote = reviewDeck.newNotes.findIndex(
                    (newNote) => newNote.path === note.path,
                );
                reviewDeck.newNotes.splice(indexOfNote, 1);
                reviewDeck.scheduledNotes.push(new SchedNote(note, scheduleInfo.dueDate.valueOf()));
            } else if (isScheduledNoteInDeck) {
                const scheduledNote = reviewDeck.scheduledNotes.find(
                    (scheduledNote) => scheduledNote.note.path === note.path,
                );
                scheduledNote.dueUnix = scheduleInfo.dueDate.valueOf();
            }

            break;
        }
    }
}
