import { Card } from "./Card";
import { FlashcardReviewMode } from "./FlashcardReviewSequencer";
import { Question } from "./Question";
import { IQuestionPostponementList } from "./QuestionPostponementList";
import { TopicPath } from "./TopicPath";

export enum CardListType {
    NewCard,
    DueCard,
    All,
}

export class Deck {
    public deckName: string;
    public newFlashcards: Card[];
    public dueFlashcards: Card[];
    public subdecks: Deck[];
    public parent: Deck | null;

    constructor(deckName: string, parent: Deck | null) {
        this.deckName = deckName;
        this.newFlashcards = [];
        this.dueFlashcards = [];
        this.subdecks = [];
        this.parent = parent;
    }

    public getCardCount(cardListType: CardListType, includeSubdeckCounts: boolean): number {
        let result: number = 0;
        if (cardListType == CardListType.NewCard || cardListType == CardListType.All)
            result += this.newFlashcards.length;
        if (cardListType == CardListType.DueCard || cardListType == CardListType.All)
            result += this.dueFlashcards.length;

        if (includeSubdeckCounts) {
            for (const deck of this.subdecks) {
                result += deck.getCardCount(cardListType, includeSubdeckCounts);
            }
        }
        return result;
    }

    //
    // Returns a count of the number of this question's cards are present in this deck.
    // (The returned value would be <= question.cards.length)
    //
    public getQuestionCardCount(question: Question): number {
        let result: number = 0;
        result += this.getQuestionCardCountForCardListType(question, this.newFlashcards);
        result += this.getQuestionCardCountForCardListType(question, this.dueFlashcards);
        return result;
    }

    private getQuestionCardCountForCardListType(question: Question, cards: Card[]): number {
        let result: number = 0;
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            if (Object.is(question, cards[i].question)) result++;
        }
        return result;
    }

    static get emptyDeck(): Deck {
        return new Deck("Root", null);
    }

    get isRootDeck() {
        return this.parent == null;
    }

    getDeck(topicPath: TopicPath): Deck {
        return this._getOrCreateDeck(topicPath, false);
    }

    getOrCreateDeck(topicPath: TopicPath): Deck {
        return this._getOrCreateDeck(topicPath, true);
    }

    private _getOrCreateDeck(topicPath: TopicPath, createAllowed: boolean): Deck {
        if (!topicPath.hasPath) {
            return this;
        }
        const t: TopicPath = topicPath.clone();
        const deckName: string = t.shift();
        for (const subdeck of this.subdecks) {
            if (deckName === subdeck.deckName) {
                return subdeck._getOrCreateDeck(t, createAllowed);
            }
        }

        let result: Deck = null;
        if (createAllowed) {
            const subdeck: Deck = new Deck(deckName, this /* parent */);
            this.subdecks.push(subdeck);
            result = subdeck._getOrCreateDeck(t, createAllowed);
        }
        return result;
    }

    getTopicPath(): TopicPath {
        const list: string[] = [];
        // eslint-disable-next-line  @typescript-eslint/no-this-alias
        let deck: Deck = this;
        while (!deck.isRootDeck) {
            list.push(deck.deckName);
            deck = deck.parent;
        }
        return new TopicPath(list.reverse());
    }

    getRootDeck(): Deck {
        // eslint-disable-next-line  @typescript-eslint/no-this-alias
        let deck: Deck = this;
        while (!deck.isRootDeck) {
            deck = deck.parent;
        }
        return deck;
    }

    getCard(index: number, cardListType: CardListType): Card {
        const cardList: Card[] = this.getCardListForCardType(cardListType);
        return cardList[index];
    }

    getCardListForCardType(cardListType: CardListType): Card[] {
        return cardListType == CardListType.DueCard ? this.dueFlashcards : this.newFlashcards;
    }

    appendCard(topicPath: TopicPath, cardObj: Card): void {
        const deck: Deck = this.getOrCreateDeck(topicPath);
        const cardList: Card[] = deck.getCardListForCardType(cardObj.cardListType);

        cardList.push(cardObj);
    }

    deleteCard(card: Card): void {
        const cardList: Card[] = this.getCardListForCardType(card.cardListType);
        const idx = cardList.indexOf(card);
        if (idx != -1) cardList.splice(idx, 1);
    }

    deleteCardAtIndex(index: number, cardListType: CardListType): void {
        const cardList: Card[] = this.getCardListForCardType(cardListType);
        cardList.splice(index, 1);
    }

    toDeckArray(): Deck[] {
        const result: Deck[] = [];
        result.push(this);
        for (const subdeck of this.subdecks) {
            result.push(...subdeck.toDeckArray());
        }
        return result;
    }

    sortSubdecksList(): void {
        this.subdecks.sort((a, b) => {
            if (a.deckName < b.deckName) {
                return -1;
            } else if (a.deckName > b.deckName) {
                return 1;
            }
            return 0;
        });

        for (const deck of this.subdecks) {
            deck.sortSubdecksList();
        }
    }

    debugLogToConsole(desc: string = null) {
        let str: string = desc != null ? `${desc}: ` : "";
        console.log((str += this.toString()));
    }

    toString(indent: number = 0): string {
        let result: string = "";
        let indentStr: string = " ".repeat(indent * 4);

        result += `${indentStr}${this.deckName}\r\n`;
        indentStr += "  ";
        for (let i = 0; i < this.newFlashcards.length; i++) {
            const card = this.newFlashcards[i];
            result += `${indentStr}New: ${i}: ${card.front}::${card.back}\r\n`;
        }
        for (let i = 0; i < this.dueFlashcards.length; i++) {
            const card = this.dueFlashcards[i];
            const s = card.isDue ? "Due" : "Not due";
            result += `${indentStr}${s}: ${i}: ${card.front}::${card.back}\r\n`;
        }

        for (const subdeck of this.subdecks) {
            result += subdeck.toString(indent + 1);
        }
        return result;
    }

    clone(): Deck {
        return this.copyWithCardFilter(() => true);
    }

    copyWithCardFilter(predicate: (value: Card) => boolean, parent: Deck = null): Deck {
        const result: Deck = new Deck(this.deckName, parent);
        result.newFlashcards = [...this.newFlashcards.filter((card) => predicate(card))];
        result.dueFlashcards = [...this.dueFlashcards.filter((card) => predicate(card))];

        for (const s of this.subdecks) {
            const newParent = result;
            const newDeck = s.copyWithCardFilter(predicate, newParent);
            result.subdecks.push(newDeck);
        }
        return result;
    }

    static otherListType(cardListType: CardListType): CardListType {
        let result: CardListType;
        if (cardListType == CardListType.NewCard) result = CardListType.DueCard;
        else if (cardListType == CardListType.DueCard) result = CardListType.NewCard;
        else throw "Invalid cardListType";
        return result;
    }
}

export class DeckTreeFilter {
    static filterForReviewableCards(reviewableDeckTree: Deck): Deck {
        return reviewableDeckTree.copyWithCardFilter((card) => !card.question.hasEditLaterTag);
    }

    static filterForRemainingCards(
        questionPostponementList: IQuestionPostponementList,
        deckTree: Deck,
        reviewMode: FlashcardReviewMode,
    ): Deck {
        return deckTree.copyWithCardFilter(
            (card) =>
                (reviewMode == FlashcardReviewMode.Cram || card.isNew || card.isDue) &&
                !questionPostponementList.includes(card.question),
        );
    }
}
