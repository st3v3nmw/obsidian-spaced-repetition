import { CardScheduleCalculator } from "src/CardSchedule";
import {
    DeckTreeIterator,
    IDeckTreeIterator,
    IIteratorOrder,
    IteratorDeckSource,
} from "src/DeckTreeIterator";
import {
    FlashcardReviewMode,
    FlashcardReviewSequencer,
    IFlashcardReviewSequencer,
} from "src/FlashcardReviewSequencer";
import { TopicPath } from "src/TopicPath";
import { CardListType, Deck } from "src/Deck";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { SampleItemDecks } from "./SampleItems";
import { UnitTestSRFile } from "src/SRFile";
import { ReviewResponse } from "src/scheduling";
import { setupStaticDateProvider_20230906 } from "src/util/DateProvider";
import moment from "moment";
import { INoteEaseList, NoteEaseList } from "src/NoteEaseList";
import { QuestionPostponementList, IQuestionPostponementList } from "src/QuestionPostponementList";
import { order_DueFirst_Sequential } from "./DeckTreeIterator.test";

class TestContext {
    cardSequencer: IDeckTreeIterator;
    noteEaseList: INoteEaseList;
    cardScheduleCalculator: CardScheduleCalculator;
    reviewSequencer: IFlashcardReviewSequencer;
    questionPostponementList: QuestionPostponementList;
    file: UnitTestSRFile;
    originalText: string;
    fakeFilePath: string;

    constructor(init?: Partial<TestContext>) {
        Object.assign(this, init);
    }

    async setSequencerDeckTreeFromOriginalText(): Promise<Deck> {
        let deck: Deck = await SampleItemDecks.createDeckFromFile(
            this.file,
            new TopicPath(["Root"]),
        );
        this.reviewSequencer.setDeckTree(deck, deck);
        return deck;
    }

    static Create(
        iteratorOrder: IIteratorOrder,
        reviewMode: FlashcardReviewMode,
        settings: SRSettings,
        text: string,
        fakeFilePath?: string,
    ): TestContext {
        let cardSequencer: IDeckTreeIterator = new DeckTreeIterator(
            iteratorOrder,
            IteratorDeckSource.UpdatedByIterator,
        );
        let noteEaseList = new NoteEaseList(settings);
        let cardScheduleCalculator: CardScheduleCalculator = new CardScheduleCalculator(
            settings,
            noteEaseList,
        );
        let cardPostponementList: QuestionPostponementList = new QuestionPostponementList(
            null,
            settings,
            [],
        );
        let reviewSequencer: IFlashcardReviewSequencer = new FlashcardReviewSequencer(
            reviewMode,
            cardSequencer,
            settings,
            cardScheduleCalculator,
            cardPostponementList,
        );
        var file: UnitTestSRFile = new UnitTestSRFile(text, fakeFilePath);

        let result: TestContext = new TestContext({
            cardSequencer,
            noteEaseList,
            cardScheduleCalculator,
            reviewSequencer,
            questionPostponementList: cardPostponementList,
            file,
            originalText: text,
            fakeFilePath,
        });
        return result;
    }
}

interface Info1 {
    cardQ2_PreReviewText: string;
    cardQ2_PostReviewEase: number;
    cardQ2_PostReviewInterval: number;
    cardQ2_PostReviewDueDate: string;
    cardQ2_PostReviewText: string;
}

async function checkReviewResponse_ReviewMode(
    reviewResponse: ReviewResponse,
    info: Info1,
): Promise<void> {
    let text: string = `
#flashcards Q1::A1
#flashcards Q2::A2 <!--SR:!2023-09-02,4,270-->
#flashcards Q3::A3`;

    let fakeFilePath: string = moment().millisecond().toString();
    let c: TestContext = TestContext.Create(
        order_DueFirst_Sequential,
        FlashcardReviewMode.Review,
        DEFAULT_SETTINGS,
        text,
        fakeFilePath,
    );
    let deck: Deck = await c.setSequencerDeckTreeFromOriginalText();

    // State before calling processReview
    let card = c.reviewSequencer.currentCard;
    expect(card.front).toEqual("Q2");
    expect(card.scheduleInfo).toMatchObject({
        ease: 270,
        interval: 4,
    });

    // State after calling processReview - next card
    await c.reviewSequencer.processReview(reviewResponse);
    expect(c.reviewSequencer.currentCard.front).toEqual("Q1");

    // Schedule for the reviewed card has been updated
    expect(card.scheduleInfo.ease).toEqual(info.cardQ2_PostReviewEase);
    expect(card.scheduleInfo.interval).toEqual(info.cardQ2_PostReviewInterval);
    expect(card.scheduleInfo.dueDate.unix).toEqual(moment(info.cardQ2_PostReviewDueDate).unix);

    // Note text has been updated
    let expectedText: string = c.originalText.replace(
        info.cardQ2_PreReviewText,
        info.cardQ2_PostReviewText,
    );
    expect(await c.file.read()).toEqual(expectedText);
}

async function checkReviewResponse_CramMode(reviewResponse: ReviewResponse): Promise<TestContext> {
    let text: string = `
#flashcards Q1::A1 <!--SR:!2023-09-02,4,270-->
#flashcards Q2::A2 <!--SR:!2023-09-02,3,270-->
#flashcards Q3::A3 <!--SR:!2023-09-02,5,270-->
#flashcards Q4::A4 <!--SR:!2023-09-02,5,270-->`;

    let str: string = moment().millisecond().toString();
    let c: TestContext = TestContext.Create(
        order_DueFirst_Sequential,
        FlashcardReviewMode.Cram,
        DEFAULT_SETTINGS,
        text,
        str,
    );
    let deck: Deck = await c.setSequencerDeckTreeFromOriginalText();

    // State before calling processReview
    let card = c.reviewSequencer.currentCard;
    expect(card.front).toEqual("Q1");
    let expectInfo = {
        ease: 270,
        interval: 4,
    };
    expect(card.scheduleInfo).toMatchObject(expectInfo);

    // State after calling processReview - next card
    await c.reviewSequencer.processReview(reviewResponse);
    expect(c.reviewSequencer.currentCard.front).toEqual("Q2");

    // No change to schedule for reviewed card in cram mode
    expect(card.scheduleInfo).toMatchObject(expectInfo);
    expect(card.scheduleInfo.dueDate.unix).toEqual(moment("2023-09-02").unix);

    // Note text remains the same
    let expectedText: string = c.originalText;
    expect(await c.file.read()).toEqual(expectedText);

    return c;
}

async function setupSample1(
    reviewMode: FlashcardReviewMode,
    settings: SRSettings,
): Promise<TestContext> {
    let text: string = `
#flashcards Q1::A1

#flashcards Q2::A2
<!--SR:!2023-09-02,4,270-->

#flashcards Q3::A3
#flashcards/science Q4::A4 <!--SR:!2023-09-02,4,270-->
#flashcards/science/physics Q5::A5 <!--SR:!2023-09-02,4,270-->
#flashcards/math Q6::A6`;

    let c: TestContext = TestContext.Create(order_DueFirst_Sequential, reviewMode, settings, text);
    await c.setSequencerDeckTreeFromOriginalText();
    return c;
}

async function setupSample2(reviewMode: FlashcardReviewMode): Promise<TestContext> {
    let text: string = `
#flashcards Q1::A1
<!--SR:!2023-09-02,4,270-->

#flashcards Q2:::A2
<!--SR:!2023-09-02,4,270!2023-09-02,5,270-->

#flashcards Q3::A3
<!--SR:!2023-09-02,4,270-->

#flashcards This single ==question== turns into ==3 separate== ==cards==
<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270-->
`;

    let c: TestContext = TestContext.Create(
        order_DueFirst_Sequential,
        reviewMode,
        DEFAULT_SETTINGS,
        text,
    );
    await c.setSequencerDeckTreeFromOriginalText();
    return c;
}

function skipThenCheckCardFront(sequencer: IFlashcardReviewSequencer, expectedFront: string): void {
    sequencer.skipCurrentCard();
    expect(sequencer.currentCard.front).toEqual(expectedFront);
}

//////////////////////////////////////////////////////////////////////

beforeAll(() => {
    setupStaticDateProvider_20230906();
});

describe("setDeckTree", () => {
    test("Empty deck", () => {
        let c: TestContext = TestContext.Create(
            order_DueFirst_Sequential,
            FlashcardReviewMode.Review,
            DEFAULT_SETTINGS,
            "",
        );
        c.reviewSequencer.setDeckTree(Deck.emptyDeck, Deck.emptyDeck);
        expect(c.reviewSequencer.currentDeck).toEqual(null);
        expect(c.reviewSequencer.currentCard).toEqual(null);
    });

    // After setDeckTree, the first card in the deck is the current card
    test("Single level deck with some new cards", async () => {
        let text: string = `
Q1::A1
Q2::A2
Q3::A3`;
        let c: TestContext = TestContext.Create(
            order_DueFirst_Sequential,
            FlashcardReviewMode.Review,
            DEFAULT_SETTINGS,
            text,
        );
        let deck: Deck = await c.setSequencerDeckTreeFromOriginalText();
        expect(deck.newFlashcards.length).toEqual(3);

        expect(c.reviewSequencer.currentDeck.newFlashcards.length).toEqual(3);
        let expected = {
            front: "Q1",
            back: "A1",
        };
        expect(c.reviewSequencer.currentCard).toMatchObject(expected);
    });
});

describe("skipCurrentCard", () => {
    test("Simple test", async () => {
        let c: TestContext = await setupSample1(FlashcardReviewMode.Review, DEFAULT_SETTINGS);
        expect(c.reviewSequencer.currentCard.front).toEqual("Q2");

        // No more due cards after current card, so we expect the first new card for topic #flashcards
        skipThenCheckCardFront(c.reviewSequencer, "Q1");
        skipThenCheckCardFront(c.reviewSequencer, "Q3");
    });

    test("Skip repeatedly until no more", async () => {
        let c: TestContext = await setupSample1(FlashcardReviewMode.Review, DEFAULT_SETTINGS);
        expect(c.reviewSequencer.currentCard.front).toEqual("Q2");

        // No more due cards after current card, so we expect the first new card for topic #flashcards
        skipThenCheckCardFront(c.reviewSequencer, "Q1");
        skipThenCheckCardFront(c.reviewSequencer, "Q3");

        skipThenCheckCardFront(c.reviewSequencer, "Q4");
        skipThenCheckCardFront(c.reviewSequencer, "Q5");
        skipThenCheckCardFront(c.reviewSequencer, "Q6");

        c.reviewSequencer.skipCurrentCard();
        expect(c.reviewSequencer.hasCurrentCard).toEqual(false);
    });

    test("Skipping a card skips all sibling cards", async () => {
        let text: string = `
#flashcards Q1::A1
<!--SR:!2023-09-02,4,270-->

#flashcards Q2:::A2
<!--SR:!2023-09-02,4,270!2023-09-02,5,270-->

#flashcards Q3::A3
<!--SR:!2023-09-02,4,270-->

#flashcards This single ==question== turns into ==3 separate== ==cards==
<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270-->
`;

        let c: TestContext = TestContext.Create(
            order_DueFirst_Sequential,
            FlashcardReviewMode.Review,
            DEFAULT_SETTINGS,
            text,
        );
        await c.setSequencerDeckTreeFromOriginalText();
        expect(c.reviewSequencer.currentQuestion.cards.length).toEqual(1);
        expect(c.reviewSequencer.currentCard.front).toEqual("Q1");

        skipThenCheckCardFront(c.reviewSequencer, "Q2");
        expect(c.reviewSequencer.currentQuestion.cards.length).toEqual(2);

        // Skipping Q2 skips over both Q2::A2 and A2::Q2, goes straight to Q3
        skipThenCheckCardFront(c.reviewSequencer, "Q3");
        expect(c.reviewSequencer.currentQuestion.cards.length).toEqual(1);

        // Skip over Q3
        c.reviewSequencer.skipCurrentCard();
        expect(c.reviewSequencer.currentQuestion.cards[0].front).toMatch(/This single/);
        expect(c.reviewSequencer.currentQuestion.cards.length).toEqual(3);

        // Skip over the cloze, skips all 3 cards, no cards left
        c.reviewSequencer.skipCurrentCard();
        expect(c.reviewSequencer.hasCurrentCard).toEqual(false);
    });

    describe("Checking postponement list", () => {
        describe("FlashcardReviewMode.Review", () => {
            test("burySiblingCards=false - skipped question not added to postponement list", async () => {
                let settings: SRSettings = { ...DEFAULT_SETTINGS };
                settings.burySiblingCards = false;

                let c: TestContext = await setupSample1(FlashcardReviewMode.Review, settings);
                expect(c.questionPostponementList.list.length).toEqual(0);
                expect(c.reviewSequencer.currentCard.front).toEqual("Q2");

                // Skip over these 2 questions
                skipThenCheckCardFront(c.reviewSequencer, "Q1");
                skipThenCheckCardFront(c.reviewSequencer, "Q3");

                expect(c.questionPostponementList.list.length).toEqual(0);
            });

            test("burySiblingCards=true - skipped question added to postponement list", async () => {
                let settings: SRSettings = { ...DEFAULT_SETTINGS };
                settings.burySiblingCards = true;

                let c: TestContext = await setupSample1(FlashcardReviewMode.Review, settings);
                expect(c.questionPostponementList.list.length).toEqual(0);
                expect(c.reviewSequencer.currentCard.front).toEqual("Q2");

                // Skip over 2 questions
                skipThenCheckCardFront(c.reviewSequencer, "Q1");
                skipThenCheckCardFront(c.reviewSequencer, "Q3");

                expect(c.questionPostponementList.list.length).toEqual(2);
            });
        });

        describe("FlashcardReviewMode.Cram", () => {
            test("Cram mode - skipped question not added to postponement list", async () => {
                let c: TestContext = await setupSample1(FlashcardReviewMode.Cram, DEFAULT_SETTINGS);
                expect(c.questionPostponementList.list.length).toEqual(0);
                expect(c.reviewSequencer.currentCard.front).toEqual("Q2");

                // Skip over these questions
                skipThenCheckCardFront(c.reviewSequencer, "Q1");
                skipThenCheckCardFront(c.reviewSequencer, "Q3");

                expect(c.questionPostponementList.list.length).toEqual(0);
            });
        });
    });
    // No postponement during cramming
    // Deletion of sibling cards after text modification
    // Deletion of sibling cards after card skip
    // Delete+postpone
});

describe("processReview", () => {
    describe("FlashcardReviewMode.Review", () => {
        describe("ReviewResponse.Reset", () => {
            test("Simple test - 3 cards all due in same deck - reset card moves to end of deck", async () => {
                let text: string = `
                    #flashcards Q1::A1 <!--SR:!2023-09-02,4,270-->
                    #flashcards Q2::A2 <!--SR:!2023-09-02,5,270-->
                    #flashcards Q3::A3 <!--SR:!2023-09-02,6,270-->`;

                let c: TestContext = TestContext.Create(
                    order_DueFirst_Sequential,
                    FlashcardReviewMode.Review,
                    DEFAULT_SETTINGS,
                    text,
                );
                let deck: Deck = await c.setSequencerDeckTreeFromOriginalText();

                // State before calling processReview
                let card = c.reviewSequencer.currentCard;
                expect(card.front).toEqual("Q1");
                expect(card.scheduleInfo).toMatchObject({
                    ease: 270,
                    interval: 4,
                });

                // State after calling processReview - same current card
                // (only need to check ease, interval - dueDate & delayBeforeReview are not relevant)
                await c.reviewSequencer.processReview(ReviewResponse.Reset);
                card = c.reviewSequencer.currentCard;
                expect(card.front).toEqual("Q2");
                expect(card.scheduleInfo).toMatchObject({
                    ease: 270,
                    interval: 5,
                });

                c.reviewSequencer.skipCurrentCard();
                card = c.reviewSequencer.currentCard;
                expect(card.front).toEqual("Q3");
                expect(card.scheduleInfo).toMatchObject({
                    ease: 270,
                    interval: 6,
                });

                // After skipping Q3, we should see Q1 the reset card with updated ease/interval
                c.reviewSequencer.skipCurrentCard();
                card = c.reviewSequencer.currentCard;
                expect(card.front).toEqual("Q1");
                expect(card.scheduleInfo).toMatchObject({
                    ease: DEFAULT_SETTINGS.baseEase,
                    interval: 1,
                });
            });
        });

        describe("ReviewResponse.Easy", () => {
            test("Card schedule is updated, next card becomes current", async () => {
                const expected: Info1 = {
                    cardQ2_PreReviewText: "Q2::A2 <!--SR:!2023-09-02,4,270-->",
                    cardQ2_PostReviewEase: 290,
                    cardQ2_PostReviewInterval: 15,
                    cardQ2_PostReviewDueDate: "2023-09-21", // 15 days after the unit testing fixed date of 2023-09-06
                    cardQ2_PostReviewText: `Q2::A2
<!--SR:!2023-09-21,15,290-->`,
                };
                await checkReviewResponse_ReviewMode(ReviewResponse.Easy, expected);
            });
        });
    });

    describe("FlashcardReviewMode.Cram", () => {
        describe("ReviewResponse.Easy", () => {
            test("Next card after reviewed card becomes current; reviewed easy card doesn't resurface", async () => {
                // [Q1, Q2, Q3] review Q1, then current becomes Q2
                let c: TestContext = await checkReviewResponse_CramMode(ReviewResponse.Easy);
                expect(c.reviewSequencer.currentCard.front).toEqual("Q2");
                skipThenCheckCardFront(c.reviewSequencer, "Q3");
                skipThenCheckCardFront(c.reviewSequencer, "Q4");

                c.reviewSequencer.skipCurrentCard();
                expect(c.reviewSequencer.hasCurrentCard).toEqual(false);
            });
        });

        describe("ReviewResponse.Hard", () => {
            test("Next card after reviewed card becomes current; reviewed hard card seen again", async () => {
                // [Q1, Q2, Q3] review Q1, then current becomes Q2
                let c: TestContext = await checkReviewResponse_CramMode(ReviewResponse.Hard);
                expect(c.reviewSequencer.currentCard.front).toEqual("Q2");
                skipThenCheckCardFront(c.reviewSequencer, "Q3");
                skipThenCheckCardFront(c.reviewSequencer, "Q4");
                skipThenCheckCardFront(c.reviewSequencer, "Q1");

                c.reviewSequencer.skipCurrentCard();
                expect(c.reviewSequencer.hasCurrentCard).toEqual(false);
            });
        });
    });
});

describe("updateCurrentQuestionText", () => {
    let space: string = " ";

    describe("Checking update to file", () => {
        describe("Single line card type; Settings - schedule on following line", () => {
            test("Question has schedule on following line before/after update", async () => {
                let text: string = `
#flashcards Q1::A1

#flashcards Q2::A2
<!--SR:!2023-09-02,4,270-->

#flashcards Q3::A3`;

                let updatedQ: string = "A much more in depth question::A much more detailed answer";
                let originalStr: string = `#flashcards Q2::A2
<!--SR:!2023-09-02,4,270-->`;
                let updatedStr: string = `#flashcards A much more in depth question::A much more detailed answer
<!--SR:!2023-09-02,4,270-->`;
                await checkUpdateCurrentQuestionText(
                    text,
                    updatedQ,
                    originalStr,
                    updatedStr,
                    DEFAULT_SETTINGS,
                );
            });

            test("Question has schedule on same line (but pushed to following line due to settings)", async () => {
                let text: string = `
#flashcards Q1::A1

#flashcards Q2::A2 <!--SR:!2023-09-02,4,270-->

#flashcards Q3::A3`;

                let updatedQ: string = "A much more in depth question::A much more detailed answer";
                let originalStr: string = `#flashcards Q2::A2 <!--SR:!2023-09-02,4,270-->`;
                let expectedUpdatedStr: string = `#flashcards A much more in depth question::A much more detailed answer
<!--SR:!2023-09-02,4,270-->`;
                await checkUpdateCurrentQuestionText(
                    text,
                    updatedQ,
                    originalStr,
                    expectedUpdatedStr,
                    DEFAULT_SETTINGS,
                );
            });
        });

        describe("Single line card type; Settings - schedule on same line", () => {
            let settings: SRSettings = { ...DEFAULT_SETTINGS };
            settings.cardCommentOnSameLine = true;

            test("Question has schedule on same line before/after", async () => {
                let text1: string = `
#flashcards Q1::A1

#flashcards Q2::A2 <!--SR:!2023-09-02,4,270-->

#flashcards Q3::A3`;

                let updatedQ: string = "A much more in depth question::A much more detailed answer";
                let originalStr: string = `#flashcards Q2::A2 <!--SR:!2023-09-02,4,270-->`;
                let updatedStr: string = `#flashcards A much more in depth question::A much more detailed answer <!--SR:!2023-09-02,4,270-->`;
                await checkUpdateCurrentQuestionText(
                    text1,
                    updatedQ,
                    originalStr,
                    updatedStr,
                    settings,
                );
            });

            test("Question has schedule on following line (but placed on same line due to settings)", async () => {
                let text: string = `
#flashcards Q1::A1

#flashcards Q2::A2
<!--SR:!2023-09-02,4,270-->

#flashcards Q3::A3`;

                let updatedQ: string = "A much more in depth question::A much more detailed answer";
                let originalStr: string = `#flashcards Q2::A2
<!--SR:!2023-09-02,4,270-->`;
                let updatedStr: string = `#flashcards A much more in depth question::A much more detailed answer <!--SR:!2023-09-02,4,270-->`;
                await checkUpdateCurrentQuestionText(
                    text,
                    updatedQ,
                    originalStr,
                    updatedStr,
                    settings,
                );
            });
        });

        describe("Multiline card type; Settings - schedule on following line", () => {
            test("Question starts immediately after tag; Existing schedule present", async () => {
                let originalStr: string = `Q2
?
A2
<!--SR:!2023-09-02,4,270-->`;

                let text: string = `
#flashcards Q1::A1

#flashcards ${originalStr}

#flashcards Q3::A3`;

                let updatedQ: string = `Multiline question
Question starting immediately after tag
?
A2 (answer now includes more detail)
extra answer line 2`;

                let expectedUpdatedStr: string = `Multiline question
Question starting immediately after tag
?
A2 (answer now includes more detail)
extra answer line 2
<!--SR:!2023-09-02,4,270-->`;

                await checkUpdateCurrentQuestionText(
                    text,
                    updatedQ,
                    originalStr,
                    expectedUpdatedStr,
                    DEFAULT_SETTINGS,
                );
            });

            test("Question starts on same line as tag (after two spaces); Existing schedule present", async () => {
                let originalStr: string = `Q2
?
A2
<!--SR:!2023-09-02,4,270-->`;

                let text: string = `
#flashcards Q1::A1

#flashcards${space}${space}${originalStr}

#flashcards Q3::A3`;

                let updatedQ: string = `Multiline question
Question starting immediately after tag
?
A2 (answer now includes more detail)
extra answer line 2`;

                let expectedUpdatedStr: string = `Multiline question
Question starting immediately after tag
?
A2 (answer now includes more detail)
extra answer line 2
<!--SR:!2023-09-02,4,270-->`;

                await checkUpdateCurrentQuestionText(
                    text,
                    updatedQ,
                    originalStr,
                    expectedUpdatedStr,
                    DEFAULT_SETTINGS,
                );
            });

            test("Question starts line after tag; Existing schedule present", async () => {
                let originalStr: string = `#flashcards
Q2
?
A2
<!--SR:!2023-09-02,4,270-->`;

                let text: string = `
#flashcards Q1::A1

${originalStr}

#flashcards Q3::A3`;

                let updatedQ: string = `Multiline question
Question starting line after tag
?
A2 (answer now includes more detail)
extra answer line 2`;

                let expectedUpdatedStr: string = `#flashcards
Multiline question
Question starting line after tag
?
A2 (answer now includes more detail)
extra answer line 2
<!--SR:!2023-09-02,4,270-->`;

                await checkUpdateCurrentQuestionText(
                    text,
                    updatedQ,
                    originalStr,
                    expectedUpdatedStr,
                    DEFAULT_SETTINGS,
                );
            });

            test("Question starts line after tag (no white space after tag); New card", async () => {
                let originalQuestionStr: string = `#flashcards
Q2
?
A2`;

                let fileText: string = `
${originalQuestionStr}

#flashcards Q1::A1

#flashcards Q3::A3`;

                let updatedQuestionText: string = `Multiline question
Question starting immediately after tag
?
A2 (answer now includes more detail)
extra answer line 2`;

                let expectedUpdatedStr: string = `#flashcards
${updatedQuestionText}`;

                await checkUpdateCurrentQuestionText(
                    fileText,
                    updatedQuestionText,
                    originalQuestionStr,
                    expectedUpdatedStr,
                    DEFAULT_SETTINGS,
                );
            });

            test("Question starts line after tag (single space after tag before newline); New card", async () => {
                let originalQuestionStr: string = `#flashcards${space}
Q2
?
A2`;

                let fileText: string = `
${originalQuestionStr}

#flashcards Q1::A1

#flashcards Q3::A3`;

                let updatedQuestionText: string = `Multiline question
Question starting immediately after tag
?
A2 (answer now includes more detail)
extra answer line 2`;

                let expectedUpdatedStr: string = `#flashcards
${updatedQuestionText}`;

                await checkUpdateCurrentQuestionText(
                    fileText,
                    updatedQuestionText,
                    originalQuestionStr,
                    expectedUpdatedStr,
                    DEFAULT_SETTINGS,
                );
            });
        });
    });
});

describe("Sequences", () => {
    test("Update question text, followed by review response", async () => {
        let text1: string = `
#flashcards Q2::A2

#flashcards Q3::A3`;

        // Do the update step
        let updatedQ: string = "A much more in depth question::A much more detailed answer";
        let originalStr: string = `#flashcards Q2::A2`;
        let updatedStr: string = `#flashcards A much more in depth question::A much more detailed answer`;

        let c: TestContext = await checkUpdateCurrentQuestionText(
            text1,
            updatedQ,
            originalStr,
            updatedStr,
            DEFAULT_SETTINGS,
        );

        // Now do the review step
        await c.reviewSequencer.processReview(ReviewResponse.Hard);

        // Schedule for the reviewed card has been updated
        let expectedText: string = `
${updatedStr}
<!--SR:!2023-09-07,1,230-->

#flashcards Q3::A3`;

        expect(await c.file.read()).toEqual(expectedText);
    });
});

async function checkUpdateCurrentQuestionText(
    noteText: string,
    updatedQ: string,
    originalStr: string,
    updatedStr: string,
    settings: SRSettings,
): Promise<TestContext> {
    let c: TestContext = TestContext.Create(
        order_DueFirst_Sequential,
        FlashcardReviewMode.Review,
        settings,
        noteText,
    );
    await c.setSequencerDeckTreeFromOriginalText();
    expect(c.reviewSequencer.currentCard.front).toEqual("Q2");

    await c.reviewSequencer.updateCurrentQuestionText(updatedQ);

    // originalText should remain the same except for the specific substring change from originalStr => updatedStr
    if (!c.originalText.includes(originalStr)) throw `Text not found: ${originalStr}`;
    let expectedFileText: string = c.originalText.replace(originalStr, updatedStr);
    expect(await c.file.read()).toEqual(expectedFileText);
    return c;
}
