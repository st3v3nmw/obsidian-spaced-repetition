import { Card } from "./Card";
import { CardListType, Deck } from "./Deck";
import { TopicPath } from "./TopicPath";

export interface IDeckTreeIterator {
    get currentDeck(): Deck;
    get currentCard(): Card;
    get hasCurrentCard(): boolean;
    setDeck(deck: Deck): void;
    deleteCurrentCard(): boolean;
    moveCurrentCardToEndOfList(): void;
    nextCard(): boolean;
}

class SingleDeckIterator {
    deck: Deck;
    preferredCardListType: CardListType;

    cardIdx?: number;
    cardListType?: CardListType;

    get hasCurrentCard(): boolean {
        return (this.cardIdx != null);
    }

    get currentCard(): Card {
        if (this.cardIdx == null)
            return null;
        return this.deck.getCard(this.cardIdx, this.cardListType);
    }

    constructor(preferredCardListType: CardListType) {
        this.preferredCardListType = preferredCardListType;
    }

    setDeck(deck: Deck): void {
        this.deck = deck;
        this.cardIdx = null;
        this.cardListType = null;
    }

    nextCard(): boolean {
        if (this.cardIdx == null) {
            this.cardIdx = -1;
            this.cardListType = this.preferredCardListType;
        }

        let cardList: Card[] = this.deck.getCardListForCardType(this.cardListType);
        this.cardIdx++;
        if (this.cardIdx == cardList.length) {
            if (this.cardListType == this.preferredCardListType) {
                // Try the non-preferred list type
                this.cardListType = Deck.otherListType(this.cardListType);
                this.cardIdx = 0;
                cardList = this.deck.getCardListForCardType(this.cardListType);
                if (this.cardIdx == cardList.length) {
                    this.cardIdx = null;
                    this.cardListType = null;
                }
            }
            else {
                this.cardIdx = null;
            }
        }
        return this.cardIdx != null;
    }

    deleteCurrentCard(): void {
        this.ensureCurrentCard();
        this.deck.deleteCardAtIndex(this.cardIdx, this.cardListType);
        this.cardIdx--;
    }

    moveCurrentCardToEndOfList(): void {
        this.ensureCurrentCard();
        let cardList: Card[] = this.deck.getCardListForCardType(this.cardListType);
        if (this.cardIdx == cardList.length - 1)
            return;
        let card = this.currentCard;
        this.deck.deleteCardAtIndex(this.cardIdx, this.cardListType);
        this.deck.appendCard(TopicPath.emptyPath, card);
    }

    private ensureCurrentCard() {
        if ((this.cardIdx == null) || (this.cardListType == null))
            throw "no current card";
    }

}

export class DeckTreeSequentialIterator implements IDeckTreeIterator {
    deckTree: Deck;
    preferredCardListType: CardListType;

    singleDeckIterator: SingleDeckIterator;
    deckArray: Deck[];
    deckIdx?: number;

    get hasCurrentCard(): boolean {
        return (this.deckIdx != null) && this.singleDeckIterator.hasCurrentCard;
    }

    get currentDeck(): Deck {
        if (this.deckIdx == null)
            return null;
        return this.deckArray[this.deckIdx];
    }

    get currentCard(): Card {
        if ((this.deckIdx == null) || !this.singleDeckIterator.hasCurrentCard)
            return null;
        return this.singleDeckIterator.currentCard;
    }

    constructor(preferredCardListType: CardListType) {
        this.preferredCardListType = preferredCardListType;
        this.singleDeckIterator = new SingleDeckIterator(preferredCardListType);
    }

    setDeck(deck: Deck): void {
        this.deckTree = deck;
        this.deckArray = deck.toDeckArray();
        this.setDeckIdx(null);
    }

    private setDeckIdx(deckIdx?: number): void {
        this.deckIdx = deckIdx;
        if (deckIdx != null)
            this.singleDeckIterator.setDeck(this.deckArray[deckIdx]);
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
        if (!result)
            this.deckIdx = null;
        return result;
    }


    deleteCurrentCard(): boolean {
        this.singleDeckIterator.deleteCurrentCard();
        return this.nextCard();
    }

    moveCurrentCardToEndOfList(): void {
        this.singleDeckIterator.moveCurrentCardToEndOfList();
    }
}