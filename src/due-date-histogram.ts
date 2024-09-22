import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { OsrNoteGraph } from "src/algorithms/osr/osr-note-graph";
import { Card } from "src/card";
import { TICKS_PER_DAY } from "src/constants";
import { Deck } from "src/deck";
import {
    CardOrder,
    DeckOrder,
    DeckTreeIterator,
    IDeckTreeIterator,
    IIteratorOrder,
} from "src/deck-tree-iterator";
import { NoteReviewDeck, SchedNote } from "src/note-review-deck";
import { TopicPath } from "src/topic-path";
import { globalDateProvider } from "src/utils/dates";

export class DueDateHistogram {
    // The key for dueDatesNotes is the number of days after today
    // therefore the key to lookup how many cards are due today is 0
    public static dueNowNDays: number = 0;

    // Key - # of days in future
    // Value - Count of notes due
    dueDatesMap: Map<number, number> = new Map<number, number>();

    constructor(rec: Record<number, number> = null) {
        this.dueDatesMap = new Map<number, number>();
        if (rec != null) {
            Object.entries(rec).forEach(([key, value]) => {
                this.dueDatesMap.set(Number(key), value);
            });
        }
    }

    get dueNotesCount(): number {
        let result: number = 0;
        if (this.dueDatesMap.has(DueDateHistogram.dueNowNDays))
            result = this.dueDatesMap.get(DueDateHistogram.dueNowNDays);
        return result;
    }

    hasEntryForDays(days: number): boolean {
        return this.dueDatesMap.has(days);
    }

    set(days: number, value: number): void {
        this.dueDatesMap.set(days, value);
    }

    get(days: number): number {
        return this.dueDatesMap.get(days);
    }

    increment(days: number): void {
        let value: number = 0;
        if (this.dueDatesMap.has(days)) {
            value = this.dueDatesMap.get(days);
        }
        this.dueDatesMap.set(days, value + 1);
    }

    decrement(days: number): void {
        let value: number = 0;
        if (this.dueDatesMap.has(days)) value = this.dueDatesMap.get(days);
        if (value > 0) {
            this.dueDatesMap.set(days, value - 1);
        }
    }

    findLeastUsedIntervalOverRange(originalInterval: number, fuzz: number): number {
        if (!this.hasEntryForDays(originalInterval)) {
            // There are no entries for the interval originalInterval - can't get a better result
            return originalInterval;
        }
        let interval: number = originalInterval;
        outer: for (let i = 1; i <= fuzz; i++) {
            for (const ivl of [originalInterval - i, originalInterval + i]) {
                if (!this.hasEntryForDays(ivl)) {
                    // There are no entries for the interval ivl - can't get a better result
                    interval = ivl;
                    break outer;
                }

                // We've found a better result, but keep searching
                if (this.dueDatesMap.get(ivl) < this.dueDatesMap.get(interval)) interval = ivl;
            }
        }
        return interval;
    }
}

export class NoteDueDateHistogram extends DueDateHistogram {
    calculateFromReviewDecksAndSort(
        reviewDecks: Map<string, NoteReviewDeck>,
        osrNoteGraph: OsrNoteGraph,
    ): void {
        this.dueDatesMap = new Map<number, number>();

        const today: number = globalDateProvider.today.valueOf();
        reviewDecks.forEach((reviewDeck: NoteReviewDeck) => {
            reviewDeck.scheduledNotes.forEach((scheduledNote: SchedNote) => {
                const nDays: number = Math.ceil((scheduledNote.dueUnix - today) / TICKS_PER_DAY);
                this.increment(nDays);
            });

            reviewDeck.sortNotesByDateAndImportance(osrNoteGraph.pageranks);
        });
    }
}

export class CardDueDateHistogram extends DueDateHistogram {
    calculateFromDeckTree(deckTree: Deck): void {
        this.dueDatesMap = new Map<number, number>();

        // Order doesn't matter as long as we iterate over everything
        const iteratorOrder: IIteratorOrder = {
            deckOrder: DeckOrder.PrevDeckComplete_Sequential,
            cardOrder: CardOrder.DueFirstSequential,
        };

        // Iteration is a destructive operation on the supplied tree, so we first take a copy
        const today: number = globalDateProvider.today.valueOf();
        const iterator: IDeckTreeIterator = new DeckTreeIterator(iteratorOrder, deckTree.clone());
        iterator.setIteratorTopicPath(TopicPath.emptyPath);
        while (iterator.nextCard()) {
            const card: Card = iterator.currentCard;
            if (card.hasSchedule) {
                const scheduledCard: RepItemScheduleInfo = card.scheduleInfo;

                const nDays: number = Math.ceil(
                    (scheduledCard.dueDateAsUnix - today) / TICKS_PER_DAY,
                );
                this.increment(nDays);
            }
        }
    }
}
