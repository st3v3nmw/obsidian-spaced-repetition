import { Notice, TFile, Vault } from "obsidian";
import { Card } from "./card";
import { Deck } from "./deck";
import { Question } from "./question";
import { ReviewResponse, schedule } from "./scheduling";
import { SRSettings } from "./settings";
import { TopicPath } from "./topic-path";
import { escapeRegexString } from "./utils";
import { CardScheduleInfo } from "./card-schedule";
import { INoteEaseList } from "./NoteEaseList";
import { TICKS_PER_DAY } from "./constants";
import { t } from "./lang/helpers";

export interface IFlashcardsReviewSequencer {
    get currentCard(): Card;
    get currentQuestion(): Question;
    get remainingTreeCurrentDeck(): Deck;

    setCurrentDeck(topicPath: TopicPath): void;
    getDeckStats(topicPath: TopicPath): IDeckStats;
    getRemainingTreeDeck(topicPath: TopicPath): Deck;
    skipCurrentCard(): void;
    processReview(response: ReviewResponse): Promise<void>;
    nextCard(): void;
    modifyQuestionText(replacementText: string): Promise<void>;
}

export interface IDeckStats {
    dueCount: string;
    newCount: string;
    totalCount: string;
}

interface ICardSequencer {
    getNextCard(): number;
}

export class FlashcardsReviewSequencer implements IFlashcardsReviewSequencer {
    noteFile: TFile;
    cramMode: boolean;
    cardSequencer: ICardSequencer;
    settings: SRSettings;
    dueDatesFlashcards: Record<number, number> = {}; // Record<# of days in future, due count>
    vault: Vault;
    noteEaseList: INoteEaseList;

    constructor(vault: Vault, noteFile: TFile, cramMode: boolean, cardSequencer: ICardSequencer, settings: SRSettings, 
        dueDatesFlashcards: Record<number, number>, noteEaseList: INoteEaseList) {
            this.vault = vault;
            this.noteFile = noteFile;
            this.cramMode = cramMode;
            this.cardSequencer = cardSequencer;
            this.settings = settings;
            this.dueDatesFlashcards = dueDatesFlashcards;
            this.noteEaseList = noteEaseList;
    }

    get currentCard(): Card {

    }

    get currentQuestion(): Question {

    }

    get remainingTreeCurrentDeck(): Deck { 

    }

    private deleteCurrentCard(): void {
        this.remainingTreeCurrentDeck.deleteFlashcardAtIndex(
            this.currentCardIdx,
            this.currentCard.isDue,
        );

    }

    private async processReview(response: ReviewResponse): Promise<void> {
        if (this.cramMode) {
            if (response == ReviewResponse.Easy) {
                this.deleteCurrentCard();
            }
        } else {
            this.deleteCurrentCard();
        }

        let interval: number, ease: number, due;

        this.deleteCurrentCard();
        if (response !== ReviewResponse.Reset) {
            let schedObj: Record<string, number>;
            // scheduled card
            if (this.currentCard.isDue) {
                schedObj = schedule(
                    response,
                    this.currentCard.interval,
                    this.currentCard.ease,
                    this.currentCard.delayBeforeReview,
                    this.plugin.data.settings,
                    this.plugin.dueDatesFlashcards,
                );
            } else {
                let initial_ease: number = this.plugin.data.settings.baseEase;
                if (
                    Object.prototype.hasOwnProperty.call(
                        this.plugin.easeByPath,
                        this.currentCard.note.path,
                    )
                ) {
                    initial_ease = Math.round(this.plugin.easeByPath[this.currentCard.note.path]);
                }

                schedObj = schedule(
                    response,
                    1.0,
                    initial_ease,
                    0,
                    this.plugin.data.settings,
                    this.plugin.dueDatesFlashcards,
                );
                interval = schedObj.interval;
                ease = schedObj.ease;
            }

            interval = schedObj.interval;
            ease = schedObj.ease;
            due = window.moment(Date.now() + interval * 24 * 3600 * 1000);
        } else {
            this.currentCard.interval = 1.0;
            this.currentCard.ease = this.plugin.data.settings.baseEase;
            if (this.currentCard.isDue) {
                this.currentDeck.dueFlashcards.push(this.currentCard);
            } else {
                this.currentDeck.newFlashcards.push(this.currentCard);
            }
            due = window.moment(Date.now());
            new Notice(t("CARD_PROGRESS_RESET"));
            this.currentDeck.nextCard(this);
            return;
        }

        const dueString: string = due.format("YYYY-MM-DD");

        let fileText: string = await this.app.vault.read(this.currentCard.note);
        const replacementRegex = new RegExp(escapeRegexString(this.currentCard.cardText), "gm");

        let question: Question;
        let currentCard: Card;
        let sep: string = question.getQuestionTextSeparator(this.settings)

        // check if we're adding scheduling information to the flashcard
        // for the first time
        if (currentCard.isNew) {
            this.currentCard.cardText =
                this.currentCard.cardText + sep + `<!--SR:!${dueString},${interval},${ease}-->`;
        } else {
            let scheduling: (RegExpMatchArray | string[])[] = [
                ...this.currentCard.cardText.matchAll(MULTI_SCHEDULING_EXTRACTOR),
            ];
            if (scheduling.length === 0) {
                scheduling = [...this.currentCard.cardText.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];
            }

            const currCardSched: string[] = ["0", dueString, interval.toString(), ease.toString()];
            if (this.currentCard.isDue) {
                scheduling[this.currentCard.siblingIdx] = currCardSched;
            } else {
                scheduling.push(currCardSched);
            }

            this.currentCard.cardText = this.currentCard.cardText.replace(/<!--SR:.+-->/gm, "");
            this.currentCard.cardText += "<!--SR:";
            for (let i = 0; i < scheduling.length; i++) {
                this.currentCard.cardText += `!${scheduling[i][1]},${scheduling[i][2]},${scheduling[i][3]}`;
            }
            this.currentCard.cardText += "-->";
        }

        fileText = fileText.replace(replacementRegex, () => this.currentCard.cardText);
        for (const sibling of this.currentCard.siblings) {
            sibling.cardText = this.currentCard.cardText;
        }
        if (this.plugin.data.settings.burySiblingCards) {
            this.burySiblingCards(true);
        }

        await this.app.vault.modify(this.currentCard.note, fileText);
        this.currentDeck.nextCard(this);
    }

    private determineCardSchedule(response: ReviewResponse, currentCard: Card): CardScheduleInfo {
        var result: CardScheduleInfo;

        if (response !== ReviewResponse.Reset) {
            let schedObj: Record<string, number>;
            let delayBeforeReview: number;
            // scheduled card
            if (currentCard.isDue) {
                delayBeforeReview = currentCard.scheduleInfo.delayBeforeReview;
                schedObj = schedule(
                    response,
                    currentCard.scheduleInfo.interval,
                    currentCard.scheduleInfo.ease,
                    currentCard.scheduleInfo.delayBeforeReview,
                    this.settings,
                    this.dueDatesFlashcards,
                );
            } else {
                let initial_ease: number = this.noteEaseList.getEaseByPath(this.noteFile.path);
                delayBeforeReview = 0;

                schedObj = schedule(
                    response,
                    CardScheduleInfo.initialInterval,
                    initial_ease,
                    delayBeforeReview, 
                    this.settings,
                    this.dueDatesFlashcards,
                );
            }

            let interval = schedObj.interval;
            let ease = schedObj.ease;
            let dueDateTicks = Date.now() + interval * TICKS_PER_DAY;
            result = CardScheduleInfo.fromDueDateTicks(dueDateTicks, interval, ease, delayBeforeReview);
        } else {
            // Resetting the card schedule
            let delayBeforeReview: number = 0;
            result = new CardScheduleInfo(new Date(), CardScheduleInfo.initialInterval, this.settings.baseEase, delayBeforeReview);
        }
        return result;
    }

    private async modifyCardText(replacementText: string) {
        if (!replacementText) return;
        let originalText: string = this.currentQuestion.questionTextStrippedSR;
        if (replacementText == originalText) return;

        let fileText: string = await this.vault.read(this.noteFile);
        const originalTextRegex = new RegExp(escapeRegexString(originalText), "gm");
        fileText = fileText.replace(originalTextRegex, replacementText);
        await this.vault.modify(this.noteFile, fileText);
        this.remainingTreeCurrentDeck.deleteAllCardsForQuestion(this.currentQuestion);
    }

}