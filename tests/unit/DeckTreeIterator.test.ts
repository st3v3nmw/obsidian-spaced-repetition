import { IQuestionContextFinder, NoteQuestionParser, NullImpl_IQuestionContextFinder } from "src/NoteQuestionParser";
import { CardListType, Deck } from "src/deck";
import { DEFAULT_SETTINGS } from "src/settings";
import { SampleItemDecks } from "./SampleItems";
import { TopicPath } from "src/TopicPath";
import { DeckTreeSequentialIterator } from "src/DeckTreeIterator";

let questionContextFinder: IQuestionContextFinder = new NullImpl_IQuestionContextFinder();
let parser: NoteQuestionParser = new NoteQuestionParser(DEFAULT_SETTINGS, questionContextFinder);
let refDate: Date = new Date(2023, 8, 6);
var iterator: DeckTreeSequentialIterator;

describe("setDeck", () => {
    test("currentDeck null immediately after setDeck", async () => {
        let text: string = `
        Q1::A1
        Q2::A2
        Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromNote(text, new TopicPath(["Root"]));
        let iterator: DeckTreeSequentialIterator = new DeckTreeSequentialIterator(CardListType.NewCard);
        iterator.setDeck(deck);
        expect(iterator.currentDeck).toEqual(null);
    });
});


describe("nextCard", () => {
    test("Single topic, new cards only", async () => {
        let text: string = `
        Q1::A1
        Q2::A2
        Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromNote(text, new TopicPath(["Root"]));
        let iterator: DeckTreeSequentialIterator = new DeckTreeSequentialIterator(CardListType.NewCard);
        iterator.setDeck(deck);
        
        expect(iterator.nextCard()).toEqual(true);
        expect(iterator.currentDeck.deckName).toEqual("Root");
        expect(iterator.currentCard.front).toEqual("Q1");

        expect(iterator.nextCard()).toEqual(true);
        expect(iterator.currentCard.front).toEqual("Q2");

        expect(iterator.nextCard()).toEqual(true);
        expect(iterator.currentCard.front).toEqual("Q3");

        expect(iterator.nextCard()).toEqual(false);

    });
});

describe("nextCard", () => {
    describe("Single topic, mixture of new and scheduled cards", () => {
        test("Get the new cards first", async () => {
            let text: string = `
            Q1::A1
            Q2::A2 <!--SR:!2023-09-02,4,270-->
            Q3::A3
            Q4::A4 <!--SR:!2023-09-02,4,270-->
            Q5::A5 <!--SR:!2023-09-02,4,270-->
            Q6::A6`;
            let deck: Deck = await SampleItemDecks.createDeckFromNote(text, new TopicPath(["Root"]));
            iterator = new DeckTreeSequentialIterator(CardListType.NewCard);
            iterator.setDeck(deck);
            
            // New cards first
            checkNextCard("Q1");
            checkNextCard("Q3");
            checkNextCard("Q6");
            
            // Scheduled cards next
            checkNextCard("Q2");
            checkNextCard("Q4");
            checkNextCard("Q5");

            // Check no more
            expect(iterator.nextCard()).toEqual(false);

        });
    });
});

function checkNextCard(expectedFront: string): void {
    expect(iterator.nextCard()).toEqual(true);
    expect(iterator.currentCard.front).toEqual(expectedFront);

}
