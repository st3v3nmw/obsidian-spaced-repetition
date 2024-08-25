import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { Card } from "src/card";
import { Deck } from "src/deck";
import {
    CardOrder,
    DeckOrder,
    DeckTreeIterator,
    IDeckTreeIterator,
    IIteratorOrder,
} from "src/deck-tree-iterator";
import { Stats } from "src/stats";
import { TopicPath } from "src/topic-path";

export class DeckTreeStatsCalculator {
    calculate(deckTree: Deck): Stats {
        // Order doesn't matter as long as we iterate over everything
        const iteratorOrder: IIteratorOrder = {
            deckOrder: DeckOrder.PrevDeckComplete_Sequential,
            cardOrder: CardOrder.DueFirstSequential,
        };
        // Iteration is a destructive operation on the supplied tree, so we first take a copy
        const iterator: IDeckTreeIterator = new DeckTreeIterator(iteratorOrder, deckTree.clone());
        const result = new Stats();
        iterator.setIteratorTopicPath(TopicPath.emptyPath);
        while (iterator.nextCard()) {
            const card: Card = iterator.currentCard;
            if (card.hasSchedule) {
                const schedule: RepItemScheduleInfo = card.scheduleInfo;
                result.update(
                    schedule.delayedBeforeReviewDaysInt(),
                    schedule.interval,
                    schedule.latestEase,
                );
            } else {
                result.incrementNew();
            }
        }
        return result;
    }
}
