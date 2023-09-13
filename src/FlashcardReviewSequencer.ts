import { Notice, TFile, Vault } from "obsidian";
import { Card } from "./__Card";
import { CardListType, Deck } from "./Deck";
import { Question } from "./Question";
import { ReviewResponse, schedule } from "./scheduling";
import { SRSettings } from "./settings";
import { TopicPath } from "./TopicPath";
import { escapeRegexString } from "./util/utils";
import { CardScheduleInfo, ICardScheduleCalculator } from "./CardSchedule";
import { INoteEaseList } from "./NoteEaseList";
import { TICKS_PER_DAY } from "./constants";
import { t } from "./lang/helpers";
import { Note } from "./Note";
import { IDeckTreeIterator } from "./DeckTreeIterator";

export interface IFlashcardReviewSequencer {
    get hasCurrentCard(): boolean;
    get currentCard(): Card;
    get currentQuestion(): Question;
    get currentNote(): Note;
    get currentDeck(): Deck;

    setDeckTree(deckTree: Deck): void;
    setCurrentDeck(topicPath: TopicPath): void;
    getDeckStats(topicPath: TopicPath): DeckStats;
    skipCurrentCard(): void;
    processReview(response: ReviewResponse): Promise<void>;
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



export enum FlashcardReviewMode { Cram, Review };

export class FlashcardReviewSequencer implements IFlashcardReviewSequencer {
    private originalDeckTree: Deck;
    private filteredDeckTree: Deck;
    private remainingDeckTree: Deck;
    private reviewMode: FlashcardReviewMode;
    private cardSequencer: IDeckTreeIterator;
    private settings: SRSettings;
    private cardScheduleCalculator: ICardScheduleCalculator;

    constructor(reviewMode: FlashcardReviewMode, cardSequencer: IDeckTreeIterator, settings: SRSettings, cardScheduleCalculator: ICardScheduleCalculator) {
            this.reviewMode = reviewMode;
            this.cardSequencer = cardSequencer;
            this.settings = settings;
            this.cardScheduleCalculator = cardScheduleCalculator;
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

    setDeckTree(deckTree: Deck): void {
        this.originalDeckTree = deckTree;
        this.createFilteredDeckTrees();
        this.setCurrentDeck(TopicPath.emptyPath);
    }

    private createFilteredDeckTrees(): void {
        this.filteredDeckTree = this.originalDeckTree.copyWithCardFilter((card) => 
            !card.question.hasEditLaterTag);

        this.remainingDeckTree = this.filteredDeckTree.copyWithCardFilter((card) => 
            (this.reviewMode == FlashcardReviewMode.Cram) || card.isNew || card.isDue);
    }

    setCurrentDeck(topicPath: TopicPath): void {
        let deck: Deck = this.remainingDeckTree.getDeck(topicPath);
        this.cardSequencer.setDeck(deck);
        this.cardSequencer.nextCard();
    }

    getDeckStats(topicPath: TopicPath): DeckStats {
        let totalCount: number = this.filteredDeckTree.getDeck(topicPath).getCardCount(CardListType.All, true);
        let remainingDeck: Deck = this.remainingDeckTree.getDeck(topicPath);
        let newCount: number = remainingDeck.getCardCount(CardListType.NewCard, true);
        let dueCount: number = remainingDeck.getCardCount(CardListType.DueCard, true);
        return new DeckStats(dueCount, newCount, totalCount);
    }

    skipCurrentCard(): void {
        this.cardSequencer.deleteCurrentCard();
    }

    private deleteCurrentCard(): void {
        this.cardSequencer.deleteCurrentCard();
    }

    async processReview(response: ReviewResponse): Promise<void> {
        let deleteCard: boolean = false;
        let moveCardToEnd: boolean = false;

        switch (this.reviewMode) {
            case FlashcardReviewMode.Review:
                deleteCard = (response != ReviewResponse.Reset);
                moveCardToEnd = (response == ReviewResponse.Reset);
                this.currentCard.scheduleInfo = this.determineCardSchedule(response, this.currentCard);
                break;

            case FlashcardReviewMode.Cram:
                deleteCard = (response == ReviewResponse.Easy);
                break;
        }
        
        if (moveCardToEnd) {
            let card = this.currentCard;
            this.deleteCurrentCard();
            this.currentDeck.appendCard(TopicPath.emptyPath, card);
        } else if (deleteCard) {
            this.deleteCurrentCard();
        }
        else
            this.nextCard();
    }
    
    private determineCardSchedule(response: ReviewResponse, currentCard: Card): CardScheduleInfo {
        var result: CardScheduleInfo;

        if (response == ReviewResponse.Reset) {
            // Resetting the card schedule
            result = this.cardScheduleCalculator.getResetCardSchedule();
        } else {
            // scheduled card
            if (currentCard.hasSchedule) {
                result = this.cardScheduleCalculator.calcUpdatedSchedule(response, currentCard.scheduleInfo);
            } else {
                let currentNote: Note = currentCard.question.note;
                result = this.cardScheduleCalculator.getNewCardSchedule(response, currentNote.filePath);
            }
        }
        return result;
    }

    private nextCard(): void {

    }
}
