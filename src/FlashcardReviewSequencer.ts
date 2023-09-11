import { Notice, TFile, Vault } from "obsidian";
import { Card } from "./card";
import { Deck } from "./deck";
import { Question } from "./question";
import { ReviewResponse, schedule } from "./scheduling";
import { SRSettings } from "./settings";
import { TopicPath } from "./TopicPath";
import { escapeRegexString } from "./utils";
import { CardScheduleInfo, ICardScheduleCalculator } from "./CardSchedule";
import { INoteEaseList } from "./NoteEaseList";
import { TICKS_PER_DAY } from "./constants";
import { t } from "./lang/helpers";
import { Note } from "./note";
import { IDeckTreeIterator } from "./DeckTreeIterator";

export interface IFlashcardReviewSequencer {
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
    deckTree: Deck;
    reviewMode: FlashcardReviewMode;
    cardSequencer: IDeckTreeIterator;
    settings: SRSettings;
    cardScheduleCalculator: ICardScheduleCalculator;

    constructor(reviewMode: FlashcardReviewMode, cardSequencer: IDeckTreeIterator, settings: SRSettings, cardScheduleCalculator: ICardScheduleCalculator) {
            this.reviewMode = reviewMode;
            this.cardSequencer = cardSequencer;
            this.settings = settings;
            this.cardScheduleCalculator = cardScheduleCalculator;
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

    get remainingDeckTree(): Deck {
        return this.deckTree;
    }

    get currentNote(): Note {
        return this.currentQuestion.note;
    }

    setDeckTree(deckTree: Deck): void {
        this.deckTree = deckTree;
        this.setCurrentDeck(TopicPath.emptyPath);
    }

    setCurrentDeck(topicPath: TopicPath): void {
        let deck: Deck = this.deckTree.getDeck(topicPath);
        console.debug(`setCurrentDeck: [${topicPath?.path}]: ${deck?.deckName}\r\n`);
        this.cardSequencer.setDeck(deck);
        this.cardSequencer.nextCard();
    }

    getDeckStats(topicPath: TopicPath): DeckStats {
        return new DeckStats(1, 2, 3);
    }

    skipCurrentCard(): void {

    }

    private deleteCurrentCard(): void {
        this.currentDeck.deleteCard(this.currentCard);
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
            this.deleteCurrentCard();
            this.currentDeck.appendCard(TopicPath.emptyPath, this.currentCard);
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
            if (currentCard.isDue) {
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
