import { CardListType } from "./Deck";
import { DueDateHistogram } from "./DueDateHistogram";
import { NoteReviewDeck, SchedNote } from "./NoteReviewDeck";
import { ISRFile } from "./SRFile";
import { RepItemScheduleInfo } from "./algorithms/base/RepItemScheduleInfo";

export class NoteReviewQueue {
    public reviewDecks: Map<string, NoteReviewDeck>;
    public dueNotesCount: number = 0;
    public dueDatesHistogram: DueDateHistogram;

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
    
    determineScheduleInfo() {
        this.dueNotesCount = 0;
        this.dueDatesHistogram = new DueDateHistogram();

        const now = window.moment(Date.now());
        this.reviewDecks.values.forEach((reviewDeck: NoteReviewDeck) => {
            reviewDeck.dueNotesCount = 0;
            reviewDeck.scheduledNotes.forEach((scheduledNote: SchedNote) => {
                if (scheduledNote.dueUnix <= now.valueOf()) {
                    reviewDeck.dueNotesCount++;
                    this.dueNotesCount++;
                }

                const nDays: number = Math.ceil(
                    (scheduledNote.dueUnix - now.valueOf()) / (24 * 3600 * 1000),
                );
                this.dueDatesHistogram.increment(nDays);
            });

            reviewDeck.sortNotesByDateAndImportance(this.osrNoteGraph.pageranks);
        });

        this.statusBar.setText(
            t("STATUS_BAR", {
                dueNotesCount: this.dueNotesCount,
                dueFlashcardsCount: this.remainingDeckTree.getCardCount(CardListType.All, true),
            }),
        );

        if (this.data.settings.enableNoteReviewPaneOnStartup) this.reviewQueueView.redraw();
    }

}