import { CardScheduleCalculator } from "src/CardSchedule";
import {
    CardOrder,
    DeckOrder,
    DeckTreeIterator,
    IDeckTreeIterator,
    IIteratorOrder,
} from "src/DeckTreeIterator";
import {
    DeckStats,
    FlashcardReviewMode,
    FlashcardReviewSequencer,
    IFlashcardReviewSequencer,
} from "src/FlashcardReviewSequencer";
import { TopicPath } from "src/TopicPath";
import { CardListType, Deck, DeckTreeFilter } from "src/Deck";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { SampleItemDecks } from "./SampleItems";
import { ReviewResponse } from "src/scheduling";
import {
    setupStaticDateProvider,
    setupStaticDateProvider_20230906,
    setupStaticDateProvider_OriginDatePlusDays,
} from "src/util/DateProvider";
import moment from "moment";
import { INoteEaseList, NoteEaseList } from "src/NoteEaseList";
import { QuestionPostponementList, IQuestionPostponementList } from "src/QuestionPostponementList";
import { UnitTestSRFile } from "./helpers/UnitTestSRFile";

let order_DueFirst_Sequential: IIteratorOrder = {
    cardOrder: CardOrder.DueFirstSequential,
    deckOrder: DeckOrder.PrevDeckComplete_Sequential,
};

let clozeQuestion1: string = "This single ==question== turns into ==3 separate== ==cards==";
let clozeQuestion1Card1: RegExp = /This single.+\.\.\..+turns into 3 separate cards/;
let clozeQuestion1Card2: RegExp = /This single question turns into.+\.\.\..+cards/;
let clozeQuestion1Card3: RegExp = /This single question turns into 3 separate.+\.\.\./;

class TestContext {
    settings: SRSettings;
    reviewMode: FlashcardReviewMode;
    iteratorOrder: IIteratorOrder;
    cardSequencer: IDeckTreeIterator;
    noteEaseList: INoteEaseList;
    cardScheduleCalculator: CardScheduleCalculator;
    reviewSequencer: FlashcardReviewSequencer;
    questionPostponementList: QuestionPostponementList;
    file: UnitTestSRFile;
    originalText: string;
    fakeFilePath: string;

    constructor(init?: Partial<TestContext>) {
        Object.assign(this, init);
    }

    async resetContext(text: string, daysAfterOrigin: number): Promise<void> {
        this.originalText = text;
        this.file.content = text;
        let cardSequencer: IDeckTreeIterator = new DeckTreeIterator(this.iteratorOrder, null);
        let reviewSequencer: FlashcardReviewSequencer = new FlashcardReviewSequencer(
            this.reviewMode,
            cardSequencer,
            this.settings,
            this.cardScheduleCalculator,
            this.questionPostponementList,
        );
        setupStaticDateProvider_OriginDatePlusDays(daysAfterOrigin);

        await this.setSequencerDeckTreeFromOriginalText();
    }

    // Within the actual application, clearing the postponement list is done in main.ts, and therefore not
    // unit testable. Within the unit tests, this is used instead.
    clearQuestionPostponementList(): void {
        this.questionPostponementList.clear();
    }

    async setSequencerDeckTreeFromOriginalText(): Promise<Deck> {
        let deckTree: Deck = await SampleItemDecks.createDeckFromFile(
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

    getDeckStats(topicTag: string): DeckStats {
        return this.reviewSequencer.getDeckStats(TopicPath.getTopicPathFromTag(topicTag));
    }

    static Create(
        iteratorOrder: IIteratorOrder,
        reviewMode: FlashcardReviewMode,
        settings: SRSettings,
        text: string,
        fakeFilePath?: string,
    ): TestContext {
        let cardSequencer: IDeckTreeIterator = new DeckTreeIterator(iteratorOrder, null);
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
        let reviewSequencer: FlashcardReviewSequencer = new FlashcardReviewSequencer(
            reviewMode,
            cardSequencer,
            settings,
            cardScheduleCalculator,
            cardPostponementList,
        );
        var file: UnitTestSRFile = new UnitTestSRFile(text, fakeFilePath);

        let result: TestContext = new TestContext({
            settings,
            reviewMode,
            iteratorOrder,
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

async function checkEmptyPostponementList(
    burySiblingCards: boolean,
    flashcardReviewMode: FlashcardReviewMode,
): Promise<void> {
    let settings: SRSettings = { ...DEFAULT_SETTINGS };
    settings.burySiblingCards = burySiblingCards;

    let c: TestContext = await setupSample1(flashcardReviewMode, settings);
    expect(c.questionPostponementList.list.length).toEqual(0);
    expect(c.reviewSequencer.currentCard.front).toEqual("Q2");

    // Skip over these 2 questions
    skipThenCheckCardFront(c.reviewSequencer, "Q1");
    skipThenCheckCardFront(c.reviewSequencer, "Q3");

    expect(c.questionPostponementList.list.length).toEqual(0);
}

function skipThenCheckCardFront(sequencer: IFlashcardReviewSequencer, expectedFront: string): void {
    sequencer.skipCurrentCard();
    expect(sequencer.currentCard.front).toEqual(expectedFront);
}

//////////////////////////////////////////////////////////////////////

// Do this before each test, as some tests change the "current" date
beforeEach(() => {
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
        c.setSequencerDeckTreeFromOriginalText();
        c.reviewSequencer.setDeckTree(Deck.emptyDeck, Deck.emptyDeck);
        expect(c.reviewSequencer.currentDeck).toEqual(null);
        expect(c.reviewSequencer.currentCard).toEqual(null);
    });

    // After setDeckTree, the first card in the deck is the current card
    test("Single level deck with some new cards", async () => {
        let text: string = `#flashcards
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
        const flashcardDeck: Deck = deck.getDeckByTopicTag("#flashcards");
        expect(flashcardDeck.newFlashcards.length).toEqual(3);

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

        skipAndCheckNoRemainingCards(c);
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

    describe("Checking postponement list (skipped cards)", () => {
        describe("FlashcardReviewMode.Review", () => {
            test("burySiblingCards=false - skipped question not added to postponement list", async () => {
                checkEmptyPostponementList(false, FlashcardReviewMode.Review);
            });

            // https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/760
            test("burySiblingCards=true - skipped question not added to postponement list", async () => {
                checkEmptyPostponementList(true, FlashcardReviewMode.Review);
            });
        });

        describe("FlashcardReviewMode.Cram", () => {
            test("Cram mode - skipped question not added to postponement list", async () => {
                checkEmptyPostponementList(false, FlashcardReviewMode.Cram);
            });
        });
    });
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

        describe("Checking postponement list (after card reviewed, burySiblingCards=false)", () => {
            test("reviewed question not added to postponement list; sibling cards are sequenced (not deleted)", async () => {
                let settings: SRSettings = { ...DEFAULT_SETTINGS };
                settings.burySiblingCards = false;

                let text: string = `#flashcards

#flashcards This single ==question== turns into ==3 separate== ==cards==

Q1::A1
    `;

                let c: TestContext = TestContext.Create(
                    order_DueFirst_Sequential,
                    FlashcardReviewMode.Review,
                    settings,
                    text,
                );
                await c.setSequencerDeckTreeFromOriginalText();
                expect(c.cardSequencer.currentDeck.getCardCount(CardListType.All, false)).toEqual(
                    4,
                );

                expect(c.reviewSequencer.currentCard.front).toMatch(clozeQuestion1Card1);

                // After reviewing, sibling cards still present
                await c.reviewSequencer.processReview(ReviewResponse.Easy);
                expect(c.reviewSequencer.currentCard.front).toMatch(clozeQuestion1Card2);
                await c.reviewSequencer.processReview(ReviewResponse.Good);
                expect(c.reviewSequencer.currentCard.front).toMatch(clozeQuestion1Card3);

                // After reviewing last sibling, move to next card
                await c.reviewSequencer.processReview(ReviewResponse.Hard);
                expect(c.reviewSequencer.currentCard.front).toEqual("Q1");

                skipAndCheckNoRemainingCards(c);
                checkQuestionPostponementListCount(c, 0);
            });
        });

        describe("Checking postponement list (after card reviewed, burySiblingCards=true)", () => {
            test("Question with multiple cards; reviewed question added to postponement list; sibling cards are buried", async () => {
                let settings: SRSettings = { ...DEFAULT_SETTINGS };
                settings.burySiblingCards = true;

                let text: string = `
#flashcards ${clozeQuestion1}

#flashcards
Q1::A1
    `;

                let c: TestContext = TestContext.Create(
                    order_DueFirst_Sequential,
                    FlashcardReviewMode.Review,
                    settings,
                    text,
                );
                await c.setSequencerDeckTreeFromOriginalText();
                expect(c.cardSequencer.currentDeck.getCardCount(CardListType.All, false)).toEqual(
                    4,
                );

                expect(c.reviewSequencer.currentCard.front).toMatch(clozeQuestion1Card1);

                // After reviewing, sibling cards skipped
                await c.reviewSequencer.processReview(ReviewResponse.Easy);
                expect(c.reviewSequencer.currentCard.front).toEqual("Q1");

                skipAndCheckNoRemainingCards(c);

                // Single question on the list ()
                checkQuestionPostponementListCount(c, 1);
            });

            test("Question with multiple cards; card reviewed as hard, after restarting the review process, that whole question skipped and next question is shown", async () => {
                let settings: SRSettings = { ...DEFAULT_SETTINGS };
                settings.burySiblingCards = true;

                let text: string = `
#flashcards ${clozeQuestion1}

#flashcards
Q1::A1
    `;

                // Simulate performing the review on 2023-09-06
                // Check that the reviewed card, scheduled for following day; 2 buried cards have schedule dates with magic number indicating unreviewed card ("2000-01-01")
                setupStaticDateProvider_OriginDatePlusDays(0);
                const c: TestContext = TestContext.Create(
                    order_DueFirst_Sequential,
                    FlashcardReviewMode.Review,
                    settings,
                    text,
                );
                await c.setSequencerDeckTreeFromOriginalText();
                expect(c.reviewSequencer.currentCard.front).toMatch(clozeQuestion1Card1);
                await c.reviewSequencer.processReview(ReviewResponse.Hard);
                text = c.file.content;
                let expectedCard1Review: string = "2023-09-07,1,230";
                expect(text).toContain(
                    `<!--SR:!${expectedCard1Review}!2000-01-01,1,250!2000-01-01,1,250-->`,
                );
                checkQuestionPostponementListCount(c, 1);

                // Reset the context to the new content (that now includes the schedule info); simulate same day
                // First question not shown (as all of its cards have been "buried"); second question shown
                let daysAfterOrigin: number = 0;
                await c.resetContext(text, daysAfterOrigin);
                expect(c.reviewSequencer.currentCard.front).toEqual("Q1");

                // Simulate next day 2023-09-07
                // First card (rated as hard the previous day) is reshown; now reviewed as Good
                c.clearQuestionPostponementList();
                daysAfterOrigin = 1;
                await c.resetContext(text, daysAfterOrigin);
                expect(c.reviewSequencer.currentCard.front).toMatch(clozeQuestion1Card1);
                await c.reviewSequencer.processReview(ReviewResponse.Good);
                text = c.file.content;
                expectedCard1Review = "2023-09-09,2,230";
                expect(text).toContain(
                    `<!--SR:!${expectedCard1Review}!2000-01-01,1,250!2000-01-01,1,250-->`,
                );
                expect(c.reviewSequencer.currentCard.front).toEqual("Q1");

                // Simulate next day 2023-09-08
                // First card (rated as Good the previous day) is skipped; second sibling shown
                // Post review of second sibling, third sibling skipped and subsequent question Q1 shown
                c.clearQuestionPostponementList();
                daysAfterOrigin = 2;
                await c.resetContext(text, daysAfterOrigin);
                expect(c.reviewSequencer.currentCard.front).toMatch(clozeQuestion1Card2);
                await c.reviewSequencer.processReview(ReviewResponse.Easy);
                text = c.file.content;
                expectedCard1Review = "2023-09-09,2,230";
                let expectedCard2Review: string = "2023-09-12,4,270";
                expect(text).toContain(
                    `<!--SR:!${expectedCard1Review}!${expectedCard2Review}!2000-01-01,1,250-->`,
                );
                expect(c.reviewSequencer.currentCard.front).toEqual("Q1");
            });

            test("Question with single cards; card reviewed as hard, the question is NOT added to the postponement list", async () => {
                let settings: SRSettings = { ...DEFAULT_SETTINGS };
                settings.burySiblingCards = true;

                // Question with a single card
                let text: string = `#flashcards Q1::A1`;

                // Create the test context
                setupStaticDateProvider_OriginDatePlusDays(0);
                const c: TestContext = TestContext.Create(
                    order_DueFirst_Sequential,
                    FlashcardReviewMode.Review,
                    settings,
                    text,
                );
                await c.setSequencerDeckTreeFromOriginalText();
                expect(c.reviewSequencer.currentCard.front).toEqual("Q1");

                // Review the card
                await c.reviewSequencer.processReview(ReviewResponse.Hard);

                // Check that there are no questions on the postponement list
                checkQuestionPostponementListCount(c, 0);
            });
        });

        test("Answer includes MathJax within $$", async () => {
            let fileText: string = `#flashcards
What is Newman's equation for gravitational force
?
$$\\huge F_g=\\frac {G m_1 m_2}{d^2}$$`;

            let c: TestContext = TestContext.Create(
                order_DueFirst_Sequential,
                FlashcardReviewMode.Review,
                DEFAULT_SETTINGS,
                fileText,
            );
            await c.setSequencerDeckTreeFromOriginalText();
            expect(c.reviewSequencer.currentCard.front).toContain("What is Newman's equation");

            // Reviewing the card doesn't change the question, only adds the schedule info
            await c.reviewSequencer.processReview(ReviewResponse.Easy);
            let expectedFileText: string = `${fileText}
<!--SR:!2023-09-10,4,270-->`;

            let actual: string = await c.file.read();
            expect(actual).toEqual(expectedFileText);
        });
    });

    describe("Checking leading/trailing spaces", () => {
        test("Leading spaces are retained post review", async () => {
            // https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/800
            let settings: SRSettings = { ...DEFAULT_SETTINGS };
            settings.burySiblingCards = true;
            let indent: string = "    ";

            // Note that "- bar?::baz" is intentionally indented
            let text: string = `#flashcards
- foo
${indent}- bar?::baz
`;

            let c: TestContext = TestContext.Create(
                order_DueFirst_Sequential,
                FlashcardReviewMode.Review,
                settings,
                text,
            );
            await c.setSequencerDeckTreeFromOriginalText();

            expect(c.reviewSequencer.currentCard.front).toMatch(`${indent}- bar?`);

            // After reviewing, check the text (explicitly text includes the whitespace before "- bar?::baz"at)
            await c.reviewSequencer.processReview(ReviewResponse.Easy);
            const expectedText: string = `${text}<!--SR:!2023-09-10,4,270-->\n`;
            expect(await c.file.read()).toEqual(expectedText);
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

describe("getDeckStats", () => {
    describe("Single level deck with some new and due cards", () => {
        test("Initial stats", async () => {
            let text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3
Q4::A4 <!--SR:!2023-01-21,15,290-->
`;
            let c: TestContext = TestContext.Create(
                order_DueFirst_Sequential,
                FlashcardReviewMode.Review,
                DEFAULT_SETTINGS,
                text,
            );
            let deck: Deck = await c.setSequencerDeckTreeFromOriginalText();
            expect(c.getDeckStats("#flashcards")).toEqual(new DeckStats(1, 3, 4));
        });

        test("Reduction in due count after skipping card", async () => {
            let text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3
Q4::A4 <!--SR:!2023-01-21,15,290-->
`;
            let c: TestContext = TestContext.Create(
                order_DueFirst_Sequential,
                FlashcardReviewMode.Review,
                DEFAULT_SETTINGS,
                text,
            );
            let deck: Deck = await c.setSequencerDeckTreeFromOriginalText();

            expect(c.reviewSequencer.currentCard.front).toEqual("Q4"); // This is the first card as we are using order_DueFirst_Sequential
            expect(c.getDeckStats("#flashcards")).toEqual(new DeckStats(1, 3, 4));
            c.reviewSequencer.skipCurrentCard();
            // One less due card
            expect(c.getDeckStats("#flashcards")).toEqual(new DeckStats(0, 3, 4));
        });

        test("Change in stats after reviewing each card", async () => {
            let text: string = `#flashcards
Q1::A1
Q2::A2
Q3::A3
Q4::A4 <!--SR:!2023-01-21,15,290-->
`;
            let c: TestContext = TestContext.Create(
                order_DueFirst_Sequential,
                FlashcardReviewMode.Review,
                DEFAULT_SETTINGS,
                text,
            );
            let deck: Deck = await c.setSequencerDeckTreeFromOriginalText();

            await checkStats(c, "#flashcards", [
                [new DeckStats(1, 3, 4), "Q4", ReviewResponse.Easy], // This is the first card as we are using order_DueFirst_Sequential
                [new DeckStats(0, 3, 4), "Q1", ReviewResponse.Easy], // Iterated through all the due cards, now the new ones
                [new DeckStats(0, 2, 4), "Q2", ReviewResponse.Easy],
            ]);
        });
    });
});

async function checkStats(
    c: TestContext,
    topicPath: string,
    expectedStats: [DeckStats, string, ReviewResponse][],
): Promise<void> {
    for (const item of expectedStats) {
        const [expectedDeckStats, expectedCardFront, reviewResponse] = item;
        expect(c.getDeckStats(topicPath)).toEqual(expectedDeckStats);
        if (expectedCardFront)
            expect(c.reviewSequencer.currentCard.front).toEqual(expectedCardFront);
        if (reviewResponse != null) await c.reviewSequencer.processReview(reviewResponse);
    }
}

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

function checkQuestionPostponementListCount(c: TestContext, expectedListLength: number) {
    expect(c.questionPostponementList.list.length).toEqual(expectedListLength);
}

function skipAndCheckNoRemainingCards(c: TestContext) {
    c.reviewSequencer.skipCurrentCard();
    expect(c.reviewSequencer.hasCurrentCard).toEqual(false);
}

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
