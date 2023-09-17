import { CardListType, Deck } from "./Deck";
import { DeckTreeSequentialIterator, IDeckTreeIterator } from "./DeckTreeIterator";
import { Card } from "./Card";
import { Stats } from "./stats";
import { CardScheduleInfo } from "./CardSchedule";

export class DeckTreeStatsCalculator {
    private deckTree: Deck;

    calculate(deckTree: Deck): Stats {
        let iterator: IDeckTreeIterator = new DeckTreeSequentialIterator(CardListType.NewCard);
        let result = new Stats();
        iterator.setDeck(deckTree);
        while (iterator.nextCard()) {
            let card: Card = iterator.currentCard;
            let schedule: CardScheduleInfo = card.scheduleInfo;
            if (schedule != null) {
                result.update(schedule.delayBeforeReviewDays, schedule.interval, schedule.ease);
            }
        }
        return result;
    }
}