import { CardScheduleCalculator } from "src/CardSchedule";
import { DeckTreeSequentialIterator, IDeckTreeIterator } from "src/DeckTreeIterator";
import { FlashcardReviewMode, FlashcardReviewSequencer, IFlashcardReviewSequencer } from "src/FlashcardReviewSequencer";
import { TopicPath } from "src/TopicPath";
import { CardListType, Deck } from "src/Deck";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { SampleItemDecks } from "./SampleItems";
import { UnitTestSRFile } from "src/SRFile";
import { ticksFromDate } from "src/util/utils";
import { ReviewResponse } from "src/scheduling";
import { setupStaticDateProvider_20230906 } from "src/util/DateProvider";
import moment from "moment";

class TestContext {
    cardSequencer: IDeckTreeIterator;
    cardScheduleCalculator: CardScheduleCalculator;
    reviewSequencer: IFlashcardReviewSequencer;
    file: UnitTestSRFile;
    originalText: string;
    fakeFilePath: string;
    
    constructor(init?: Partial<TestContext>) {
        Object.assign(this, init);
    }

    async setSequencerDeckTreeFromOriginalText(): Promise<Deck> {
        let deck: Deck = await SampleItemDecks.createDeckFromFile(this.file, new TopicPath(["Root"]));
        this.reviewSequencer.setDeckTree(deck);
        return deck;
    }

    static Create(cardListType: CardListType, reviewMode: FlashcardReviewMode, settings: SRSettings, text: string, fakeFilePath?: string): TestContext {
        let cardSequencer: IDeckTreeIterator = new DeckTreeSequentialIterator(cardListType);
        let cardScheduleCalculator: CardScheduleCalculator = new CardScheduleCalculator(settings);
        let reviewSequencer: IFlashcardReviewSequencer = new FlashcardReviewSequencer(reviewMode, cardSequencer, settings, cardScheduleCalculator);
        var file: UnitTestSRFile = new UnitTestSRFile(text, fakeFilePath);

        let result: TestContext = new TestContext({
            cardSequencer, 
            cardScheduleCalculator, 
            reviewSequencer, 
            file, 
            originalText: text, 
            fakeFilePath
        });
        return result;
        
    }
}

beforeAll(() =>  {
    setupStaticDateProvider_20230906();
})

describe("setDeckTree", () => {

    test("Empty deck", () => {
        let c: TestContext = TestContext.Create(CardListType.DueCard, FlashcardReviewMode.Review, DEFAULT_SETTINGS, "");
        c.reviewSequencer.setDeckTree(Deck.emptyDeck);
        expect(c.reviewSequencer.currentDeck).toEqual(null);
        expect(c.reviewSequencer.currentCard).toEqual(null);
    });

    // After setDeckTree, the first card in the deck is the current card
    test("Single level deck with some new cards", async () => {
        let text: string = `
Q1::A1
Q2::A2
Q3::A3`;
        let c: TestContext = TestContext.Create(CardListType.DueCard, FlashcardReviewMode.Review, DEFAULT_SETTINGS, text);
        let deck: Deck = await c.setSequencerDeckTreeFromOriginalText();
        expect(deck.newFlashcards.length).toEqual(3);
        
        expect(c.reviewSequencer.currentDeck.newFlashcards.length).toEqual(3);
        let expected = {
            front: "Q1", 
            back: "A1"
        };
        expect(c.reviewSequencer.currentCard).toMatchObject(expected);
    });
});

describe("skipCurrentCard", () => {

    test("Simple test", async () => {
        let c: TestContext = await setupSample1();
        expect(c.reviewSequencer.currentCard.front).toEqual("Q2");
        
        // No more due cards after current card, so we expect the first new card for topic #flashcards
        skipAndCheck(c.reviewSequencer, "Q1");
        skipAndCheck(c.reviewSequencer, "Q3");
    });

    test("Skip repeatedly until no more", async () => {
        let c: TestContext = await setupSample1();
        expect(c.reviewSequencer.currentCard.front).toEqual("Q2");
        
        // No more due cards after current card, so we expect the first new card for topic #flashcards
        skipAndCheck(c.reviewSequencer, "Q1");
        skipAndCheck(c.reviewSequencer, "Q3");

        skipAndCheck(c.reviewSequencer, "Q4");
        skipAndCheck(c.reviewSequencer, "Q5");
        skipAndCheck(c.reviewSequencer, "Q6");

        c.reviewSequencer.skipCurrentCard();
        expect(c.reviewSequencer.hasCurrentCard).toEqual(false);
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

                let c: TestContext = TestContext.Create(CardListType.DueCard, FlashcardReviewMode.Review, DEFAULT_SETTINGS, text);
                let deck: Deck = await c.setSequencerDeckTreeFromOriginalText();

                // State before calling processReview
                let card = c.reviewSequencer.currentCard;
                expect(card.front).toEqual("Q1");
                expect(card.scheduleInfo).toMatchObject({
                    ease: 270, 
                    interval: 4
                });

                // State after calling processReview - same current card
                // (only need to check ease, interval - dueDate & delayBeforeReview are not relevant)
                await c.reviewSequencer.processReview(ReviewResponse.Reset);
                card = c.reviewSequencer.currentCard;
                expect(card.front).toEqual("Q2");
                expect(card.scheduleInfo).toMatchObject({
                    ease: 270, 
                    interval: 5
                });

                c.reviewSequencer.skipCurrentCard();
                card = c.reviewSequencer.currentCard;
                expect(card.front).toEqual("Q3");
                expect(card.scheduleInfo).toMatchObject({
                    ease: 270, 
                    interval: 6
                });

                // After skipping Q3, we should see Q1 the reset card with updated ease/interval
                c.reviewSequencer.skipCurrentCard();
                card = c.reviewSequencer.currentCard;
                expect(card.front).toEqual("Q1");
                expect(card.scheduleInfo).toMatchObject({
                    ease: DEFAULT_SETTINGS.baseEase, 
                    interval: 1
                });
            });
        });

        describe("ReviewResponse.Easy", () => {
            test("Card schedule is updated, next card becomes current", async () => {

                const expected: Info1 = {
                    cardQ2_PreReviewText: "Q2::A2 <!--SR:!2023-09-02,4,270-->", 
                    cardQ2_PostReviewEase: 290, 
                    cardQ2_PostReviewInterval: 30, 
                    cardQ2_PostReviewDueDate: "2023-10-06", 
                    cardQ2_PostReviewText: `Q2::A2
<!--SR:!2023-10-06,30,290-->`             
                };
                await checkReviewResponse(ReviewResponse.Easy, expected);
            });
        });
    });
});

interface Info1 {
    cardQ2_PreReviewText: string;
    cardQ2_PostReviewEase: number;
    cardQ2_PostReviewInterval: number;
    cardQ2_PostReviewDueDate: string;
    cardQ2_PostReviewText: string
}

async function checkReviewResponse(reviewResponse: ReviewResponse, info: Info1): Promise<void> {

    let text: string = `
#flashcards Q1::A1
#flashcards Q2::A2 <!--SR:!2023-09-02,4,270-->
#flashcards Q3::A3`;

    let str: string = moment().millisecond().toString();
    let c: TestContext = TestContext.Create(CardListType.DueCard, FlashcardReviewMode.Review, DEFAULT_SETTINGS, text, str);
    let deck: Deck = await c.setSequencerDeckTreeFromOriginalText();

    // State before calling processReview
    let card = c.reviewSequencer.currentCard;
    expect(card.front).toEqual("Q2");
    expect(card.scheduleInfo).toMatchObject({
        ease: 270, 
        interval: 4
    });

    // State after calling processReview - next card
    await c.reviewSequencer.processReview(reviewResponse);
    expect(c.reviewSequencer.currentCard.front).toEqual("Q1");

    // Schedule for the reviewed card has been updated
    expect(card.scheduleInfo.ease).toEqual(info.cardQ2_PostReviewEase);
    expect(card.scheduleInfo.interval).toEqual(info.cardQ2_PostReviewInterval);
    expect(card.scheduleInfo.dueDateTicks.unix).toEqual(moment(info.cardQ2_PostReviewDueDate).unix);

    // Note text has been updated
    let expectedText: string = c.originalText.replace(info.cardQ2_PreReviewText, info.cardQ2_PostReviewText);
    expect(await c.file.read()).toEqual(expectedText);
};

async function setupSample1(): Promise<TestContext> {
    let text: string = `
        #flashcards Q1::A1
        #flashcards Q2::A2 <!--SR:!2023-09-02,4,270-->
        #flashcards Q3::A3
        #flashcards/science Q4::A4 <!--SR:!2023-09-02,4,270-->
        #flashcards/science/physics Q5::A5 <!--SR:!2023-09-02,4,270-->
        #flashcards/math Q6::A6`;
    
    let c: TestContext = TestContext.Create(CardListType.DueCard, FlashcardReviewMode.Review, DEFAULT_SETTINGS, text);
    await c.setSequencerDeckTreeFromOriginalText();
    return c;
}

function skipAndCheck(sequencer: IFlashcardReviewSequencer, expectedFront: string): void {
    sequencer.skipCurrentCard();
    expect(sequencer.currentCard.front).toEqual(expectedFront);

}

