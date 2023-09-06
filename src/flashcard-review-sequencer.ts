import { Notice, TFile, Vault } from "obsidian";
import { Card } from "./card";
import { Deck } from "./deck";
import { Question } from "./question";
import { ReviewResponse, schedule } from "./scheduling";
import { SRSettings } from "./settings";
import { TopicPath } from "./topic-path";
import { escapeRegexString } from "./utils";
import { CardScheduleInfo, ICardScheduleCalculator } from "./card-schedule";
import { INoteEaseList } from "./NoteEaseList";
import { TICKS_PER_DAY } from "./constants";
import { t } from "./lang/helpers";
import { Note } from "./note";

export interface IFlashcardsReviewSequencer {
    get currentCard(): Card;
    get currentQuestion(): Question;
    get currentNote(): Note;
    get currentDeck(): Deck;
    get remainingDeckTree(): Deck;

    setCurrentDeck(topicPath: TopicPath): void;
    getDeckStats(topicPath: TopicPath): IDeckStats;
    getDeck(topicPath: TopicPath): Deck;
    skipCurrentCard(): void;
    processReview(response: ReviewResponse): Promise<void>;
}

export interface IDeckStats {
    dueCount: string;
    newCount: string;
    totalCount: string;
}



export enum FlashcardReviewMode { Cram, Review };

export class FlashcardsReviewSequencer implements IFlashcardsReviewSequencer {
    remainingDeckTree1: Deck;
    reviewMode: FlashcardReviewMode;
    cardSequencer: IDeckTreeIterator;
    settings: SRSettings;
    cardScheduleCalculator: ICardScheduleCalculator;

    constructor(remainingDeckTree: Deck, reviewMode: FlashcardReviewMode, cardSequencer: IDeckTreeIterator, settings: SRSettings, cardScheduleCalculator: ICardScheduleCalculator) {
            this.remainingDeckTree1 = remainingDeckTree;
            this.reviewMode = reviewMode;
            this.cardSequencer = cardSequencer;
            this.settings = settings;
            this.cardScheduleCalculator = cardScheduleCalculator;
    }

    get currentCard(): Card {

    }

    get currentQuestion(): Question {
        return this.currentCard?.question;
    }

    get currentDeck(): Deck { 

    }

    get remainingDeckTree(): Deck {
        return this.remainingDeckTree1;
    }

    private deleteCurrentCard(): void {
        this.currentDeck.deleteFlashcard(this.currentCard);
    }

    private async processReview(response: ReviewResponse): Promise<void> {
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
            this.deleteCurrentCard();
            this.currentDeck.appendFlashcard(TopicPath.emptyPath, this.currentCard);
        } else if (deleteCard) {
            this.deleteCurrentCard();
        }
        this.nextCard();
    }
    
    private determineCardSchedule(response: ReviewResponse, currentCard: Card): CardScheduleInfo {
        var result: CardScheduleInfo;

        if (response == ReviewResponse.Reset) {
            // Resetting the card schedule
            result = this.cardScheduleCalculator.getResetCardSchedule();
        } else {
            // scheduled card
            if (currentCard.isDue) {
                result = this.cardScheduleCalculator.calcUpdatedSchedule(response, currentCard.scheduleInfo);
            } else {
                result = this.cardScheduleCalculator.getNewCardSchedule(response, this.note.path);
            }
        }
        return result;
    }

    private nextCard(): void {

    }
}
