import { Notice } from "obsidian";

import { TICKS_PER_DAY } from "src/data/constants";
import { DataStore } from "src/data/data-store/base/data-store";
import { Card } from "src/data/data-structures/card/card";
import { Question, QuestionText } from "src/data/data-structures/card/questions/question";
import { IQuestionPostponementList } from "src/data/data-structures/card/questions/question-postponement-list";
import {
    CardFrontBack,
    CardFrontBackUtil,
} from "src/data/data-structures/card/questions/question-type";
import { Deck } from "src/data/data-structures/deck/deck";
import { IDeckTreeIterator } from "src/data/data-structures/deck/deck-tree-iterator";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { SRSettings } from "src/data/settings";
import { assertQuestionTextUnchangedInNote } from "src/history/ensure-card-id";
import { Note } from "src/note/note";
import { ISRAlgorithm } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { RepItemState, ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { DueDateHistogram } from "src/scheduling/due-date-histogram";
import { globalDateProvider } from "src/utils/dates";

export interface IFlashcardReviewSequencer {
    get hasCurrentCard(): boolean;
    get hasPendingCards(): boolean;
    get currentCard(): Card | null;
    get currentQuestion(): Question;
    get currentNote(): Note;
    get currentDeck(): Deck | null;
    get nextPendingDueUnix(): number | null;
    get originalDeckTree(): Deck;

    setDeckTree(originalDeckTree: Deck, remainingDeckTree: Deck): void;
    setCurrentDeck(topicPath: TopicPath): void;
    refreshCurrentDeck(): void;
    getDeckStats(topicPath: TopicPath): DeckStats;
    getSubDecksWithCardsInQueue(deck: Deck): Deck[];
    skipCurrentCard(): void;
    currentCardRecallProbability(): number | null;
    suspendCurrentCard(): Promise<void>;
    determineCardSchedule(response: ReviewResponse, card: Card): RepItemScheduleInfo;
    processReview(response: ReviewResponse): Promise<void>;
    updateCurrentQuestionTextAndCards(text: string): Promise<void>;
    deleteCurrentCardFromNote(): Promise<void>;

    createUndoSnapshot(): ReviewUndoSnapshot;
    completeUndoSnapshot(snapshot: ReviewUndoSnapshot): void;
    undo(snapshot: ReviewUndoSnapshot): Promise<void>;
    focusCard(match: CardMatch, topicPath: TopicPath): boolean;
    focusCardObject(card: Card, topicPath: TopicPath): boolean;
}

/**
 * Everything needed to undo an action on the current card (review, reset, skip, suspend).
 *
 * Created by createUndoSnapshot() right before the action, and completed by completeUndoSnapshot() right after it.
 */
export interface ReviewUndoSnapshot {
    readonly card: Card;
    readonly scheduleInfo: RepItemScheduleInfo | null;
    readonly isSuspended: boolean;
    // The sequencer's topic path (the deck chosen for review), and the deck the card was shown in
    readonly sessionTopicPath: TopicPath;
    readonly deckTopicPath: TopicPath | null;
    // The cards of the card's question (including the card itself) that were still waiting for review
    readonly questionCardsInRemainingDeckTree: Card[];
    readonly inOriginalDeckTree: boolean;
    readonly histogram: Map<number, number>;
    readonly postponedTextHashesBefore: string[];
    // Questions that the action added to the postponement list (burying siblings). Null until completed.
    postponedTextHashesAdded: string[] | null;
}

/**
 * Identifies a card across reloads of the vault (which create new Card objects).
 */
export interface CardMatch {
    id: string | null;
    notePath: string;
    textHash: string;
    cardIdx: number;
}

export function createCardMatch(card: Card): CardMatch {
    return {
        id: card.id,
        notePath: card.question.note.filePath,
        textHash: card.question.questionText.textHash,
        cardIdx: card.cardIdx,
    };
}

export function cardMatches(card: Card, match: CardMatch): boolean {
    if (match.id !== null) return card.id === match.id;
    return (
        card.question.note.filePath === match.notePath &&
        card.question.questionText.textHash === match.textHash &&
        card.cardIdx === match.cardIdx
    );
}

/**
 * Restores the stored state of the card (schedule, suspended flag) and the postponement list to how they were before
 * the action of the snapshot.
 *
 * This only touches what is persisted, not the review queue, so it also works after the review queue was reloaded.
 */
export async function restoreUndoSnapshotPersistentState(
    snapshot: ReviewUndoSnapshot,
    questionPostponementList: IQuestionPostponementList,
): Promise<void> {
    if (snapshot.postponedTextHashesAdded === null) {
        throw new Error(
            "restoreUndoSnapshotPersistentState: the undo snapshot was never completed",
        );
    }
    const postponed: string[] = questionPostponementList.getTextHashes();
    for (const textHash of snapshot.postponedTextHashesAdded) {
        if (!postponed.includes(textHash)) {
            throw new Error(
                `Cannot undo: a buried question (${textHash}) is no longer in the postponement list`,
            );
        }
    }

    const card: Card = snapshot.card;
    if (card.scheduleInfo !== snapshot.scheduleInfo || card.isSuspended !== snapshot.isSuspended) {
        await assertQuestionTextUnchangedInNote(card);
        card.scheduleInfo = snapshot.scheduleInfo;
        card.isSuspended = snapshot.isSuspended;
        await DataStore.getInstance().writeSchedule(card.question);
    }

    if (snapshot.postponedTextHashesAdded.length > 0) {
        for (const textHash of snapshot.postponedTextHashesAdded) {
            questionPostponementList.removeTextHash(textHash);
        }
        await questionPostponementList.write();
    }
}

/**
 * The topic paths of the decks a card belongs to (its question's topics, or the root deck). Mirrors
 * Deck.appendRepItem().
 */
function getCardTopicPaths(card: Card): TopicPath[] {
    return card.question.topicPathList.list.length === 0
        ? [TopicPath.emptyPath]
        : card.question.topicPathList.list;
}

function isCardInDeckTree(deckTree: Deck, card: Card): boolean {
    return getCardTopicPaths(card).some((topicPath: TopicPath) => {
        const deck: Deck | null = deckTree.getDeck(topicPath);
        return (
            deck !== null && (deck.newRepItems.includes(card) || deck.dueRepItems.includes(card))
        );
    });
}

function removeCardFromDeckTree(deckTree: Deck, card: Card): void {
    for (const topicPath of getCardTopicPaths(card)) {
        const deck: Deck | null = deckTree.getDeck(topicPath);
        if (deck !== null) deck.deleteCardFromThisDeck(card, false);
    }
}

function ensureCardInDeckTree(deckTree: Deck, card: Card): void {
    for (const topicPath of getCardTopicPaths(card)) {
        const deck: Deck = deckTree.getOrCreateDeck(topicPath);
        if (!deck.newRepItems.includes(card) && !deck.dueRepItems.includes(card)) {
            deck.getRepItemListForRepItemState(card.repItemState).push(card);
        }
    }
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
            this.cardSequencer.currentRepItem !== null &&
            this.cardSequencer.currentRepItem !== undefined
        );
    }

    get hasPendingCards(): boolean {
        return this.pendingCards.length > 0;
    }

    get currentCard(): Card | null {
        if (this.cardSequencer.currentRepItem === null) return null;

        return this.cardSequencer.currentRepItem as Card;
    }

    get currentQuestion(): Question {
        return this.currentCard?.question;
    }

    get currentDeck(): Deck | null {
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

    /**
     * The probability that the current card is recalled now, as predicted by the scheduling algorithm.
     *
     * @returns {number | null} - null for new cards, and for schedules without a prediction (e.g. SM-2).
     */
    currentCardRecallProbability(): number | null {
        const card: Card | null = this.currentCard;
        if (card === null)
            throw new Error("currentCardRecallProbability: There is no current card");
        return card.scheduleInfo === null
            ? null
            : this.srsAlgorithm.cardRecallProbability(card.scheduleInfo);
    }

    /**
     * Suspends the current card (and only that card, not its siblings), similar to Anki's "suspend card".
     *
     * The suspended flag is written to the card's scheduling comment, and the card is removed from all decks,
     * so that it isn't shown again (in review or cram mode) until it is unsuspended.
     */
    async suspendCurrentCard(): Promise<void> {
        const card: Card | null = this.currentCard;
        if (card === null) throw new Error("suspendCurrentCard: There is no current card");

        card.isSuspended = true;
        await DataStore.getInstance().writeSchedule(card.question);

        // Remove from the remaining deck tree first. In cram mode the original and the remaining deck tree can be
        // the same object, and the iterator requires the card to still be present.
        this.cardSequencer.deleteCurrentRepItemFromAllDecks();
        this._originalDeckTree.deleteCardFromAllDecks(card, false);
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
                this.processReviewCramMode(response);
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
            // The histogram counts whole days, while FSRS-7 intervals are fractional days
            this.dueDateFlashcardHistogram.increment(
                Math.round(this.currentCard.scheduleInfo.interval),
            );
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
            this.cardSequencer.deleteCurrentQuestionFromAllDecks();
        } else {
            this.cardSequencer.deleteCurrentRepItemFromAllDecks();
        }

        this.pendingCards.push({ card: pendingCard, dueUnix });
    }

    processReviewCramMode(response: ReviewResponse): void {
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

    async updateCurrentQuestionTextAndCards(text: string): Promise<void> {
        const question = this.currentQuestion;
        const q: QuestionText = question.questionText;

        // Update front/back properties of all cards which question is linked to
        const cardFrontBackList: CardFrontBack[] = CardFrontBackUtil.expand(
            question.questionType,
            text,
            this.settings,
        );

        q.actualQuestion = text;

        await this.currentQuestion.writeQuestion(this.settings);

        if (cardFrontBackList.length !== question.cards.length) {
            console.warn("SR: Cards count does not match question text. Skipping redraw.");
            new Notice("Cards count does not match cards from question text. Skipping redraw.");
            return;
        }
        question.cards.forEach((card, i) => {
            const { front, back } = cardFrontBackList[i];
            card.front = front;
            card.back = back;
        });
    }

    createUndoSnapshot(): ReviewUndoSnapshot {
        const card: Card | null = this.currentCard;
        if (card === null) throw new Error("createUndoSnapshot: There is no current card");

        return {
            card,
            scheduleInfo: card.scheduleInfo,
            isSuspended: card.isSuspended,
            sessionTopicPath: this.currentTopicPath,
            deckTopicPath: this.currentDeck === null ? null : this.currentDeck.getTopicPath(),
            questionCardsInRemainingDeckTree: card.question.cards.filter((questionCard) =>
                isCardInDeckTree(this.remainingDeckTree, questionCard),
            ),
            inOriginalDeckTree: isCardInDeckTree(this._originalDeckTree, card),
            histogram: new Map(this.dueDateFlashcardHistogram.dueDatesMap),
            postponedTextHashesBefore: this.questionPostponementList.getTextHashes(),
            postponedTextHashesAdded: null,
        };
    }

    completeUndoSnapshot(snapshot: ReviewUndoSnapshot): void {
        if (snapshot.postponedTextHashesAdded !== null) {
            throw new Error("completeUndoSnapshot: The undo snapshot was already completed");
        }
        snapshot.postponedTextHashesAdded = this.questionPostponementList
            .getTextHashes()
            .filter((textHash) => !snapshot.postponedTextHashesBefore.includes(textHash));
    }

    /**
     * Undoes the action of the snapshot, which must have been taken by this sequencer: restores the card's stored
     * state and puts it (and any siblings the action buried) back into the queue. The card becomes the current card.
     */
    async undo(snapshot: ReviewUndoSnapshot): Promise<void> {
        const card: Card = snapshot.card;

        await restoreUndoSnapshotPersistentState(snapshot, this.questionPostponementList);
        this.dueDateFlashcardHistogram.dueDatesMap = new Map(snapshot.histogram);
        this.pendingCards = this.pendingCards.filter((pendingCard) => pendingCard.card !== card);

        // The card may still be in the queue (e.g. moved to the end of the list), in the list matching its schedule
        // after the action. Re-add it, so it ends up in the list matching its restored schedule.
        removeCardFromDeckTree(this.remainingDeckTree, card);
        for (const questionCard of snapshot.questionCardsInRemainingDeckTree) {
            ensureCardInDeckTree(this.remainingDeckTree, questionCard);
        }
        if (snapshot.inOriginalDeckTree) {
            ensureCardInDeckTree(this._originalDeckTree, card);
        }

        this.currentTopicPath = snapshot.sessionTopicPath;
        this.cardSequencer.setCurrentRepItem(
            card,
            snapshot.sessionTopicPath,
            snapshot.deckTopicPath,
        );
    }

    /**
     * Makes the matching card the current card, e.g. after undoing an action of an earlier review queue.
     *
     * @param {CardMatch} match - Identifies the card.
     * @param {TopicPath} topicPath - The deck to review. If the card isn't within it, the whole deck tree is used.
     * @returns {boolean} - False if the card isn't waiting for review in this review queue.
     */
    focusCard(match: CardMatch, topicPath: TopicPath): boolean {
        return this.focusFirstCard((card: Card) => cardMatches(card, match), topicPath);
    }

    /**
     * Makes the given card the current card, e.g. to redo an undone action on it.
     *
     * @param {Card} card - The card.
     * @param {TopicPath} topicPath - The deck to review. If the card isn't within it, the whole deck tree is used.
     * @returns {boolean} - False if the card isn't waiting for review in this review queue.
     */
    focusCardObject(card: Card, topicPath: TopicPath): boolean {
        return this.focusFirstCard((candidate: Card) => candidate === card, topicPath);
    }

    private focusFirstCard(predicate: (card: Card) => boolean, topicPath: TopicPath): boolean {
        const findIn = (deck: Deck | null): Card | null =>
            deck === null
                ? null
                : (deck
                      .getFlattenedRepItemArray(RepItemState.AnyItem, true)
                      .find((card: Card) => predicate(card)) ?? null);

        let iteratorTopicPath: TopicPath = topicPath;
        let card: Card | null = findIn(this.remainingDeckTree.getDeck(topicPath));
        if (card === null) {
            iteratorTopicPath = TopicPath.emptyPath;
            card = findIn(this.remainingDeckTree);
        }
        if (card === null) return false;

        this.currentTopicPath = iteratorTopicPath;
        this.cardSequencer.setCurrentRepItem(card, iteratorTopicPath, null);
        return true;
    }

    async deleteCurrentCardFromNote(): Promise<void> {
        const question = this.currentQuestion;
        await DataStore.getInstance().delete(question);
        this._originalDeckTree.deleteQuestionFromAllDecks(question, false);
        this.cardSequencer.deleteCurrentQuestionFromAllDecks();
    }
}
