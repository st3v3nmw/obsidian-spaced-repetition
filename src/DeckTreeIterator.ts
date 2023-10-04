import { Card } from "./Card";
import { CardListType, Deck } from "./Deck";
import { Question } from "./Question";
import { TopicPath } from "./TopicPath";
import { globalRandomNumberProvider } from "./util/RandomNumberProvider";

export enum CardListOrder {
    NewFirst,
    DueFirst,
    Random,
}
export enum OrderMethod {
    Sequential,
    Random,
}
export enum IteratorDeckSource {
    UpdatedByIterator,
    CloneBeforeUse,
}

export interface IIteratorOrder {
    // Choose decks in sequential order, or randomly
    deckOrder: OrderMethod;

    // Within a deck, choose: new cards first, due cards first, or randomly
    cardListOrder: CardListOrder;

    // Within a card list (i.e. either new or due), choose cards sequentially or randomly
    cardOrder: OrderMethod;
}

export interface IDeckTreeIterator {
    get currentDeck(): Deck;
    get currentCard(): Card;
    get hasCurrentCard(): boolean;
    setDeck(deck: Deck): void;
    deleteCurrentCard(): boolean;
    deleteCurrentQuestion(): boolean;
    moveCurrentCardToEndOfList(): void;
    nextCard(): boolean;
}

class SingleDeckIterator {
    deck: Deck;
    iteratorOrder: IIteratorOrder;
    preferredCardListType: CardListType;
    cardIdx?: number;
    cardListType?: CardListType;

    get hasCurrentCard(): boolean {
        return this.cardIdx != null;
    }

    get currentCard(): Card {
        if (this.cardIdx == null) return null;
        return this.deck.getCard(this.cardIdx, this.cardListType);
    }

    constructor(iteratorOrder: IIteratorOrder) {
        this.iteratorOrder = iteratorOrder;
        this.preferredCardListType =
            this.iteratorOrder.cardListOrder == CardListOrder.DueFirst
                ? CardListType.DueCard
                : CardListType.NewCard;
    }

    setDeck(deck: Deck): void {
        this.deck = deck;
        this.setCardListType(null);
    }

    private setCardListType(cardListType?: CardListType): void {
        this.cardListType = cardListType;
        this.cardIdx = null;
    }

    nextCard(): boolean {
        // First return cards in the preferred list
        if (this.cardListType == null) {
            this.setCardListType(this.preferredCardListType);
        }

        if (!this.nextCardWithinList()) {
            if (this.cardListType == this.preferredCardListType) {
                // Nothing left in the preferred list, so try the non-preferred list type
                this.setCardListType(Deck.otherListType(this.cardListType));
                if (!this.nextCardWithinList()) {
                    this.setCardListType(null);
                }
            } else {
                this.cardIdx = null;
            }
        }
        return this.cardIdx != null;
    }

    private nextCardWithinList(): boolean {
        let result: boolean = false;
        const cardList: Card[] = this.deck.getCardListForCardType(this.cardListType);

        // Delete the current card so we don't return it again
        if (this.hasCurrentCard) {
            this.deleteCurrentCard();
        }
        result = cardList.length > 0;
        if (result) {
            switch (this.iteratorOrder.cardOrder) {
                case OrderMethod.Sequential:
                    this.cardIdx = 0;
                    break;

                case OrderMethod.Random:
                    this.cardIdx = globalRandomNumberProvider.getInteger(0, cardList.length - 1);
                    break;
            }
        }
        return result;
    }

    deleteCurrentQuestion(): void {
        this.ensureCurrentCard();
        const q: Question = this.currentCard.question;
        const cards: Card[] = this.deck.getCardListForCardType(this.cardListType);
        do {
            this.deck.deleteCardAtIndex(this.cardIdx, this.cardListType);
        } while (this.cardIdx < cards.length && Object.is(q, cards[this.cardIdx].question));
        this.setNoCurrentCard();
    }

    deleteCurrentCard(): void {
        this.ensureCurrentCard();
        this.deck.deleteCardAtIndex(this.cardIdx, this.cardListType);
        this.setNoCurrentCard();
    }

    moveCurrentCardToEndOfList(): void {
        this.ensureCurrentCard();
        const cardList: Card[] = this.deck.getCardListForCardType(this.cardListType);
        if (cardList.length <= 1) return;
        const card = this.currentCard;
        this.deck.deleteCardAtIndex(this.cardIdx, this.cardListType);
        this.deck.appendCard(TopicPath.emptyPath, card);
        this.setNoCurrentCard();
    }

    private setNoCurrentCard() {
        this.cardIdx = null;
    }

    private ensureCurrentCard() {
        if (this.cardIdx == null || this.cardListType == null) throw "no current card";
    }
}

export class DeckTreeIterator implements IDeckTreeIterator {
    deckTree: Deck;
    preferredCardListType: CardListType;
    iteratorOrder: IIteratorOrder;
    deckSource: IteratorDeckSource;

    singleDeckIterator: SingleDeckIterator;
    deckArray: Deck[];
    deckIdx?: number;

    get hasCurrentCard(): boolean {
        return this.deckIdx != null && this.singleDeckIterator.hasCurrentCard;
    }

    get currentDeck(): Deck {
        if (this.deckIdx == null) return null;
        return this.deckArray[this.deckIdx];
    }

    get currentCard(): Card {
        if (this.deckIdx == null || !this.singleDeckIterator.hasCurrentCard) return null;
        return this.singleDeckIterator.currentCard;
    }

    constructor(iteratorOrder: IIteratorOrder, deckSource: IteratorDeckSource) {
        this.singleDeckIterator = new SingleDeckIterator(iteratorOrder);
        this.iteratorOrder = iteratorOrder;
        this.deckSource = deckSource;
    }

    setDeck(deck: Deck): void {
        // We don't want to change the supplied deck, so first clone
        if (this.deckSource == IteratorDeckSource.CloneBeforeUse) deck = deck.clone();

        this.deckTree = deck;
        this.deckArray = deck.toDeckArray();
        this.setDeckIdx(null);
    }

    private setDeckIdx(deckIdx?: number): void {
        this.deckIdx = deckIdx;
        if (deckIdx != null) this.singleDeckIterator.setDeck(this.deckArray[deckIdx]);
    }

    nextCard(): boolean {
        let result: boolean = false;
        if (this.deckIdx == null) {
            this.setDeckIdx(0);
        }
        while (this.deckIdx < this.deckArray.length) {
            if (this.singleDeckIterator.nextCard()) {
                result = true;
                break;
            }
            this.deckIdx++;
            if (this.deckIdx < this.deckArray.length) {
                this.singleDeckIterator.setDeck(this.deckArray[this.deckIdx]);
            }
        }
        if (!result) this.deckIdx = null;
        return result;
    }

    deleteCurrentQuestion(): boolean {
        this.singleDeckIterator.deleteCurrentQuestion();
        return this.nextCard();
    }

    deleteCurrentCard(): boolean {
        this.singleDeckIterator.deleteCurrentCard();
        return this.nextCard();
    }

    moveCurrentCardToEndOfList(): void {
        this.singleDeckIterator.moveCurrentCardToEndOfList();
    }
}
