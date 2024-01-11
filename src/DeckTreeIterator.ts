import { Card } from "./Card";
import { CardListType, Deck } from "./Deck";
import { Question } from "./Question";
import { TopicPath } from "./TopicPath";
import { WeightedRandomNumber, globalRandomNumberProvider } from "./util/RandomNumberProvider";

export enum CardOrder {
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
    cardOrder: CardOrder;

    // Choose decks in sequential order, or randomly
    deckOrder: DeckOrder;
}

export interface IDeckTreeIterator {
    get currentDeck(): Deck;
    get currentCard(): Card;
    get hasCurrentCard(): boolean;
    setBaseDeck(baseDeck: Deck): void;
    setIteratorTopicPath(topicPath: TopicPath): void;
    deleteCurrentCardFromAllDecks(): boolean;
    deleteCurrentQuestionFromAllDecks(): boolean;
    moveCurrentCardToEndOfList(): void;
    nextCard(): boolean;
}

class SingleDeckIterator {
    deck: Deck;
    iteratorOrder: IIteratorOrder;
    preferredCardListType: CardListType;
    cardIdx?: number;
    cardListType?: CardListType;
    weightedRandomNumber: WeightedRandomNumber;

    get hasCurrentCard(): boolean {
        return this.cardIdx != null;
    }

    get currentCard(): Card {
        let result: Card = null;
        if (this.cardIdx != null) result = this.deck.getCard(this.cardIdx, this.cardListType);
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
        let cardListType: CardListType = CardListType.NewCard;
        let index: number = cardIndex;
        if (cardIndex >= this.deck.newFlashcards.length) {
            cardListType = CardListType.DueCard;
            index = cardIndex - this.deck.newFlashcards.length;
        }
        this.setCardListType(cardListType, index);
    }

    private setCardListType(cardListType?: CardListType, cardIdx: number = null): void {
        this.cardListType = cardListType;
        this.cardIdx = cardIdx;
    }

    nextCard(): boolean {
        if (this.iteratorOrder.cardOrder == CardOrder.EveryCardRandomDeckAndCard) {
            this.nextRandomCard();
        } else {
            // First return cards in the preferred list
            if (this.cardListType == null) {
                this.setCardListType(this.preferredCardListType);
            }

            if (!this.nextCardWithinCurrentList()) {
                if (this.cardListType == this.preferredCardListType) {
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

        return this.cardIdx != null;
    }

    private nextRandomCard(): void {
        const newCount: number = this.deck.newFlashcards.length;
        const dueCount: number = this.deck.dueFlashcards.length;
        if (newCount + dueCount > 0) {
            // Generate a random number such that the probability of picking an individual card is the same
            // regardless of whether the card is in the new/due list, or which list has more cards
            // I.e. we don't pick the new/due list first at 50/50 and then a random card within it
            const weights: Partial<Record<CardListType, number>> = {};
            if (newCount > 0) weights[CardListType.NewCard] = newCount;
            if (dueCount > 0) weights[CardListType.DueCard] = dueCount;
            const [cardListType, index] = this.weightedRandomNumber.getRandomValues(weights);
            this.setCardListType(cardListType, index);
        } else {
            this.setCardListType(null);
        }
    }

    private nextCardWithinCurrentList(): boolean {
        const cardList: Card[] = this.deck.getCardListForCardType(this.cardListType);

        const result: boolean = cardList.length > 0;
        if (result) {
            switch (this.iteratorOrder.cardOrder) {
                case CardOrder.DueFirstSequential:
                case CardOrder.NewFirstSequential:
                    // We always pick the card with index 0
                    // Sequential retrieval occurs by the caller deleting the card at this index after it is used
                    this.cardIdx = 0;
                    break;

                case CardOrder.DueFirstRandom:
                case CardOrder.NewFirstRandom:
                    this.cardIdx = globalRandomNumberProvider.getInteger(0, cardList.length - 1);
                    break;
            }
        }
        return result;
    }

    moveCurrentCardToEndOfList(): void {
        this.ensureCurrentCard();
        const cardList: Card[] = this.deck.getCardListForCardType(this.cardListType);
        if (cardList.length <= 1) return;
        const card = this.currentCard;
        this.deck.deleteCardAtIndex(this.cardIdx, this.cardListType);
        this.deck.appendCardToRootDeck(card);
        this.setNoCurrentCard();
    }

    setNoCurrentCard() {
        this.cardIdx = null;
    }

    ensureCurrentCard() {
        if (this.cardIdx == null || this.cardListType == null) throw "no current card";
    }

    private static getCardListTypeForIterator(iteratorOrder: IIteratorOrder): CardListType | null {
        let result: CardListType = null;
        switch (iteratorOrder.cardOrder) {
            case CardOrder.DueFirstRandom:
            case CardOrder.DueFirstSequential:
                result = CardListType.DueCard;
                break;

            case CardOrder.NewFirstRandom:
            case CardOrder.NewFirstSequential:
                result = CardListType.NewCard;
                break;
        }
        return result;
    }
}

//
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
//
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
        return this.deckIdx != null && this.singleDeckIterator.hasCurrentCard;
    }

    get currentTopicPath(): TopicPath {
        return this.currentDeck?.getTopicPath();
    }

    get currentDeck(): Deck {
        if (this.deckIdx == null) return null;
        return this.deckArray[this.deckIdx];
    }

    get currentCard(): Card {
        let result: Card = null;
        if (this.deckIdx != null && this.singleDeckIterator.hasCurrentCard)
            result = this.singleDeckIterator.currentCard;
        return result;
    }

    get currentQuestion(): Question {
        return this.currentCard?.question;
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
            const hasAnyCards = deck.getCardCount(CardListType.All, false) > 0;
            if (hasAnyCards) {
                result.push(deck);
            }
        }
        return result;
    }

    private setDeckIdx(deckIdx?: number): void {
        this.deckIdx = deckIdx;
        if (deckIdx != null) this.singleDeckIterator.setDeck(this.deckArray[deckIdx]);
    }

    nextCard(): boolean {
        let result: boolean = false;

        // Delete the current card so we don't return it again
        if (this.hasCurrentCard) {
            this.baseDeckTree.deleteCardFromAllDecks(this.currentCard, true);
        }

        if (this.iteratorOrder.cardOrder == CardOrder.EveryCardRandomDeckAndCard) {
            result = this.nextCard_EveryCardRandomDeck();
        } else {
            // If we are just starting, then depending on settings we want to either start from the first deck,
            // or a random deck
            if (this.deckIdx == null) {
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
                    if (this.deckArray[i].getCardCount(CardListType.All, false)) {
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

    private nextCard_EveryCardRandomDeck(): boolean {
        // Make the chance of picking a specific deck proportional to the number of cards within
        const weights: Record<number, number> = {};
        for (let i = 0; i < this.deckArray.length; i++) {
            const cardCount: number = this.deckArray[i].getCardCount(CardListType.All, false);
            if (cardCount) {
                weights[i] = cardCount;
            }
        }
        if (Object.keys(weights).length == 0) return false;

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
        return this.nextCard();
    }

    deleteCurrentCardFromAllDecks(): boolean {
        this.singleDeckIterator.ensureCurrentCard();
        this.baseDeckTree.deleteCardFromAllDecks(this.currentCard, true);
        this.singleDeckIterator.setNoCurrentCard();
        return this.nextCard();
    }

    moveCurrentCardToEndOfList(): void {
        this.singleDeckIterator.moveCurrentCardToEndOfList();
    }

    private removeCurrentDeckIfEmpty(): void {
        if (this.currentDeck.getCardCount(CardListType.All, false) == 0) {
            this.deckArray.splice(this.deckIdx, 1);

            // There is no change to deckIdx, but this now is a different deck
            if (this.deckIdx < this.deckArray.length) this.setDeckIdx(this.deckIdx);
        }
    }
}
