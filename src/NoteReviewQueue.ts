import { NoteReviewDeck } from "./NoteReviewDeck";
import { ISRFile } from "./SRFile";
import { RepItemScheduleInfo } from "./algorithms/base/RepItemScheduleInfo";

export class NoteReviewQueue {
    private _reviewDecks: Map<string, NoteReviewDeck>;

    get reviewDecks(): Map<string, NoteReviewDeck> {
        return this._reviewDecks;
    }

    get dueNotesCount(): number {
        let result: number = 0;
        this._reviewDecks.forEach((reviewDeck: NoteReviewDeck) => {
            result += reviewDeck.dueNotesCount;
        });
        return result;
    }

    init(): void {
        this._reviewDecks = new Map<string, NoteReviewDeck>();
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
                    .scheduledNotes.push({ note: noteFile, dueUnix: noteSchedule.dueDateAsUnix });
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
                reviewDeck.scheduledNotes.push({ note, dueUnix: scheduleInfo.dueDate.valueOf() });
            }
        });
    }
}
