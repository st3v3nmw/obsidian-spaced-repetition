import { NoteQuestionParser } from "src/NoteQuestionParser";
import { CardListType, Deck } from "src/Deck";
import { DEFAULT_SETTINGS } from "src/settings";
import { SampleItemDecks } from "./SampleItems";
import { TopicPath } from "src/TopicPath";
import { DeckTreeSequentialIterator } from "src/DeckTreeIterator";
import { StaticDateProvider, globalDateProvider, setupStaticDateProvider_20230906 } from "src/util/DateProvider";

let parser: NoteQuestionParser = new NoteQuestionParser(DEFAULT_SETTINGS);
var iterator: DeckTreeSequentialIterator;

beforeAll(() =>  {
    setupStaticDateProvider_20230906();
})

describe("setDeck", () => {
    test("currentDeck null immediately after setDeck", async () => {
        let text: string = `
        Q1::A1
        Q2::A2
        Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, new TopicPath(["Root"]));
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
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, new TopicPath(["Root"]));
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

    describe("Single topic, mixture of new and scheduled cards", () => {
        test("Get the new cards first", async () => {
            let text: string = `
            Q1::A1
            Q2::A2 <!--SR:!2023-09-02,4,270-->
            Q3::A3
            Q4::A4 <!--SR:!2023-09-02,4,270-->
            Q5::A5 <!--SR:!2023-09-02,4,270-->
            Q6::A6`;
            let deck: Deck = await SampleItemDecks.createDeckFromText(text, new TopicPath(["Root"]));
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

        test("Get the scheduled cards first", async () => {
            let text: string = `
            Q1::A1
            Q2::A2 <!--SR:!2023-09-02,4,270-->
            Q3::A3
            Q4::A4 <!--SR:!2023-09-02,4,270-->
            Q5::A5 <!--SR:!2023-09-02,4,270-->
            Q6::A6`;
            let deck: Deck = await SampleItemDecks.createDeckFromText(text, new TopicPath(["Root"]));
            iterator = new DeckTreeSequentialIterator(CardListType.DueCard);
            iterator.setDeck(deck);
            
            // Scheduled cards first
            checkNextCard("Q2");
            checkNextCard("Q4");
            checkNextCard("Q5");
            
            // New cards next
            checkNextCard("Q1");
            checkNextCard("Q3");
            checkNextCard("Q6");

            // Check no more
            expect(iterator.nextCard()).toEqual(false);

        });
    });

    describe("Multiple topics, mixture of new and scheduled cards", () => {
        test("Get the ancestor deck's cards first, then descendants", async () => {
            let text: string = `
            #flashcards Q1::A1
            #flashcards Q2::A2 <!--SR:!2023-09-02,4,270-->
            #flashcards Q3::A3

#flashcards/science Q4::A4 <!--SR:!2023-09-02,4,270-->
            #flashcards/science Q5::A5

            #flashcards/science/physics Q6::A6
            #flashcards/science/physics Q7::A7
            
            #flashcards/science/chemistry Q8::A8
                        `;
            let deck: Deck = await SampleItemDecks.createDeckFromText(text, new TopicPath(["Root"]));
            iterator = new DeckTreeSequentialIterator(CardListType.NewCard);
            iterator.setDeck(deck);
            
            // New root deck's cards first
            checkNextCard("Q1");
            checkNextCard("Q3");
            checkNextCard("Q2");
            
            // Then subdeck #flashcards/science
            checkNextCard("Q5");
            checkNextCard("Q4");

            // Then subdeck #flashcards/science/physics
            checkNextCard("Q6");
            checkNextCard("Q7");

            // Then subdeck #flashcards/science/chemistry
            checkNextCard("Q8");

            // Check no more
            expect(iterator.nextCard()).toEqual(false);

        });
    });
});

describe("deleteCurrentCard", () => {
    test("Delete after all cards iterated - exception throw", async () => {
        let text: string = `
        Q1::A1
        Q2::A2 usim
        Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, new TopicPath(["Root"]));
        iterator = new DeckTreeSequentialIterator(CardListType.NewCard);
        iterator.setDeck(deck);
        
        expect(iterator.nextCard()).toEqual(true);
        expect(iterator.nextCard()).toEqual(true);
        expect(iterator.nextCard()).toEqual(true);
        expect(iterator.nextCard()).toEqual(false);

        const t = () => {
            iterator.deleteCurrentCard();
        };
        expect(t).toThrow();
    });

    test("Delete card, with single card remaining after it", async () => {
        let text: string = `
        Q1::A1
        Q2::A2
        Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, new TopicPath(["Root"]));
        expect(deck.newFlashcards.length).toEqual(3);
        iterator = new DeckTreeSequentialIterator(CardListType.NewCard);
        iterator.setDeck(deck);
        
        checkNextCard("Q1");
        checkNextCard("Q2");
        expect(iterator.deleteCurrentCard()).toEqual(true);
        expect(iterator.currentCard.front).toEqual("Q3");
        expect(iterator.deleteCurrentCard()).toEqual(false);
    });

});

function checkNextCard(expectedFront: string): void {
    expect(iterator.nextCard()).toEqual(true);
    expect(iterator.currentCard.front).toEqual(expectedFront);

}
