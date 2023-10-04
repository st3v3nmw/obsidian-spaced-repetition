import { Card } from "./Card";
import { CardListType, Deck } from "./Deck";
import { Question, QuestionText } from "./Question";
import { ReviewResponse } from "./scheduling";
import { SRSettings } from "./settings";
import { TopicPath } from "./TopicPath";
import { CardScheduleInfo, ICardScheduleCalculator } from "./CardSchedule";
import { Note } from "./Note";
import { IDeckTreeIterator } from "./DeckTreeIterator";
import { IQuestionPostponementList } from "./QuestionPostponementList";

export interface IFlashcardReviewSequencer {
    get hasCurrentCard(): boolean;
    get currentCard(): Card;
    get currentQuestion(): Question;
    get currentNote(): Note;
    get currentDeck(): Deck;
    get originalDeckTree(): Deck;

    setDeckTree(originalDeckTree: Deck, remainingDeckTree: Deck): void;
    setCurrentDeck(topicPath: TopicPath): void;
    getDeckStats(topicPath: TopicPath): DeckStats;
    skipCurrentCard(): void;
    determineCardSchedule(response: ReviewResponse, card: Card): CardScheduleInfo;
    processReview(response: ReviewResponse): Promise<void>;
    updateCurrentQuestionText(text: string): Promise<void>;
}

export class DeckStats {
    dueCount: number;
    newCount: number;
    totalCount: number;

    constructor(dueCount: number, newCount: number, totalCount: number) {
        this.dueCount = dueCount;
        this.newCount = newCount;
        this.totalCount = totalCount;
    }
}

export enum FlashcardReviewMode {
    Cram,
    Review,
}

export class FlashcardReviewSequencer implements IFlashcardReviewSequencer {
    private _originalDeckTree: Deck;
    private remainingDeckTree: Deck;
    private reviewMode: FlashcardReviewMode;
    private cardSequencer: IDeckTreeIterator;
    private settings: SRSettings;
    private cardScheduleCalculator: ICardScheduleCalculator;
    private questionPostponementList: IQuestionPostponementList;

    constructor(
        reviewMode: FlashcardReviewMode,
        cardSequencer: IDeckTreeIterator,
        settings: SRSettings,
        cardScheduleCalculator: ICardScheduleCalculator,
        questionPostponementList: IQuestionPostponementList,
    ) {
        this.reviewMode = reviewMode;
        this.cardSequencer = cardSequencer;
        this.settings = settings;
        this.cardScheduleCalculator = cardScheduleCalculator;
        this.questionPostponementList = questionPostponementList;
    }

    get hasCurrentCard(): boolean {
        return this.cardSequencer.currentCard != null;
    }

    get currentCard(): Card {
        return this.cardSequencer.currentCard;
    }

    get currentQuestion(): Question {
        return this.currentCard?.question;
    }

    get currentDeck(): Deck {
        return this.cardSequencer.currentDeck;
    }

    get currentNote(): Note {
        return this.currentQuestion.note;
    }

    setDeckTree(originalDeckTree: Deck, remainingDeckTree: Deck): void {
        this._originalDeckTree = originalDeckTree;
        this.remainingDeckTree = remainingDeckTree;
        this.setCurrentDeck(TopicPath.emptyPath);
    }

    setCurrentDeck(topicPath: TopicPath): void {
        const deck: Deck = this.remainingDeckTree.getDeck(topicPath);
        this.cardSequencer.setDeck(deck);
        this.cardSequencer.nextCard();
    }

    get originalDeckTree(): Deck {
        return this._originalDeckTree;
    }

    getDeckStats(topicPath: TopicPath): DeckStats {
        const totalCount: number = this._originalDeckTree
            .getDeck(topicPath)
            .getCardCount(CardListType.All, true);
        const remainingDeck: Deck = this.remainingDeckTree.getDeck(topicPath);
        const newCount: number = remainingDeck.getCardCount(CardListType.NewCard, true);
        const dueCount: number = remainingDeck.getCardCount(CardListType.DueCard, true);
        return new DeckStats(dueCount, newCount, totalCount);
    }

    skipCurrentCard(): void {
        this.questionPostponementList.addIfRequired(this.currentQuestion);
        this.cardSequencer.deleteCurrentQuestion();
    }

    private deleteCurrentCard(): void {
        this.cardSequencer.deleteCurrentCard();
    }

    async processReview(response: ReviewResponse): Promise<void> {
        switch (this.reviewMode) {
            case FlashcardReviewMode.Review:
                await this.processReview_ReviewMode(response);
                break;

            case FlashcardReviewMode.Cram:
                await this.processReview_CramMode(response);
                break;
        }
    }

    async processReview_ReviewMode(response: ReviewResponse): Promise<void> {
        this.currentCard.scheduleInfo = this.determineCardSchedule(response, this.currentCard);

        // Update the source file with the updated schedule
        await this.currentQuestion.writeQuestion(this.settings);

        // Move/delete the card
        if (response == ReviewResponse.Reset) {
            this.cardSequencer.moveCurrentCardToEndOfList();
            this.cardSequencer.nextCard();
        } else this.deleteCurrentCard();
    }

    async processReview_CramMode(response: ReviewResponse): Promise<void> {
        if (response == ReviewResponse.Easy) this.deleteCurrentCard();
        else {
            this.cardSequencer.moveCurrentCardToEndOfList();
            this.cardSequencer.nextCard();
        }
    }

    determineCardSchedule(response: ReviewResponse, card: Card): CardScheduleInfo {
        let result: CardScheduleInfo;

        if (response == ReviewResponse.Reset) {
            // Resetting the card schedule
            result = this.cardScheduleCalculator.getResetCardSchedule();
        } else {
            // scheduled card
            if (card.hasSchedule) {
                result = this.cardScheduleCalculator.calcUpdatedSchedule(
                    response,
                    card.scheduleInfo,
                );
            } else {
                const currentNote: Note = card.question.note;
                result = this.cardScheduleCalculator.getNewCardSchedule(
                    response,
                    currentNote.filePath,
                );
            }
        }
        return result;
    }

    async updateCurrentQuestionText(text: string): Promise<void> {
        const q: QuestionText = this.currentQuestion.questionText;

        q.actualQuestion = text;

        await this.currentQuestion.writeQuestion(this.settings);
    }
}
