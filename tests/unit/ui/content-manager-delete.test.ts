import type { App } from "obsidian";

import type { Card } from "src/data/data-structures/card/card";
import type { Question } from "src/data/data-structures/card/questions/question";
import { Deck } from "src/data/data-structures/deck/deck";
import { DEFAULT_SETTINGS } from "src/data/settings";
import type SRPlugin from "src/main";
import type { Note } from "src/note/note";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import {
    DeckStats,
    FlashcardReviewMode,
    IFlashcardReviewSequencer,
} from "src/scheduling/flashcard-review-sequencer";
import { CardContainer } from "src/ui/obsidian-ui-components/content-container/card-container/card-container";
import ContentManager from "src/ui/obsidian-ui-components/content-container/content-manager";
import { DeckContainer } from "src/ui/obsidian-ui-components/content-container/deck-container/deck-container";
import { FlashcardEditModal } from "src/ui/obsidian-ui-components/modals/edit-modal";
import type { ReviewQueueLoader } from "src/ui/review-queue-loader";
import { UIState } from "src/ui/ui-manager";

jest.mock("src/ui/obsidian-ui-components/content-container/card-container/card-container", () => ({
    CardContainer: jest.fn(),
}));
jest.mock("src/ui/obsidian-ui-components/content-container/deck-container/deck-container", () => ({
    DeckContainer: jest.fn(),
}));
jest.mock("src/ui/obsidian-ui-components/modals/edit-modal", () => ({
    FlashcardEditModal: { Prompt: jest.fn() },
}));
jest.mock("src/ui/ui-manager", () => ({
    UIState: { Closed: 0, DeckList: 1, CardFront: 2, CardBack: 3, EditModal: 4 },
}));

function deferred<T = void>() {
    let resolve: (value: T) => void;
    let reject: (reason: Error) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

async function createReview() {
    const settings = { ...DEFAULT_SETTINGS, reviewButtonDelay: 0 };
    const deck = new Deck("Review", null);
    const firstCard = { front: "First question" } as Card;
    const nextCard = { front: "Next question" } as Card;
    const sequencer = {
        currentCard: firstCard,
        currentQuestion: {} as Question,
        currentNote: {} as Note,
        currentDeck: deck,
        originalDeckTree: deck,
        hasCurrentCard: true,
        getSubDecksWithCardsInQueue: jest.fn(() => [deck]),
        getDeckStats: jest.fn(() => new DeckStats(2, 0, 2, 2, 0, 2, 2, 0, 1)),
        deleteCurrentCardFromNote: jest.fn<Promise<void>, []>(),
        processReview: jest.fn<Promise<void>, [ReviewResponse]>(),
        skipCurrentCard: jest.fn(),
        setCurrentDeck: jest.fn(),
    };
    const loader = {
        getReviewMode: jest.fn(() => FlashcardReviewMode.Review),
        setReviewMode: jest.fn(),
        loadReviewQueue: jest.fn().mockResolvedValue(sequencer),
    };
    const cardView = {
        openSession: jest.fn().mockResolvedValue(undefined),
        closeSession: jest.fn(),
        drawCardFront: jest
            .fn<Promise<void>, Parameters<CardContainer["drawCardFront"]>>()
            .mockResolvedValue(undefined),
        drawBack: jest.fn().mockResolvedValue(undefined),
    };
    const deckView = { closeList: jest.fn(), showList: jest.fn() };
    const uiManager = { setUIState: jest.fn(), setSRViewInFocus: jest.fn() };
    jest.mocked(CardContainer).mockImplementation(() => cardView as unknown as CardContainer);
    jest.mocked(DeckContainer).mockImplementation(() => deckView as unknown as DeckContainer);

    const manager = new ContentManager(
        {} as App,
        { uiManager, dataManager: { data: { settings } } } as unknown as SRPlugin,
        loader as unknown as ReviewQueueLoader,
        settings,
        document.createElement("div"),
    );
    const [, , , , deleteCard, backToDecks, editCard] = jest.mocked(CardContainer).mock.calls[0];
    const canProcessCard = jest.mocked(CardContainer).mock.calls[0][12];
    const [, changeMode, startDeck] = jest.mocked(DeckContainer).mock.calls[0];
    await manager.open();
    jest.clearAllMocks();

    return {
        manager,
        sequencer,
        loader,
        cardView,
        deckView,
        uiManager,
        firstCard,
        nextCard,
        deck,
        deleteCard,
        canProcessCard,
        backToDecks,
        editCard: editCard as () => Promise<void>,
        changeMode: changeMode as (mode: FlashcardReviewMode) => Promise<void>,
        startDeck: startDeck as (deck: Deck) => Promise<void>,
    };
}

describe("Deleting a card during review", () => {
    beforeEach(() => jest.clearAllMocks());

    test("starts deletion immediately and displays the next card only after persistence", async () => {
        const review = await createReview();
        const save = deferred();
        review.sequencer.deleteCurrentCardFromNote.mockImplementation(async () => {
            await save.promise;
            review.sequencer.currentCard = review.nextCard;
        });

        const deletion = review.deleteCard();
        expect(review.sequencer.deleteCurrentCardFromNote).toHaveBeenCalledTimes(1);
        expect(review.cardView.drawCardFront).not.toHaveBeenCalled();

        save.resolve();
        await deletion;

        expect(review.cardView.drawCardFront).toHaveBeenCalledTimes(1);
        expect(review.cardView.drawCardFront.mock.calls[0][0].cardData.currentCard).toBe(
            review.nextCard,
        );
    });

    test("blocks competing actions while deletion is pending, even with no button delay", async () => {
        const review = await createReview();
        const save = deferred();
        review.sequencer.deleteCurrentCardFromNote.mockReturnValue(save.promise);
        const deletion = review.deleteCard();

        expect(review.canProcessCard()).toBe(false);
        await review.deleteCard();
        await review.manager._skipCurrentCard();
        await review.manager._processReview(ReviewResponse.Good);
        await review.manager._showAnswer();
        await review.editCard();
        await review.backToDecks();
        await review.changeMode(FlashcardReviewMode.Cram);
        await review.startDeck(review.deck);
        await review.manager.open();

        expect(review.sequencer.deleteCurrentCardFromNote).toHaveBeenCalledTimes(1);
        expect(review.sequencer.skipCurrentCard).not.toHaveBeenCalled();
        expect(review.sequencer.processReview).not.toHaveBeenCalled();
        expect(review.sequencer.setCurrentDeck).not.toHaveBeenCalled();
        expect(jest.mocked(FlashcardEditModal).Prompt).not.toHaveBeenCalled();
        expect(review.loader.loadReviewQueue).not.toHaveBeenCalled();
        expect(review.loader.setReviewMode).not.toHaveBeenCalled();
        expect(review.cardView.drawBack).not.toHaveBeenCalled();
        expect(review.cardView.drawCardFront).not.toHaveBeenCalled();
        expect(review.deckView.showList).not.toHaveBeenCalled();
        expect(review.uiManager.setUIState).not.toHaveBeenCalled();
        expect(review.sequencer.currentCard).toBe(review.firstCard);

        save.resolve();
        await deletion;
        expect(review.canProcessCard()).toBe(true);
        await review.manager._skipCurrentCard();
        expect(review.sequencer.skipCurrentCard).toHaveBeenCalledTimes(1);
    });

    test("does not delete while a rating is being saved", async () => {
        const review = await createReview();
        const save = deferred();
        review.sequencer.processReview.mockReturnValue(save.promise);
        const rating = review.manager._processReview(ReviewResponse.Good);

        await review.deleteCard();
        expect(review.sequencer.deleteCurrentCardFromNote).not.toHaveBeenCalled();
        expect(review.cardView.drawCardFront).not.toHaveBeenCalled();

        save.resolve();
        await rating;
        await review.deleteCard();
        expect(review.sequencer.deleteCurrentCardFromNote).toHaveBeenCalledTimes(1);
    });

    test("a failed deletion does not advance the card and allows a retry", async () => {
        const review = await createReview();
        const save = deferred();
        review.sequencer.deleteCurrentCardFromNote.mockReturnValueOnce(save.promise);
        const deletion = review.deleteCard();
        const failure = expect(deletion).rejects.toThrow("Write failed");
        save.reject(new Error("Write failed"));
        await failure;

        expect(review.cardView.drawCardFront).not.toHaveBeenCalled();
        expect(review.sequencer.currentCard).toBe(review.firstCard);
        await review.deleteCard();
        expect(review.sequencer.deleteCurrentCardFromNote).toHaveBeenCalledTimes(2);
        expect(review.cardView.drawCardFront).toHaveBeenCalledTimes(1);
    });

    test("closing during deletion does not reopen the reviewer when the write finishes", async () => {
        const review = await createReview();
        const save = deferred();
        review.sequencer.deleteCurrentCardFromNote.mockReturnValue(save.promise);
        const deletion = review.deleteCard();

        review.manager.close();
        save.resolve();
        await deletion;
        await review.deleteCard();

        expect(review.uiManager.setUIState).toHaveBeenCalledTimes(1);
        expect(review.uiManager.setUIState).toHaveBeenCalledWith(UIState.Closed);
        expect(review.cardView.closeSession).toHaveBeenCalledTimes(1);
        expect(review.cardView.drawCardFront).not.toHaveBeenCalled();
        expect(review.deckView.showList).not.toHaveBeenCalled();
        expect(review.loader.loadReviewQueue).not.toHaveBeenCalled();
        expect(review.sequencer.deleteCurrentCardFromNote).toHaveBeenCalledTimes(1);
    });

    test("closing while the last-card queue reload is pending does not reopen the deck list", async () => {
        const review = await createReview();
        const reload = deferred<IFlashcardReviewSequencer>();
        review.loader.loadReviewQueue.mockReturnValueOnce(reload.promise);
        review.sequencer.deleteCurrentCardFromNote.mockImplementation(() => {
            review.sequencer.hasCurrentCard = false;
            return Promise.resolve();
        });

        const deletion = review.deleteCard();
        await Promise.resolve();
        expect(review.loader.loadReviewQueue).toHaveBeenCalledTimes(1);

        review.manager.close();
        reload.resolve(review.sequencer as unknown as IFlashcardReviewSequencer);
        await deletion;

        expect(review.uiManager.setUIState).toHaveBeenCalledTimes(1);
        expect(review.uiManager.setUIState).toHaveBeenCalledWith(UIState.Closed);
        expect(review.deckView.showList).not.toHaveBeenCalled();
        expect(review.cardView.drawCardFront).not.toHaveBeenCalled();
    });
});
