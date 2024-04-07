import { NoteQuestionParser } from "src/NoteQuestionParser";
import { CardListType, Deck } from "src/Deck";
import { DEFAULT_SETTINGS } from "src/settings";
import { SampleItemDecks } from "./SampleItems";
import { TopicPath } from "src/TopicPath";
import { CardOrder, DeckTreeIterator, IIteratorOrder, DeckOrder } from "src/DeckTreeIterator";
import {
    StaticDateProvider,
    globalDateProvider,
    setupStaticDateProvider_20230906,
} from "src/util/DateProvider";
import {
    setupNextRandomNumber,
    setupStaticRandomNumberProvider,
} from "src/util/RandomNumberProvider";

let order_DueFirst_Sequential: IIteratorOrder = {
    cardOrder: CardOrder.DueFirstSequential,
    deckOrder: DeckOrder.PrevDeckComplete_Sequential,
};

var iterator: DeckTreeIterator;

beforeAll(() => {
    setupStaticDateProvider_20230906();
    setupStaticRandomNumberProvider();
});

describe("setDeck", () => {
    test("currentDeck null immediately after setDeck", async () => {
        let text: string = `
Q1::A1
Q2::A2
Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, new TopicPath(["Root"]));
        let iterator: DeckTreeIterator = new DeckTreeIterator(
            {
                cardOrder: CardOrder.NewFirstSequential,
                deckOrder: DeckOrder.PrevDeckComplete_Sequential,
            },
            deck,
        );
        iterator.setIteratorTopicPath(TopicPath.emptyPath);
        expect(iterator.currentDeck).toEqual(null);
    });
});

describe("nextCard - Cards only present in a single deck", () => {
    describe("DeckOrder.PrevDeckComplete_Sequential; Sequential card ordering", () => {
        describe("Due cards before new cards", () => {
            test("Single topic, new cards only", async () => {
                let text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3`;
                let deck: Deck = await SampleItemDecks.createDeckFromText(
                    text,
                    TopicPath.emptyPath,
                );
                let iterator: DeckTreeIterator = new DeckTreeIterator(
                    {
                        cardOrder: CardOrder.DueFirstSequential,
                        deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                    },
                    deck,
                );
                iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

                // No due cards, so expect the new ones immediately
                expect(iterator.nextCard()).toEqual(true);
                expect(iterator.currentDeck.deckName).toEqual("flashcards");
                expect(iterator.currentCard.front).toEqual("Q1");

                expect(iterator.nextCard()).toEqual(true);
                expect(iterator.currentCard.front).toEqual("Q2");

                expect(iterator.nextCard()).toEqual(true);
                expect(iterator.currentCard.front).toEqual("Q3");

                expect(iterator.nextCard()).toEqual(false);
            });

            describe("Single topic, mixture of new and scheduled cards", () => {
                test("Get the scheduled cards first", async () => {
                    let text: string = `#flashcards
Q1::A1
Q2::A2 <!--SR:!2023-09-02,4,270-->
Q3::A3
Q4::A4 <!--SR:!2023-09-02,4,270-->
Q5::A5 <!--SR:!2023-09-02,4,270-->
Q6::A6`;
                    let deck: Deck = await SampleItemDecks.createDeckFromText(
                        text,
                        TopicPath.emptyPath,
                    );
                    iterator = new DeckTreeIterator(
                        {
                            cardOrder: CardOrder.DueFirstSequential,
                            deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                        },
                        deck,
                    );
                    iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

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
                        TopicPath.emptyPath,
                    );
                    iterator = new DeckTreeIterator(
                        {
                            cardOrder: CardOrder.DueFirstSequential,
                            deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                        },
                        deck,
                    );
                    iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

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
                let text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3`;
                let deck: Deck = await SampleItemDecks.createDeckFromText(
                    text,
                    TopicPath.emptyPath,
                );
                let iterator: DeckTreeIterator = new DeckTreeIterator(
                    {
                        cardOrder: CardOrder.NewFirstSequential,
                        deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                    },
                    deck,
                );
                iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

                expect(iterator.nextCard()).toEqual(true);
                expect(iterator.currentDeck.deckName).toEqual("flashcards");
                expect(iterator.currentCard.front).toEqual("Q1");

                expect(iterator.nextCard()).toEqual(true);
                expect(iterator.currentCard.front).toEqual("Q2");

                expect(iterator.nextCard()).toEqual(true);
                expect(iterator.currentCard.front).toEqual("Q3");

                expect(iterator.nextCard()).toEqual(false);
            });

            describe("Single topic, mixture of new and scheduled cards", () => {
                test("Get the new cards first", async () => {
                    let text: string = `#flashcards
Q1::A1
Q2::A2 <!--SR:!2023-09-02,4,270-->
Q3::A3
Q4::A4 <!--SR:!2023-09-02,4,270-->
Q5::A5 <!--SR:!2023-09-02,4,270-->
Q6::A6`;
                    let deck: Deck = await SampleItemDecks.createDeckFromText(
                        text,
                        TopicPath.emptyPath,
                    );
                    iterator = new DeckTreeIterator(
                        {
                            cardOrder: CardOrder.NewFirstSequential,
                            deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                        },
                        deck,
                    );
                    iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

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
                    let text: string = `#flashcards
Q1::A1
Q2::A2 <!--SR:!2023-09-02,4,270-->
Q3::A3
Q4::A4 <!--SR:!2023-09-02,4,270-->
Q5::A5 <!--SR:!2023-09-02,4,270-->
Q6::A6`;
                    let deck: Deck = await SampleItemDecks.createDeckFromText(
                        text,
                        TopicPath.emptyPath,
                    );
                    iterator = new DeckTreeIterator(
                        {
                            cardOrder: CardOrder.DueFirstSequential,
                            deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                        },
                        deck,
                    );
                    iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

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
                        TopicPath.emptyPath,
                    );
                    iterator = new DeckTreeIterator(
                        {
                            cardOrder: CardOrder.NewFirstSequential,
                            deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                        },
                        deck,
                    );
                    iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

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

    describe("DeckOrder.PrevDeckComplete_Sequential; Random card ordering", () => {
        describe("Due cards before new cards", () => {
            test("All new cards", async () => {
                let text: string = `#flashcards
Q0::A0
Q1::A1
Q2::A2
Q3::A3
Q4::A4
Q5::A5
Q6::A6`;
                let deck: Deck = await SampleItemDecks.createDeckFromText(
                    text,
                    TopicPath.emptyPath,
                );
                iterator = new DeckTreeIterator(
                    {
                        cardOrder: CardOrder.DueFirstRandom,
                        deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                    },
                    deck,
                );
                iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

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
                let text: string = `#flashcards
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
                    TopicPath.emptyPath,
                );
                iterator = new DeckTreeIterator(
                    {
                        cardOrder: CardOrder.DueFirstRandom,
                        deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                    },
                    deck,
                );
                iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

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

    describe("DeckOrder.PrevDeckComplete_Random", () => {
        test("CardOrder.NewFirstSequential", async () => {
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
            let deck: Deck = await SampleItemDecks.createDeckFromText(text, TopicPath.emptyPath);
            iterator = new DeckTreeIterator(
                {
                    cardOrder: CardOrder.NewFirstSequential,
                    deckOrder: DeckOrder.PrevDeckComplete_Random,
                },
                deck,
            );
            iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

            // New root deck's cards first Q1/Q3, then due cards - Q2
            setupNextRandomNumber({ lower: 0, upper: 3, next: 0 });
            nextCardThenCheck("Q1");
            nextCardThenCheck("Q3");
            nextCardThenCheck("Q2");

            // 3 decks with cards present to choose from (hence we expect the random number provider to be asked
            // for a random number 0... 2):
            //      [0=#flashcards/science, 1=#flashcards/science/physics, 2=#flashcards/science/chemistry]
            // Have the random number provider return 1 when next asked; deck 1 corresponds to - #flashcards/science/physics
            setupNextRandomNumber({ lower: 0, upper: 2, next: 1 });
            nextCardThenCheck("Q6");
            nextCardThenCheck("Q7");

            // 2 decks to choose from [#flashcards/science, #flashcards/science/chemistry]
            // Then random deck - #flashcards/science/chemistry
            setupNextRandomNumber({ lower: 0, upper: 1, next: 1 });
            nextCardThenCheck("Q8");

            // 1 deck to choose from [#flashcards/science]
            // Then subdeck #flashcards/science/chemistry
            setupNextRandomNumber({ lower: 0, upper: 0, next: 0 });
            nextCardThenCheck("Q5");
            nextCardThenCheck("Q4");

            // Check no more
            expect(iterator.nextCard()).toEqual(false);
        });
    });

    describe("DeckOrder.EveryCardRandomDeckAndCard", () => {
        test("Simple test", async () => {
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
            let deck: Deck = await SampleItemDecks.createDeckFromText(text, TopicPath.emptyPath);
            iterator = new DeckTreeIterator(
                {
                    cardOrder: CardOrder.EveryCardRandomDeckAndCard,
                    deckOrder: null,
                },
                deck,
            );
            iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

            // 8 cards to choose from (hence we expect the random number provider to be asked
            // for a random number 0... 7):
            //      [0=Q1, 1=Q3, 2=Q2, 3=Q5, 4=Q4, 5=Q6, 6=Q7, 7=Q8]
            // Have the random number provider return 5 when next asked; 5 corresponds to Q6
            setupNextRandomNumber({ lower: 0, upper: 7, next: 5 });
            nextCardThenCheck("Q6");

            //      [0=Q1, 1=Q3, 2=Q2, 3=Q5, 4=Q4, 5=Q7, 6=Q8]
            setupNextRandomNumber({ lower: 0, upper: 6, next: 3 });
            nextCardThenCheck("Q5");

            //      [0=Q1, 1=Q3, 2=Q2, 3=Q4, 4=Q7, 5=Q8]
            setupNextRandomNumber({ lower: 0, upper: 5, next: 1 });
            nextCardThenCheck("Q3");

            //      [0=Q1, 1=Q2, 2=Q4, 3=Q7, 4=Q8]
            setupNextRandomNumber({ lower: 0, upper: 4, next: 0 });
            nextCardThenCheck("Q1");

            //      [0=Q2, 1=Q4, 2=Q7, 3=Q8]
            setupNextRandomNumber({ lower: 0, upper: 3, next: 3 });
            nextCardThenCheck("Q8");

            //      [0=Q2, 1=Q4, 2=Q7]
            setupNextRandomNumber({ lower: 0, upper: 2, next: 1 });
            nextCardThenCheck("Q4");

            //      [0=Q2, 1=Q7]
            setupNextRandomNumber({ lower: 0, upper: 1, next: 1 });
            nextCardThenCheck("Q7");

            //      [0=Q2]
            setupNextRandomNumber({ lower: 0, upper: 0, next: 0 });
            nextCardThenCheck("Q2");

            // Check no more
            expect(iterator.nextCard()).toEqual(false);
        });
    });
});

describe("nextCard - Some cards present in multiple decks", () => {
    describe("DeckOrder.PrevDeckComplete_Sequential; Sequential card ordering", () => {
        test("Iterating over complete deck tree", async () => {
            let text: string = `#flashcards
Q1::A1

#flashcards/folder1
Q21::A21

#flashcards/folder2
Q31::A31

#flashcards/folder1 #flashcards/folder2
Q11::A11
Q12::A12
`;
            const [deck, iterator] = await SampleItemDecks.createDeckAndIteratorFromText(
                text,
                TopicPath.emptyPath,
                CardOrder.DueFirstSequential,
                DeckOrder.PrevDeckComplete_Sequential,
            );
            iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

            // Start off with cards in the top most deck, i.e. #flashcards
            expect(iterator.nextCard()).toEqual(true);
            expect(iterator.currentDeck.deckName).toEqual("flashcards");
            expect(iterator.currentCard.front).toEqual("Q1");

            // Now those in #flashcards/folder1
            expect(iterator.nextCard()).toEqual(true);
            expect(iterator.currentCard.front).toEqual("Q21"); // Specific to #flashcards/folder1
            expect(iterator.nextCard()).toEqual(true);
            expect(iterator.currentCard.front).toEqual("Q11"); // Common to #flashcards/folder1 & folder2
            expect(iterator.nextCard()).toEqual(true);
            expect(iterator.currentCard.front).toEqual("Q12"); // Common to #flashcards/folder1 & folder2

            // Now those in #flashcards/folder2
            expect(iterator.nextCard()).toEqual(true);
            expect(iterator.currentCard.front).toEqual("Q31");

            // Ones common to both folder1 and folder2 are not returned for folder2
            // i.e. we don't see Q11 or Q12 again
            expect(iterator.nextCard()).toEqual(false);
        });

        test("Iterating over portion of deck tree still deletes hard-linked cards in non-iterated portion of the deck", async () => {
            let text: string = `#flashcards
Q1::A1

#flashcards/folder1
Q21::A21

#flashcards/folder2
Q31::A31

#flashcards/folder1 #flashcards/folder2
Q11::A11
Q12::A12
`;
            const [deck, iterator] = await SampleItemDecks.createDeckAndIteratorFromText(
                text,
                TopicPath.emptyPath,
                CardOrder.DueFirstSequential,
                DeckOrder.PrevDeckComplete_Sequential,
            );

            // Before iterating folder2, there are (1 + 2) cards in folder1
            let subdeck: Deck = deck.getDeckByTopicTag("#flashcards/folder1");
            expect(subdeck.getCardCount(CardListType.All, false)).toEqual(3);

            // Iterate cards in #flashcards/folder2
            iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards/folder2"));

            expect(iterator.nextCard()).toEqual(true);
            expect(iterator.currentCard.front).toEqual("Q31");
            expect(iterator.nextCard()).toEqual(true);
            expect(iterator.currentCard.front).toEqual("Q11");
            expect(iterator.nextCard()).toEqual(true);
            expect(iterator.currentCard.front).toEqual("Q12");
            expect(iterator.nextCard()).toEqual(false);

            // After iterating folder2, there are (1 + 0) cards in folder1
            subdeck = deck.getDeckByTopicTag("#flashcards/folder1");
            expect(subdeck.getCardCount(CardListType.All, false)).toEqual(1);
        });
    });
});

describe("hasCurrentCard", () => {
    test("false immediately after setDeck", async () => {
        let text: string = `#flashcards
        Q1::A1
        Q2::A2
        Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, TopicPath.emptyPath);
        let iterator: DeckTreeIterator = new DeckTreeIterator(
            {
                cardOrder: CardOrder.NewFirstSequential,
                deckOrder: DeckOrder.PrevDeckComplete_Sequential,
            },
            deck,
        );
        iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

        expect(iterator.hasCurrentCard).toEqual(false);
    });

    test("true immediately after nextCard", async () => {
        let text: string = `#flashcards
        Q1::A1
        Q2::A2
        Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, TopicPath.emptyPath);
        let iterator: DeckTreeIterator = new DeckTreeIterator(
            {
                cardOrder: CardOrder.NewFirstSequential,
                deckOrder: DeckOrder.PrevDeckComplete_Sequential,
            },
            deck,
        );
        iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

        expect(iterator.nextCard()).toEqual(true);
        expect(iterator.hasCurrentCard).toEqual(true);
    });
});

describe("deleteCurrentCard", () => {
    test("Delete after all cards iterated - exception throw", async () => {
        let text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, TopicPath.emptyPath);
        iterator = new DeckTreeIterator(
            {
                cardOrder: CardOrder.NewFirstSequential,
                deckOrder: DeckOrder.PrevDeckComplete_Sequential,
            },
            deck,
        );
        iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

        expect(iterator.nextCard()).toEqual(true);
        expect(iterator.nextCard()).toEqual(true);
        expect(iterator.nextCard()).toEqual(true);
        expect(iterator.nextCard()).toEqual(false);

        const t = () => {
            iterator.deleteCurrentCardFromAllDecks();
        };
        expect(t).toThrow();
    });

    test("Delete card, with single card remaining after it", async () => {
        let text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, TopicPath.emptyPath);
        const flashcardDeck: Deck = deck.getDeckByTopicTag("#flashcards");
        expect(flashcardDeck.newFlashcards.length).toEqual(3);
        iterator = new DeckTreeIterator(
            {
                cardOrder: CardOrder.NewFirstSequential,
                deckOrder: DeckOrder.PrevDeckComplete_Sequential,
            },
            deck,
        );
        iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

        nextCardThenCheck("Q1");
        nextCardThenCheck("Q2");
        expect(iterator.deleteCurrentCardFromAllDecks()).toEqual(true);
        expect(iterator.currentCard.front).toEqual("Q3");
        expect(iterator.deleteCurrentCardFromAllDecks()).toEqual(false);
    });
});

function nextCardThenCheck(expectedFront: string): void {
    expect(iterator.nextCard()).toEqual(true);
    expect(iterator.currentCard.front).toEqual(expectedFront);
}
