import { CardListType, Deck } from "src/Deck";
import { TopicPath } from "src/TopicPath";
import { SampleItemDecks } from "./SampleItems";
import { Card } from "src/Card";

describe("constructor", () => {
    test("Deck name", () => {
        let actual: Deck = new Deck("Great Name", null);

        expect(actual.deckName).toEqual("Great Name");
    });
});

describe("getOrCreateDeck()", () => {
    test("Empty topic path", () => {
        let deck: Deck = new Deck("Great Name", null);
        deck.getOrCreateDeck(TopicPath.emptyPath);

        expect(deck.deckName).toEqual("Great Name");
        expect(deck.subdecks.length).toEqual(0);
    });

    test("Create single subdeck on empty deck", () => {
        let deck: Deck = new Deck("Root", null);
        let path: TopicPath = new TopicPath(["Level1"]);
        let subdeck: Deck = deck.getOrCreateDeck(path);

        expect(deck.deckName).toEqual("Root");
        expect(deck.subdecks.length).toEqual(1);
        expect(subdeck === deck.subdecks[0]).toEqual(true);
        expect(subdeck.deckName).toEqual("Level1");
    });

    test("Create multiple subdecks under single deck", () => {
        let deck: Deck = new Deck("Root", null);
        let subdeckA: Deck = deck.getOrCreateDeck(new TopicPath(["Level1A"]));
        let subdeckB: Deck = deck.getOrCreateDeck(new TopicPath(["Level1B"]));
        let subdeckC: Deck = deck.getOrCreateDeck(new TopicPath(["Level1C"]));

        expect(deck.deckName).toEqual("Root");
        expect(deck.subdecks.length).toEqual(3);

        expect(subdeckA === deck.subdecks[0]).toEqual(true);
        expect(subdeckA.deckName).toEqual("Level1A");

        expect(subdeckB === deck.subdecks[1]).toEqual(true);
        expect(subdeckB.deckName).toEqual("Level1B");

        expect(subdeckC === deck.subdecks[2]).toEqual(true);
        expect(subdeckC.deckName).toEqual("Level1C");
    });

    test("Create multi-level deck in separate steps", () => {
        let deck: Deck = new Deck("Root", null);
        let subdeck1: Deck = deck.getOrCreateDeck(new TopicPath(["Level1"]));
        let subdeck2: Deck = subdeck1.getOrCreateDeck(new TopicPath(["Level2"]));
        let subdeck3: Deck = subdeck2.getOrCreateDeck(new TopicPath(["Level3"]));

        expect(deck.deckName).toEqual("Root");
        expect(deck.subdecks.length).toEqual(1);

        expect(subdeck1 === deck.subdecks[0]).toEqual(true);
        expect(subdeck1.deckName).toEqual("Level1");
        expect(subdeck1.subdecks.length).toEqual(1);

        expect(subdeck2 === subdeck1.subdecks[0]).toEqual(true);
        expect(subdeck2.deckName).toEqual("Level2");
        expect(subdeck2.subdecks.length).toEqual(1);

        expect(subdeck3 === subdeck2.subdecks[0]).toEqual(true);
        expect(subdeck3.deckName).toEqual("Level3");
        expect(subdeck3.subdecks.length).toEqual(0);
    });

    test("Create multi-level deck in single step", () => {
        let deck: Deck = new Deck("Root", null);
        let subdeck3: Deck = deck.getOrCreateDeck(new TopicPath(["Level1", "Level2", "Level3"]));

        expect(deck.deckName).toEqual("Root");
        expect(deck.subdecks.length).toEqual(1);

        let subdeck1: Deck = deck.subdecks[0];
        expect(subdeck1.deckName).toEqual("Level1");
        expect(subdeck1.subdecks.length).toEqual(1);

        let subdeck2: Deck = subdeck1.subdecks[0];
        expect(subdeck2.deckName).toEqual("Level2");
        expect(subdeck2.subdecks.length).toEqual(1);

        expect(subdeck3 === subdeck2.subdecks[0]).toEqual(true);
        expect(subdeck3.deckName).toEqual("Level3");
        expect(subdeck3.subdecks.length).toEqual(0);
    });
});

describe("getDistinctCardCount()", () => {
    test("Single deck", async () => {
        let text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3
Q4::A4 <!--SR:!2023-09-02,4,270-->`;
        const deck: Deck = await SampleItemDecks.createDeckFromText(text);
        const flashcardDeck: Deck = deck.getDeckByTopicTag("#flashcards");
        expect(flashcardDeck.getDistinctCardCount(CardListType.NewCard, false)).toEqual(3);
        expect(flashcardDeck.getDistinctCardCount(CardListType.DueCard, false)).toEqual(1);
        expect(flashcardDeck.getDistinctCardCount(CardListType.All, false)).toEqual(4);
    });

    test("Deck hierarchy - no duplicate cards", async () => {
        let text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3
Q4::A4 <!--SR:!2023-09-02,4,270-->

#flashcards/folder1
Q11::A11
Q12::A12
Q13::A13
Q14::A14 <!--SR:!2023-09-02,4,270
Q15::A15 <!--SR:!2023-09-02,4,270


`;
        const deck: Deck = await SampleItemDecks.createDeckFromText(text);
        const flashcardDeck: Deck = deck.getDeckByTopicTag("#flashcards");
        // Just #flashcards, no subdeck
        expect(flashcardDeck.getDistinctCardCount(CardListType.NewCard, false)).toEqual(3);
        expect(flashcardDeck.getDistinctCardCount(CardListType.DueCard, false)).toEqual(1);
        expect(flashcardDeck.getDistinctCardCount(CardListType.All, false)).toEqual(4);

        // #flashcards, and subdeck
        expect(flashcardDeck.getDistinctCardCount(CardListType.NewCard, true)).toEqual(6);
        expect(flashcardDeck.getDistinctCardCount(CardListType.DueCard, true)).toEqual(3);
        expect(flashcardDeck.getDistinctCardCount(CardListType.All, true)).toEqual(9);
    });

    test("Deck hierarchy - with duplicate cards", async () => {
        let text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3
Q4::A4 <!--SR:!2023-09-02,4,270-->

#flashcards/folder1 #flashcards/folder2
Q11::A11
Q12::A12
Q13::A13
Q14::A14 <!--SR:!2023-09-02,4,270
Q15::A15 <!--SR:!2023-09-02,4,270

#flashcards/folder2
Q21::A21

`;
        const deck: Deck = await SampleItemDecks.createDeckFromText(text);

        // #flashcards/folder1
        let subdeck: Deck = deck.getDeckByTopicTag("#flashcards/folder1");
        expect(subdeck.getDistinctCardCount(CardListType.NewCard, true)).toEqual(3);
        expect(subdeck.getDistinctCardCount(CardListType.DueCard, true)).toEqual(2);

        // #flashcards/folder2
        subdeck = deck.getDeckByTopicTag("#flashcards/folder2");
        expect(subdeck.getDistinctCardCount(CardListType.NewCard, true)).toEqual(4);
        expect(subdeck.getDistinctCardCount(CardListType.DueCard, true)).toEqual(2);

        // #flashcards and subdecks
        subdeck = deck.getDeckByTopicTag("#flashcards");
        expect(subdeck.getDistinctCardCount(CardListType.NewCard, true)).toEqual(3 + 3 + 1);
        expect(subdeck.getDistinctCardCount(CardListType.DueCard, true)).toEqual(1 + 2 + 0);
    });
});

describe("getTopicPath()", () => {
    test("Empty topic path", () => {
        let deck: Deck = new Deck("Root", null);
        let path: TopicPath = deck.getTopicPath();

        expect(path.isEmptyPath).toEqual(true);
    });

    test("Single level topic path", () => {
        let deck: Deck = new Deck("Root", null);
        let subdeck: Deck = deck.getOrCreateDeck(new TopicPath(["Science"]));
        let topicPath: TopicPath = subdeck.getTopicPath();

        expect(topicPath.path).toEqual(["Science"]);
    });

    test("Multi level topic path", () => {
        let deck: Deck = new Deck("Root", null);
        let subdeck: Deck = deck.getOrCreateDeck(new TopicPath(["Science", "Chemistry"]));
        let topicPath: TopicPath = subdeck.getTopicPath();

        expect(topicPath.path).toEqual(["Science", "Chemistry"]);
    });
});

describe("appendCard()", () => {
    test("Append to root deck", () => {
        let deck: Deck = new Deck("Root", null);
        let path: TopicPath = deck.getTopicPath();

        expect(path.isEmptyPath).toEqual(true);
    });

    test("Single level topic path", () => {
        let deck: Deck = new Deck("Root", null);
        let subdeck: Deck = deck.getOrCreateDeck(new TopicPath(["Science"]));
        let topicPath: TopicPath = subdeck.getTopicPath();

        expect(topicPath.path).toEqual(["Science"]);
    });

    test("Multi level topic path", () => {
        let deck: Deck = new Deck("Root", null);
        let subdeck: Deck = deck.getOrCreateDeck(new TopicPath(["Science", "Chemistry"]));
        let topicPath: TopicPath = subdeck.getTopicPath();

        expect(topicPath.path).toEqual(["Science", "Chemistry"]);
    });
});

describe("toDeckArray()", () => {
    test("Empty tree", () => {
        let deckTree: Deck = new Deck("Root", null);
        let deckArray: Deck[] = deckTree.toDeckArray();
        let nameArray: string[] = deckArray.map((deck) => deck.deckName);

        expect(nameArray).toEqual(["Root"]);
    });

    test("Single level test", () => {
        let deckTree: Deck = new Deck("Root", null);
        deckTree.getOrCreateDeck(new TopicPath(["Aliens"]));
        let deckArray: Deck[] = deckTree.toDeckArray();
        let nameArray: string[] = deckArray.map((deck) => deck.deckName);

        let expectedArray: string[] = ["Root", "Aliens"];
        expect(nameArray).toEqual(expectedArray);
    });

    test("Multi level test", () => {
        let deckTree: Deck = SampleItemDecks.createScienceTree();
        let deckArray: Deck[] = deckTree.toDeckArray();
        let nameArray: string[] = deckArray.map((deck) => deck.deckName);

        let expectedArray: string[] = [
            "Root",
            "Science",
            "Physics",
            "Electromagnetism",
            "Light",
            "Fluids",
            "Math",
            "Geometry",
            "Algebra",
            "Polynomials",
        ];
        expect(nameArray).toEqual(expectedArray);
    });
});

describe("copyWithCardFilter()", () => {
    describe("Single level tree", () => {
        test("No cards", () => {
            let original: Deck = new Deck("Root", null);
            let copy: Deck = original.copyWithCardFilter((card) => true);

            original.deckName = "New deck name";
            expect(copy.deckName).toEqual("Root");
        });

        test("With new cards", async () => {
            let text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3`;
            let original: Deck = await SampleItemDecks.createDeckFromText(
                text,
                TopicPath.emptyPath,
            );
            let copy: Deck = original.copyWithCardFilter((card) => card.front.includes("2"));
            copy = copy.getDeckByTopicTag("#flashcards");

            expect(copy.newFlashcards.length).toEqual(1);
            expect(copy.newFlashcards[0].front).toEqual("Q2");
        });

        test("With scheduled cards", async () => {
            let text: string = `#flashcards
Q1::A1 <!--SR:!2023-09-02,4,270-->
Q2::A2 <!--SR:!2023-09-02,4,270-->
Q3::A3 <!--SR:!2023-09-02,4,270-->`;
            let original: Deck = await SampleItemDecks.createDeckFromText(
                text,
                TopicPath.emptyPath,
            );
            let copy: Deck = original.copyWithCardFilter((card) => !card.front.includes("2"));
            copy = copy.getDeck(TopicPath.getTopicPathFromTag("#flashcards"));

            expect(copy.newFlashcards.length).toEqual(0);
            expect(copy.dueFlashcards.length).toEqual(2);
            expect(copy.dueFlashcards[0].front).toEqual("Q1");
            expect(copy.dueFlashcards[1].front).toEqual("Q3");
        });
    });

    describe("Multi level tree", () => {
        test("No change in original deck after copy", async () => {
            let text: string = `
            #flashcards Q1::A1
            #flashcards Q2::A2
            #flashcards Q3::A3
            
            #flashcards/science Q4::A4
            #flashcards/science Q5::A5
            
            #flashcards/science/physics Q6::A6`;
            let original: Deck = await SampleItemDecks.createDeckFromText(
                text,
                new TopicPath(["Root"]),
            );
            let originalCountPreCopy: number = original.getCardCount(CardListType.All, true);
            expect(originalCountPreCopy).toEqual(6);

            let copy: Deck = original.copyWithCardFilter(
                (card) => parseInt(card.front[1]) % 2 == 1,
            );
            let originalCountPostCopy: number = original.getCardCount(CardListType.All, true);
            expect(originalCountPreCopy).toEqual(originalCountPostCopy);
        });

        test("With new cards", async () => {
            let text: string = `
            #flashcards Q1::A1
            #flashcards Q2::A2
            #flashcards Q3::A3
            
            #flashcards/science Q4::A4
            #flashcards/science Q5::A5
            
            #flashcards/science/physics Q6::A6`;
            let original: Deck = await SampleItemDecks.createDeckFromText(
                text,
                new TopicPath(["Root"]),
            );

            let copy: Deck = original.copyWithCardFilter(
                (card) => parseInt(card.front[1]) % 2 == 1,
            );

            let subdeck: Deck = copy.getDeck(new TopicPath(["flashcards"]));
            expect(subdeck.newFlashcards.length).toEqual(2);
            expect(subdeck.newFlashcards[0].front).toEqual("Q1");
            expect(subdeck.newFlashcards[1].front).toEqual("Q3");

            subdeck = copy.getDeck(new TopicPath(["flashcards", "science"]));
            expect(subdeck.newFlashcards.length).toEqual(1);
            expect(subdeck.newFlashcards[0].front).toEqual("Q5");

            subdeck = copy.getDeck(new TopicPath(["flashcards", "science", "physics"]));
            expect(subdeck.newFlashcards.length).toEqual(0);
        });
    });
});

describe("deleteCardFromAllDecks()", () => {
    test("Single deck", async () => {
        let text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3
Q4::A4 <!--SR:!2023-09-02,4,270-->`;
        const deck: Deck = await SampleItemDecks.createDeckFromText(text);
        const flashcardDeck: Deck = deck.getDeckByTopicTag("#flashcards");
        expect(flashcardDeck.getCardCount(CardListType.All, false)).toEqual(4);

        // We have to call on the base deck (i.e. "deck", not "flashcardDeck")
        deck.deleteCardFromAllDecks(flashcardDeck.newFlashcards[1], true);
        expect(flashcardDeck.getCardCount(CardListType.All, false)).toEqual(3);
        expect(flashcardDeck.newFlashcards[0].front).toEqual("Q1");
        expect(flashcardDeck.newFlashcards[1].front).toEqual("Q3");
        expect(flashcardDeck.dueFlashcards[0].front).toEqual("Q4");
    });

    test("Deck hierarchy - with duplicate cards", async () => {
        let text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3
Q4::A4 <!--SR:!2023-09-02,4,270-->

#flashcards/folder1 #flashcards/folder2
Q11::A11
Q12::A12
Q13::A13
Q14::A14 <!--SR:!2023-09-02,4,270
Q15::A15 <!--SR:!2023-09-02,4,270

#flashcards/folder2
Q21::A21

`;
        const deck: Deck = await SampleItemDecks.createDeckFromText(text);

        // Delete card from #flashcards/folder1, deletes from #flashcards/folder as well
        const folder1: Deck = deck.getDeckByTopicTag("#flashcards/folder1");
        const folder2: Deck = deck.getDeckByTopicTag("#flashcards/folder2");
        let card: Card = folder1.newFlashcards[1];
        expect(folder1.getCardCount(CardListType.NewCard, false)).toEqual(3);
        expect(folder2.getCardCount(CardListType.NewCard, false)).toEqual(3 + 1);
        deck.deleteCardFromAllDecks(card, true);
        expect(folder1.getCardCount(CardListType.NewCard, false)).toEqual(2);
        expect(folder2.getCardCount(CardListType.NewCard, false)).toEqual(2 + 1);
    });
});
