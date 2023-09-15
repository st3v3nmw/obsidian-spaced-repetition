import { Card } from "./Card";
import { CardListType, Deck } from "./Deck";
import { TopicPath } from "./TopicPath";

export interface IDeckTreeIterator {
    get currentDeck(): Deck;
    get currentCard(): Card;
    setDeck(deck: Deck): void;
    deleteCurrentCard(): boolean;
    moveCurrentCardToEndOfList(): void;
    nextCard(): boolean;
}

export class DeckTreeSequentialIterator implements IDeckTreeIterator {
    deckTree: Deck;
    preferredCardListType: CardListType;

    deckArray: Deck[];
    deckIdx?: number;
    cardIdx?: number;
    cardListType?: CardListType;

    get currentDeck(): Deck {
        if (this.deckIdx == null)
            return null;
        return this.deckArray[this.deckIdx];
    }

    get currentCard(): Card {
        if ((this.deckIdx == null) || (this.cardIdx == null))
            return null;
        return this.deckArray[this.deckIdx].getCard(this.cardIdx, this.cardListType);
    }

    constructor(preferredCardListType: CardListType) {
        this.preferredCardListType = preferredCardListType;
    }

    setDeck(deck: Deck): void {
        this.deckTree = deck;
        this.deckArray = deck.toDeckArray();
        this.setDeckIdx(null);
    }

    private setDeckIdx(deckIdx?: number): void {
        this.deckIdx = deckIdx;
        this.cardIdx = null;
        this.cardListType = null;
    }

    nextCard(): boolean {
        let result: boolean = false;
        if (this.deckIdx == null) {
            this.setDeckIdx(0);
        }
        while (this.deckIdx < this.deckArray.length) {
            if (this.nextCardWithinDeck()) {
                result = true;
                break;
            }
            this.deckIdx++;
        }
        if (!result)
            this.deckIdx = null;
        return result;
    }

    private nextCardWithinDeck(): boolean {
        if (this.deckIdx == null)
            throw "No current deck";
        let deck: Deck = this.currentDeck;

        if (this.cardIdx == null) {
            this.cardIdx = -1;
            this.cardListType = this.preferredCardListType;
        }

        let cardList: Card[] = deck.getCardListForCardType(this.cardListType);
        this.cardIdx++;
        if (this.cardIdx == cardList.length) {
            if (this.cardListType == this.preferredCardListType) {
                // Try the non-preferred list type
                this.cardListType = Deck.otherListType(this.cardListType);
                this.cardIdx = 0;
                cardList = deck.getCardListForCardType(this.cardListType);
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

    deleteCurrentCard(): boolean {
        this.ensureCurrentCard();
        this.currentDeck.deleteCardAtIndex(this.cardIdx, this.cardListType);
        this.cardIdx--;
        return this.nextCard();
    }

    moveCurrentCardToEndOfList(): void {
        this.ensureCurrentCard();
        let cardList: Card[] = this.currentDeck.getCardListForCardType(this.cardListType);
        if (this.cardIdx == cardList.length - 1)
            return;
        let card = this.currentCard;
        this.currentDeck.deleteCardAtIndex(this.cardIdx, this.cardListType);
        this.currentDeck.appendCard(TopicPath.emptyPath, card);
    }

    private ensureCurrentCard() {
        if ((this.cardIdx == null) || (this.cardListType == null))
            throw "no current card";
    }
}