import { Deck } from "./Deck";
import {
    CardListOrder,
    DeckTreeIterator,
    IDeckTreeIterator,
    IIteratorOrder,
    IteratorDeckSource,
    OrderMethod,
} from "./DeckTreeIterator";
import { Card } from "./Card";
import { Stats } from "./stats";
import { CardScheduleInfo } from "./CardSchedule";

export class DeckTreeStatsCalculator {
    private deckTree: Deck;

    calculate(deckTree: Deck): Stats {
        // Order doesn't matter as long as we iterate over everything
        const iteratorOrder: IIteratorOrder = {
            deckOrder: OrderMethod.Sequential,
            cardListOrder: CardListOrder.DueFirst,
            cardOrder: OrderMethod.Sequential,
        };
        const iterator: IDeckTreeIterator = new DeckTreeIterator(
            iteratorOrder,
            IteratorDeckSource.CloneBeforeUse,
        );
        const result = new Stats();
        iterator.setDeck(deckTree);
        while (iterator.nextCard()) {
            const card: Card = iterator.currentCard;
            if (card.hasSchedule) {
                const schedule: CardScheduleInfo = card.scheduleInfo;
                result.update(schedule.delayBeforeReviewDaysInt, schedule.interval, schedule.ease);
            } else {
                result.incrementNew();
            }
        }
        return result;
    }
}
