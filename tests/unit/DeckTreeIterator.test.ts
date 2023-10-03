import { NoteQuestionParser } from "src/NoteQuestionParser";
import { CardListType, Deck } from "src/Deck";
import { DEFAULT_SETTINGS } from "src/settings";
import { SampleItemDecks } from "./SampleItems";
import { TopicPath } from "src/TopicPath";
import {
    CardListOrder,
    DeckTreeIterator,
    IIteratorOrder,
    IteratorDeckSource,
    OrderMethod,
} from "src/DeckTreeIterator";
import {
    StaticDateProvider,
    globalDateProvider,
    setupStaticDateProvider_20230906,
} from "src/util/DateProvider";
import { setupNextRandomNumber } from "src/util/RandomNumberProvider";

export var order_DueFirst_Sequential: IIteratorOrder = {
    cardOrder: OrderMethod.Sequential,
    cardListOrder: CardListOrder.DueFirst,
    deckOrder: OrderMethod.Sequential,
};
var order_DueFirst_Random: IIteratorOrder = {
    cardOrder: OrderMethod.Random,
    cardListOrder: CardListOrder.DueFirst,
    deckOrder: OrderMethod.Sequential,
};
var order_NewFirst_Sequential: IIteratorOrder = {
    cardOrder: OrderMethod.Sequential,
    cardListOrder: CardListOrder.NewFirst,
    deckOrder: OrderMethod.Sequential,
};

var iterator: DeckTreeIterator;

beforeAll(() => {
    setupStaticDateProvider_20230906();
});

describe("setDeck", () => {
    test("currentDeck null immediately after setDeck", async () => {
        let text: string = `
        Q1::A1
        Q2::A2
        Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, new TopicPath(["Root"]));
        let iterator: DeckTreeIterator = new DeckTreeIterator(
            order_NewFirst_Sequential,
            IteratorDeckSource.UpdatedByIterator,
        );
        iterator.setDeck(deck);
        expect(iterator.currentDeck).toEqual(null);
    });
});

describe("nextCard", () => {
    describe("Sequential ordering", () => {
        describe("Due cards before new cards", () => {
            test("Single topic, new cards only", async () => {
                let text: string = `
                Q1::A1
                Q2::A2
                Q3::A3`;
                let deck: Deck = await SampleItemDecks.createDeckFromText(
                    text,
                    new TopicPath(["Root"]),
                );
                let iterator: DeckTreeIterator = new DeckTreeIterator(
                    order_DueFirst_Sequential,
                    IteratorDeckSource.UpdatedByIterator,
                );
                iterator.setDeck(deck);

                // No due cards, so expect the new ones immediately
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
                test("Get the scheduled cards first", async () => {
                    let text: string = `
                    Q1::A1
                    Q2::A2 <!--SR:!2023-09-02,4,270-->
                    Q3::A3
                    Q4::A4 <!--SR:!2023-09-02,4,270-->
                    Q5::A5 <!--SR:!2023-09-02,4,270-->
                    Q6::A6`;
                    let deck: Deck = await SampleItemDecks.createDeckFromText(
                        text,
                        new TopicPath(["Root"]),
                    );
                    iterator = new DeckTreeIterator(
                        order_DueFirst_Sequential,
                        IteratorDeckSource.UpdatedByIterator,
                    );
                    iterator.setDeck(deck);

                    // Scheduled cards first
                    nextCardThenCheck("Q2");
                    nextCardThenCheck("Q4");
                    nextCardThenCheck("Q5");

                    // New cards next
                    nextCardThenCheck("Q1");
                    nextCardThenCheck("Q3");
                    nextCardThenCheck("Q6");

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
                    let deck: Deck = await SampleItemDecks.createDeckFromText(
                        text,
                        new TopicPath(["Root"]),
                    );
                    iterator = new DeckTreeIterator(
                        order_DueFirst_Sequential,
                        IteratorDeckSource.UpdatedByIterator,
                    );
                    iterator.setDeck(deck);

                    // Due root deck's cards first
                    nextCardThenCheck("Q2");

                    // Then the new cards
                    nextCardThenCheck("Q1");
                    nextCardThenCheck("Q3");

                    // Then subdeck #flashcards/science (due then new)
                    nextCardThenCheck("Q4");
                    nextCardThenCheck("Q5");

                    // Then subdeck #flashcards/science/physics
                    nextCardThenCheck("Q6");
                    nextCardThenCheck("Q7");

                    // Then subdeck #flashcards/science/chemistry
                    nextCardThenCheck("Q8");

                    // Check no more
                    expect(iterator.nextCard()).toEqual(false);
                });
            });
        });

        describe("New cards before due cards", () => {
            test("Single topic, new cards only", async () => {
                let text: string = `
                Q1::A1
                Q2::A2
                Q3::A3`;
                let deck: Deck = await SampleItemDecks.createDeckFromText(
                    text,
                    new TopicPath(["Root"]),
                );
                let iterator: DeckTreeIterator = new DeckTreeIterator(
                    order_NewFirst_Sequential,
                    IteratorDeckSource.UpdatedByIterator,
                );
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
                    let deck: Deck = await SampleItemDecks.createDeckFromText(
                        text,
                        new TopicPath(["Root"]),
                    );
                    iterator = new DeckTreeIterator(
                        order_NewFirst_Sequential,
                        IteratorDeckSource.UpdatedByIterator,
                    );
                    iterator.setDeck(deck);

                    // New cards first
                    nextCardThenCheck("Q1");
                    nextCardThenCheck("Q3");
                    nextCardThenCheck("Q6");

                    // Scheduled cards next
                    nextCardThenCheck("Q2");
                    nextCardThenCheck("Q4");
                    nextCardThenCheck("Q5");

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
                    let deck: Deck = await SampleItemDecks.createDeckFromText(
                        text,
                        new TopicPath(["Root"]),
                    );
                    iterator = new DeckTreeIterator(
                        order_DueFirst_Sequential,
                        IteratorDeckSource.UpdatedByIterator,
                    );
                    iterator.setDeck(deck);

                    // Scheduled cards first
                    nextCardThenCheck("Q2");
                    nextCardThenCheck("Q4");
                    nextCardThenCheck("Q5");

                    // New cards next
                    nextCardThenCheck("Q1");
                    nextCardThenCheck("Q3");
                    nextCardThenCheck("Q6");

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
                    let deck: Deck = await SampleItemDecks.createDeckFromText(
                        text,
                        new TopicPath(["Root"]),
                    );
                    iterator = new DeckTreeIterator(
                        order_NewFirst_Sequential,
                        IteratorDeckSource.UpdatedByIterator,
                    );
                    iterator.setDeck(deck);

                    // New root deck's cards first
                    nextCardThenCheck("Q1");
                    nextCardThenCheck("Q3");
                    nextCardThenCheck("Q2");

                    // Then subdeck #flashcards/science
                    nextCardThenCheck("Q5");
                    nextCardThenCheck("Q4");

                    // Then subdeck #flashcards/science/physics
                    nextCardThenCheck("Q6");
                    nextCardThenCheck("Q7");

                    // Then subdeck #flashcards/science/chemistry
                    nextCardThenCheck("Q8");

                    // Check no more
                    expect(iterator.nextCard()).toEqual(false);
                });
            });
        });
    });

    describe("Random ordering", () => {
        describe("Due cards before new cards", () => {
            test("All new cards", async () => {
                let text: string = `
                Q0::A0
                Q1::A1
                Q2::A2
                Q3::A3
                Q4::A4
                Q5::A5
                Q6::A6`;
                let deck: Deck = await SampleItemDecks.createDeckFromText(
                    text,
                    new TopicPath(["Root"]),
                );
                iterator = new DeckTreeIterator(
                    order_DueFirst_Random,
                    IteratorDeckSource.UpdatedByIterator,
                );
                iterator.setDeck(deck);

                // [0, 1, 2, 3, 4, 5, 6]
                setupNextRandomNumber({ lower: 0, upper: 6, next: 5 });
                nextCardThenCheck("Q5");
                // [0, 1, 2, 3, 4, 6]
                setupNextRandomNumber({ lower: 0, upper: 5, next: 5 });
                nextCardThenCheck("Q6");
                // [0, 1, 2, 3, 4]
                setupNextRandomNumber({ lower: 0, upper: 4, next: 1 });
                nextCardThenCheck("Q1");
                // [0, 2, 3, 4]
                setupNextRandomNumber({ lower: 0, upper: 3, next: 3 });
                nextCardThenCheck("Q4");
                // [0, 2, 3]
                setupNextRandomNumber({ lower: 0, upper: 2, next: 1 });
                nextCardThenCheck("Q2");
                // [0, 3]
                setupNextRandomNumber({ lower: 0, upper: 1, next: 1 });
                nextCardThenCheck("Q3");
                // [0]
                setupNextRandomNumber({ lower: 0, upper: 0, next: 0 });
                nextCardThenCheck("Q0");

                // Check no more
                expect(iterator.nextCard()).toEqual(false);
            });

            test("Mixture new/scheduled", async () => {
                let text: string = `
                QN0::A
                QS0::A <!--SR:!2023-09-02,4,270-->
                QN1::A
                QS1::A <!--SR:!2023-09-02,4,270-->
                QS2::A <!--SR:!2023-09-02,4,270-->
                QN2::A
                QN3::A
                QS3::Q <!--SR:!2023-09-02,4,270-->`;
                let deck: Deck = await SampleItemDecks.createDeckFromText(
                    text,
                    new TopicPath(["Root"]),
                );
                iterator = new DeckTreeIterator(
                    order_DueFirst_Random,
                    IteratorDeckSource.UpdatedByIterator,
                );
                iterator.setDeck(deck);

                // Scheduled cards first
                // [QN0, QN1, QN2, QN3], [QS0, QS1, QS2, QS3]
                setupNextRandomNumber({ lower: 0, upper: 3, next: 3 });
                nextCardThenCheck("QS3");

                // [QN0, QN1, QN2, QN3], [QS0, QS1, QS2]
                setupNextRandomNumber({ lower: 0, upper: 2, next: 1 });
                nextCardThenCheck("QS1");

                // [QN0, QN1, QN2, QN3], [QS0, QS2]
                setupNextRandomNumber({ lower: 0, upper: 1, next: 0 });
                nextCardThenCheck("QS0");

                // [QN0, QN1, QN2, QN3], [QS2]
                setupNextRandomNumber({ lower: 0, upper: 0, next: 0 });
                nextCardThenCheck("QS2");

                // New cards next
                // [QN0, QN1, QN2, QN3]
                setupNextRandomNumber({ lower: 0, upper: 3, next: 2 });
                nextCardThenCheck("QN2");

                // [QN0, QN1, QN3]
                setupNextRandomNumber({ lower: 0, upper: 2, next: 2 });
                nextCardThenCheck("QN3");

                // [QN0, QN1]
                setupNextRandomNumber({ lower: 0, upper: 1, next: 0 });
                nextCardThenCheck("QN0");

                // [QN1]
                setupNextRandomNumber({ lower: 0, upper: 0, next: 0 });
                nextCardThenCheck("QN1");

                // Check no more
                expect(iterator.nextCard()).toEqual(false);
            });
        });
    });
});

describe("hasCurrentCard", () => {
    test("false immediately after setDeck", async () => {
        let text: string = `
        Q1::A1
        Q2::A2
        Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, new TopicPath(["Root"]));
        let iterator: DeckTreeIterator = new DeckTreeIterator(
            order_NewFirst_Sequential,
            IteratorDeckSource.UpdatedByIterator,
        );
        iterator.setDeck(deck);
        expect(iterator.hasCurrentCard).toEqual(false);
    });

    test("true immediately after nextCard", async () => {
        let text: string = `
        Q1::A1
        Q2::A2
        Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, new TopicPath(["Root"]));
        let iterator: DeckTreeIterator = new DeckTreeIterator(
            order_NewFirst_Sequential,
            IteratorDeckSource.UpdatedByIterator,
        );
        iterator.setDeck(deck);
        expect(iterator.nextCard()).toEqual(true);
        expect(iterator.hasCurrentCard).toEqual(true);
    });
});
/* describe("deleteCurrentCard", () => {
    test("Delete after all cards iterated - exception throw", async () => {
        let text: string = `
        Q1::A1
        Q2::A2 usim
        Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, new TopicPath(["Root"]));
        iterator = new DeckTreeSequentialIterator(order_NewFirst_Sequential);
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
        iterator = new DeckTreeSequentialIterator(order_NewFirst_Sequential);
        iterator.setDeck(deck);
        
        nextCardThenCheck("Q1");
        nextCardThenCheck("Q2");
        expect(iterator.deleteCurrentCard()).toEqual(true);
        expect(iterator.currentCard.front).toEqual("Q3");
        expect(iterator.deleteCurrentCard()).toEqual(false);
    });

});
 */
function nextCardThenCheck(expectedFront: string): void {
    expect(iterator.nextCard()).toEqual(true);
    expect(iterator.currentCard.front).toEqual(expectedFront);
}
