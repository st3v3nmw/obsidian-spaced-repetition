import { App, Notice, Platform, setIcon } from "obsidian";
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import type SRPlugin from "src/main";
import { SRSettings } from "src/settings";
import { textInterval, ReviewResponse } from "src/scheduling";
import { t } from "src/lang/helpers";
import { Card } from "../Card";
import { CardListType, Deck } from "../Deck";
import { CardType, Question } from "../Question";
import {
    FlashcardReviewMode,
    IFlashcardReviewSequencer as IFlashcardReviewSequencer,
} from "src/FlashcardReviewSequencer";
import { Note } from "src/Note";
import { RenderMarkdownWrapper } from "src/util/RenderMarkdownWrapper";
import { CardScheduleInfo } from "src/CardSchedule";
import { FlashcardModalMode } from "./flashcard-modal";

export class FlashcardReviewView {
    public app: App;
    public plugin: SRPlugin;
    public answerBtn: HTMLElement;
    public titleEl: HTMLElement;
    public contentEl: HTMLElement;
    public flashcardView: HTMLElement;
    private flashCardMenu: HTMLDivElement;
    public hardBtn: HTMLElement;
    public goodBtn: HTMLElement;
    public easyBtn: HTMLElement;
    public nextBtn: HTMLElement;
    public responseDiv: HTMLElement;
    public resetButton: HTMLButtonElement;
    public editButton: HTMLElement;
    public contextView: HTMLElement;
    public mode: FlashcardModalMode;
    private reviewSequencer: IFlashcardReviewSequencer;
    private settings: SRSettings;
    private reviewMode: FlashcardReviewMode;
    private backClickHandler: () => void;
    private editClickHandler: () => void;

    private get currentCard(): Card {
        return this.reviewSequencer.currentCard;
    }

    private get currentQuestion(): Question {
        return this.reviewSequencer.currentQuestion;
    }

    private get currentNote(): Note {
        return this.reviewSequencer.currentNote;
    }

    constructor(
        app: App,
        plugin: SRPlugin,
        settings: SRSettings,
        reviewSequencer: IFlashcardReviewSequencer,
        reviewMode: FlashcardReviewMode,
        titleEl: HTMLElement,
        contentEl: HTMLElement,
        backClickHandler: () => void,
        editClickHandler: () => void
    ) {
        this.app = app;
        this.plugin = plugin;
        this.settings = settings;
        this.reviewSequencer = reviewSequencer;
        this.reviewMode = reviewMode;
        this.backClickHandler = backClickHandler;
        this.editClickHandler = editClickHandler;

        this.titleEl = titleEl;
        this.contentEl = contentEl;

        this.titleEl.addClass("sr-centered");

        this.contentEl.style.position = "relative";
        this.contentEl.style.height = "92%";
        this.contentEl.addClass("sr-modal-content");
        if (Platform.isMobile) {
            this.contentEl.style.display = "block";
        }

        // TODO: refactor into event handler?
        document.body.onkeydown = (e) => {
            // TODO: Please fix this. It's ugly.
            // Checks if the input textbox is in focus before processing keyboard shortcuts.
            if (
                document.activeElement.nodeName !== "TEXTAREA" &&
                this.mode !== FlashcardModalMode.DecksList
            ) {
                const consume = () => {
                    e.preventDefault();
                    e.stopPropagation();
                };
                if (this.mode !== FlashcardModalMode.Closed && e.code === "KeyS") {
                    this.skipCurrentCard();
                    consume();
                } else if (
                    this.mode === FlashcardModalMode.Front &&
                    (e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter")
                ) {
                    this.showAnswer();
                    consume();
                } else if (this.mode === FlashcardModalMode.Back) {
                    if (e.code === "Numpad1" || e.code === "Digit1") {
                        this.processReview(ReviewResponse.Hard);
                        consume();
                    } else if (e.code === "Numpad2" || e.code === "Digit2" || e.code === "Space") {
                        this.processReview(ReviewResponse.Good);
                        consume();
                    } else if (e.code === "Numpad3" || e.code === "Digit3") {
                        this.processReview(ReviewResponse.Easy);
                        consume();
                    } else if (e.code === "Numpad0" || e.code === "Digit0") {
                        this.processReview(ReviewResponse.Reset);
                        consume();
                    }
                }
            }
        };
    }

    async showCurrentCard(): Promise<void> {
        this.setupView();

        const deck: Deck = this.reviewSequencer.currentDeck;

        this.responseDiv.style.display = "none";
        this.resetButton.disabled = true;
        this.titleEl.setText(`${deck.deckName}: ${deck.getCardCount(CardListType.All, true)}`);

        this.answerBtn.style.display = "initial";
        this.flashcardView.empty();
        this.mode = FlashcardModalMode.Front;

        const wrapper: RenderMarkdownWrapper = new RenderMarkdownWrapper(
            this.app,
            this.plugin,
            this.currentNote.filePath,
        );
        await wrapper.renderMarkdownWrapper(this.currentCard.front, this.flashcardView);

        if (this.reviewMode == FlashcardReviewMode.Cram) {
            // Same for mobile/desktop
            this.hardBtn.setText(`${this.settings.flashcardHardText}`);
            this.easyBtn.setText(`${this.settings.flashcardEasyText}`);
        } else {
            this.setupEaseButton(
                this.hardBtn,
                this.settings.flashcardHardText,
                ReviewResponse.Hard,
            );
            this.setupEaseButton(
                this.goodBtn,
                this.settings.flashcardGoodText,
                ReviewResponse.Good,
            );
            this.setupEaseButton(
                this.easyBtn,
                this.settings.flashcardEasyText,
                ReviewResponse.Easy,
            );
        }

        if (this.settings.showContextInCards)
            this.contextView.setText(
                this.formatQuestionContextText(this.currentQuestion.questionContext),
            );
    }

    createShowAnswerButton() {
        this.answerBtn = this.contentEl.createDiv();
        this.answerBtn.setAttribute("id", "sr-show-answer");
        this.answerBtn.setText(t("SHOW_ANSWER"));
        this.answerBtn.addEventListener("click", () => {
            this.showAnswer();
        });
    }

    createResponseButtons() {
        this.responseDiv = this.contentEl.createDiv("sr-flashcard-response");

        this.hardBtn = document.createElement("button");
        this.hardBtn.setAttribute("id", "sr-hard-btn");
        this.hardBtn.setText(this.settings.flashcardHardText);
        this.hardBtn.addEventListener("click", () => {
            this.processReview(ReviewResponse.Hard);
        });
        this.responseDiv.appendChild(this.hardBtn);

        this.goodBtn = document.createElement("button");
        this.goodBtn.setAttribute("id", "sr-good-btn");
        this.goodBtn.setText(this.settings.flashcardGoodText);
        this.goodBtn.addEventListener("click", () => {
            this.processReview(ReviewResponse.Good);
        });
        this.responseDiv.appendChild(this.goodBtn);

        this.easyBtn = document.createElement("button");
        this.easyBtn.setAttribute("id", "sr-easy-btn");
        this.easyBtn.setText(this.settings.flashcardEasyText);
        this.easyBtn.addEventListener("click", () => {
            this.processReview(ReviewResponse.Easy);
        });
        this.responseDiv.appendChild(this.easyBtn);
        this.responseDiv.style.display = "none";
    }

    createSkipButton() {
        const skipButton = this.flashCardMenu.createEl("button");
        skipButton.addClass("sr-flashcard-menu-item");
        setIcon(skipButton, "chevrons-right");
        skipButton.setAttribute("aria-label", t("SKIP"));
        skipButton.addEventListener("click", () => {
            this.skipCurrentCard();
        });
    }

    createCardInfoButton() {
        const cardInfo = this.flashCardMenu.createEl("button");
        cardInfo.addClass("sr-flashcard-menu-item");
        setIcon(cardInfo, "info");
        cardInfo.setAttribute("aria-label", "View Card Info");
        cardInfo.addEventListener("click", async () => {
            this.displayCurrentCardInfoNotice();
        });
    }

    displayCurrentCardInfoNotice() {
        const schedule = this.currentCard.scheduleInfo;
        const currentEaseStr = t("CURRENT_EASE_HELP_TEXT") + (schedule?.ease ?? t("NEW"));
        const currentIntervalStr =
            t("CURRENT_INTERVAL_HELP_TEXT") + textInterval(schedule?.interval, false);
        const generatedFromStr = t("CARD_GENERATED_FROM", {
            notePath: this.currentQuestion.note.filePath,
        });
        new Notice(currentEaseStr + "\n" + currentIntervalStr + "\n" + generatedFromStr);
    }

    createBackButton() {
        const backButton = this.flashCardMenu.createEl("button");
        backButton.addClass("sr-flashcard-menu-item");
        setIcon(backButton, "arrow-left");
        backButton.setAttribute("aria-label", t("BACK"));
        backButton.addEventListener("click", () => {
            /* this.plugin.data.historyDeck = ""; */
            this.backClickHandler();
        });
    }

    createResetButton() {
        this.resetButton = this.flashCardMenu.createEl("button");
        this.resetButton.addClass("sr-flashcard-menu-item");
        setIcon(this.resetButton, "refresh-cw");
        this.resetButton.setAttribute("aria-label", t("RESET_CARD_PROGRESS"));
        this.resetButton.addEventListener("click", () => {
            this.processReview(ReviewResponse.Reset);
        });
    }

    createEditButton() {
        this.editButton = this.flashCardMenu.createEl("button");
        this.editButton.addClass("sr-flashcard-menu-item");
        setIcon(this.editButton, "edit");
        this.editButton.setAttribute("aria-label", t("EDIT_CARD"));
        this.editButton.addEventListener("click", async () => {
            this.editClickHandler();
        });
    }

    private setupView(): void {
        this.contentEl.empty();

        this.flashCardMenu = this.contentEl.createDiv("sr-flashcard-menu");

        this.createBackButton();
        this.createEditButton();
        this.createResetButton();
        this.createCardInfoButton();
        this.createSkipButton();

        if (this.settings.showContextInCards) {
            this.contextView = this.contentEl.createDiv();
            this.contextView.setAttribute("id", "sr-context");
        }

        this.flashcardView = this.contentEl.createDiv("div");
        this.flashcardView.setAttribute("id", "sr-flashcard-view");

        this.createResponseButtons();

        this.createShowAnswerButton();

        if (this.reviewMode == FlashcardReviewMode.Cram) {
            this.goodBtn.style.display = "none";

            this.responseDiv.addClass("sr-ignorestats-response");
            this.easyBtn.addClass("sr-ignorestats-btn");
            this.hardBtn.addClass("sr-ignorestats-btn");
        }
    }

    private showAnswer(): void {
        this.mode = FlashcardModalMode.Back;

        this.answerBtn.style.display = "none";
        this.responseDiv.style.display = "grid";

        if (this.currentCard.hasSchedule) {
            this.resetButton.disabled = false;
        }

        if (this.currentQuestion.questionType !== CardType.Cloze) {
            const hr: HTMLElement = document.createElement("hr");
            hr.setAttribute("id", "sr-hr-card-divide");
            this.flashcardView.appendChild(hr);
        } else {
            this.flashcardView.empty();
        }

        const wrapper: RenderMarkdownWrapper = new RenderMarkdownWrapper(
            this.app,
            this.plugin,
            this.currentNote.filePath,
        );
        wrapper.renderMarkdownWrapper(this.currentCard.back, this.flashcardView);
    }

    private async processReview(response: ReviewResponse): Promise<void> {
        await this.reviewSequencer.processReview(response);
        // console.log(`processReview: ${response}: ${this.currentCard?.front ?? 'None'}`)
        await this.handleNextCard();
    }

    private async skipCurrentCard(): Promise<void> {
        this.reviewSequencer.skipCurrentCard();
        // console.log(`skipCurrentCard: ${this.currentCard?.front ?? 'None'}`)
        await this.handleNextCard();
    }

    private async handleNextCard(): Promise<void> {
        if (this.currentCard != null) await this.showCurrentCard();
        else this.backClickHandler();
    }

    private formatQuestionContextText(questionContext: string[]): string {
        const result = `${this.currentNote.file.basename} > ${questionContext.join(" > ")}`;
        return result;
    }

    private setupEaseButton(
        button: HTMLElement,
        buttonName: string,
        reviewResponse: ReviewResponse,
    ) {
        const schedule: CardScheduleInfo = this.reviewSequencer.determineCardSchedule(
            reviewResponse,
            this.currentCard,
        );
        const interval: number = schedule.interval;

        if (Platform.isMobile) {
            button.setText(textInterval(interval, true));
        } else {
            button.setText(`${buttonName} - ${textInterval(interval, false)}`);
        }
    }
}
