import "src/ui/obsidian-ui-components/content-container/card-container/response-section/response-section.css";
import { Platform } from "obsidian";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { formatScheduleInterval } from "src/algorithms/schedule-display";
import { FlashcardReviewMode } from "src/card/flashcard-review-sequencer";
import { t } from "src/lang/helpers";
import { SRSettings } from "src/settings";
import SRResponseButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/response-section/sr-response-button";
import EmulatedPlatform from "src/utils/platform-detector";

export default class ResponseSectionComponent {
    public responseEl: HTMLDivElement;
    public againButton: SRResponseButtonComponent;
    public hardButton: SRResponseButtonComponent;
    public goodButton: SRResponseButtonComponent;
    public easyButton: SRResponseButtonComponent;
    public answerButton: SRResponseButtonComponent;

    constructor(
        container: HTMLElement,
        settings: SRSettings,
        showAnswer: () => void,
        processReview: (response: ReviewResponse) => void,
    ) {
        this.responseEl = container.createDiv();
        this.responseEl.addClass("sr-response");

        this.answerButton = new SRResponseButtonComponent(this.responseEl, {
            classNames: ["sr-bg-blue", "sr-show-answer-button"],
            text: t("SHOW_ANSWER"),
            onClick: () => {
                showAnswer();
            },
        });

        this.againButton = new SRResponseButtonComponent(this.responseEl, {
            classNames: ["sr-bg-red", "sr-again-button", "sr-is-hidden"],
            text: settings.flashcardAgainText,
            onClick: () => {
                processReview(ReviewResponse.Again);
            },
        });

        this.hardButton = new SRResponseButtonComponent(this.responseEl, {
            classNames: ["sr-bg-yellow", "sr-hard-button", "sr-is-hidden"],
            text: settings.flashcardHardText,
            onClick: () => {
                processReview(ReviewResponse.Hard);
            },
        });

        this.goodButton = new SRResponseButtonComponent(this.responseEl, {
            classNames: ["sr-bg-blue", "sr-good-button", "sr-is-hidden"],
            text: settings.flashcardGoodText,
            onClick: () => {
                processReview(ReviewResponse.Good);
            },
        });

        this.easyButton = new SRResponseButtonComponent(this.responseEl, {
            classNames: ["sr-bg-green", "sr-easy-button", "sr-is-hidden"],
            text: settings.flashcardEasyText,
            onClick: () => {
                processReview(ReviewResponse.Easy);
            },
        });
    }

    public resetResponseButtons() {
        // Sets all buttons in to their default state
        this.answerButton.buttonEl.removeClass("sr-is-hidden");
        this.againButton.buttonEl.addClass("sr-is-hidden");
        this.hardButton.buttonEl.addClass("sr-is-hidden");
        this.goodButton.buttonEl.addClass("sr-is-hidden");
        this.easyButton.buttonEl.addClass("sr-is-hidden");
    }

    public hideAllButtons() {
        this.answerButton.buttonEl.addClass("sr-is-hidden");
        this.againButton.buttonEl.addClass("sr-is-hidden");
        this.hardButton.buttonEl.addClass("sr-is-hidden");
        this.goodButton.buttonEl.addClass("sr-is-hidden");
        this.easyButton.buttonEl.addClass("sr-is-hidden");
    }

    public showRatingButtons(
        reviewMode: FlashcardReviewMode,
        againButtonText: string,
        hardButtonText: string,
        goodButtonText: string,
        easyButtonText: string,
        showIntervalInReviewButtons: boolean,
        determineButtonSchedule: (response: ReviewResponse) => RepItemScheduleInfo,
    ) {
        // Shows the rating buttons and hides the show answer button
        this.answerButton.buttonEl.addClass("sr-is-hidden");

        if (reviewMode === FlashcardReviewMode.Cram) {
            this.responseEl.addClass("is-cram");
            this.againButton.setButtonText(`${againButtonText}`);
            this.easyButton.setButtonText(`${easyButtonText}`);

            if (this.againButton.buttonEl.hasClass("sr-is-hidden")) {
                this.againButton.buttonEl.removeClass("sr-is-hidden");
            }
            if (this.easyButton.buttonEl.hasClass("sr-is-hidden")) {
                this.easyButton.buttonEl.removeClass("sr-is-hidden");
            }

            if (!this.goodButton.buttonEl.hasClass("sr-is-hidden")) {
                this.goodButton.buttonEl.addClass("sr-is-hidden");
            }
            if (!this.hardButton.buttonEl.hasClass("sr-is-hidden")) {
                this.hardButton.buttonEl.addClass("sr-is-hidden");
            }
        } else {
            if (this.responseEl.hasClass("is-cram")) this.responseEl.removeClass("is-cram");
            this.againButton.buttonEl.removeClass("sr-is-hidden");
            this.hardButton.buttonEl.removeClass("sr-is-hidden");
            this.goodButton.buttonEl.removeClass("sr-is-hidden");
            this.easyButton.buttonEl.removeClass("sr-is-hidden");
            this._setupEaseButton(
                this.againButton,
                againButtonText,
                determineButtonSchedule(ReviewResponse.Again),
                showIntervalInReviewButtons,
            );
            this._setupEaseButton(
                this.hardButton,
                hardButtonText,
                determineButtonSchedule(ReviewResponse.Hard),
                showIntervalInReviewButtons,
            );
            this._setupEaseButton(
                this.goodButton,
                goodButtonText,
                determineButtonSchedule(ReviewResponse.Good),
                showIntervalInReviewButtons,
            );
            this._setupEaseButton(
                this.easyButton,
                easyButtonText,
                determineButtonSchedule(ReviewResponse.Easy),
                showIntervalInReviewButtons,
            );
        }
    }

    private _setupEaseButton(
        button: SRResponseButtonComponent,
        buttonName: string,
        schedule: RepItemScheduleInfo,
        showInterval: boolean,
    ) {
        if (showInterval) {
            button.setSmallText(formatScheduleInterval(schedule, true));
            button.setLargeText(`${buttonName} - ${formatScheduleInterval(schedule, false)}`);

            if (EmulatedPlatform().isMobile || Platform.isMobile) {
                if (button.buttonEl.hasClass("sr-show-large-text")) {
                    button.buttonEl.removeClass("sr-show-large-text");
                }
                if (!button.buttonEl.hasClass("sr-show-small-text")) {
                    button.buttonEl.addClass("sr-show-small-text");
                }
            } else {
                if (button.buttonEl.hasClass("sr-show-small-text")) {
                    button.buttonEl.removeClass("sr-show-small-text");
                }
                if (!button.buttonEl.hasClass("sr-show-large-text")) {
                    button.buttonEl.addClass("sr-show-large-text");
                }
            }
        } else {
            if (button.buttonEl.hasClass("sr-show-small-text")) {
                button.buttonEl.removeClass("sr-show-small-text");
            }
            if (!button.buttonEl.hasClass("sr-show-large-text")) {
                button.buttonEl.addClass("sr-show-large-text");
            }
            button.setLargeText(buttonName);
        }
    }
}
