import { Card } from "./Card";
import { FlashcardReviewMode } from "./FlashcardReviewSequencer";
import { Question } from "./Question";
import { IQuestionPostponementList } from "./QuestionPostponementList";
import { TopicPath, TopicPathList } from "./TopicPath";

export enum CardListType {
    NewCard,
    DueCard,
    All,
}

//
// The same card can be added to multiple decks e.g.
//      #flashcards/language/words
//      #flashcards/trivia
// To simplify certain functions (e.g. getDistinctCardCount), we explicitly use the same card object (and not a copy)
//
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

    public getDistinctCardCount(cardListType: CardListType, includeSubdeckCounts: boolean): number {
        const cardList: Card[] = this.getFlattenedCardArray(cardListType, includeSubdeckCounts);

        // The following selects distinct cards from cardList (based on reference equality)
        const distinctCardSet = new Set(cardList);
        // console.log(`getDistinctCardCount: ${this.deckName} ${distinctCardSet.size} ${this.getCardCount(cardListType, includeSubdeckCounts)}`);
        return distinctCardSet.size;
    }

    public getFlattenedCardArray(
        cardListType: CardListType,
        includeSubdeckCounts: boolean,
    ): Card[] {
        let result: Card[] = [] as Card[];
        switch (cardListType) {
            case CardListType.NewCard:
                result = this.newFlashcards;
                break;
            case CardListType.DueCard:
                result = this.dueFlashcards;
                break;
            case CardListType.All:
                result = this.newFlashcards.concat(this.dueFlashcards);
        }

        if (includeSubdeckCounts) {
            for (const subdeck of this.subdecks) {
                result = result.concat(
                    subdeck.getFlattenedCardArray(cardListType, includeSubdeckCounts),
                );
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

    getDeckByTopicTag(tag: string): Deck {
        return this.getDeck(TopicPath.getTopicPathFromTag(tag));
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
        // The root deck may have a dummy deck name, which we don't want
        // So we first check that this isn't the root deck
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

    appendCard(topicPathList: TopicPathList, cardObj: Card): void {
        if (topicPathList.list.length == 0) {
            this.appendCardToRootDeck(cardObj);
        } else {
            // We explicitly are adding the same card object to each of the specified decks
            // This is required by getDistinctCardCount()
            for (const topicPath of topicPathList.list) {
                this.appendCard_SingleTopic(topicPath, cardObj);
            }
        }
    }

    appendCardToRootDeck(cardObj: Card): void {
        this.appendCard_SingleTopic(TopicPath.emptyPath, cardObj);
    }

    appendCard_SingleTopic(topicPath: TopicPath, cardObj: Card): void {
        const deck: Deck = this.getOrCreateDeck(topicPath);
        const cardList: Card[] = deck.getCardListForCardType(cardObj.cardListType);

        cardList.push(cardObj);
    }

    //
    // The question lists all the topics in which this card is included.
    // The topics are relative to the base deck, and this method must be called on that deck
    //
    deleteQuestionFromAllDecks(question: Question, exceptionIfMissing: boolean): void {
        for (const card of question.cards) {
            this.deleteCardFromAllDecks(card, exceptionIfMissing);
        }
    }

    deleteQuestion(question: Question, exceptionIfMissing: boolean): void {
        for (const card of question.cards) {
            this.deleteCardFromThisDeck(card, exceptionIfMissing);
        }
    }

    //
    // The card's question lists all the topics in which this card is included.
    // The topics are relative to the base deck, and this method must be called on that deck
    //
    deleteCardFromAllDecks(card: Card, exceptionIfMissing: boolean): void {
        for (const topicPath of card.question.topicPathList.list) {
            const deck: Deck = this.getDeck(topicPath);
            deck.deleteCardFromThisDeck(card, exceptionIfMissing);
        }
    }

    deleteCardFromThisDeck(card: Card, exceptionIfMissing: boolean): void {
        const newIdx = this.newFlashcards.indexOf(card);
        if (newIdx != -1) this.newFlashcards.splice(newIdx, 1);
        const dueIdx = this.dueFlashcards.indexOf(card);
        if (dueIdx != -1) this.dueFlashcards.splice(dueIdx, 1);
        if (newIdx == -1 && dueIdx == -1 && exceptionIfMissing) {
            throw `deleteCardFromThisDeck: Card: ${card.front} not found in deck: ${this.deckName}`;
        }
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

    debugLogToConsole(desc: string = null, indent: number = 0) {
        let str: string = desc != null ? `${desc}: ` : "";
        console.log((str += this.toString(indent)));
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
