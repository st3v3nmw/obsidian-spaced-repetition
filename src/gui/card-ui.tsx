import { now } from "moment";
import { App, Notice, Platform, setIcon } from "obsidian";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { textInterval } from "src/algorithms/osr/note-scheduling";
import { Card } from "src/card";
import { CardListType, Deck } from "src/deck";
import {
    FlashcardReviewMode,
    IFlashcardReviewSequencer as IFlashcardReviewSequencer,
} from "src/flashcard-review-sequencer";
import { FlashcardMode } from "src/gui/sr-modal";
import { t } from "src/lang/helpers";
import type SRPlugin from "src/main";
import { Note } from "src/note";
import { CardType, Question } from "src/question";
import { SRSettings } from "src/settings";
import { RenderMarkdownWrapper } from "src/utils/renderers";

export class CardUI {
    public app: App;
    public plugin: SRPlugin;
    public contentEl: HTMLElement;
    public parentEl: HTMLElement;
    public mode: FlashcardMode;

    public view: HTMLDivElement;

    public header: HTMLDivElement;
    public chosenDeckLabel: HTMLDivElement;
    public chosenDeckText: HTMLDivElement;
    public chosenDeckSubDeckNumText: HTMLDivElement;
    public chosenDeckCardNumIcon: HTMLDivElement;
    public chosenDeckDeckNumIcon: HTMLDivElement;

    public deckDivider: HTMLDivElement;

    public currentDeckLabel: HTMLDivElement;
    public currentDeckText: HTMLDivElement;
    public currentDeckCardNumIcon: HTMLDivElement;

    public controls: HTMLDivElement;
    public editButton: HTMLButtonElement;
    public resetButton: HTMLButtonElement;
    public infoButton: HTMLButtonElement;
    public skipButton: HTMLButtonElement;
    public headerDivider: HTMLHRElement;

    public content: HTMLDivElement;
    public context: HTMLElement;
    public contextLandscape: HTMLElement;

    public response: HTMLDivElement;
    public hardButton: HTMLButtonElement;
    public goodButton: HTMLButtonElement;
    public easyButton: HTMLButtonElement;
    public answerButton: HTMLButtonElement;
    public lastPressed: number;

    private chosenDeck: Deck | null;
    private reviewSequencer: IFlashcardReviewSequencer;
    private settings: SRSettings;
    private reviewMode: FlashcardReviewMode;
    private backToDeck: () => void;
    private editClickHandler: () => void;

    constructor(
        app: App,
        plugin: SRPlugin,
        settings: SRSettings,
        reviewSequencer: IFlashcardReviewSequencer,
        reviewMode: FlashcardReviewMode,
        contentEl: HTMLElement,
        parentEl: HTMLElement,
        backToDeck: () => void,
        editClickHandler: () => void,
    ) {
        // Init properties
        this.app = app;
        this.plugin = plugin;
        this.settings = settings;
        this.reviewSequencer = reviewSequencer;
        this.reviewMode = reviewMode;
        this.backToDeck = backToDeck;
        this.editClickHandler = editClickHandler;
        this.contentEl = contentEl;
        this.parentEl = parentEl;
        this.chosenDeck = null;

        // Build ui
        this.init();
    }

    /**
     * Initializes all static elements in the FlashcardView
     */
    init() {
        this.view = this.contentEl.createDiv();
        this.view.addClasses(["sr-flashcard", "sr-is-hidden"]);

        this.header = this.view.createDiv();
        this.header.addClass("sr-header");

        this.chosenDeckLabel = this.header.createDiv();
        this.chosenDeckLabel.addClass("sr-chosen-deck-label");
        this.chosenDeckText = this.chosenDeckLabel.createDiv();

        this.chosenDeckCardNumIcon = this.chosenDeckLabel.createDiv();
        setIcon(this.chosenDeckCardNumIcon, "credit-card");

        this.chosenDeckSubDeckNumText = this.chosenDeckLabel.createDiv();
        this.chosenDeckSubDeckNumText.addClass("sr-chosen-deck-deck-num");

        this.chosenDeckDeckNumIcon = this.chosenDeckLabel.createDiv();
        setIcon(this.chosenDeckDeckNumIcon, "layers");

        this.deckDivider = this.header.createDiv();
        this.deckDivider.addClass("sr-deck-divider");
        this.deckDivider.addClass("sr-is-hidden");
        this.deckDivider.setText(">>");

        this.currentDeckLabel = this.header.createDiv();
        this.currentDeckLabel.addClass("sr-is-hidden");
        this.currentDeckLabel.addClass("sr-current-deck-label");

        this.currentDeckText = this.currentDeckLabel.createDiv();
        this.currentDeckCardNumIcon = this.currentDeckLabel.createDiv();
        setIcon(this.currentDeckCardNumIcon, "credit-card");

        this.controls = this.view.createDiv();
        this.controls.addClass("sr-controls");

        this._createCardControls();

        this.headerDivider = this.view.createEl("hr");

        if (this.settings.showContextInCards) {
            this.context = this.view.createDiv();
            this.context.addClass("sr-context");
        }

        this.content = this.view.createDiv();
        this.content.addClass("sr-content");

        this.response = this.view.createDiv();
        this.response.addClass("sr-response");

        this._createResponseButtons();
    }

    /**
     * Shows the FlashcardView if it is hidden
     */
    async show(chosenDeck: Deck) {
        if (!this.view.hasClass("sr-is-hidden")) {
            return;
        }
        this.chosenDeck = chosenDeck;

        await this._drawContent();

        // Prevents the following code, from running if this show is just a redraw and not an unhide
        this.view.removeClass("sr-is-hidden");
        // this.backButton.removeClass("sr-is-hidden");
        document.addEventListener("keydown", this._keydownHandler);
    }

    /**
     * Refreshes all dynamic elements
     */
    async refresh() {
        await this._drawContent();
    }

    /**
     * Hides the FlashcardView if it is visible
     */
    hide() {
        // Prevents the following code, from running if this was executed multiple times after one another
        if (this.view.hasClass("sr-is-hidden")) {
            return;
        }

        document.removeEventListener("keydown", this._keydownHandler);
        this.view.addClass("sr-is-hidden");
        // this.backButton.addClass("sr-is-hidden");
    }

    /**
     * Closes the FlashcardView
     */
    close() {
        this.hide();
        document.removeEventListener("keydown", this._keydownHandler);
    }

    // #region -> Functions & helpers

    private async _drawContent() {
        this.mode = FlashcardMode.Front;
        const currentDeck: Deck = this.reviewSequencer.currentDeck;

        // Setup title
        this._setChosenDeckLabel(this.chosenDeck);
        this._setCurrentDeckLabel(this.chosenDeck, currentDeck);
        this.resetButton.disabled = true;

        // Setup context
        if (this.settings.showContextInCards) {
            this.context.setText(
                this._formatQuestionContextText(this._currentQuestion.questionContext),
            );
        }

        // Setup card content
        this.content.empty();
        const wrapper: RenderMarkdownWrapper = new RenderMarkdownWrapper(
            this.app,
            this.plugin,
            this._currentNote.filePath,
        );
        await wrapper.renderMarkdownWrapper(
            this._currentCard.front.trimStart(),
            this.content,
            this._currentQuestion.questionText.textDirection,
        );
        // Set scroll position back to top
        this.content.scrollTop = 0;

        // Setup response buttons
        this._resetResponseButtons();
    }

    private _keydownHandler = (e: KeyboardEvent) => {
        // Prevents any input, if the edit modal is open or if the view is not in focus
        if (
            document.activeElement.nodeName === "TEXTAREA" ||
            this.mode === FlashcardMode.Closed ||
            !this.plugin.getSRInFocusState()
        ) {
            return;
        }

        const consumeKeyEvent = () => {
            e.preventDefault();
            e.stopPropagation();
        };

        switch (e.code) {
            case "KeyS":
                this._skipCurrentCard();
                consumeKeyEvent();
                break;
            case "Space":
                if (this.mode === FlashcardMode.Front) {
                    this._showAnswer();
                    consumeKeyEvent();
                } else if (this.mode === FlashcardMode.Back) {
                    this._processReview(ReviewResponse.Good);
                    consumeKeyEvent();
                }
                break;
            case "Enter":
            case "NumpadEnter":
                if (this.mode !== FlashcardMode.Front) {
                    break;
                }
                this._showAnswer();
                consumeKeyEvent();
                break;
            case "Numpad1":
            case "Digit1":
                if (this.mode !== FlashcardMode.Back) {
                    break;
                }
                this._processReview(ReviewResponse.Hard);
                consumeKeyEvent();
                break;
            case "Numpad2":
            case "Digit2":
                if (this.mode !== FlashcardMode.Back) {
                    break;
                }
                this._processReview(ReviewResponse.Good);
                consumeKeyEvent();
                break;
            case "Numpad3":
            case "Digit3":
                if (this.mode !== FlashcardMode.Back) {
                    break;
                }
                this._processReview(ReviewResponse.Easy);
                consumeKeyEvent();
                break;
            case "Numpad0":
            case "Digit0":
                if (this.mode !== FlashcardMode.Back) {
                    break;
                }
                this._processReview(ReviewResponse.Reset);
                consumeKeyEvent();
                break;
            default:
                break;
        }
    };

    private _displayCurrentCardInfoNotice() {
        const schedule = this._currentCard.scheduleInfo;

        const currentEaseStr = t("CURRENT_EASE_HELP_TEXT") + (schedule?.latestEase ?? t("NEW"));
        const currentIntervalStr =
            t("CURRENT_INTERVAL_HELP_TEXT") + textInterval(schedule?.interval, false);
        const generatedFromStr = t("CARD_GENERATED_FROM", {
            notePath: this._currentQuestion.note.filePath,
        });

        new Notice(currentEaseStr + "\n" + currentIntervalStr + "\n" + generatedFromStr);
    }

    private get _currentCard(): Card {
        return this.reviewSequencer.currentCard;
    }

    private get _currentQuestion(): Question {
        return this.reviewSequencer.currentQuestion;
    }

    private get _currentNote(): Note {
        return this.reviewSequencer.currentNote;
    }

    private _showAnswer(): void {
        const timeNow = now();
        if (
            this.lastPressed &&
            timeNow - this.lastPressed < this.plugin.data.settings.reviewButtonDelay
        ) {
            return;
        }
        this.lastPressed = timeNow;

        this.mode = FlashcardMode.Back;

        this.resetButton.disabled = false;

        // Show answer text
        if (this._currentQuestion.questionType !== CardType.Cloze) {
            const hr: HTMLElement = document.createElement("hr");
            this.content.appendChild(hr);
        } else {
            this.content.empty();
        }

        const wrapper: RenderMarkdownWrapper = new RenderMarkdownWrapper(
            this.app,
            this.plugin,
            this._currentNote.filePath,
        );
        wrapper.renderMarkdownWrapper(
            this._currentCard.back,
            this.content,
            this._currentQuestion.questionText.textDirection,
        );

        // Show response buttons
        this.answerButton.addClass("sr-is-hidden");
        this.hardButton.removeClass("sr-is-hidden");
        this.easyButton.removeClass("sr-is-hidden");

        if (this.reviewMode === FlashcardReviewMode.Cram) {
            this.response.addClass("is-cram");
            this.hardButton.setText(`${this.settings.flashcardHardText}`);
            this.easyButton.setText(`${this.settings.flashcardEasyText}`);
        } else {
            this.goodButton.removeClass("sr-is-hidden");
            this._setupEaseButton(
                this.hardButton,
                this.settings.flashcardHardText,
                ReviewResponse.Hard,
            );
            this._setupEaseButton(
                this.goodButton,
                this.settings.flashcardGoodText,
                ReviewResponse.Good,
            );
            this._setupEaseButton(
                this.easyButton,
                this.settings.flashcardEasyText,
                ReviewResponse.Easy,
            );
        }
    }

    private async _processReview(response: ReviewResponse): Promise<void> {
        const timeNow = now();
        if (
            this.lastPressed &&
            timeNow - this.lastPressed < this.plugin.data.settings.reviewButtonDelay
        ) {
            return;
        }
        this.lastPressed = timeNow;

        await this.reviewSequencer.processReview(response);
        await this._handleSkipCard();
    }

    private async _skipCurrentCard(): Promise<void> {
        this.reviewSequencer.skipCurrentCard();
        await this._handleSkipCard();
    }

    private async _handleSkipCard(): Promise<void> {
        if (this._currentCard != null) await this.refresh();
        else this.backToDeck();
    }

    private _formatQuestionContextText(questionContext: string[]): string {
        const separator: string = " > ";
        let result = this._currentNote.file.basename;
        questionContext.forEach((context) => {
            // Check for links trim [[ ]]
            if (context.startsWith("[[") && context.endsWith("]]")) {
                context = context.replace("[[", "").replace("]]", "");
                // Use replacement text if any
                if (context.contains("|")) {
                    context = context.split("|")[1];
                }
            }
            result += separator + context;
        });
        return result;
    }

    // #region -> Header

    private _setChosenDeckLabel(deck: Deck) {
        let text = deck.deckName;

        const deckStats = this.reviewSequencer.getDeckStats(deck.getTopicPath());
        const cardsInQueue = deckStats.dueCount + deckStats.newCount;
        text += ` -  ${cardsInQueue} x `;

        const subDecksWithCardsInQueue = deck.subdecks.filter((subDeck) => {
            const deckStats = this.reviewSequencer.getDeckStats(subDeck.getTopicPath());
            return deckStats.dueCount + deckStats.newCount > 0;
        });

        this.chosenDeckText.setText(text);
        this.chosenDeckSubDeckNumText.setText(subDecksWithCardsInQueue.length + " x ");
    }

    private _setCurrentDeckLabel(chosenDeck: Deck, currentDeck: Deck) {
        if (chosenDeck.subdecks.length === 0) {
            if (!this.deckDivider.hasClass("sr-is-hidden")) {
                this.deckDivider.addClass("sr-is-hidden");
            }
            if (!this.currentDeckLabel.hasClass("sr-is-hidden")) {
                this.currentDeckLabel.addClass("sr-is-hidden");
            }
            return;
        }

        if (this.deckDivider.hasClass("sr-is-hidden")) {
            this.deckDivider.removeClass("sr-is-hidden");
        }

        if (this.currentDeckLabel.hasClass("sr-is-hidden")) {
            this.currentDeckLabel.removeClass("sr-is-hidden");
        }

        let text = `${currentDeck.deckName} - `;

        const isRandomMode = this.settings.flashcardCardOrder === "EveryCardRandomDeckAndCard";
        if (!isRandomMode) {
            text = `${currentDeck.deckName} - ${currentDeck.getCardCount(CardListType.All, false)} x `;
        }

        this.currentDeckText.setText(text);
    }

    // #region -> Controls

    private _createCardControls() {
        this._createEditButton();
        this._createResetButton();
        this._createCardInfoButton();
        this._createSkipButton();
    }

    private _createEditButton() {
        this.editButton = this.controls.createEl("button");
        this.editButton.addClasses(["sr-button", "sr-edit-button"]);
        setIcon(this.editButton, "edit");
        this.editButton.setAttribute("aria-label", t("EDIT_CARD"));
        this.editButton.addEventListener("click", async () => {
            this.editClickHandler();
        });
    }

    private _createResetButton() {
        this.resetButton = this.controls.createEl("button");
        this.resetButton.addClasses(["sr-button", "sr-reset-button"]);
        setIcon(this.resetButton, "refresh-cw");
        this.resetButton.setAttribute("aria-label", t("RESET_CARD_PROGRESS"));
        this.resetButton.addEventListener("click", () => {
            this._processReview(ReviewResponse.Reset);
        });
    }

    private _createCardInfoButton() {
        this.infoButton = this.controls.createEl("button");
        this.infoButton.addClasses(["sr-button", "sr-info-button"]);
        setIcon(this.infoButton, "info");
        this.infoButton.setAttribute("aria-label", "View Card Info");
        this.infoButton.addEventListener("click", async () => {
            this._displayCurrentCardInfoNotice();
        });
    }

    private _createSkipButton() {
        this.skipButton = this.controls.createEl("button");
        this.skipButton.addClasses(["sr-button", "sr-skip-button"]);
        setIcon(this.skipButton, "chevrons-right");
        this.skipButton.setAttribute("aria-label", t("SKIP"));
        this.skipButton.addEventListener("click", () => {
            this._skipCurrentCard();
        });
    }

    // #region -> Response

    private _createResponseButtons() {
        this._createShowAnswerButton();
        this._createHardButton();
        this._createGoodButton();
        this._createEasyButton();
    }

    private _resetResponseButtons() {
        // Sets all buttons in to their default state
        this.answerButton.removeClass("sr-is-hidden");
        this.hardButton.addClass("sr-is-hidden");
        this.goodButton.addClass("sr-is-hidden");
        this.easyButton.addClass("sr-is-hidden");
    }

    private _createShowAnswerButton() {
        this.answerButton = this.response.createEl("button");
        this.answerButton.addClasses(["sr-response-button", "sr-show-answer-button", "sr-bg-blue"]);
        this.answerButton.setText(t("SHOW_ANSWER"));
        this.answerButton.addEventListener("click", () => {
            this._showAnswer();
        });
    }

    private _createHardButton() {
        this.hardButton = this.response.createEl("button");
        this.hardButton.addClasses([
            "sr-response-button",
            "sr-hard-button",
            "sr-bg-red",
            "sr-is-hidden",
        ]);
        this.hardButton.setText(this.settings.flashcardHardText);
        this.hardButton.addEventListener("click", () => {
            this._processReview(ReviewResponse.Hard);
        });
    }

    private _createGoodButton() {
        this.goodButton = this.response.createEl("button");
        this.goodButton.addClasses([
            "sr-response-button",
            "sr-good-button",
            "sr-bg-blue",
            "sr-is-hidden",
        ]);
        this.goodButton.setText(this.settings.flashcardGoodText);
        this.goodButton.addEventListener("click", () => {
            this._processReview(ReviewResponse.Good);
        });
    }

    private _createEasyButton() {
        this.easyButton = this.response.createEl("button");
        this.easyButton.addClasses([
            "sr-response-button",
            "sr-hard-button",
            "sr-bg-green",
            "sr-is-hidden",
        ]);
        this.easyButton.setText(this.settings.flashcardEasyText);
        this.easyButton.addEventListener("click", () => {
            this._processReview(ReviewResponse.Easy);
        });
    }

    private _setupEaseButton(
        button: HTMLElement,
        buttonName: string,
        reviewResponse: ReviewResponse,
    ) {
        const schedule: RepItemScheduleInfo = this.reviewSequencer.determineCardSchedule(
            reviewResponse,
            this._currentCard,
        );
        const interval: number = schedule.interval;

        if (this.settings.showIntervalInReviewButtons) {
            if (Platform.isMobile) {
                button.setText(textInterval(interval, true));
            } else {
                button.setText(`${buttonName} - ${textInterval(interval, false)}`);
            }
        } else {
            button.setText(buttonName);
        }
    }
}
