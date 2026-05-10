import { RepetitionItem, RepItemState } from "src/scheduling/algorithms/base/repetition-item";
import { Card } from "src/data/data-structures/card/card";
import { Question } from "src/data/data-structures/card/questions/question";
import { Deck } from "src/data/data-structures/deck/deck";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { globalRandomNumberProvider, WeightedRandomNumber } from "src/utils/numbers";

export enum RepItemOrder {
    NewFirstSequential,
    NewFirstRandom,
    DueFirstSequential,
    DueFirstRandom,
    EveryCardRandomDeckAndCard,
}
export enum DeckOrder {
    PrevDeckComplete_Sequential,
    PrevDeckComplete_Random,
}

export interface IIteratorOrder {
    // Within a deck this specifies the order the cards should be reviewed
    // e.g. new first, going sequentially
    repItemOrder: RepItemOrder;

    // Choose decks in sequential order, or randomly
    deckOrder: DeckOrder;
}

/**
 * Represents the DeckTree iterator.
 *
 * @interface IDeckTreeIterator
 */
export interface IDeckTreeIterator {
    get currentDeck(): Deck | null;
    get currentRepItem(): RepetitionItem | null;
    get hasCurrentCard(): boolean;
    /**
     * Sets the base deck.
     *
     * @param {Deck} baseDeck - The base deck.
     */
    setBaseDeck(baseDeck: Deck): void;
    /**
     * Sets the iterator topic path.
     *
     * @param {TopicPath} topicPath - The topic path.
     */
    setIteratorTopicPath(topicPath: TopicPath): void;
    /**
     * Deletes the current repetition item from all decks.
     *
     * @returns {boolean} - True if the repetition item was deleted, false otherwise.
     */
    deleteCurrentRepItemFromAllDecks(): boolean;
    /**
     * Deletes the current question from all decks.
     *
     * @returns {boolean} - True if the question was deleted, false otherwise.
     */
    deleteCurrentQuestionFromAllDecks(): boolean;
    /**
     * Moves the current repetition item to the end of the list.
     */
    moveCurrentRepItemToEndOfList(): void;
    /**
     * Moves to the next repetition item.
     *
     * @returns {boolean} - True if there is a next repetition item, false otherwise.
     */
    nextRepItem(): boolean;
}

class SingleDeckIterator {
    deck: Deck | null = null;
    iteratorOrder: IIteratorOrder;
    preferredCardListType: RepItemState;
    cardIdx?: number;
    cardListType?: RepItemState;
    weightedRandomNumber: WeightedRandomNumber;

    get hasCurrentCard(): boolean {
        return this.cardIdx !== null && this.cardIdx !== undefined;
    }

    get currentCard(): Card | null {
        let result: Card | null = null;
        if (this.cardIdx !== null && this.cardIdx !== undefined && this.deck !== null)
            result = this.deck.getRepItem(this.cardIdx, this.cardListType);
        return result;
    }

    constructor(iteratorOrder: IIteratorOrder) {
        this.iteratorOrder = iteratorOrder;
        this.preferredCardListType = SingleDeckIterator.getCardListTypeForIterator(
            this.iteratorOrder,
        );
        this.weightedRandomNumber = WeightedRandomNumber.create();
    }

    setDeck(deck: Deck): void {
        this.deck = deck;
        this.setCardListType(null);
    }

    //
    // 0 <= cardIndex < newFlashcards.length + dueFlashcards.length
    //
    setNewOrDueCardIdx(cardIndex: number): void {
        let cardListType: RepItemState = RepItemState.NewItem;
        let index: number = cardIndex;
        if (cardIndex >= this.deck.newRepItems.length) {
            cardListType = RepItemState.DueItem;
            index = cardIndex - this.deck.newRepItems.length;
        }
        this.setCardListType(cardListType, index);
    }

    private setCardListType(cardListType?: RepItemState, cardIdx: number = null): void {
        this.cardListType = cardListType;
        this.cardIdx = cardIdx;
    }

    nextCard(): boolean {
        if (this.iteratorOrder.repItemOrder === RepItemOrder.EveryCardRandomDeckAndCard) {
            this.nextRandomCard();
        } else {
            // First return cards in the preferred list
            if (this.cardListType === null) {
                this.setCardListType(this.preferredCardListType);
            }

            if (!this.nextCardWithinCurrentList()) {
                if (this.cardListType === this.preferredCardListType) {
                    // Nothing left in the preferred list, so try the non-preferred list type
                    this.setCardListType(Deck.otherListType(this.cardListType));
                    if (!this.nextCardWithinCurrentList()) {
                        this.setCardListType(null);
                    }
                } else {
                    this.cardIdx = null;
                }
            }
        }

        return this.cardIdx !== null && this.cardIdx !== undefined;
    }

    private nextRandomCard(): void {
        const newCount: number = this.deck.newRepItems.length;
        const dueCount: number = this.deck.dueRepItems.length;
        if (newCount + dueCount > 0) {
            // Generate a random number such that the probability of picking an individual card is the same
            // regardless of whether the card is in the new/due list, or which list has more cards
            // I.e. we don't pick the new/due list first at 50/50 and then a random card within it
            const weights: Partial<Record<RepItemState, number>> = {};
            if (newCount > 0) weights[RepItemState.NewItem] = newCount;
            if (dueCount > 0) weights[RepItemState.DueItem] = dueCount;
            const [cardListType, index] = this.weightedRandomNumber.getRandomValues(weights);
            this.setCardListType(cardListType, index);
        } else {
            this.setCardListType(null);
        }
    }

    private nextCardWithinCurrentList(): boolean {
        const cardList: Card[] = this.deck.getRepItemListForRepItemState(this.cardListType);

        const result: boolean = cardList.length > 0;
        if (result) {
            switch (this.iteratorOrder.repItemOrder) {
                case RepItemOrder.DueFirstSequential:
                case RepItemOrder.NewFirstSequential:
                    // We always pick the card with index 0
                    // Sequential retrieval occurs by the caller deleting the card at this index after it is used
                    this.cardIdx = 0;
                    break;

                case RepItemOrder.DueFirstRandom:
                case RepItemOrder.NewFirstRandom:
                    this.cardIdx = globalRandomNumberProvider.getInteger(0, cardList.length - 1);
                    break;
            }
        }
        return result;
    }

    moveCurrentCardToEndOfList(): void {
        this.ensureCurrentCard();
        const card = this.currentCard;
        this.deck.deleteRepItemAtIndex(this.cardIdx, this.cardListType);
        this.deck.appendRepItemToRootDeck(card);
        this.setNoCurrentCard();
    }

    setNoCurrentCard() {
        this.cardIdx = null;
    }

    ensureCurrentCard() {
        if (this.cardIdx === null || this.cardListType === null) throw "no current card";
    }

    private static getCardListTypeForIterator(iteratorOrder: IIteratorOrder): RepItemState | null {
        let result: RepItemState = null;
        switch (iteratorOrder.repItemOrder) {
            case RepItemOrder.DueFirstRandom:
            case RepItemOrder.DueFirstSequential:
                result = RepItemState.DueItem;
                break;

            case RepItemOrder.NewFirstRandom:
            case RepItemOrder.NewFirstSequential:
                result = RepItemState.NewItem;
                break;
        }
        return result;
    }
}

// Note that this iterator is destructive over the deck tree supplied to setBaseDeck()
// The caller is required to first make a clone if this behavior is unwanted.
//
// Handling of multi-deck cards (implemented for https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/495):
//      A "multi-deck card" is a card that is present in multiple decks, e.g. the following cat question is present in
//      two separate decks.
//
//      #flashcards/language/words #flashcards/trivia/interesting
//      A group of cats is called a::clowder
//
//      1. Whilst iterating, any multi-deck card is only returned once.
//      2. All copies are removed from the deck tree supplied to setBaseDeck()
export class DeckTreeIterator implements IDeckTreeIterator {
    private iteratorOrder: IIteratorOrder;

    private singleDeckIterator: SingleDeckIterator;
    private baseDeckTree: Deck;

    // The subset of baseDeckTree over which we are iterating
    // Each item is treated as a single deck, i.e. any subdecks are ignored
    private deckArray: Deck[];
    private deckIdx?: number;

    private weightedRandomNumber: WeightedRandomNumber;

    get hasCurrentCard(): boolean {
        return (
            this.deckIdx !== null &&
            this.deckIdx !== undefined &&
            this.singleDeckIterator.hasCurrentCard
        );
    }

    get currentTopicPath(): TopicPath {
        return this.currentDeck?.getTopicPath();
    }

    get currentDeck(): Deck | null {
        if (this.deckIdx === null || this.deckIdx === undefined) return null;
        return this.deckArray[this.deckIdx];
    }

    get currentRepItem(): Card | null {
        let result: Card | null = null;
        if (
            this.deckIdx !== null &&
            this.deckIdx !== undefined &&
            this.singleDeckIterator.hasCurrentCard
        )
            result = this.singleDeckIterator.currentCard;
        return result;
    }

    get currentQuestion(): Question | null {
        return (this.currentRepItem as Card | null)?.question || null;
    }

    constructor(iteratorOrder: IIteratorOrder, baseDeckTree: Deck) {
        this.singleDeckIterator = new SingleDeckIterator(iteratorOrder);
        this.iteratorOrder = iteratorOrder;
        this.weightedRandomNumber = WeightedRandomNumber.create();
        this.setBaseDeck(baseDeckTree);
    }

    setBaseDeck(baseDeck: Deck): void {
        this.baseDeckTree = baseDeck;
        this.singleDeckIterator.setNoCurrentCard();
    }

    setIteratorTopicPath(topicPath: TopicPath): void {
        const iteratorDeck: Deck = this.baseDeckTree.getDeck(topicPath);
        this.deckArray = DeckTreeIterator.filterForDecksWithCards(iteratorDeck.toDeckArray());
        this.setDeckIdx(null);
    }

    private static filterForDecksWithCards(sourceArray: Deck[]): Deck[] {
        const result: Deck[] = [];
        for (let idx = 0; idx < sourceArray.length; idx++) {
            const deck: Deck = sourceArray[idx];
            const hasAnyCards = deck.getRepItemCount(RepItemState.AnyItem, false) > 0;
            if (hasAnyCards) {
                result.push(deck);
            }
        }
        return result;
    }

    private setDeckIdx(deckIdx?: number): void {
        this.deckIdx = deckIdx;
        if (deckIdx !== null && deckIdx !== undefined)
            this.singleDeckIterator.setDeck(this.deckArray[deckIdx]);
    }

    nextRepItem(): boolean {
        let result: boolean = false;

        // Delete the current card so we don't return it again
        if (this.hasCurrentCard) {
            this.baseDeckTree.deleteCardFromAllDecks(this.currentRepItem as Card, true);
        }

        if (this.iteratorOrder.repItemOrder === RepItemOrder.EveryCardRandomDeckAndCard) {
            result = this.nextCardEveryCardRandomDeck();
        } else {
            // If we are just starting, then depending on settings we want to either start from the first deck,
            // or a random deck
            if (this.deckIdx === null || this.deckIdx === undefined) {
                this.chooseNextDeck(true);
            }
            while (this.deckIdx < this.deckArray.length) {
                if (this.singleDeckIterator.nextCard()) {
                    result = true;
                    break;
                }
                this.chooseNextDeck(false);
            }
        }
        if (!result) this.deckIdx = null;
        return result;
    }

    private chooseNextDeck(firstTime: boolean): void {
        switch (this.iteratorOrder.deckOrder) {
            case DeckOrder.PrevDeckComplete_Sequential:
                this.deckIdx = firstTime ? 0 : this.deckIdx + 1;
                break;

            case DeckOrder.PrevDeckComplete_Random: {
                // Equal probability of picking any deck that has cards within
                const weights: Record<number, number> = {};
                let hasDeck: boolean = false;
                for (let i = 0; i < this.deckArray.length; i++) {
                    if (this.deckArray[i].getRepItemCount(RepItemState.AnyItem, false)) {
                        weights[i] = 1;
                        hasDeck = true;
                    }
                }
                if (hasDeck) {
                    const [deckIdx, _] = this.weightedRandomNumber.getRandomValues(weights);
                    this.deckIdx = deckIdx;
                } else {
                    // Our signal that no deck with cards present
                    this.deckIdx = this.deckArray.length;
                }
                break;
            }
        }

        if (this.deckIdx < this.deckArray.length) {
            this.singleDeckIterator.setDeck(this.deckArray[this.deckIdx]);
        }
    }

    private nextCardEveryCardRandomDeck(): boolean {
        // Make the chance of picking a specific deck proportional to the number of cards within
        const weights: Record<number, number> = {};
        for (let i = 0; i < this.deckArray.length; i++) {
            const cardCount: number = this.deckArray[i].getRepItemCount(RepItemState.AnyItem, false);
            if (cardCount) {
                weights[i] = cardCount;
            }
        }
        if (Object.keys(weights).length === 0) return false;

        const [deckIdx, cardIdx] = this.weightedRandomNumber.getRandomValues(weights);
        this.setDeckIdx(deckIdx);
        this.singleDeckIterator.setNewOrDueCardIdx(cardIdx);
        return true;
    }

    deleteCurrentQuestionFromAllDecks(): boolean {
        this.singleDeckIterator.ensureCurrentCard();

        // Delete every card of this question from every deck specified for the question
        // Note that not every card will necessarily be present, so we pass false to the following
        this.baseDeckTree.deleteQuestionFromAllDecks(this.currentQuestion, false);
        this.singleDeckIterator.setNoCurrentCard();
        return this.nextRepItem();
    }

    deleteCurrentRepItemFromAllDecks(): boolean {
        this.singleDeckIterator.ensureCurrentCard();
        this.baseDeckTree.deleteCardFromAllDecks(this.currentRepItem as Card, true);
        this.singleDeckIterator.setNoCurrentCard();
        return this.nextRepItem();
    }

    moveCurrentRepItemToEndOfList(): void {
        this.singleDeckIterator.moveCurrentCardToEndOfList();
    }

    private removeCurrentDeckIfEmpty(): void {
        if (this.currentDeck.getRepItemCount(RepItemState.AnyItem, false) === 0) {
            this.deckArray.splice(this.deckIdx, 1);

            // There is no change to deckIdx, but this now is a different deck
            if (this.deckIdx < this.deckArray.length) this.setDeckIdx(this.deckIdx);
        }
    }
}
