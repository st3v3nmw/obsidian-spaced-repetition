import { NoteReviewDeck, SchedNote } from "./NoteReviewDeck";
import { OsrNoteGraph } from "./algorithms/osr/OsrNoteGraph";
import { globalDateProvider } from "./util/DateProvider";

export class DueDateHistogram {
    // Key - # of days in future
    // Value - Count of notes due
    dueNotesCount: number;
    dueDatesNotes: Map<number, number> = new Map<number, number>;

    init(): void {
        this.dueNotesCount = 0;
        this.dueDatesNotes = new Map<number, number>;
    }

    hasEntryForDays(days: number): boolean {
        return this.dueDatesNotes.has(days);
    }

    set(days: number, value: number): void {
        this.dueDatesNotes.set(days, value);
    }

    increment(days: number): void {
        let value: number = 0;
        if (this.dueDatesNotes.has(days)) {
            value = this.dueDatesNotes.get(days);
        }
        this.dueDatesNotes.set(days, value + 1);
    }

    calculateFromReviewDecksAndSort(reviewDecks: Map<string, NoteReviewDeck>, osrNoteGraph: OsrNoteGraph): void {
        this.dueNotesCount = 0;
        this.dueDatesNotes = new Map<number, number>;

        const now: number = globalDateProvider.now.valueOf();
        Object.values(reviewDecks).forEach((reviewDeck: NoteReviewDeck) => {
            reviewDeck.dueNotesCount = 0;
            reviewDeck.scheduledNotes.forEach((scheduledNote: SchedNote) => {
                if (scheduledNote.dueUnix <= now) {
                    reviewDeck.dueNotesCount++;
                    this.dueNotesCount++;
                }

                const nDays: number = Math.ceil(
                    (scheduledNote.dueUnix - now) / (24 * 3600 * 1000),
                );
                this.increment(nDays);
            });

            reviewDeck.sortNotesByDateAndImportance(osrNoteGraph.pageranks);
        });
    }

    findLeastUsedIntervalOverRange(originalInterval: number, fuzz: number): number {
        let interval: number = originalInterval;
        outer: for (let i = 1; i <= fuzz; i++) {
            for (const ivl of [originalInterval - i, originalInterval + i]) {
                if (!this.hasEntryForDays(ivl)) {
                    // There are no entries for the interval ivl - can't get a better result
                    interval = ivl;
                    break outer;
                }

                // We've found a better result, but keep searching
                if (this.dueDatesNotes.get(ivl) < this.dueDatesNotes.get(interval)) interval = ivl;
            }
        }
        return interval;
    }
}