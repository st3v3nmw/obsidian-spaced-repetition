import { ISRAlgorithm } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { RepItemState, ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { TICKS_PER_DAY } from "src/data/constants";
import { DataStore } from "src/data/data-stores/base/data-store";
import { Card } from "src/data/data-structures/card/card";
import { Question, QuestionText } from "src/data/data-structures/card/questions/question";
import { IQuestionPostponementList } from "src/data/data-structures/card/questions/question-postponement-list";
import { Deck } from "src/data/data-structures/deck/deck";
import { IDeckTreeIterator } from "src/data/data-structures/deck/deck-tree-iterator";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { SRSettings } from "src/data/settings";
import { Note } from "src/note/note";
import { DueDateHistogram } from "src/scheduling/due-date-histogram";
import { globalDateProvider } from "src/utils/dates";

export interface IFlashcardReviewSequencer {
    get hasCurrentCard(): boolean;
    get hasPendingCards(): boolean;
    get currentCard(): Card;
    get currentQuestion(): Question;
    get currentNote(): Note;
    get currentDeck(): Deck;
    get nextPendingDueUnix(): number | null;
    get originalDeckTree(): Deck;

    setDeckTree(originalDeckTree: Deck, remainingDeckTree: Deck): void;
    setCurrentDeck(topicPath: TopicPath): void;
    refreshCurrentDeck(): void;
    getDeckStats(topicPath: TopicPath): DeckStats;
    getSubDecksWithCardsInQueue(deck: Deck): Deck[];
    skipCurrentCard(): void;
    determineCardSchedule(response: ReviewResponse, card: Card): RepItemScheduleInfo;
    processReview(response: ReviewResponse): Promise<void>;
    updateCurrentQuestionText(text: string): Promise<void>;
    deleteCurrentCardFromNote(): Promise<void>;
}

/**
 * Represents statistics for a deck and its subdecks.
 *
 * @property {number} totalCount - Total number of cards in this deck and all subdecks.
 * @property {number} dueCount - Number of due cards in this deck and all subdecks.
 * @property {number} newCount - Number of new cards in this deck and all subdecks.
 * @property {number} cardsInQueueCount - Number of cards in the queue of this deck and all subdecks.
 * @property {number} dueCardsInQueueOfThisDeckCount - Number of due cards just in this deck.
 * @property {number} newCardsInQueueOfThisDeckCount - Number of new cards just in this deck.
 * @property {number} cardsInQueueOfThisDeckCount - Total number of cards in queue just in this deck.
 * @property {number} subDecksInQueueOfThisDeckCount - Number of subdecks in the queue just in this deck.
 * @property {number} decksInQueueOfThisDeckCount - Total number of decks in the queue including this deck and its subdecks.
 *
 * @constructor
 * @param {number} totalCount - Initializes the total count of cards.
 * @param {number} dueCount - Initializes the due count of cards.
 * @param {number} newCount - Initializes the new count of cards.
 * @param {number} cardsInQueueCount - Initializes the count of cards in the queue.
 * @param {number} dueCardsInQueueOfThisDeckCount - Initializes the count of due cards just in this deck.
 * @param {number} newCardsInQueueOfThisDeckCount - Initializes the count of new cards just in this deck.
 * @param {number} cardsInQueueOfThisDeckCount - Initializes the count of all cards in the queue just in this deck.
 * @param {number} subDecksInQueueOfThisDeckCount - Initializes the count of subdecks in the queue just in this deck.
 * @param {number} decksInQueueOfThisDeckCount - Initializes the count of all decks in the queue including this deck and its subdecks.
 */
export class DeckStats {
    totalCount: number;
    dueCount: number;
    newCount: number;
    cardsInQueueCount: number;
    dueCardsInQueueOfThisDeckCount: number;
    newCardsInQueueOfThisDeckCount: number;
    cardsInQueueOfThisDeckCount: number;
    subDecksInQueueOfThisDeckCount: number;
    decksInQueueOfThisDeckCount: number;

    constructor(
        totalCount: number,
        dueCount: number,
        newCount: number,
        cardsInQueueCount: number,
        dueCardsInQueueOfThisDeckCount: number,
        newCardsInQueueOfThisDeckCount: number,
        cardsInQueueOfThisDeckCount: number,
        subDecksInQueueOfThisDeckCount: number,
        decksInQueueOfThisDeckCount: number,
    ) {
        this.dueCount = dueCount;
        this.newCount = newCount;
        this.totalCount = totalCount;
        this.cardsInQueueCount = cardsInQueueCount;
        this.dueCardsInQueueOfThisDeckCount = dueCardsInQueueOfThisDeckCount;
        this.newCardsInQueueOfThisDeckCount = newCardsInQueueOfThisDeckCount;
        this.cardsInQueueOfThisDeckCount = cardsInQueueOfThisDeckCount;
        this.subDecksInQueueOfThisDeckCount = subDecksInQueueOfThisDeckCount;
        this.decksInQueueOfThisDeckCount = decksInQueueOfThisDeckCount;
    }
}

export enum FlashcardReviewMode {
    Cram,
    Review,
}

interface PendingCard {
    card: Card;
    dueUnix: number;
}

export class FlashcardReviewSequencer implements IFlashcardReviewSequencer {
    // We need the original deck tree so that we can still provide the total cards in each deck
    private _originalDeckTree: Deck;

    // This is set by the caller, and must have the same deck hierarchy as originalDeckTree.
    private remainingDeckTree: Deck;

    private reviewMode: FlashcardReviewMode;
    private cardSequencer: IDeckTreeIterator;
    private settings: SRSettings;
    private srsAlgorithm: ISRAlgorithm;
    private questionPostponementList: IQuestionPostponementList;
    private dueDateFlashcardHistogram: DueDateHistogram;
    private pendingCards: PendingCard[] = [];
    private currentTopicPath: TopicPath = TopicPath.emptyPath;

    constructor(
        reviewMode: FlashcardReviewMode,
        cardSequencer: IDeckTreeIterator,
        settings: SRSettings,
        srsAlgorithm: ISRAlgorithm,
        questionPostponementList: IQuestionPostponementList,
        dueDateFlashcardHistogram: DueDateHistogram,
    ) {
        this.reviewMode = reviewMode;
        this.cardSequencer = cardSequencer;
        this.settings = settings;
        this.srsAlgorithm = srsAlgorithm;
        this.questionPostponementList = questionPostponementList;
        this.dueDateFlashcardHistogram = dueDateFlashcardHistogram;
    }

    get hasCurrentCard(): boolean {
        return (
            this.cardSequencer.currentRepItem !== null && this.cardSequencer.currentRepItem !== undefined
        );
    }

    get hasPendingCards(): boolean {
        return this.pendingCards.length > 0;
    }

    get currentCard(): Card {
        return this.cardSequencer.currentRepItem as Card;
    }

    get currentQuestion(): Question {
        return this.currentCard?.question;
    }

    get currentDeck(): Deck {
        return this.cardSequencer.currentDeck;
    }

    get nextPendingDueUnix(): number | null {
        return this.pendingCards.length > 0
            ? Math.min(...this.pendingCards.map((pendingCard) => pendingCard.dueUnix))
            : null;
    }

    get currentNote(): Note {
        return this.currentQuestion.note;
    }

    // originalDeckTree isn't modified by the review process
    // Only remainingDeckTree
    setDeckTree(originalDeckTree: Deck, remainingDeckTree: Deck): void {
        this.cardSequencer.setBaseDeck(remainingDeckTree);
        this._originalDeckTree = originalDeckTree;
        this.remainingDeckTree = remainingDeckTree;
        this.pendingCards = [];
        this.setCurrentDeck(TopicPath.emptyPath);
    }

    setCurrentDeck(topicPath: TopicPath): void {
        this.currentTopicPath = topicPath;
        this.wakeDuePendingCards();
        this.cardSequencer.setIteratorTopicPath(topicPath);
        this.cardSequencer.nextRepItem();
    }

    refreshCurrentDeck(): void {
        this.setCurrentDeck(this.currentTopicPath);
    }

    get originalDeckTree(): Deck {
        return this._originalDeckTree;
    }

    getDeckStats(topicPath: TopicPath): DeckStats {
        this.wakeDuePendingCards();
        const totalCount: number = this._originalDeckTree
            .getDeck(topicPath)
            .getDistinctRepItemCount(RepItemState.AnyItem, true);
        const remainingDeck: Deck = this.remainingDeckTree.getDeck(topicPath);
        const newCount: number = remainingDeck.getDistinctRepItemCount(RepItemState.NewItem, true);
        const dueCount: number = remainingDeck.getDistinctRepItemCount(RepItemState.DueItem, true);

        // Sry for the long variable names, but I needed all these distinct counts in the UI
        const newCardsInQueueOfThisDeckCount = remainingDeck.getDistinctRepItemCount(
            RepItemState.NewItem,
            false,
        );
        const dueCardsInQueueOfThisDeckCount = remainingDeck.getDistinctRepItemCount(
            RepItemState.DueItem,
            false,
        );
        const cardsInQueueOfThisDeckCount =
            newCardsInQueueOfThisDeckCount + dueCardsInQueueOfThisDeckCount;

        const subDecksInQueueOfThisDeckCount =
            this.getSubDecksWithCardsInQueue(remainingDeck).length;
        const decksInQueueOfThisDeckCount =
            cardsInQueueOfThisDeckCount > 0
                ? subDecksInQueueOfThisDeckCount + 1
                : subDecksInQueueOfThisDeckCount;

        return new DeckStats(
            totalCount,
            dueCount,
            newCount,
            dueCount + newCount,
            dueCardsInQueueOfThisDeckCount,
            newCardsInQueueOfThisDeckCount,
            cardsInQueueOfThisDeckCount,
            subDecksInQueueOfThisDeckCount,
            decksInQueueOfThisDeckCount,
        );
    }

    getSubDecksWithCardsInQueue(deck: Deck): Deck[] {
        this.wakeDuePendingCards();
        let subDecksWithCardsInQueue: Deck[] = [];

        deck.subdecks.forEach((subDeck) => {
            subDecksWithCardsInQueue = subDecksWithCardsInQueue.concat(
                this.getSubDecksWithCardsInQueue(subDeck),
            );

            const newCount: number = subDeck.getDistinctRepItemCount(RepItemState.NewItem, false);
            const dueCount: number = subDeck.getDistinctRepItemCount(RepItemState.DueItem, false);
            if (newCount + dueCount > 0) subDecksWithCardsInQueue.push(subDeck);
        });

        return subDecksWithCardsInQueue;
    }

    skipCurrentCard(): void {
        this.cardSequencer.deleteCurrentQuestionFromAllDecks();
    }

    private deleteCurrentCard(): void {
        this.cardSequencer.deleteCurrentRepItemFromAllDecks();
    }

    async processReview(response: ReviewResponse): Promise<void> {
        switch (this.reviewMode) {
            case FlashcardReviewMode.Review:
                await this.processReviewReviewMode(response);
                break;

            case FlashcardReviewMode.Cram:
                await this.processReviewCramMode(response);
                break;
        }
    }

    async processReviewReviewMode(response: ReviewResponse): Promise<void> {
        let shortTermRequeue: "none" | "immediate" | "pending" = "none";
        if (response !== ReviewResponse.Reset || this.currentCard.hasSchedule) {
            const oldSchedule = this.currentCard.scheduleInfo;

            // We need to update the schedule if:
            //  (1) the user reviewed with easy/good/hard (either a new or due card),
            //  (2) or reset a due card
            // Nothing to do if a user resets a new card
            this.currentCard.scheduleInfo = this.determineCardSchedule(response, this.currentCard);
            shortTermRequeue = this.getShortTermRequeueMode(this.currentCard.scheduleInfo);

            // Update the source file with the updated schedule
            await DataStore.getInstance().writeSchedule(this.currentQuestion);

            if (oldSchedule) {
                const now: number = globalDateProvider.now.valueOf();
                const nDays: number = Math.ceil((oldSchedule.dueDateAsUnix - now) / TICKS_PER_DAY);

                this.dueDateFlashcardHistogram.decrement(nDays);
            }
            this.dueDateFlashcardHistogram.increment(this.currentCard.scheduleInfo.interval);
        } else if (response === ReviewResponse.Reset) {
            shortTermRequeue = "immediate";
        }

        if (shortTermRequeue === "pending") {
            await this.handlePendingRequeue();
        } else if (shortTermRequeue === "immediate" || response === ReviewResponse.Reset) {
            if (this.settings.burySiblingCards) {
                await this.burySiblingCards();
                this.deleteSiblingCardsFromAllDecks();
            }
            this.cardSequencer.moveCurrentRepItemToEndOfList();
            this.cardSequencer.nextRepItem();
        } else {
            if (this.settings.burySiblingCards) {
                await this.burySiblingCards();
                this.cardSequencer.deleteCurrentQuestionFromAllDecks();
            } else {
                this.deleteCurrentCard();
            }
        }
    }

    private async burySiblingCards(): Promise<void> {
        // We check if there are any sibling cards still in the deck,
        // We do this because otherwise we would be adding every reviewed card to the postponement list, even for a
        // question with a single card. That isn't consistent with the 1.10.1 behavior
        const remaining = this.currentDeck.getQuestionRepItemCount(this.currentQuestion);
        if (remaining > 1) {
            this.questionPostponementList.add(this.currentQuestion);
            await this.questionPostponementList.write();
        }
    }

    private deleteSiblingCardsFromAllDecks(): void {
        for (const siblingCard of this.currentQuestion.cards) {
            if (Object.is(siblingCard, this.currentCard)) {
                continue;
            }

            this.remainingDeckTree.deleteCardFromAllDecks(siblingCard, false);
        }
    }

    private async handlePendingRequeue(): Promise<void> {
        const pendingCard = this.currentCard;
        const dueUnix = pendingCard.scheduleInfo?.dueDateAsUnix;

        if (this.settings.burySiblingCards) {
            await this.burySiblingCards();
            this.deleteSiblingCardsFromAllDecks();
        }

        this.cardSequencer.deleteCurrentRepItemFromAllDecks();
        this.pendingCards.push({ card: pendingCard, dueUnix });
    }

    async processReviewCramMode(response: ReviewResponse): Promise<void> {
        if (response === ReviewResponse.Easy) this.deleteCurrentCard();
        else {
            this.cardSequencer.moveCurrentRepItemToEndOfList();
            this.cardSequencer.nextRepItem();
        }
    }

    private getShortTermRequeueMode(
        scheduleInfo: RepItemScheduleInfo | null,
    ): "none" | "immediate" | "pending" {
        if (!scheduleInfo || scheduleInfo.interval >= 1) {
            return "none";
        }

        return scheduleInfo.isDue() ? "immediate" : "pending";
    }

    private wakeDuePendingCards(): void {
        if (this.pendingCards.length === 0) {
            return;
        }

        const nowUnix = globalDateProvider.now.valueOf();
        const remainingPendingCards: PendingCard[] = [];
        for (const pendingCard of this.pendingCards) {
            if (pendingCard.dueUnix <= nowUnix) {
                this.remainingDeckTree.appendRepItem(
                    pendingCard.card.question.topicPathList,
                    pendingCard.card,
                );
            } else {
                remainingPendingCards.push(pendingCard);
            }
        }

        this.pendingCards = remainingPendingCards;
    }

    determineCardSchedule(response: ReviewResponse, card: Card): RepItemScheduleInfo {
        let result: RepItemScheduleInfo;

        if (response === ReviewResponse.Reset) {
            // Resetting the card schedule
            result = this.srsAlgorithm.cardGetResetSchedule();
        } else {
            // scheduled card
            if (card.hasSchedule) {
                result = this.srsAlgorithm.cardCalcUpdatedSchedule(
                    response,
                    card.scheduleInfo,
                    this.dueDateFlashcardHistogram,
                );
            } else {
                const currentNote: Note = card.question.note;
                result = this.srsAlgorithm.cardGetNewSchedule(
                    response,
                    currentNote.filePath,
                    this.dueDateFlashcardHistogram,
                );
            }
        }
        return result;
    }

    async updateCurrentQuestionText(text: string): Promise<void> {
        const q: QuestionText = this.currentQuestion.questionText;

        q.actualQuestion = text;

        await DataStore.getInstance().write(this.currentQuestion);
    }

    async deleteCurrentCardFromNote(): Promise<void> {
        const question = this.currentQuestion;
        await DataStore.getInstance().delete(question);
        this._originalDeckTree.deleteQuestionFromAllDecks(question, false);
        this.cardSequencer.deleteCurrentQuestionFromAllDecks();
    }
}
