import "src/ui/obsidian-ui-components/content-container/card-container/card-container.css";
import { App, Platform } from "obsidian";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import {
    FlashcardReviewMode,
} from "src/card/flashcard-review-sequencer";
import { CardType } from "src/card/questions/question";
import { escapeHtml } from "src/escape-html";
import { t } from "src/lang/helpers";
import type SRPlugin from "src/main";
import { SRSettings } from "src/settings";
import ContextSectionComponent from "src/ui/obsidian-ui-components/content-container/card-container/context-section";
import ResponseSectionComponent from "src/ui/obsidian-ui-components/content-container/card-container/response-section/response-section";
import CardToolbarComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar";
import {
    CardState,
    SessionData,
} from "src/ui/obsidian-ui-components/content-container/content-manager";
import { ConfirmationModal } from "src/ui/obsidian-ui-components/modals/confirmation-modal";
import EmulatedPlatform from "src/utils/platform-detector";
import { RenderMarkdownWrapper } from "src/utils/renderers";

export class CardContainer {
    private app: App;
    private plugin: SRPlugin;
    private cardState: CardState;

    private view: HTMLDivElement;

    private toolbar: CardToolbarComponent;
    private contextSection: ContextSectionComponent;

    private scrollWrapper: HTMLDivElement;
    private content: HTMLDivElement;

    private response: ResponseSectionComponent;

    private clozeInputs: NodeListOf<HTMLInputElement> | null = null;
    private clozeAnswers: NodeListOf<Element> | null = null;

    private processReviewHandler: (response: ReviewResponse) => Promise<void>;
    private skipCardHandler: () => void;
    private showAnswerHandler: () => void;
    private backToDeckHandler: () => void;

    constructor(
        app: App,
        plugin: SRPlugin,
        settings: SRSettings,
        parentEl: HTMLElement,
        backToDeckHandler: () => void,
        editCardHandler: () => void,
        processReviewHandler: (response: ReviewResponse) => Promise<void>,
        skipCardHandler: () => void,
        showAnswerHandler: () => void,
        jumpToCurrentCardHandler: () => Promise<void>,
        displayCurrentCardInfoNoticeHandler: () => void,
        closeModal?: () => void,
    ) {
        // Init properties
        this.app = app;
        this.plugin = plugin;
        this.cardState = CardState.Closed;
        this.processReviewHandler = processReviewHandler;
        this.skipCardHandler = skipCardHandler;
        this.showAnswerHandler = showAnswerHandler;
        this.backToDeckHandler = backToDeckHandler;

        // Build ui
        this.view = parentEl.createDiv();
        this.view.addClasses(["sr-container", "sr-card-container", "sr-is-hidden"]);

        this.toolbar = new CardToolbarComponent(
            this.view,
            !settings.openViewInNewTab,
            backToDeckHandler,
            editCardHandler,
            jumpToCurrentCardHandler,
            displayCurrentCardInfoNoticeHandler,
            this.skipCardHandler,
            () => {
                new ConfirmationModal(
                    app,
                    t("DELETE_SCHEDULING_DATA_OF_CURRENT_CARD"),
                    t("CONFIRM_SCHEDULING_DATA_DELETION_OF_CURRENT_CARD"),
                    t("SCHEDULING_DATA_DELETION_IN_PROGRESS_OF_CURRENT_CARD"),
                    async () => {
                        await this.processReviewHandler(ReviewResponse.Reset);
                    },
                ).open();
            },
            closeModal,
        );

        this.contextSection = new ContextSectionComponent(this.view);

        this.scrollWrapper = this.view.createDiv();
        this.scrollWrapper.addClass("sr-scroll-wrapper");

        this.content = this.scrollWrapper.createDiv();
        this.content.addClass("sr-content");

        this.response = new ResponseSectionComponent(
            this.view,
            settings,
            this.showAnswerHandler,
            this.processReviewHandler,
        );
    }

    // #region -> public methods

    /**
     * Shows the FlashcardView if it is hidden
     */
    async open(sessionData: SessionData, settings: SRSettings) {
        // Prevents rest of code, from running if this was executed multiple times after one another
        if (!this.view.hasClass("sr-is-hidden")) {
            return;
        }

        await this.drawCardFront(sessionData, settings);

        this.view.removeClass("sr-is-hidden");
        document.addEventListener("keydown", this._keydownHandler);
    }

    /**
     * Hides the FlashcardView if it is visible
     */
    close() {
        // Prevents the rest of code, from running if this was executed multiple times after one another
        if (this.view.hasClass("sr-is-hidden")) {
            return;
        }
        this.cardState = CardState.Closed;
        document.removeEventListener("keydown", this._keydownHandler);
        this.view.addClass("sr-is-hidden");
    }

    /**
     * Blocks the key input to the FlashcardView
     *
     * @param block
     */
    blockKeyInput(block: boolean) {
        if (block) {
            document.addEventListener("keydown", this._keydownHandler);
        } else {
            document.removeEventListener("keydown", this._keydownHandler);
        }
    }

    public async drawCardFront(sessionData: SessionData, settings: SRSettings) {
        this.toolbar.setResetButtonDisabled(true);
        this.contextSection.updateCardContext(
            settings.showContextInCards,
            sessionData.currentQuestion,
            sessionData.currentNote,
        );

        // Update current deck info
        this.cardState = sessionData.cardData.currentCardState;

        this._updateInfoBar(sessionData, settings.flashcardCardOrder);

        // Update card content
        this.content.empty();
        const wrapper: RenderMarkdownWrapper = new RenderMarkdownWrapper(
            this.app,
            this.plugin,
            sessionData.currentNote.filePath,
        );

        await wrapper.renderMarkdownWrapper(
            sessionData.cardData.currentCard.front.trimStart(),
            this.content,
            sessionData.currentQuestion.questionText.textDirection,
        );
        // Set scroll position back to top
        this.content.scrollTop = 0;

        // Update response buttons
        this.response.resetResponseButtons();

        // Setup cloze input listeners
        this._setupClozeInputListeners();
        // auto-focus the first cloze input if this card is a cloze card
        if (sessionData.currentQuestion.questionType === CardType.Cloze) {
            const firstInput = document.querySelector(".cloze-input") as HTMLInputElement;
            if (firstInput) {
                firstInput.focus();
            }
        }
    }

    // #region -> Deck Info

    private _updateInfoBar(sessionData: SessionData, flashcardCardOrder: string) {
        if (sessionData.deckData.chosenDeck === null || sessionData.deckData.currentDeck === null)
            return;

        this.toolbar.updateInfo(
            sessionData.deckData.chosenDeck,
            sessionData.deckData.currentDeck,
            sessionData.deckData.chosenDeckStats,
            sessionData.deckData.currentDeckStats,
            sessionData.totalCardsInSession,
            sessionData.totalDecksInSession,
            sessionData.deckData.currentDeckTotalCardsInQueue,
            flashcardCardOrder,
        );
    }

    private _setupClozeInputListeners(): void {
        this.clozeInputs = document.querySelectorAll(".cloze-input");

        this.clozeInputs.forEach((input) => {
            input.addEventListener("keydown", (e: KeyboardEvent) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    (input as HTMLElement).blur();
                    this.showAnswerHandler();
                }
            });
        });
    }
    private _evaluateClozeAnswers(): void {
        this.clozeAnswers = document.querySelectorAll(".cloze-answer");

        if (this.clozeInputs !== null && this.clozeAnswers.length === this.clozeInputs.length) {
            for (let i = 0; i < this.clozeAnswers.length; i++) {
                const clozeInput = this.clozeInputs[i] as HTMLInputElement;
                const clozeAnswer = this.clozeAnswers[i] as HTMLElement;

                const inputText = clozeInput.value.trim();
                const answerText = clozeAnswer.innerText.trim();

                const answerElement =
                    inputText === answerText
                        ? `<span style="color: green">${escapeHtml(inputText)}</span>`
                        : `[<span style="color: red; text-decoration: line-through;">${escapeHtml(inputText)}</span><span style="color: green">${answerText}</span>]`;
                clozeAnswer.innerHTML = answerElement;
            }
        }
    }

    public drawBack(
        sessionData: SessionData,
        reviewMode: FlashcardReviewMode,
        settings: SRSettings,
        determineButtonInterval: (response: ReviewResponse) => number,
    ) {
        this.cardState = sessionData.cardData.currentCardState;

        this.toolbar.setResetButtonDisabled(false);

        // Show answer text
        if (sessionData.currentQuestion.questionType !== CardType.Cloze) {
            const hr: HTMLElement = document.createElement("hr");
            this.content.appendChild(hr);
        } else {
            this.content.empty();
        }

        const wrapper: RenderMarkdownWrapper = new RenderMarkdownWrapper(
            this.app,
            this.plugin,
            sessionData.currentNote.filePath,
        );
        wrapper.renderMarkdownWrapper(
            sessionData.cardData.currentCard.back,
            this.content,
            sessionData.currentQuestion.questionText.textDirection,
        );

        // Evaluate cloze answers
        this._evaluateClozeAnswers();

        // Show response buttons
        this.response.showRatingButtons(
            reviewMode,
            settings.flashcardAgainText,
            settings.flashcardHardText,
            settings.flashcardGoodText,
            settings.flashcardEasyText,
            settings.showIntervalInReviewButtons,
            determineButtonInterval,
        );
        // NEW: restore keyboard focus after cloze confirmation
        this.plugin.uiManager.setSRViewInFocus(true);
        this.response.againButton.buttonEl.focus();
    }

    private _keydownHandler = (e: KeyboardEvent) => {
        // Prevents any input, if the edit modal is open or if the view is not in focus
        if (
            (document.activeElement !== null &&
                (document.activeElement.nodeName === "TEXTAREA" ||
                    document.activeElement.nodeName === "INPUT")) ||
            this.cardState === CardState.Closed ||
            !this.plugin.uiManager.getSRInFocusState() ||
            Platform.isMobile || // No keyboard events on mobile
            EmulatedPlatform().isMobile
        ) {
            return;
        }

        const consumeKeyEvent = () => {
            e.preventDefault();
            e.stopPropagation();
        };

        switch (e.code) {
            case "KeyS":
                this.skipCardHandler();
                consumeKeyEvent();
                break;
            case "Enter":
            case "NumpadEnter":
            case "Space":
                if (this.cardState === CardState.Front) {
                    this.showAnswerHandler();
                    consumeKeyEvent();
                } else if (this.cardState === CardState.Back) {
                    this.processReviewHandler(ReviewResponse.Good);
                    consumeKeyEvent();
                }
                break;
            case "Numpad1":
            case "Digit1":
                if (this.cardState !== CardState.Back) {
                    break;
                }
                this.processReviewHandler(ReviewResponse.Hard);
                consumeKeyEvent();
                break;
            case "Numpad2":
            case "Digit2":
                if (this.cardState !== CardState.Back) {
                    break;
                }
                this.processReviewHandler(ReviewResponse.Good);
                consumeKeyEvent();
                break;
            case "Numpad3":
            case "Digit3":
                if (this.cardState !== CardState.Back) {
                    break;
                }
                this.processReviewHandler(ReviewResponse.Easy);
                consumeKeyEvent();
                break;
            case "Numpad0":
            case "Digit0":
                if (this.cardState !== CardState.Back) {
                    break;
                }
                this.processReviewHandler(ReviewResponse.Reset);
                consumeKeyEvent();
                break;
            default:
                break;
        }
    };
}
