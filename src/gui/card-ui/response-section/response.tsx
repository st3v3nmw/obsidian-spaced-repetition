import { ButtonComponent, Platform } from "obsidian";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { textInterval } from "src/algorithms/osr/note-scheduling";
import { Card } from "src/card";
import { FlashcardReviewMode, IFlashcardReviewSequencer } from "src/flashcard-review-sequencer";
import SRResponseButton from "src/gui/card-ui/response-section/sr-response-button";
import { t } from "src/lang/helpers";
import { SRSettings } from "src/settings";
import EmulatedPlatform from "src/utils/platform-detector";

export default class Response {
    public responseEl: HTMLDivElement;
    public hardButton: ButtonComponent;
    public goodButton: ButtonComponent;
    public easyButton: ButtonComponent;
    public answerButton: ButtonComponent;

    constructor(container: HTMLElement, settings: SRSettings, showAnswer: () => void, processReview: (response: ReviewResponse) => void) {
        this.responseEl = container.createDiv();
        this.responseEl.addClass("sr-response");

        this.answerButton = new SRResponseButton(this.responseEl, {
            className: ["sr-bg-blue"].join(" "),
            text: t("SHOW_ANSWER"),
            onClick: () => {
                showAnswer();
            },
        });

        this.hardButton = new SRResponseButton(this.responseEl, {
            className: ["sr-bg-red", "sr-is-hidden"].join(" "),
            text: settings.flashcardHardText,
            onClick: () => {
                processReview(ReviewResponse.Hard);
            },
        });

        this.goodButton = new SRResponseButton(this.responseEl, {
            className: ["sr-bg-blue", "sr-is-hidden"].join(" "),
            text: settings.flashcardGoodText,
            onClick: () => {
                processReview(ReviewResponse.Good);
            },
        });

        this.easyButton = new SRResponseButton(this.responseEl, {
            className: ["sr-bg-green", "sr-is-hidden"].join(" "),
            text: settings.flashcardEasyText,
            onClick: () => {
                processReview(ReviewResponse.Easy);
            },
        });
    }

    public resetResponseButtons() {
        // Sets all buttons in to their default state
        this.answerButton.buttonEl.removeClass("sr-is-hidden");
        this.hardButton.buttonEl.addClass("sr-is-hidden");
        this.goodButton.buttonEl.addClass("sr-is-hidden");
        this.easyButton.buttonEl.addClass("sr-is-hidden");
    }

    public showRatingButtons(reviewMode: FlashcardReviewMode, settings: SRSettings, reviewSequencer: IFlashcardReviewSequencer,
        currentCard: Card) {
        // Shows the rating buttons and hides the show answer button
        this.answerButton.buttonEl.addClass("sr-is-hidden");

        if (reviewMode === FlashcardReviewMode.Cram) {
            this.responseEl.addClass("is-cram");
            this.hardButton.setButtonText(`${settings.flashcardHardText}`);
            this.easyButton.setButtonText(`${settings.flashcardEasyText}`);
            if (!this.goodButton.buttonEl.hasClass("sr-is-hidden")) {
                this.goodButton.buttonEl.addClass("sr-is-hidden");
            }
        } else {
            if (this.responseEl.hasClass("is-cram")) this.responseEl.removeClass("is-cram");
            this.goodButton.buttonEl.removeClass("sr-is-hidden");
            this._setupEaseButton(
                this.hardButton,
                settings.flashcardHardText,
                reviewSequencer,
                currentCard,
                settings,
                ReviewResponse.Hard,
            );
            this._setupEaseButton(
                this.goodButton,
                settings.flashcardGoodText,
                reviewSequencer,
                currentCard,
                settings,
                ReviewResponse.Good,
            );
            this._setupEaseButton(
                this.easyButton,
                settings.flashcardEasyText,
                reviewSequencer,
                currentCard,
                settings,
                ReviewResponse.Easy,
            );
        }
        this.hardButton.buttonEl.removeClass("sr-is-hidden");
        this.easyButton.buttonEl.removeClass("sr-is-hidden");
    }

    private _setupEaseButton(
        button: ButtonComponent,
        buttonName: string,
        reviewSequencer: IFlashcardReviewSequencer,
        currentCard: Card,
        settings: SRSettings,
        reviewResponse: ReviewResponse,
    ) {
        const schedule: RepItemScheduleInfo = reviewSequencer.determineCardSchedule(
            reviewResponse,
            currentCard,
        );
        const interval: number = schedule.interval;

        if (settings.showIntervalInReviewButtons) {
            if (EmulatedPlatform().isMobile || Platform.isMobile) {
                button.setButtonText(textInterval(interval, true));
            } else {
                button.setButtonText(`${buttonName} - ${textInterval(interval, false)}`);
            }
        } else {
            button.setButtonText(buttonName);
        }
    }
}