import { CardScheduleCalculator } from "src/CardSchedule";
import { DeckTreeSequentialIterator, IDeckTreeIterator } from "src/DeckTreeIterator";
import { FlashcardReviewMode, FlashcardReviewSequencer, IFlashcardReviewSequencer } from "src/FlashcardReviewSequencer";
import { TopicPath } from "src/TopicPath";
import { CardListType, Deck } from "src/Deck";
import { DEFAULT_SETTINGS } from "src/settings";
import { SampleItemDecks } from "./SampleItems";
import { UnitTestSRFile } from "src/SRFile";
import { ticksFromDate } from "src/util/utils";
import { ReviewResponse } from "src/scheduling";
import { setupStaticDateProvider_20230906 } from "src/util/DateProvider";
import moment from "moment";

let cardSequencer_PreferDue: IDeckTreeIterator = new DeckTreeSequentialIterator(CardListType.DueCard);
let cardScheduleCalculator: CardScheduleCalculator = new CardScheduleCalculator(DEFAULT_SETTINGS);
let reviewSequencer_PreferDue: IFlashcardReviewSequencer = new FlashcardReviewSequencer(FlashcardReviewMode.Review, cardSequencer_PreferDue, DEFAULT_SETTINGS, cardScheduleCalculator);
var file: UnitTestSRFile;
var originalText: string;

beforeAll(() =>  {
    setupStaticDateProvider_20230906();
})

describe("setDeckTree", () => {

    test("Empty deck", () => {
        reviewSequencer_PreferDue.setDeckTree(Deck.emptyDeck);
        expect(reviewSequencer_PreferDue.currentDeck).toEqual(null);
        expect(reviewSequencer_PreferDue.currentCard).toEqual(null);
    });

    // After setDeckTree, the first card in the deck is the current card
    test("Single level deck with some new cards", async () => {
        let text: string = `
Q1::A1
Q2::A2
Q3::A3`;
        let deck: Deck = await SampleItemDecks.createDeckFromText(text, new TopicPath(["Root"]));
        expect(deck.newFlashcards.length).toEqual(3);
        reviewSequencer_PreferDue.setDeckTree(deck);
        expect(reviewSequencer_PreferDue.currentDeck.newFlashcards.length).toEqual(3);
        let expected = {
            front: "Q1", 
            back: "A1"
        };
        expect(reviewSequencer_PreferDue.currentCard).toMatchObject(expected);
    });
});

describe("skipCurrentCard", () => {

    test("Simple test", async () => {
        await setupSample1();
        expect(reviewSequencer_PreferDue.currentCard.front).toEqual("Q2");
        
        // No more due cards after current card, so we expect the first new card for topic #flashcards
        skipAndCheck(reviewSequencer_PreferDue, "Q1");
        skipAndCheck(reviewSequencer_PreferDue, "Q3");
    });

    test("Skip repeatedly until no more", async () => {
        await setupSample1();
        expect(reviewSequencer_PreferDue.currentCard.front).toEqual("Q2");
        
        // No more due cards after current card, so we expect the first new card for topic #flashcards
        skipAndCheck(reviewSequencer_PreferDue, "Q1");
        skipAndCheck(reviewSequencer_PreferDue, "Q3");

        skipAndCheck(reviewSequencer_PreferDue, "Q4");
        skipAndCheck(reviewSequencer_PreferDue, "Q5");
        skipAndCheck(reviewSequencer_PreferDue, "Q6");

        reviewSequencer_PreferDue.skipCurrentCard();
        expect(reviewSequencer_PreferDue.hasCurrentCard).toEqual(false);
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
                await setupSample(text);

                // State before calling processReview
                let card = reviewSequencer_PreferDue.currentCard;
                expect(card.front).toEqual("Q1");
                expect(card.scheduleInfo).toMatchObject({
                    ease: 270, 
                    interval: 4
                });

                // State after calling processReview - same current card
                // (only need to check ease, interval - dueDate & delayBeforeReview are not relevant)
                reviewSequencer_PreferDue.processReview(ReviewResponse.Reset);
                card = reviewSequencer_PreferDue.currentCard;
                expect(card.front).toEqual("Q2");
                expect(card.scheduleInfo).toMatchObject({
                    ease: 270, 
                    interval: 5
                });

                reviewSequencer_PreferDue.skipCurrentCard();
                card = reviewSequencer_PreferDue.currentCard;
                expect(card.front).toEqual("Q3");
                expect(card.scheduleInfo).toMatchObject({
                    ease: 270, 
                    interval: 6
                });

                // After skipping Q3, we should see Q1 the reset card with updated ease/interval
                reviewSequencer_PreferDue.skipCurrentCard();
                card = reviewSequencer_PreferDue.currentCard;
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
                    cardQ2_PostReviewInterval: 34, 
                    cardQ2_PostReviewDueDate: "2023-10-06", 
                    cardQ2_PostReviewText: "Q2::A2 <!--SR:!2023-10-16,34,290-->"             
                };
                let cardQ2_PostReviewEase
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
    await setupSample(text);

    // State before calling processReview
    let card = reviewSequencer_PreferDue.currentCard;
    expect(card.front).toEqual("Q2");
    expect(card.scheduleInfo).toMatchObject({
        ease: 270, 
        interval: 4
    });

    // State after calling processReview - next card
    reviewSequencer_PreferDue.processReview(reviewResponse);
    expect(reviewSequencer_PreferDue.currentCard.front).toEqual("Q1");

    // Schedule for the reviewed card has been updated
    expect(card.scheduleInfo.ease).toEqual(info.cardQ2_PostReviewEase);
    expect(card.scheduleInfo.interval).toEqual(info.cardQ2_PostReviewInterval);
    expect(card.scheduleInfo.dueDateTicks.unix).toEqual(moment(info.cardQ2_PostReviewDueDate).unix);

    // Note text has been updated
    let expectedText: string = originalText.replace(info.cardQ2_PreReviewText, info.cardQ2_PostReviewText);
    expect(await file.read()).toEqual(expectedText);
};

async function setupSample1() {
    let text: string = `
        #flashcards Q1::A1
        #flashcards Q2::A2 <!--SR:!2023-09-02,4,270-->
        #flashcards Q3::A3
        #flashcards/science Q4::A4 <!--SR:!2023-09-02,4,270-->
        #flashcards/science/physics Q5::A5 <!--SR:!2023-09-02,4,270-->
        #flashcards/math Q6::A6`;
    await setupSample(text);
}

async function setupSample(text: string) {

    file = new UnitTestSRFile(text);
    originalText = text;
    let deck: Deck = await SampleItemDecks.createDeckFromFile(file, new TopicPath(["Root"]));
    reviewSequencer_PreferDue.setDeckTree(deck);
}

function skipAndCheck(sequencer: IFlashcardReviewSequencer, expectedFront: string): void {
    sequencer.skipCurrentCard();
    expect(sequencer.currentCard.front).toEqual(expectedFront);

}

