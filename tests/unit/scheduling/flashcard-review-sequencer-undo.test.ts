import moment from "moment";
import { State } from "ts-fsrs";

import { QuestionPostponementList } from "src/data/data-structures/card/questions/question-postponement-list";
import { Deck, DeckTreeFilter } from "src/data/data-structures/deck/deck";
import {
    DeckOrder,
    DeckTreeIterator,
    IIteratorOrder,
    RepItemOrder,
} from "src/data/data-structures/deck/deck-tree-iterator";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { DEFAULT_SETTINGS, SRSettings } from "src/data/settings";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { SRAlgorithm } from "src/scheduling/algorithms/base/sr-algorithm";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { CardDueDateHistogram } from "src/scheduling/due-date-histogram";
import {
    createCardMatch,
    FlashcardReviewMode,
    FlashcardReviewSequencer,
    restoreUndoSnapshotPersistentState,
    ReviewUndoSnapshot,
} from "src/scheduling/flashcard-review-sequencer";
import { setupStaticDateProvider20230906 } from "src/utils/dates";

import { UnitTestSRFile } from "../helpers/unit-test-file";
import { unitTestSetupStandardDataStoreAlgorithm } from "../helpers/unit-test-setup";
import { SampleItemDecks } from "../sample-items";

const orderDueFirstSequential: IIteratorOrder = {
    repItemOrder: RepItemOrder.DueFirstSequential,
    deckOrder: DeckOrder.PrevDeckComplete_Sequential,
};

const clozeQuestion1: string = "This single ==question== turns into ==3 separate== ==cards==";
const clozeQuestion1Card1: RegExp = /This single.+\.\.\..+turns into 3 separate cards/;
const clozeQuestion1Card2: RegExp = /This single question turns into.+\.\.\..+cards/;

class UndoTestContext {
    settings: SRSettings;
    reviewMode: FlashcardReviewMode;
    sequencer: FlashcardReviewSequencer;
    postponementList: QuestionPostponementList;
    histogram: CardDueDateHistogram;
    file: UnitTestSRFile;
    originalText: string;

    static async create(
        reviewMode: FlashcardReviewMode,
        text: string,
        settings: SRSettings = DEFAULT_SETTINGS,
        sameOriginalAndRemainingTree: boolean = false,
    ): Promise<UndoTestContext> {
        const c = new UndoTestContext();
        c.settings = { ...settings };
        c.reviewMode = reviewMode;
        unitTestSetupStandardDataStoreAlgorithm(c.settings);
        c.postponementList = new QuestionPostponementList(null, c.settings, []);
        c.histogram = new CardDueDateHistogram();
        c.file = new UnitTestSRFile(text);
        c.originalText = text;
        await c.reload(sameOriginalAndRemainingTree);
        return c;
    }

    // Like reopening the review: new sequencer, cards parsed again from the file
    async reload(sameOriginalAndRemainingTree: boolean = false): Promise<void> {
        this.sequencer = new FlashcardReviewSequencer(
            this.reviewMode,
            new DeckTreeIterator(orderDueFirstSequential, null),
            this.settings,
            SRAlgorithm.getInstance(),
            this.postponementList,
            this.histogram,
        );
        const deckTree: Deck = await SampleItemDecks.createDeckFromFile(
            this.file,
            new TopicPath(["Root"]),
        );
        const remainingDeckTree: Deck = sameOriginalAndRemainingTree
            ? deckTree
            : DeckTreeFilter.filterForRemainingRepItems(
                  this.postponementList,
                  deckTree,
                  this.reviewMode,
              );
        this.sequencer.setDeckTree(deckTree, remainingDeckTree);
    }

    get front(): string {
        return this.sequencer.currentCard.front;
    }

    remainingCount(): number {
        return this.sequencer.getDeckStats(TopicPath.emptyPath).cardsInQueueCount;
    }

    totalCount(): number {
        return this.sequencer.getDeckStats(TopicPath.emptyPath).totalCount;
    }

    async undoable(action: () => Promise<void> | void): Promise<ReviewUndoSnapshot> {
        const snapshot: ReviewUndoSnapshot = this.sequencer.createUndoSnapshot();
        await action();
        this.sequencer.completeUndoSnapshot(snapshot);
        return snapshot;
    }
}

// The scheduling comments are on their own line, as written with the default settings, so that undoing an action
// restores the exact original text
const threeCardsText: string = `#flashcards Q1::A1
#flashcards Q2::A2
<!--SR:!2023-09-02,4,270-->
#flashcards Q3::A3`;

beforeEach(() => {
    setupStaticDateProvider20230906();
});

describe("Undo in review mode", () => {
    test("Undoing a review restores the schedule in the note and shows the card again", async () => {
        const c = await UndoTestContext.create(FlashcardReviewMode.Review, threeCardsText);
        expect(c.front).toEqual("Q2");
        const card = c.sequencer.currentCard;
        const scheduleBefore = card.scheduleInfo;
        const histogramBefore = new Map(c.histogram.dueDatesMap);

        const snapshot = await c.undoable(() => c.sequencer.processReview(ReviewResponse.Good));
        expect(c.front).toEqual("Q1");
        expect(await c.file.read()).not.toEqual(c.originalText);
        expect(c.remainingCount()).toEqual(2);

        await c.sequencer.undo(snapshot);

        expect(c.sequencer.currentCard).toBe(card);
        expect(card.scheduleInfo).toBe(scheduleBefore);
        expect(await c.file.read()).toEqual(c.originalText);
        expect(c.histogram.dueDatesMap).toEqual(histogramBefore);
        expect(c.remainingCount()).toEqual(3);

        // The review can be repeated, and continues with the following cards
        await c.sequencer.processReview(ReviewResponse.Easy);
        expect(c.front).toEqual("Q1");
        expect(await c.file.read()).toContain("Q2::A2\n<!--SR:!2023-09-21,");
        expect(await c.file.read()).not.toEqual(c.originalText);
    });

    test("Undoing a review of a new card turns it back into a new card", async () => {
        const c = await UndoTestContext.create(
            FlashcardReviewMode.Review,
            `#flashcards Q1::A1
#flashcards Q2::A2`,
        );
        expect(c.front).toEqual("Q1");
        const card = c.sequencer.currentCard;

        const snapshot = await c.undoable(() => c.sequencer.processReview(ReviewResponse.Hard));
        expect(card.isNew).toEqual(false);

        await c.sequencer.undo(snapshot);
        expect(card.isNew).toEqual(true);
        expect(c.front).toEqual("Q1");
        expect(await c.file.read()).toEqual(c.originalText);
        expect(c.sequencer.getDeckStats(TopicPath.emptyPath).newCount).toEqual(2);
    });

    test("Several undos are applied in reverse order", async () => {
        const c = await UndoTestContext.create(FlashcardReviewMode.Review, threeCardsText);
        const snapshots: ReviewUndoSnapshot[] = [];
        snapshots.push(await c.undoable(() => c.sequencer.processReview(ReviewResponse.Good)));
        snapshots.push(await c.undoable(() => c.sequencer.processReview(ReviewResponse.Good)));
        snapshots.push(await c.undoable(() => c.sequencer.skipCurrentCard()));
        expect(c.sequencer.hasCurrentCard).toEqual(false);

        await c.sequencer.undo(snapshots.pop());
        expect(c.front).toEqual("Q3");
        await c.sequencer.undo(snapshots.pop());
        expect(c.front).toEqual("Q1");
        await c.sequencer.undo(snapshots.pop());
        expect(c.front).toEqual("Q2");

        expect(await c.file.read()).toEqual(c.originalText);
        expect(c.remainingCount()).toEqual(3);
    });

    test("Undoing a reset", async () => {
        const c = await UndoTestContext.create(FlashcardReviewMode.Review, threeCardsText);
        const snapshot = await c.undoable(() => c.sequencer.processReview(ReviewResponse.Reset));
        expect(await c.file.read()).not.toEqual(c.originalText);

        await c.sequencer.undo(snapshot);
        expect(c.front).toEqual("Q2");
        expect(await c.file.read()).toEqual(c.originalText);
        expect(c.remainingCount()).toEqual(3);
    });

    test("Undoing a skip puts the card back", async () => {
        const c = await UndoTestContext.create(FlashcardReviewMode.Review, threeCardsText);
        const snapshot = await c.undoable(() => c.sequencer.skipCurrentCard());
        expect(c.front).toEqual("Q1");
        expect(c.remainingCount()).toEqual(2);

        await c.sequencer.undo(snapshot);
        expect(c.front).toEqual("Q2");
        expect(c.remainingCount()).toEqual(3);
        expect(await c.file.read()).toEqual(c.originalText);
    });

    test("Undoing a skip of a question puts all its waiting cards back", async () => {
        const c = await UndoTestContext.create(
            FlashcardReviewMode.Review,
            `#flashcards ${clozeQuestion1}
<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270-->

#flashcards Q1::A1`,
        );
        expect(c.front).toMatch(clozeQuestion1Card1);
        expect(c.remainingCount()).toEqual(4);

        const snapshot = await c.undoable(() => c.sequencer.skipCurrentCard());
        expect(c.front).toEqual("Q1");
        expect(c.remainingCount()).toEqual(1);

        await c.sequencer.undo(snapshot);
        expect(c.front).toMatch(clozeQuestion1Card1);
        expect(c.remainingCount()).toEqual(4);
    });

    test("Undoing a suspension removes the flag and puts the card back", async () => {
        const c = await UndoTestContext.create(FlashcardReviewMode.Review, threeCardsText);
        expect(c.totalCount()).toEqual(3);

        const snapshot = await c.undoable(() => c.sequencer.suspendCurrentCard());
        expect(c.front).toEqual("Q1");
        expect(c.totalCount()).toEqual(2);
        expect(await c.file.read()).toContain("suspended");

        await c.sequencer.undo(snapshot);
        expect(c.front).toEqual("Q2");
        expect(c.sequencer.currentCard.isSuspended).toEqual(false);
        expect(c.totalCount()).toEqual(3);
        expect(c.remainingCount()).toEqual(3);
        expect(await c.file.read()).toEqual(c.originalText);
    });

    test("Undoing a review that buried the siblings un-buries them", async () => {
        const c = await UndoTestContext.create(
            FlashcardReviewMode.Review,
            `#flashcards ${clozeQuestion1}
<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270-->

#flashcards Q1::A1`,
            { ...DEFAULT_SETTINGS, burySiblingCards: true },
        );
        expect(c.front).toMatch(clozeQuestion1Card1);

        const snapshot = await c.undoable(() => c.sequencer.processReview(ReviewResponse.Good));
        expect(c.front).toEqual("Q1");
        expect(c.postponementList.list).toHaveLength(1);
        expect(snapshot.postponedTextHashesAdded).toEqual(c.postponementList.list);

        await c.sequencer.undo(snapshot);
        expect(c.postponementList.list).toHaveLength(0);
        expect(c.front).toMatch(clozeQuestion1Card1);
        expect(c.remainingCount()).toEqual(4);
        expect(await c.file.read()).toEqual(c.originalText);

        // The siblings come up again after the card
        c.sequencer.skipCurrentCard();
        expect(c.front).toEqual("Q1");
    });

    test("Undoing a review that made the card pending (FSRS learning step)", async () => {
        const c = await UndoTestContext.create(FlashcardReviewMode.Review, threeCardsText);
        const pendingSchedule = new RepItemScheduleInfoFsrs(
            moment("2023-09-06T00:10:00.000Z"),
            0,
            5.5,
            0.4,
            State.Learning,
            1,
            0,
            1,
            moment("2023-09-06T00:00:00.000Z"),
        );
        jest.spyOn(c.sequencer, "determineCardSchedule").mockReturnValue(pendingSchedule);

        const snapshot = await c.undoable(() => c.sequencer.processReview(ReviewResponse.Good));
        expect(c.sequencer.hasPendingCards).toEqual(true);

        await c.sequencer.undo(snapshot);
        expect(c.sequencer.hasPendingCards).toEqual(false);
        expect(c.front).toEqual("Q2");
        expect(await c.file.read()).toEqual(c.originalText);
    });

    test("Undoing after moving on to another deck goes back to the card's deck", async () => {
        const c = await UndoTestContext.create(
            FlashcardReviewMode.Review,
            `#flashcards/a A1::B1 <!--SR:!2023-09-02,4,270-->
#flashcards/b A2::B2 <!--SR:!2023-09-02,4,270-->`,
        );
        expect(c.front).toEqual("A1");
        const snapshot = await c.undoable(() => c.sequencer.processReview(ReviewResponse.Good));
        expect(c.front).toEqual("A2");
        expect(c.sequencer.currentDeck.deckName).toEqual("b");

        await c.sequencer.undo(snapshot);
        expect(c.front).toEqual("A1");
        expect(c.sequencer.currentDeck.deckName).toEqual("a");
    });

    test("Undo throws, and changes nothing, if the card's text was changed in the note", async () => {
        const c = await UndoTestContext.create(FlashcardReviewMode.Review, threeCardsText);
        const snapshot = await c.undoable(() => c.sequencer.processReview(ReviewResponse.Good));
        const reviewedText: string = await c.file.read();
        c.file.content = reviewedText.replace("Q2::A2", "Q2::changed");

        await expect(c.sequencer.undo(snapshot)).rejects.toThrow(/changed in the note/);
        expect(c.front).toEqual("Q1");
    });

    test("A snapshot must be completed before it can be undone", async () => {
        const c = await UndoTestContext.create(FlashcardReviewMode.Review, threeCardsText);
        const snapshot = c.sequencer.createUndoSnapshot();
        await c.sequencer.processReview(ReviewResponse.Good);

        await expect(c.sequencer.undo(snapshot)).rejects.toThrow(/never completed/);
    });
});

describe("Undo in cram mode", () => {
    test("Undoing an easy review in cram mode puts the card back", async () => {
        const c = await UndoTestContext.create(
            FlashcardReviewMode.Cram,
            `#flashcards Q1::A1
<!--SR:!2023-09-02,4,270-->
#flashcards Q2::A2
<!--SR:!2023-09-02,3,270-->`,
            DEFAULT_SETTINGS,
            true,
        );
        expect(c.front).toEqual("Q1");

        const snapshot = await c.undoable(() => c.sequencer.processReview(ReviewResponse.Easy));
        expect(c.front).toEqual("Q2");
        expect(c.remainingCount()).toEqual(1);

        await c.sequencer.undo(snapshot);
        expect(c.front).toEqual("Q1");
        expect(c.remainingCount()).toEqual(2);
        expect(await c.file.read()).toEqual(c.originalText);
    });

    test("Undoing a suspension in cram mode, with the same original and remaining deck tree", async () => {
        const c = await UndoTestContext.create(
            FlashcardReviewMode.Cram,
            `#flashcards Q1::A1
<!--SR:!2023-09-02,4,270-->
#flashcards Q2::A2
<!--SR:!2023-09-02,3,270-->`,
            DEFAULT_SETTINGS,
            true,
        );
        const snapshot = await c.undoable(() => c.sequencer.suspendCurrentCard());
        expect(c.totalCount()).toEqual(1);

        await c.sequencer.undo(snapshot);
        expect(c.front).toEqual("Q1");
        expect(c.totalCount()).toEqual(2);
        expect(await c.file.read()).toEqual(c.originalText);
    });
});

describe("Undo after the review queue was reloaded", () => {
    test("The stored state is restored and the card can be found in the new queue", async () => {
        const c = await UndoTestContext.create(FlashcardReviewMode.Review, threeCardsText);
        const snapshot = await c.undoable(() => c.sequencer.processReview(ReviewResponse.Good));

        await restoreUndoSnapshotPersistentState(snapshot, c.postponementList);
        expect(await c.file.read()).toEqual(c.originalText);

        await c.reload();
        expect(c.sequencer.focusCard(createCardMatch(snapshot.card), TopicPath.emptyPath)).toEqual(
            true,
        );
        expect(c.front).toEqual("Q2");
        expect(c.sequencer.currentCard).not.toBe(snapshot.card);
    });

    test("Cards are found by id, even if their text changed", async () => {
        const c = await UndoTestContext.create(
            FlashcardReviewMode.Review,
            `#flashcards Q1::A1
#flashcards Q2::A2
<!--SR:!2023-09-02,4,270,id=abc123-->`,
        );
        expect(c.front).toEqual("Q2");
        const match = createCardMatch(c.sequencer.currentCard);
        expect(match.id).toEqual("abc123");

        c.file.content = c.file.content.replace("Q2::A2", "Q2::changed");
        await c.reload();
        c.sequencer.skipCurrentCard();
        expect(c.front).toEqual("Q1");

        // The skipped card isn't in the queue anymore
        expect(c.sequencer.focusCard(match, TopicPath.emptyPath)).toEqual(false);

        await c.reload();
        expect(c.sequencer.focusCard(match, new TopicPath(["flashcards"]))).toEqual(true);
        expect(c.sequencer.currentCard.back).toEqual("changed");
    });

    test("A buried question is un-buried", async () => {
        const c = await UndoTestContext.create(
            FlashcardReviewMode.Review,
            `#flashcards ${clozeQuestion1}
<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270-->`,
            { ...DEFAULT_SETTINGS, burySiblingCards: true },
        );
        const snapshot = await c.undoable(() => c.sequencer.processReview(ReviewResponse.Good));
        expect(c.sequencer.hasCurrentCard).toEqual(false);

        await c.reload();
        expect(c.sequencer.hasCurrentCard).toEqual(false);

        await restoreUndoSnapshotPersistentState(snapshot, c.postponementList);
        await c.reload();
        expect(c.remainingCount()).toEqual(3);
        expect(c.sequencer.focusCard(createCardMatch(snapshot.card), TopicPath.emptyPath)).toEqual(
            true,
        );
        expect(c.front).toMatch(clozeQuestion1Card1);
        c.sequencer.skipCurrentCard();
        expect(c.sequencer.hasCurrentCard).toEqual(false);
    });

    test("Focusing a card that isn't first in the queue keeps the other cards", async () => {
        const c = await UndoTestContext.create(
            FlashcardReviewMode.Review,
            `#flashcards ${clozeQuestion1}
<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270-->`,
        );
        const card2 = c.sequencer.currentQuestion.cards[1];
        expect(c.sequencer.focusCard(createCardMatch(card2), TopicPath.emptyPath)).toEqual(true);
        expect(c.front).toMatch(clozeQuestion1Card2);
        expect(c.remainingCount()).toEqual(3);
    });
});

describe("Redo", () => {
    test("After two undos, both actions can be re-applied to their cards in order", async () => {
        const c = await UndoTestContext.create(FlashcardReviewMode.Review, threeCardsText);
        const q2 = c.sequencer.currentCard;
        const review = await c.undoable(() => c.sequencer.processReview(ReviewResponse.Good));
        const q1 = c.sequencer.currentCard;
        const skip = await c.undoable(() => c.sequencer.skipCurrentCard());
        expect(c.front).toEqual("Q3");
        const textAfterReview: string = await c.file.read();

        await c.sequencer.undo(skip);
        await c.sequencer.undo(review);
        expect(c.front).toEqual("Q2");
        expect(await c.file.read()).toEqual(c.originalText);

        // Redo the review
        expect(c.sequencer.focusCardObject(q2, review.sessionTopicPath)).toEqual(true);
        await c.sequencer.processReview(ReviewResponse.Good);
        expect(await c.file.read()).toEqual(textAfterReview);

        // Redo the skip, even if another card came up first
        expect(c.sequencer.focusCardObject(q1, skip.sessionTopicPath)).toEqual(true);
        expect(c.sequencer.currentCard).toBe(q1);
        c.sequencer.skipCurrentCard();
        expect(c.front).toEqual("Q3");
        expect(c.remainingCount()).toEqual(1);

        // A card that isn't waiting for review anymore can't be focused
        expect(c.sequencer.focusCardObject(q2, TopicPath.emptyPath)).toEqual(false);
        expect(c.front).toEqual("Q3");
    });
});
