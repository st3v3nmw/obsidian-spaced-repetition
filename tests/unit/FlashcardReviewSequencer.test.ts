import { CardScheduleCalculator } from "src/CardSchedule";
import { DeckTreeSequentialIterator, IDeckTreeIterator } from "src/DeckTreeIterator";
import { FlashcardReviewMode, FlashcardReviewSequencer, IFlashcardReviewSequencer } from "src/FlashcardReviewSequencer";
import { TopicPath } from "src/TopicPath";
import { CardListType, Deck } from "src/deck";
import { DEFAULT_SETTINGS } from "src/settings";
import { SampleItemDecks } from "./SampleItems";

let cardSequencer: IDeckTreeIterator = new DeckTreeSequentialIterator(CardListType.DueCard);
let cardScheduleCalculator: CardScheduleCalculator = new CardScheduleCalculator();
let reviewSequencer: IFlashcardReviewSequencer = new FlashcardReviewSequencer(FlashcardReviewMode.Review, cardSequencer, DEFAULT_SETTINGS, cardScheduleCalculator);

describe("setDeckTree", () => {

    test("Empty deck", () => {
        reviewSequencer.setDeckTree(Deck.emptyDeck);
        expect(reviewSequencer.currentDeck).toEqual(null);
        expect(reviewSequencer.currentCard).toEqual(null);
    });

    // After setDeckTree, the first card in the deck is the current card
    test("Single level deck with some new cards", async () => {
        let text: string = `
Q1::A1
Q2::A2
Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromNote(text, new TopicPath(["flashcards"]));
        expect(deck.newFlashcards.length).toEqual(3);
        reviewSequencer.setDeckTree(deck);
        expect(reviewSequencer.currentDeck.newFlashcards.length).toEqual(3);
        expect(reviewSequencer.currentDeck.getCardCount(CardListType.All, true)).toEqual(2);
        expect(reviewSequencer.currentDeck.getCardCount(CardListType.All, true)).toEqual(2);
        let expected = {
            front: "Q1", 
            back: "A1"
        };
        expect(reviewSequencer.currentCard).toMatchObject(expected);
    });
});