import { CardListType, Deck } from "src/deck";
import { CardOrder, DeckOrder, DeckTreeIterator } from "src/deck-tree-iterator";
import { DEFAULT_SETTINGS } from "src/settings";
import { TopicPath } from "src/topic-path";
import { setupStaticDateProvider20230906 } from "src/utils/dates";
import { setupNextRandomNumber, setupStaticRandomNumberProvider } from "src/utils/numbers";

import { unitTestSetupStandardDataStoreAlgorithm } from "./helpers/unit-test-setup";
import { SampleItemDecks } from "./sample-items";

beforeAll(() => {
    setupStaticDateProvider20230906();
    setupStaticRandomNumberProvider();
    unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

describe("setDeck", () => {
    test("currentDeck null immediately after setDeck", async () => {
        const text: string = `
Q1::A1
Q2::A2
Q3::A3`;
        const deck: Deck = await SampleItemDecks.createDeckFromText(text, new TopicPath(["Root"]));
        const iterator: DeckTreeIterator = new DeckTreeIterator(
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
                const text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3`;
                const deck: Deck = await SampleItemDecks.createDeckFromText(
                    text,
                    TopicPath.emptyPath,
                );
                const iterator = new DeckTreeIterator(
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
                    const text: string = `#flashcards
Q1::A1
Q2::A2 <!--SR:!2023-09-02,4,270-->
Q3::A3
Q4::A4 <!--SR:!2023-09-02,4,270-->
Q5::A5 <!--SR:!2023-09-02,4,270-->
Q6::A6`;
                    const deck: Deck = await SampleItemDecks.createDeckFromText(
                        text,
                        TopicPath.emptyPath,
                    );
                    const iterator = new DeckTreeIterator(
                        {
                            cardOrder: CardOrder.DueFirstSequential,
                            deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                        },
                        deck,
                    );
                    iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

                    // Scheduled cards first
                    nextCardThenCheck(iterator, "Q2");
                    nextCardThenCheck(iterator, "Q4");
                    nextCardThenCheck(iterator, "Q5");

                    // New cards next
                    nextCardThenCheck(iterator, "Q1");
                    nextCardThenCheck(iterator, "Q3");
                    nextCardThenCheck(iterator, "Q6");

                    // Check no more
                    expect(iterator.nextCard()).toEqual(false);
                });
            });

            describe("Multiple topics, mixture of new and scheduled cards", () => {
                test("Get the ancestor deck's cards first, then descendants", async () => {
                    const text: string = `
                    #flashcards Q1::A1
                    #flashcards Q2::A2 <!--SR:!2023-09-02,4,270-->
                    #flashcards Q3::A3

        #flashcards/science Q4::A4 <!--SR:!2023-09-02,4,270-->
                    #flashcards/science Q5::A5

                    #flashcards/science/physics Q6::A6
                    #flashcards/science/physics Q7::A7

                    #flashcards/science/chemistry Q8::A8
                                `;
                    const deck: Deck = await SampleItemDecks.createDeckFromText(
                        text,
                        TopicPath.emptyPath,
                    );
                    const iterator = new DeckTreeIterator(
                        {
                            cardOrder: CardOrder.DueFirstSequential,
                            deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                        },
                        deck,
                    );
                    iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

                    // Due root deck's cards first
                    nextCardThenCheck(iterator, "Q2");

                    // Then the new cards
                    nextCardThenCheck(iterator, "Q1");
                    nextCardThenCheck(iterator, "Q3");

                    // Then subdeck #flashcards/science (due then new)
                    nextCardThenCheck(iterator, "Q4");
                    nextCardThenCheck(iterator, "Q5");

                    // Then subdeck #flashcards/science/physics
                    nextCardThenCheck(iterator, "Q6");
                    nextCardThenCheck(iterator, "Q7");

                    // Then subdeck #flashcards/science/chemistry
                    nextCardThenCheck(iterator, "Q8");

                    // Check no more
                    expect(iterator.nextCard()).toEqual(false);
                });
            });
        });

        describe("New cards before due cards", () => {
            test("Single topic, new cards only", async () => {
                const text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3`;
                const deck: Deck = await SampleItemDecks.createDeckFromText(
                    text,
                    TopicPath.emptyPath,
                );
                const iterator: DeckTreeIterator = new DeckTreeIterator(
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
                    const text: string = `#flashcards
Q1::A1
Q2::A2 <!--SR:!2023-09-02,4,270-->
Q3::A3
Q4::A4 <!--SR:!2023-09-02,4,270-->
Q5::A5 <!--SR:!2023-09-02,4,270-->
Q6::A6`;
                    const deck: Deck = await SampleItemDecks.createDeckFromText(
                        text,
                        TopicPath.emptyPath,
                    );
                    const iterator = new DeckTreeIterator(
                        {
                            cardOrder: CardOrder.NewFirstSequential,
                            deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                        },
                        deck,
                    );
                    iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

                    // New cards first
                    nextCardThenCheck(iterator, "Q1");
                    nextCardThenCheck(iterator, "Q3");
                    nextCardThenCheck(iterator, "Q6");

                    // Scheduled cards next
                    nextCardThenCheck(iterator, "Q2");
                    nextCardThenCheck(iterator, "Q4");
                    nextCardThenCheck(iterator, "Q5");

                    // Check no more
                    expect(iterator.nextCard()).toEqual(false);
                });

                test("Get the scheduled cards first", async () => {
                    const text: string = `#flashcards
Q1::A1
Q2::A2 <!--SR:!2023-09-02,4,270-->
Q3::A3
Q4::A4 <!--SR:!2023-09-02,4,270-->
Q5::A5 <!--SR:!2023-09-02,4,270-->
Q6::A6`;
                    const deck: Deck = await SampleItemDecks.createDeckFromText(
                        text,
                        TopicPath.emptyPath,
                    );
                    const iterator = new DeckTreeIterator(
                        {
                            cardOrder: CardOrder.DueFirstSequential,
                            deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                        },
                        deck,
                    );
                    iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

                    // Scheduled cards first
                    nextCardThenCheck(iterator, "Q2");
                    nextCardThenCheck(iterator, "Q4");
                    nextCardThenCheck(iterator, "Q5");

                    // New cards next
                    nextCardThenCheck(iterator, "Q1");
                    nextCardThenCheck(iterator, "Q3");
                    nextCardThenCheck(iterator, "Q6");

                    // Check no more
                    expect(iterator.nextCard()).toEqual(false);
                });
            });

            describe("Multiple topics, mixture of new and scheduled cards", () => {
                test("Get the ancestor deck's cards first, then descendants", async () => {
                    const text: string = `
                    #flashcards Q1::A1
                    #flashcards Q2::A2 <!--SR:!2023-09-02,4,270-->
                    #flashcards Q3::A3

        #flashcards/science Q4::A4 <!--SR:!2023-09-02,4,270-->
                    #flashcards/science Q5::A5

                    #flashcards/science/physics Q6::A6
                    #flashcards/science/physics Q7::A7

                    #flashcards/science/chemistry Q8::A8
                                `;
                    const deck: Deck = await SampleItemDecks.createDeckFromText(
                        text,
                        TopicPath.emptyPath,
                    );
                    const iterator = new DeckTreeIterator(
                        {
                            cardOrder: CardOrder.NewFirstSequential,
                            deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                        },
                        deck,
                    );
                    iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

                    // New root deck's cards first
                    nextCardThenCheck(iterator, "Q1");
                    nextCardThenCheck(iterator, "Q3");
                    nextCardThenCheck(iterator, "Q2");

                    // Then subdeck #flashcards/science
                    nextCardThenCheck(iterator, "Q5");
                    nextCardThenCheck(iterator, "Q4");

                    // Then subdeck #flashcards/science/physics
                    nextCardThenCheck(iterator, "Q6");
                    nextCardThenCheck(iterator, "Q7");

                    // Then subdeck #flashcards/science/chemistry
                    nextCardThenCheck(iterator, "Q8");

                    // Check no more
                    expect(iterator.nextCard()).toEqual(false);
                });
            });
        });
    });

    describe("DeckOrder.PrevDeckComplete_Sequential; Random card ordering", () => {
        describe("Due cards before new cards", () => {
            test("All new cards", async () => {
                const text: string = `#flashcards
Q0::A0
Q1::A1
Q2::A2
Q3::A3
Q4::A4
Q5::A5
Q6::A6`;
                const deck: Deck = await SampleItemDecks.createDeckFromText(
                    text,
                    TopicPath.emptyPath,
                );
                const iterator = new DeckTreeIterator(
                    {
                        cardOrder: CardOrder.DueFirstRandom,
                        deckOrder: DeckOrder.PrevDeckComplete_Sequential,
                    },
                    deck,
                );
                iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

                // [0, 1, 2, 3, 4, 5, 6]
                setupNextRandomNumber({ lower: 0, upper: 6, next: 5 });
                nextCardThenCheck(iterator, "Q5");
                // [0, 1, 2, 3, 4, 6]
                setupNextRandomNumber({ lower: 0, upper: 5, next: 5 });
                nextCardThenCheck(iterator, "Q6");
                // [0, 1, 2, 3, 4]
                setupNextRandomNumber({ lower: 0, upper: 4, next: 1 });
                nextCardThenCheck(iterator, "Q1");
                // [0, 2, 3, 4]
                setupNextRandomNumber({ lower: 0, upper: 3, next: 3 });
                nextCardThenCheck(iterator, "Q4");
                // [0, 2, 3]
                setupNextRandomNumber({ lower: 0, upper: 2, next: 1 });
                nextCardThenCheck(iterator, "Q2");
                // [0, 3]
                setupNextRandomNumber({ lower: 0, upper: 1, next: 1 });
                nextCardThenCheck(iterator, "Q3");
                // [0]
                setupNextRandomNumber({ lower: 0, upper: 0, next: 0 });
                nextCardThenCheck(iterator, "Q0");

                // Check no more
                expect(iterator.nextCard()).toEqual(false);
            });

            test("Mixture new/scheduled", async () => {
                const text: string = `#flashcards
QN0::A
QS0::A <!--SR:!2023-09-02,4,270-->
QN1::A
QS1::A <!--SR:!2023-09-02,4,270-->
QS2::A <!--SR:!2023-09-02,4,270-->
QN2::A
QN3::A
QS3::Q <!--SR:!2023-09-02,4,270-->`;
                const deck: Deck = await SampleItemDecks.createDeckFromText(
                    text,
                    TopicPath.emptyPath,
                );
                const iterator = new DeckTreeIterator(
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
                nextCardThenCheck(iterator, "QS3");

                // [QN0, QN1, QN2, QN3], [QS0, QS1, QS2]
                setupNextRandomNumber({ lower: 0, upper: 2, next: 1 });
                nextCardThenCheck(iterator, "QS1");

                // [QN0, QN1, QN2, QN3], [QS0, QS2]
                setupNextRandomNumber({ lower: 0, upper: 1, next: 0 });
                nextCardThenCheck(iterator, "QS0");

                // [QN0, QN1, QN2, QN3], [QS2]
                setupNextRandomNumber({ lower: 0, upper: 0, next: 0 });
                nextCardThenCheck(iterator, "QS2");

                // New cards next
                // [QN0, QN1, QN2, QN3]
                setupNextRandomNumber({ lower: 0, upper: 3, next: 2 });
                nextCardThenCheck(iterator, "QN2");

                // [QN0, QN1, QN3]
                setupNextRandomNumber({ lower: 0, upper: 2, next: 2 });
                nextCardThenCheck(iterator, "QN3");

                // [QN0, QN1]
                setupNextRandomNumber({ lower: 0, upper: 1, next: 0 });
                nextCardThenCheck(iterator, "QN0");

                // [QN1]
                setupNextRandomNumber({ lower: 0, upper: 0, next: 0 });
                nextCardThenCheck(iterator, "QN1");

                // Check no more
                expect(iterator.nextCard()).toEqual(false);
            });
        });
    });

    describe("DeckOrder.PrevDeckComplete_Random", () => {
        test("CardOrder.NewFirstSequential", async () => {
            const text: string = `
#flashcards Q1::A1
#flashcards Q2::A2 <!--SR:!2023-09-02,4,270-->
#flashcards Q3::A3

#flashcards/science Q4::A4 <!--SR:!2023-09-02,4,270-->
#flashcards/science Q5::A5

#flashcards/science/physics Q6::A6
#flashcards/science/physics Q7::A7

#flashcards/science/chemistry Q8::A8
                        `;
            const deck: Deck = await SampleItemDecks.createDeckFromText(text, TopicPath.emptyPath);
            const iterator = new DeckTreeIterator(
                {
                    cardOrder: CardOrder.NewFirstSequential,
                    deckOrder: DeckOrder.PrevDeckComplete_Random,
                },
                deck,
            );
            iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

            // New root deck's cards first Q1/Q3, then due cards - Q2
            setupNextRandomNumber({ lower: 0, upper: 3, next: 0 });
            nextCardThenCheck(iterator, "Q1");
            nextCardThenCheck(iterator, "Q3");
            nextCardThenCheck(iterator, "Q2");

            // 3 decks with cards present to choose from (hence we expect the random number provider to be asked
            // for a random number 0... 2):
            //      [0=#flashcards/science, 1=#flashcards/science/physics, 2=#flashcards/science/chemistry]
            // Have the random number provider return 1 when next asked; deck 1 corresponds to - #flashcards/science/physics
            setupNextRandomNumber({ lower: 0, upper: 2, next: 1 });
            nextCardThenCheck(iterator, "Q6");
            nextCardThenCheck(iterator, "Q7");

            // 2 decks to choose from [#flashcards/science, #flashcards/science/chemistry]
            // Then random deck - #flashcards/science/chemistry
            setupNextRandomNumber({ lower: 0, upper: 1, next: 1 });
            nextCardThenCheck(iterator, "Q8");

            // 1 deck to choose from [#flashcards/science]
            // Then subdeck #flashcards/science/chemistry
            setupNextRandomNumber({ lower: 0, upper: 0, next: 0 });
            nextCardThenCheck(iterator, "Q5");
            nextCardThenCheck(iterator, "Q4");

            // Check no more
            expect(iterator.nextCard()).toEqual(false);
        });
    });

    describe("DeckOrder.EveryCardRandomDeckAndCard", () => {
        test("Simple test", async () => {
            const text: string = `
#flashcards Q1::A1
#flashcards Q2::A2 <!--SR:!2023-09-02,4,270-->
#flashcards Q3::A3

#flashcards/science Q4::A4 <!--SR:!2023-09-02,4,270-->
#flashcards/science Q5::A5

#flashcards/science/physics Q6::A6
#flashcards/science/physics Q7::A7

#flashcards/science/chemistry Q8::A8
                        `;
            const deck: Deck = await SampleItemDecks.createDeckFromText(text, TopicPath.emptyPath);
            const iterator = new DeckTreeIterator(
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
            nextCardThenCheck(iterator, "Q6");

            //      [0=Q1, 1=Q3, 2=Q2, 3=Q5, 4=Q4, 5=Q7, 6=Q8]
            setupNextRandomNumber({ lower: 0, upper: 6, next: 3 });
            nextCardThenCheck(iterator, "Q5");

            //      [0=Q1, 1=Q3, 2=Q2, 3=Q4, 4=Q7, 5=Q8]
            setupNextRandomNumber({ lower: 0, upper: 5, next: 1 });
            nextCardThenCheck(iterator, "Q3");

            //      [0=Q1, 1=Q2, 2=Q4, 3=Q7, 4=Q8]
            setupNextRandomNumber({ lower: 0, upper: 4, next: 0 });
            nextCardThenCheck(iterator, "Q1");

            //      [0=Q2, 1=Q4, 2=Q7, 3=Q8]
            setupNextRandomNumber({ lower: 0, upper: 3, next: 3 });
            nextCardThenCheck(iterator, "Q8");

            //      [0=Q2, 1=Q4, 2=Q7]
            setupNextRandomNumber({ lower: 0, upper: 2, next: 1 });
            nextCardThenCheck(iterator, "Q4");

            //      [0=Q2, 1=Q7]
            setupNextRandomNumber({ lower: 0, upper: 1, next: 1 });
            nextCardThenCheck(iterator, "Q7");

            //      [0=Q2]
            setupNextRandomNumber({ lower: 0, upper: 0, next: 0 });
            nextCardThenCheck(iterator, "Q2");

            // Check no more
            expect(iterator.nextCard()).toEqual(false);
        });
    });
});

describe("nextCard - Some cards present in multiple decks", () => {
    describe("DeckOrder.PrevDeckComplete_Sequential; Sequential card ordering", () => {
        test("Iterating over complete deck tree", async () => {
            const text: string = `#flashcards
Q1::A1

#flashcards/folder1
Q21::A21

#flashcards/folder2
Q31::A31

#flashcards/folder1 #flashcards/folder2
Q11::A11
Q12::A12
`;
            const [_, iterator] = await SampleItemDecks.createDeckAndIteratorFromText(
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
            const text: string = `#flashcards
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
        const text: string = `#flashcards
        Q1::A1
        Q2::A2
        Q3::A3`;
        const deck: Deck = await SampleItemDecks.createDeckFromText(text, TopicPath.emptyPath);
        const iterator: DeckTreeIterator = new DeckTreeIterator(
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
        const text: string = `#flashcards
        Q1::A1
        Q2::A2
        Q3::A3`;
        const deck: Deck = await SampleItemDecks.createDeckFromText(text, TopicPath.emptyPath);
        const iterator: DeckTreeIterator = new DeckTreeIterator(
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
        const text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3`;
        const deck: Deck = await SampleItemDecks.createDeckFromText(text, TopicPath.emptyPath);
        const iterator = new DeckTreeIterator(
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
        const text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3`;
        const deck: Deck = await SampleItemDecks.createDeckFromText(text, TopicPath.emptyPath);
        const flashcardDeck: Deck = deck.getDeckByTopicTag("#flashcards");
        expect(flashcardDeck.newFlashcards.length).toEqual(3);
        const iterator = new DeckTreeIterator(
            {
                cardOrder: CardOrder.NewFirstSequential,
                deckOrder: DeckOrder.PrevDeckComplete_Sequential,
            },
            deck,
        );
        iterator.setIteratorTopicPath(TopicPath.getTopicPathFromTag("#flashcards"));

        nextCardThenCheck(iterator, "Q1");
        nextCardThenCheck(iterator, "Q2");
        expect(iterator.deleteCurrentCardFromAllDecks()).toEqual(true);
        expect(iterator.currentCard.front).toEqual("Q3");
        expect(iterator.deleteCurrentCardFromAllDecks()).toEqual(false);
    });
});

function nextCardThenCheck(iterator: DeckTreeIterator, expectedFront: string): void {
    expect(iterator.nextCard()).toEqual(true);
    expect(iterator.currentCard.front).toEqual(expectedFront);
}
