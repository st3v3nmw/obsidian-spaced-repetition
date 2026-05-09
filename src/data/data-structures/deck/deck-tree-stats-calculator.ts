import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { Card } from "src/data/data-structures/card/card";
import { Deck } from "src/data/data-structures/deck/deck";
import {
    CardOrder,
    DeckOrder,
    DeckTreeIterator,
    IDeckTreeIterator,
    IIteratorOrder,
} from "src/data/data-structures/deck/deck-tree-iterator";
import { Stats } from "src/data/data-structures/deck/stats";
import { TopicPath } from "src/data/data-structures/deck/topic-path";

export class DeckTreeStatsCalculator {
    calculate(deckTree: Deck): Stats {
        // Order doesn't matter as long as we iterate over everything
        const iteratorOrder: IIteratorOrder = {
            deckOrder: DeckOrder.PrevDeckComplete_Sequential,
            cardOrder: CardOrder.DueFirstSequential,
        };
        // Iteration is a destructive operation on the supplied tree, so we first take a copy
        const iterator: IDeckTreeIterator = new DeckTreeIterator(iteratorOrder, deckTree.clone());
        const stats: Stats = new Stats();
        iterator.setIteratorTopicPath(TopicPath.emptyPath);
        while (iterator.nextCard()) {
            const card: Card | null = iterator.currentCard;
            if (card === null) continue;
            if (card.scheduleInfo !== null) {
                const schedule: RepItemScheduleInfo = card.scheduleInfo;
                stats.update(
                    schedule.delayedBeforeReviewDaysInt(),
                    schedule.interval,
                    schedule.latestEase,
                );
            } else {
                stats.incrementNew();
            }
        }
        return stats;
    }
}
