import { RepItemState } from "src/scheduling/algorithms/base/repetition-item";
import { Card, Card as RepetitionItem } from "src/data/data-structures/card/card";
import { Question } from "src/data/data-structures/card/questions/question";
import { IQuestionPostponementList } from "src/data/data-structures/card/questions/question-postponement-list";
import { TopicPath, TopicPathList } from "src/data/data-structures/deck/topic-path";
import { FlashcardReviewMode } from "src/scheduling/flashcard-review-sequencer";


// The same card can be added to multiple decks e.g.
//      #flashcards/language/words
//      #flashcards/trivia
// To simplify certain functions (e.g. getDistinctCardCount), we explicitly use the same card object (and not a copy)

/**
 * Represents a deck of repetition items.
 *
 * @class Deck
 * @property {string} deckName - The name of the deck.
 * @property {RepetitionItem[]} newRepItems - An array of new repetition items.
 * @property {RepetitionItem[]} dueRepItems - An array of due repetition items.
 * @property {Deck[]} subdecks - An array of subdecks.
 * @property {Deck | null} parent - The parent deck.
 */
export class Deck {
    public deckName: string;
    public newRepItems: RepetitionItem[];
    public dueRepItems: RepetitionItem[];
    public subdecks: Deck[];
    public parent: Deck | null;

    constructor(deckName: string, parent: Deck | null) {
        this.deckName = deckName;
        this.newRepItems = [];
        this.dueRepItems = [];
        this.subdecks = [];
        this.parent = parent;
    }

    /**
     * Gets the number of repetition items of the specified type in this deck and all its subdecks.
     *
     * @param {RepItemState} repItemListType - The repetition item list type.
     * @param {boolean} includeSubdeckCounts - Whether to include the count of repetition items in subdecks.
     * @returns {number} - The number of repetition items of the specified type in this deck and all its subdecks.
     */
    public getRepItemCount(repItemListType: RepItemState, includeSubdeckCounts: boolean): number {
        let result: number = 0;
        if (repItemListType === RepItemState.NewItem || repItemListType === RepItemState.AnyItem)
            result += this.newRepItems.length;
        if (repItemListType === RepItemState.DueItem || repItemListType === RepItemState.AnyItem)
            result += this.dueRepItems.length;

        if (includeSubdeckCounts) {
            for (const deck of this.subdecks) {
                result += deck.getRepItemCount(repItemListType, includeSubdeckCounts);
            }
        }
        return result;
    }

    /**
     * Gets the number of distinct repetition items of the specified type in this deck and all its subdecks.
     *
     * @param {RepItemState} repItemListType - The repetition item list type.
     * @param {boolean} includeSubdeckCounts - Whether to include the count of repetition items in subdecks.
     * @returns {number} - The number of distinct repetition items of the specified type in this deck and all its subdecks.
     */
    public getDistinctRepItemCount(repItemListType: RepItemState, includeSubdeckCounts: boolean): number {
        const repItemList: RepetitionItem[] = this.getFlattenedRepItemArray(repItemListType, includeSubdeckCounts);

        // The following selects distinct cards from cardList (based on reference equality)
        const distinctCardSet = new Set(repItemList);
        return distinctCardSet.size;
    }

    /**
     * Gets an array of repetition items of the specified type in this deck and all its subdecks.
     *
     * @param {RepItemState} repItemListType - The repetition item list type.
     * @param {boolean} includeSubdeckCounts - Whether to include the count of repetition items in subdecks.
     * @returns {RepetitionItem[]} - An array of repetition items of the specified type in this deck and all its subdecks.
     */
    public getFlattenedRepItemArray(
        repItemListType: RepItemState,
        includeSubdeckCounts: boolean,
    ): RepetitionItem[] {
        let result: RepetitionItem[] = [] as RepetitionItem[];
        switch (repItemListType) {
            case RepItemState.NewItem:
                result = this.newRepItems;
                break;
            case RepItemState.DueItem:
                result = this.dueRepItems;
                break;
            case RepItemState.AnyItem:
                result = this.newRepItems.concat(this.dueRepItems);
        }

        if (includeSubdeckCounts) {
            for (const subdeck of this.subdecks) {
                result = result.concat(
                    subdeck.getFlattenedRepItemArray(repItemListType, includeSubdeckCounts),
                );
            }
        }
        return result;
    }

    // Returns a count of the number of this question's repetition items are present in this deck.
    // (The returned value would be <= question.cards.length)
    public getQuestionRepItemCount(question: Question): number {
        let result: number = 0;
        result += this.getQuestionRepItemCountForRepItemListType(question, this.newRepItems);
        result += this.getQuestionRepItemCountForRepItemListType(question, this.dueRepItems);
        return result;
    }

    /**
     * Gets the number of repetition items of the specified type in the specified question.
     *
     * @param {Question} question - The question.
     * @param {RepetitionItem[]} repItems - The repetition items.
     * @returns {number} - The number of repetition items of the specified type in the specified question.
     */
    private getQuestionRepItemCountForRepItemListType(question: Question, repItems: RepetitionItem[]): number {
        let result: number = 0;
        for (let i = 0; i < repItems.length; i++) {
            if (repItems[i] instanceof Card && Object.is(question, repItems[i].question)) result++;
        }
        return result;
    }

    static get emptyDeck(): Deck {
        return new Deck("Root", null);
    }

    get isRootDeck() {
        return this.parent === null;
    }

    /**
     * Gets the deck with the specified tag.
     *
     * @param {string} tag - The tag.
     * @returns {Deck | null} - The deck with the specified tag, or null if not found.
     */
    getDeckByTopicTag(tag: string): Deck | null {
        return this.getDeck(TopicPath.getTopicPathFromTag(tag));
    }

    /**
     * Gets the deck with the specified topic path.
     *
     * @param {TopicPath} topicPath - The topic path.
     * @returns {Deck | null} - The deck with the specified topic path, or null if not found.
     */
    getDeck(topicPath: TopicPath): Deck | null {
        return this._findDeckByTopicPath(topicPath);
    }

    /**
     * Gets or creates a deck with the specified topic path.
     *
     * @param {TopicPath} topicPath - The topic path.
     * @param {boolean} createAllowed - Whether to create the deck if it doesn't exist.
     * @returns {Deck | null} - The deck with the specified topic path, or null if it doesn't exist and createAllowed is false.
     */
    private _findDeckByTopicPath(topicPath: TopicPath): Deck | null {
        if (!topicPath.hasPath) {
            return this;
        }

        const t: TopicPath = topicPath.clone();
        const deckName: string = t.shift();
        for (const subdeck of this.subdecks) {
            if (deckName === subdeck.deckName) {
                return subdeck._findDeckByTopicPath(t);
            }
        }

        return null;
    }

    /**
     * Gets or creates a deck with the specified topic path.
     *
     * @param {TopicPath} topicPath - The topic path.
     * @returns {Deck} - The deck with the specified topic path
     */
    getOrCreateDeck(topicPath: TopicPath): Deck {
        if (!topicPath.hasPath) {
            return this;
        }
        const t: TopicPath = topicPath.clone();
        const deckName: string = t.shift();
        for (const subdeck of this.subdecks) {
            if (deckName === subdeck.deckName) {
                return subdeck.getOrCreateDeck(t);
            }
        }

        const subdeck: Deck = new Deck(deckName, this /* parent */);
        this.subdecks.push(subdeck);
        return subdeck.getOrCreateDeck(t);
    }

    /**
     * Gets the topic path of the deck.
     *
     * @returns {TopicPath} - The topic path of the deck.
     */
    getTopicPath(): TopicPath {
        const list: string[] = [];
        // eslint-disable-next-line  @typescript-eslint/no-this-alias
        let deck: Deck = this;
        // The root deck may have a dummy deck name, which we don't want
        // So we first check that this isn't the root deck
        while (!deck.isRootDeck) {
            list.push(deck.deckName);
            if (deck.parent === null) {
                break;
            }
            deck = deck.parent;
        }
        return new TopicPath(list.reverse());
    }

    /**
     * Gets the root deck of the deck.
     *
     * @returns {Deck} - The root deck of the deck.
     */
    getRootDeck(): Deck {
        // eslint-disable-next-line  @typescript-eslint/no-this-alias
        let deck: Deck = this;
        while (!deck.isRootDeck) {
            if (deck.parent === null) {
                break;
            }
            deck = deck.parent;
        }
        return deck;
    }

    /**
     * Gets the RepetitionItem with the specified index.
     *
     * @param {number} index - The index of the RepetitionItem.
     * @param {RepItemState} state - The state of the RepetitionItem.
     * @returns {RepetitionItem} - The RepetitionItem with the specified index.
     */
    getRepItem(index: number, repItemListType: RepItemState): RepetitionItem {
        const repItemList: RepetitionItem[] = this.getRepItemListForRepItemState(repItemListType);
        return repItemList[index];
    }

    /**
     * Gets the list of RepetitionItems for the specified state.
     *
     * @param {RepItemState} state - The state of the RepetitionItems.
     * @returns {RepetitionItem[]} - The list of RepetitionItems for the specified state.
     */
    getRepItemListForRepItemState(state: RepItemState): RepetitionItem[] {
        return state === RepItemState.DueItem ? this.dueRepItems : this.newRepItems;
    }

    /**
     * Appends a RepetitionItem to the deck.
     *
     * @param {TopicPathList} topicPathList - The topic path list.
     * @param {RepetitionItem} repItem - The RepetitionItem to append.
     */
    appendRepItem(topicPathList: TopicPathList, repItem: RepetitionItem): void {
        if (topicPathList.list.length === 0) {
            this.appendRepItemToRootDeck(repItem);
        } else {
            // We explicitly are adding the same card object to each of the specified decks
            // This is required by getDistinctCardCount()
            for (const topicPath of topicPathList.list) {
                this.appendRepItemSingleTopic(topicPath, repItem);
            }
        }
    }

    /**
    * Appends a RepetitionItem to the root deck.
    *
     * This is used for cards that don't have any topics, and also for postponing cards (e.g. when skipping a card, we move it to the root deck and remove its topic paths, so that it won't be seen until the next review session when we reassign it to decks based on its question's topic paths)
     *
     * @param {RepetitionItem} repItem - The RepetitionItem to append.
     */
    appendRepItemToRootDeck(repItem: RepetitionItem): void {
        this.appendRepItemSingleTopic(TopicPath.emptyPath, repItem);
    }

    /**
     * Appends a RepetitionItem to a deck with the specified topic path.
     *
     * @param {TopicPath} topicPath - The topic path.
     * @param {RepetitionItem} repItem - The RepetitionItem to append.
     */
    appendRepItemSingleTopic(topicPath: TopicPath, repItem: RepetitionItem): void {
        const deck: Deck = this.getOrCreateDeck(topicPath);
        const repItemList: RepetitionItem[] = deck.getRepItemListForRepItemState(repItem.repItemState);

        repItemList.push(repItem);
    }

    // The question lists all the topics in which this card is included.
    // The topics are relative to the base deck, and this method must be called on that deck
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

    // The card's question lists all the topics in which this card is included.
    // The topics are relative to the base deck, and this method must be called on that deck
    deleteCardFromAllDecks(card: RepetitionItem, exceptionIfMissing: boolean): void {
        for (const topicPath of card.question.topicPathList.list) {
            const deck: Deck | null = this.getDeck(topicPath);
            if (deck) {
                deck.deleteCardFromThisDeck(card, exceptionIfMissing);
            }
        }
    }

    deleteCardFromThisDeck(card: RepetitionItem, exceptionIfMissing: boolean): void {
        const newIdx = this.newRepItems.indexOf(card);
        if (newIdx !== -1) this.newRepItems.splice(newIdx, 1);
        const dueIdx = this.dueRepItems.indexOf(card);
        if (dueIdx !== -1) this.dueRepItems.splice(dueIdx, 1);
        if (newIdx === -1 && dueIdx === -1 && exceptionIfMissing) {
            throw `deleteCardFromThisDeck: Card: ${card.front} not found in deck: ${this.deckName}`;
        }
    }

    /**
     * Deletes a RepetitionItem at the specified index.
     *
     * @param {number} index - The index of the RepetitionItem to delete.
     * @param {RepItemState} repItemState - The state of the RepetitionItem.
     */
    deleteRepItemAtIndex(index: number, repItemState: RepItemState): void {
        const repItemList: RepetitionItem[] = this.getRepItemListForRepItemState(repItemState);
        repItemList.splice(index, 1);
    }

    /**
    * Exports the deck and all its subdecks to an array.
    *
    * @returns {Deck[]} - An array containing the deck and all its subdecks.
    */
    toDeckArray(): Deck[] {
        const result: Deck[] = [];
        result.push(this);
        for (const subdeck of this.subdecks) {
            result.push(...subdeck.toDeckArray());
        }
        return result;
    }

    /**
     * Sorts the subdecks list in ascending order by deck name.
     */
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

    /**
     * Logs the deck and its subdecks to the console.
     *
     * @param {string | null} desc - The description to log.
     * @param {number} indent - The indentation level.
     */
    debugLogToConsole(desc: string | null = null, indent: number = 0) {
        let str: string = desc !== null && desc !== undefined ? `${desc}: ` : "";
        str += this.toString(indent);
        console.log(str);
    }

    /**
     * Converts the deck and its subdecks to a string.
     *
     * @param {number} indent - The indentation level.
     * @returns {string} - The string representation of the deck and its subdecks.
     */
    toString(indent: number = 0): string {
        let result: string = "";
        let indentStr: string = " ".repeat(indent * 4);

        result += `${indentStr}${this.deckName}\r\n`;
        indentStr += "  ";
        for (let i = 0; i < this.newRepItems.length; i++) {
            const repItem = this.newRepItems[i];
            result += `${indentStr}New: ${i}: ${repItem.toString()}\r\n`;
        }
        for (let i = 0; i < this.dueRepItems.length; i++) {
            const repItem = this.dueRepItems[i];
            const s = repItem.isDue ? "Due" : "Not due";
            result += `${indentStr}${s}: ${i}: ${repItem.toString()}\r\n`;
        }

        for (const subdeck of this.subdecks) {
            result += subdeck.toString(indent + 1);
        }
        return result;
    }

    /**
     * Clones the deck and its subdecks.
     *
     * @returns {Deck} - The cloned deck and its subdecks.
     */
    clone(): Deck {
        return this.copyWithRepItemFilter(() => true);
    }

    /**
     * Copies the deck and its subdecks with a filter.
     *
     * @param {(value: RepetitionItem) => boolean} predicate - The filter function.
     * @param {Deck | null} parent - The parent deck.
     * @returns {Deck} - The copied deck and its subdecks with the filter applied.
     */
    copyWithRepItemFilter(predicate: (value: RepetitionItem) => boolean, parent: Deck | null = null): Deck {
        const result: Deck = new Deck(this.deckName, parent);
        result.newRepItems = [...this.newRepItems.filter((card) => predicate(card))];
        result.dueRepItems = [...this.dueRepItems.filter((card) => predicate(card))];

        for (const s of this.subdecks) {
            const newParent = result;
            const newDeck = s.copyWithRepItemFilter(predicate, newParent);
            result.subdecks.push(newDeck);
        }
        return result;
    }

    /**
     * Gets the opposite state of the specified state.
     *
     * @param {RepItemState} repItemState - The state.
     * @returns {RepItemState} - The opposite state.
     */
    static otherListType(repItemState: RepItemState): RepItemState {
        let result: RepItemState;
        if (repItemState === RepItemState.NewItem) result = RepItemState.DueItem;
        else if (repItemState === RepItemState.DueItem) result = RepItemState.NewItem;
        else throw "Invalid repItemState";
        return result;
    }
}

/**
 * Filters the deck tree items
 */
export class DeckTreeFilter {
    /**
     * Filters the deck tree for the remaining repetition items.
     *
     * @param {IQuestionPostponementList} questionPostponementList - The question postponement list.
     * @param {Deck} deckTree - The deck tree.
     * @param {FlashcardReviewMode} reviewMode - The review mode.
     * @returns {Deck} - The filtered deck tree.
     */
    static filterForRemainingRepItems(
        questionPostponementList: IQuestionPostponementList,
        deckTree: Deck,
        reviewMode: FlashcardReviewMode,
    ): Deck {
        return deckTree.copyWithRepItemFilter(
            (repItem: RepetitionItem) =>
                (reviewMode === FlashcardReviewMode.Cram || repItem.isNew || repItem.isDue) &&
                !questionPostponementList.includes(repItem.question),
        );
    }
}
