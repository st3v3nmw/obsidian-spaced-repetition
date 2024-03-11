import { Deck } from "./Deck";
import {
    CardOrder,
    DeckOrder,
    DeckTreeIterator,
    IDeckTreeIterator,
    IIteratorOrder,
} from "./DeckTreeIterator";
import { Card } from "./Card";
import { Stats } from "./stats";
import { TopicPath } from "./TopicPath";
import { RepItemScheduleInfo } from "./algorithms/base/RepItemScheduleInfo";

export class DeckTreeStatsCalculator {
    private deckTree: Deck;

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
                result.update(schedule.delayedBeforeReviewDaysInt(), schedule.interval, schedule.latestEase);
            } else {
                result.incrementNew();
            }
        }
        return result;
    }
}
