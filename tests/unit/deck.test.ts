import { Card } from "src/data/data-structures/card/card";
import { Deck } from "src/data/data-structures/deck/deck";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { DEFAULT_SETTINGS } from "src/data/settings";

import { unitTestSetupStandardDataStoreAlgorithm } from "./helpers/unit-test-setup";
import { SampleItemDecks } from "./sample-items";
import { RepItemState } from "src/scheduling/algorithms/base/repetition-item";

beforeAll(() => {
    unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

describe("constructor", () => {
    test("Deck name", () => {
        const actual: Deck = new Deck("Great Name", null);

        expect(actual.deckName).toEqual("Great Name");
    });
});

describe("getOrCreateDeck()", () => {
    test("Empty topic path", () => {
        const deck: Deck = new Deck("Great Name", null);
        deck.getOrCreateDeck(TopicPath.emptyPath);

        expect(deck.deckName).toEqual("Great Name");
        expect(deck.subdecks.length).toEqual(0);
    });

    test("Create single subdeck on empty deck", () => {
        const deck: Deck = new Deck("Root", null);
        const path: TopicPath = new TopicPath(["Level1"]);
        const subdeck: Deck = deck.getOrCreateDeck(path);

        expect(deck.deckName).toEqual("Root");
        expect(deck.subdecks.length).toEqual(1);
        expect(subdeck === deck.subdecks[0]).toEqual(true);
        expect(subdeck.deckName).toEqual("Level1");
    });

    test("Create multiple subdecks under single deck", () => {
        const deck: Deck = new Deck("Root", null);
        const subdeckA: Deck = deck.getOrCreateDeck(new TopicPath(["Level1A"]));
        const subdeckB: Deck = deck.getOrCreateDeck(new TopicPath(["Level1B"]));
        const subdeckC: Deck = deck.getOrCreateDeck(new TopicPath(["Level1C"]));

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
        const deck: Deck = new Deck("Root", null);
        const subdeck1: Deck = deck.getOrCreateDeck(new TopicPath(["Level1"]));
        const subdeck2: Deck = subdeck1.getOrCreateDeck(new TopicPath(["Level2"]));
        const subdeck3: Deck = subdeck2.getOrCreateDeck(new TopicPath(["Level3"]));

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
        const deck: Deck = new Deck("Root", null);
        const subdeck3: Deck = deck.getOrCreateDeck(new TopicPath(["Level1", "Level2", "Level3"]));

        expect(deck.deckName).toEqual("Root");
        expect(deck.subdecks.length).toEqual(1);

        const subdeck1: Deck = deck.subdecks[0];
        expect(subdeck1.deckName).toEqual("Level1");
        expect(subdeck1.subdecks.length).toEqual(1);

        const subdeck2: Deck = subdeck1.subdecks[0];
        expect(subdeck2.deckName).toEqual("Level2");
        expect(subdeck2.subdecks.length).toEqual(1);

        expect(subdeck3 === subdeck2.subdecks[0]).toEqual(true);
        expect(subdeck3.deckName).toEqual("Level3");
        expect(subdeck3.subdecks.length).toEqual(0);
    });
});

describe("getDistinctCardCount()", () => {
    test("Single deck", async () => {
        const text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3
Q4::A4 <!--SR:!2023-09-02,4,270-->`;
        const deck: Deck = await SampleItemDecks.createDeckFromText(text);
        const flashcardDeck: Deck = deck.getDeckByTopicTag("#flashcards");
        expect(flashcardDeck.getDistinctRepItemCount(RepItemState.NewItem, false)).toEqual(3);
        expect(flashcardDeck.getDistinctRepItemCount(RepItemState.DueItem, false)).toEqual(1);
        expect(flashcardDeck.getDistinctRepItemCount(RepItemState.AnyItem, false)).toEqual(4);
    });

    test("Deck hierarchy - no duplicate cards", async () => {
        const text: string = `#flashcards
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
        expect(flashcardDeck.getDistinctRepItemCount(RepItemState.NewItem, false)).toEqual(3);
        expect(flashcardDeck.getDistinctRepItemCount(RepItemState.DueItem, false)).toEqual(1);
        expect(flashcardDeck.getDistinctRepItemCount(RepItemState.AnyItem, false)).toEqual(4);

        // #flashcards, and subdeck
        expect(flashcardDeck.getDistinctRepItemCount(RepItemState.NewItem, true)).toEqual(6);
        expect(flashcardDeck.getDistinctRepItemCount(RepItemState.DueItem, true)).toEqual(3);
        expect(flashcardDeck.getDistinctRepItemCount(RepItemState.AnyItem, true)).toEqual(9);
    });

    test("Deck hierarchy - with duplicate cards", async () => {
        const text: string = `#flashcards
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
        expect(subdeck.getDistinctRepItemCount(RepItemState.NewItem, true)).toEqual(3);
        expect(subdeck.getDistinctRepItemCount(RepItemState.DueItem, true)).toEqual(2);

        // #flashcards/folder2
        subdeck = deck.getDeckByTopicTag("#flashcards/folder2");
        expect(subdeck.getDistinctRepItemCount(RepItemState.NewItem, true)).toEqual(4);
        expect(subdeck.getDistinctRepItemCount(RepItemState.DueItem, true)).toEqual(2);

        // #flashcards and subdecks
        subdeck = deck.getDeckByTopicTag("#flashcards");
        expect(subdeck.getDistinctRepItemCount(RepItemState.NewItem, true)).toEqual(3 + 3 + 1);
        expect(subdeck.getDistinctRepItemCount(RepItemState.DueItem, true)).toEqual(1 + 2 + 0);
    });
});

describe("getTopicPath()", () => {
    test("Empty topic path", () => {
        const deck: Deck = new Deck("Root", null);
        const path: TopicPath = deck.getTopicPath();

        expect(path.isEmptyPath).toEqual(true);
    });

    test("Single level topic path", () => {
        const deck: Deck = new Deck("Root", null);
        const subdeck: Deck = deck.getOrCreateDeck(new TopicPath(["Science"]));
        const topicPath: TopicPath = subdeck.getTopicPath();

        expect(topicPath.path).toEqual(["Science"]);
    });

    test("Multi level topic path", () => {
        const deck: Deck = new Deck("Root", null);
        const subdeck: Deck = deck.getOrCreateDeck(new TopicPath(["Science", "Chemistry"]));
        const topicPath: TopicPath = subdeck.getTopicPath();

        expect(topicPath.path).toEqual(["Science", "Chemistry"]);
    });
});

describe("appendCard()", () => {
    test("Append to root deck", () => {
        const deck: Deck = new Deck("Root", null);
        const path: TopicPath = deck.getTopicPath();

        expect(path.isEmptyPath).toEqual(true);
    });

    test("Single level topic path", () => {
        const deck: Deck = new Deck("Root", null);
        const subdeck: Deck = deck.getOrCreateDeck(new TopicPath(["Science"]));
        const topicPath: TopicPath = subdeck.getTopicPath();

        expect(topicPath.path).toEqual(["Science"]);
    });

    test("Multi level topic path", () => {
        const deck: Deck = new Deck("Root", null);
        const subdeck: Deck = deck.getOrCreateDeck(new TopicPath(["Science", "Chemistry"]));
        const topicPath: TopicPath = subdeck.getTopicPath();

        expect(topicPath.path).toEqual(["Science", "Chemistry"]);
    });
});

describe("toDeckArray()", () => {
    test("Empty tree", () => {
        const deckTree: Deck = new Deck("Root", null);
        const deckArray: Deck[] = deckTree.toDeckArray();
        const nameArray: string[] = deckArray.map((deck) => deck.deckName);

        expect(nameArray).toEqual(["Root"]);
    });

    test("Single level test", () => {
        const deckTree: Deck = new Deck("Root", null);
        deckTree.getOrCreateDeck(new TopicPath(["Aliens"]));
        const deckArray: Deck[] = deckTree.toDeckArray();
        const nameArray: string[] = deckArray.map((deck) => deck.deckName);

        const expectedArray: string[] = ["Root", "Aliens"];
        expect(nameArray).toEqual(expectedArray);
    });

    test("Multi level test", () => {
        const deckTree: Deck = SampleItemDecks.createScienceTree();
        const deckArray: Deck[] = deckTree.toDeckArray();
        const nameArray: string[] = deckArray.map((deck) => deck.deckName);

        const expectedArray: string[] = [
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
            const original: Deck = new Deck("Root", null);
            const copy: Deck = original.copyWithRepItemFilter((_) => true);

            original.deckName = "New deck name";
            expect(copy.deckName).toEqual("Root");
        });

        test("With new cards", async () => {
            const text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3`;
            const original: Deck = await SampleItemDecks.createDeckFromText(
                text,
                TopicPath.emptyPath,
            );
            let copy: Deck = original.copyWithRepItemFilter((card) => card.front.includes("2"));
            copy = copy.getDeckByTopicTag("#flashcards");

            expect(copy.newRepItems.length).toEqual(1);
            expect(copy.newRepItems[0].front).toEqual("Q2");
        });

        test("With scheduled cards", async () => {
            const text: string = `#flashcards
Q1::A1 <!--SR:!2023-09-02,4,270-->
Q2::A2 <!--SR:!2023-09-02,4,270-->
Q3::A3 <!--SR:!2023-09-02,4,270-->`;
            const original: Deck = await SampleItemDecks.createDeckFromText(
                text,
                TopicPath.emptyPath,
            );
            let copy: Deck = original.copyWithRepItemFilter((card) => !card.front.includes("2"));
            copy = copy.getDeck(TopicPath.getTopicPathFromTag("#flashcards"));

            expect(copy.newRepItems.length).toEqual(0);
            expect(copy.dueRepItems.length).toEqual(2);
            expect(copy.dueRepItems[0].front).toEqual("Q1");
            expect(copy.dueRepItems[1].front).toEqual("Q3");
        });
    });

    describe("Multi level tree", () => {
        test("No change in original deck after copy", async () => {
            const text: string = `
            #flashcards Q1::A1
            #flashcards Q2::A2
            #flashcards Q3::A3

            #flashcards/science Q4::A4
            #flashcards/science Q5::A5

            #flashcards/science/physics Q6::A6`;
            const original: Deck = await SampleItemDecks.createDeckFromText(
                text,
                new TopicPath(["Root"]),
            );
            const originalCountPreCopy: number = original.getRepItemCount(RepItemState.AnyItem, true);
            expect(originalCountPreCopy).toEqual(6);

            original.copyWithRepItemFilter((card) => parseInt(card.front[1]) % 2 === 1);
            const originalCountPostCopy: number = original.getRepItemCount(RepItemState.AnyItem, true);
            expect(originalCountPreCopy).toEqual(originalCountPostCopy);
        });

        test("With new cards", async () => {
            const text: string = `
            #flashcards Q1::A1
            #flashcards Q2::A2
            #flashcards Q3::A3

            #flashcards/science Q4::A4
            #flashcards/science Q5::A5

            #flashcards/science/physics Q6::A6`;
            const original: Deck = await SampleItemDecks.createDeckFromText(
                text,
                new TopicPath(["Root"]),
            );

            const copy: Deck = original.copyWithRepItemFilter(
                (card) => parseInt(card.front[1]) % 2 === 1,
            );

            let subdeck: Deck = copy.getDeck(new TopicPath(["flashcards"]));
            expect(subdeck.newRepItems.length).toEqual(2);
            expect(subdeck.newRepItems[0].front).toEqual("Q1");
            expect(subdeck.newRepItems[1].front).toEqual("Q3");

            subdeck = copy.getDeck(new TopicPath(["flashcards", "science"]));
            expect(subdeck.newRepItems.length).toEqual(1);
            expect(subdeck.newRepItems[0].front).toEqual("Q5");

            subdeck = copy.getDeck(new TopicPath(["flashcards", "science", "physics"]));
            expect(subdeck.newRepItems.length).toEqual(0);
        });
    });
});

describe("deleteCardFromAllDecks()", () => {
    test("Single deck", async () => {
        const text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3
Q4::A4 <!--SR:!2023-09-02,4,270-->`;
        const deck: Deck = await SampleItemDecks.createDeckFromText(text);
        const flashcardDeck: Deck = deck.getDeckByTopicTag("#flashcards");
        expect(flashcardDeck.getRepItemCount(RepItemState.AnyItem, false)).toEqual(4);

        // We have to call on the base deck (i.e. "deck", not "flashcardDeck")
        deck.deleteCardFromAllDecks(flashcardDeck.newRepItems[1], true);
        expect(flashcardDeck.getRepItemCount(RepItemState.AnyItem, false)).toEqual(3);
        expect(flashcardDeck.newRepItems[0].front).toEqual("Q1");
        expect(flashcardDeck.newRepItems[1].front).toEqual("Q3");
        expect(flashcardDeck.dueRepItems[0].front).toEqual("Q4");
    });

    test("Deck hierarchy - with duplicate cards", async () => {
        const text: string = `#flashcards
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
        const card: Card = folder1.newRepItems[1];
        expect(folder1.getRepItemCount(RepItemState.NewItem, false)).toEqual(3);
        expect(folder2.getRepItemCount(RepItemState.NewItem, false)).toEqual(3 + 1);
        deck.deleteCardFromAllDecks(card, true);
        expect(folder1.getRepItemCount(RepItemState.NewItem, false)).toEqual(2);
        expect(folder2.getRepItemCount(RepItemState.NewItem, false)).toEqual(2 + 1);
    });
});
