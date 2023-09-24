import { CardListType, Deck } from "./Deck";
import { DeckTreeIterator, IDeckTreeIterator } from "./DeckTreeIterator";
import { Card } from "./Card";
import { Stats } from "./stats";
import { CardScheduleInfo } from "./CardSchedule";

export class DeckTreeStatsCalculator {
    private deckTree: Deck;

    calculate(deckTree: Deck): Stats {
        let iterator: IDeckTreeIterator = new DeckTreeIterator(CardListType.NewCard);
        let result = new Stats();
        iterator.setDeck(deckTree);
        while (iterator.nextCard()) {
            let card: Card = iterator.currentCard;
            if (card.hasSchedule) {
                let schedule: CardScheduleInfo = card.scheduleInfo;
                result.update(schedule.delayBeforeReviewDays, schedule.interval, schedule.ease);
            } else {
                result.incrementNew();
            }

        }
        return result;
    }
}