import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import {
    FlashcardReviewMode,
    FlashcardReviewSequencer,
    IFlashcardReviewSequencer,
} from "src/card/flashcard-review-sequencer";
import { QuestionPostponementList } from "src/card/questions/question-postponement-list";
import { Deck, DeckTreeFilter } from "src/deck/deck";
import {
    CardOrder,
    DeckOrder,
    DeckTreeIterator,
    IDeckTreeIterator,
    IIteratorOrder,
} from "src/deck/deck-tree-iterator";
import { TopicPath } from "src/deck/topic-path";
import { CardDueDateHistogram } from "src/due-date-histogram";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

import { UnitTestSRFile } from "./helpers/unit-test-file";
import { unitTestSetupStandardDataStoreAlgorithm } from "./helpers/unit-test-setup";
import { SampleItemDecks } from "./sample-items";

const orderDueFirstSequential: IIteratorOrder = {
    cardOrder: CardOrder.DueFirstSequential,
    deckOrder: DeckOrder.PrevDeckComplete_Sequential,
};

class TestContext {
    settings: SRSettings;
    reviewMode: FlashcardReviewMode;
    iteratorOrder: IIteratorOrder;
    cardSequencer: IDeckTreeIterator;
    reviewSequencer: IFlashcardReviewSequencer;
    questionPostponementList: QuestionPostponementList;
    dueDateFlashcardHistogram: CardDueDateHistogram;
    file: UnitTestSRFile;
    originalText: string;
    fakeFilePath: string;

    constructor(init?: Partial<TestContext>) {
        Object.assign(this, init);
    }

    async setSequencerDeckTreeFromOriginalText(): Promise<Deck> {
        const deckTree: Deck = await SampleItemDecks.createDeckFromFile(
            this.file,
            new TopicPath(["Root"]),
        );
        const remainingDeckTree = DeckTreeFilter.filterForRemainingCards(
            this.questionPostponementList,
            deckTree,
            this.reviewMode,
        );
        this.reviewSequencer.setDeckTree(deckTree, remainingDeckTree);
        return deckTree;
    }

    static Create(
        iteratorOrder: IIteratorOrder,
        reviewMode: FlashcardReviewMode,
        settings: SRSettings,
        text: string,
    ): TestContext {
        const settingsClone: SRSettings = { ...settings };
        const cardSequencer: IDeckTreeIterator = new DeckTreeIterator(iteratorOrder, null);
        unitTestSetupStandardDataStoreAlgorithm(settingsClone);
        const cardPostponementList: QuestionPostponementList = new QuestionPostponementList(
            null,
            settingsClone,
            [],
        );
        const dueDateFlashcardHistogram: CardDueDateHistogram = new CardDueDateHistogram();
        const reviewSequencer: FlashcardReviewSequencer = new FlashcardReviewSequencer(
            reviewMode,
            cardSequencer,
            settingsClone,
            SrsAlgorithm.getInstance(),
            cardPostponementList,
            dueDateFlashcardHistogram,
        );
        const file: UnitTestSRFile = new UnitTestSRFile(text, "test-file");

        const result: TestContext = new TestContext({
            settings: settingsClone,
            reviewMode,
            iteratorOrder,
            cardSequencer,
            reviewSequencer,
            questionPostponementList: cardPostponementList,
            file,
            originalText: text,
        });
        return result;
    }
}

describe("FlashcardReviewSequencer - Bidirectional Deletion", () => {
    beforeEach(() => {
        setupStaticDateProvider20230906();
    });

    test("Deleting a bidirectional card removes both cards from queue", async () => {
        // Q1 ::: A1 creates two cards: Q1->A1 and A1->Q1
        const text: string = "#flashcards Q1:::A1\n#flashcards A2:::Q2";

        const c: TestContext = TestContext.Create(
            orderDueFirstSequential,
            FlashcardReviewMode.Review,
            DEFAULT_SETTINGS,
            text,
        );
        await c.setSequencerDeckTreeFromOriginalText();

        // Initial check
        const initialStats = c.reviewSequencer.getDeckStats(
            TopicPath.getTopicPathFromTag("#flashcards"),
        );
        // Both are new cards
        expect(initialStats.newCount).toEqual(4);
        expect(initialStats.cardsInQueueCount).toEqual(4);

        // Delete the current card
        await c.reviewSequencer.deleteCurrentCardFromNote();

        // Check stats again
        const statsAfterDelete = c.reviewSequencer.getDeckStats(
            TopicPath.getTopicPathFromTag("#flashcards"),
        );

        // Should be 0
        expect(statsAfterDelete.newCount).toEqual(2);
        expect(statsAfterDelete.cardsInQueueCount).toEqual(2);
    });
});
