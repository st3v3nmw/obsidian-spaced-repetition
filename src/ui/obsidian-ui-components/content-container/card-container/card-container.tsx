import "src/ui/obsidian-ui-components/content-container/card-container/card-container.css";
import moment from "moment";
import { App, Platform } from "obsidian";

import { CardType } from "src/data/data-structures/card/questions/question";
import { SRSettings } from "src/data/settings";
import { t } from "src/lang/helpers";
import type SRPlugin from "src/main";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { FlashcardReviewMode } from "src/scheduling/flashcard-review-sequencer";
import Card3DView, {
    DEFAULT_TABLE_SURFACE,
    isTableSurface,
    TableSurface,
} from "src/ui/obsidian-ui-components/content-container/card-container/card-3d-view/card-3d-view";
import ContextSectionComponent from "src/ui/obsidian-ui-components/content-container/card-container/context-section/context-section";
import ResponseSectionComponent from "src/ui/obsidian-ui-components/content-container/card-container/response-section/response-section";
import CardToolbarComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar";
import {
    CardState,
    SessionData,
} from "src/ui/obsidian-ui-components/content-container/content-manager";
import { ConfirmationModal } from "src/ui/obsidian-ui-components/modals/confirmation-modal";
import { escapeHtml } from "src/utils/escape-html";
import EmulatedPlatform from "src/utils/platform-detector";
import { RenderMarkdownWrapper } from "src/utils/renderers";

// TODO: Refactor cloze rendering into the renderers file
export class CardContainer {
    private app: App;
    private plugin: SRPlugin;
    private settings: SRSettings;
    private cardState: CardState;
    private sessionData: SessionData | null = null;

    private view: HTMLDivElement;
    private card3DView: Card3DView | null = null;

    private toolbar: CardToolbarComponent;
    private contextSection: ContextSectionComponent | null = null;

    private scrollWrapper: HTMLDivElement;
    private content: HTMLDivElement;
    private pendingClock: HTMLDivElement | null = null;
    private pendingResumeTimeout: number | null = null;

    private response: ResponseSectionComponent;

    private clozeInputs: NodeListOf<HTMLInputElement> | null = null;
    private clozeAnswers: NodeListOf<Element> | null = null;

    private processReviewHandler: (response: ReviewResponse) => Promise<void>;
    private skipCardHandler: () => void;
    private showAnswerHandler: () => void;
    private jumpToCardHandler: () => Promise<void>;

    constructor(
        app: App,
        plugin: SRPlugin,
        settings: SRSettings,
        parentEl: HTMLElement,
        deleteCurrentCard: () => void,
        backToDeckHandler: () => Promise<void>,
        editCardHandler: () => void,
        processReviewHandler: (response: ReviewResponse) => Promise<void>,
        skipCardHandler: () => void,
        showAnswerHandler: () => void,
        jumpToCurrentCardHandler: () => Promise<void>,
        displayCurrentCardInfoNoticeHandler: () => void,
        closeModal?: () => void,
        toggleMaximized?: () => boolean,
    ) {
        // Init properties
        this.app = app;
        this.plugin = plugin;
        this.settings = settings;
        this.cardState = CardState.Closed;
        this.processReviewHandler = processReviewHandler;
        this.skipCardHandler = skipCardHandler;
        this.showAnswerHandler = showAnswerHandler;
        this.jumpToCardHandler = jumpToCurrentCardHandler;

        // Build ui
        this.view = parentEl.createDiv();
        this.view.addClasses(["sr-container", "sr-card-container", "sr-is-hidden"]);

        this.setCustomHotKeyState(settings.useCustomHotkeys);

        this.toolbar = new CardToolbarComponent(
            this.view,
            settings.showDeleteButtonInCardView,
            deleteCurrentCard,
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
            () => void this.toggle3DView(),
            settings.flashcard3DView,
            {
                isAvailable: () => this.settings.flashcard3DView,
                current: () => this.settings.flashcard3DTableSurface,
                choose: (surface: TableSurface) => void this.setTableSurface(surface),
            },
            closeModal,
            toggleMaximized,
        );

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
    async openSession(sessionData: SessionData, settings: SRSettings) {
        // Prevents rest of code, from running if this was executed multiple times after one another
        if (!this.view.hasClass("sr-is-hidden")) {
            return;
        }

        await this.drawCardFront(sessionData, settings);

        this.view.removeClass("sr-is-hidden");
        activeDocument.addEventListener("keydown", this._keydownHandler);
    }

    /**
     * Hides the FlashcardView if it is visible
     */
    closeSession() {
        // Prevents the rest of code, from running if this was executed multiple times after one another

        if (this.view.hasClass("sr-is-hidden")) {
            return;
        }
        if (this.pendingResumeTimeout !== null) {
            window.clearTimeout(this.pendingResumeTimeout);
            this.pendingResumeTimeout = null;
        }
        this.cardState = CardState.Closed;
        activeDocument.removeEventListener("keydown", this._keydownHandler);
        this.view.addClass("sr-is-hidden");
    }

    /**
     * Blocks the key input to the FlashcardView
     *
     * @param block
     */
    blockKeyInput(block: boolean) {
        if (block) {
            activeDocument.addEventListener("keydown", this._keydownHandler);
        } else {
            activeDocument.removeEventListener("keydown", this._keydownHandler);
        }
    }

    public async drawCardFront(sessionData: SessionData, settings: SRSettings) {
        this.toolbar.setResetButtonDisabled(true);
        this.toolbar.set3DViewActive(settings.flashcard3DView);
        // Update current deck info
        this.sessionData = sessionData;
        this.cardState = sessionData.cardData.currentCardState;

        this._updateInfoBar(sessionData, settings.flashcardCardOrder);

        // Update card content
        await this.drawCardFrontContent(sessionData, settings);

        // Update response buttons
        this.response.resetResponseButtons();

        // Setup cloze input listeners
        this._setupClozeInputListeners();

        // auto-focus the first cloze input if this card is a cloze card
        if (sessionData.currentQuestion.questionType === CardType.Cloze) {
            const firstInput: HTMLInputElement | null =
                activeDocument.querySelector(".cloze-input");
            if (firstInput) {
                firstInput.focus();
            }
        }
    }

    private drawCardContext(
        sessionData: SessionData,
        settings: SRSettings,
        containerEl: HTMLDivElement = this.content,
    ) {
        if (settings.showContextInCards) {
            this.contextSection = new ContextSectionComponent(containerEl);
            this.contextSection.updateCardContext(
                settings.showContextInCards,
                sessionData.currentQuestion,
                sessionData.currentNote,
            );
        }
    }

    private async drawCardFrontContent(sessionData: SessionData, settings: SRSettings) {
        if (settings.flashcard3DView) {
            await this.draw3DCard(sessionData, settings);
        } else {
            await this.drawFlatFrontContent(sessionData, settings);
        }
    }

    private async drawFlatFrontContent(sessionData: SessionData, settings: SRSettings) {
        this.show3DView(false);

        // Update card content
        this.content.empty();

        // Create context section
        this.drawCardContext(sessionData, settings);

        // Build card content
        const wrapper: RenderMarkdownWrapper = new RenderMarkdownWrapper(
            this.app,
            this.plugin,
            sessionData.currentNote.filePath,
        );

        await wrapper.renderMarkdownWrapper(
            sessionData.cardData.currentCard.front.trimStart(),
            this.content,
            sessionData.currentQuestion.questionText.textDirection,
            // sessionData.cardData.currentCardState
        );
        // Set scroll position back to top
        this.content.scrollTop = 0;
    }

    // #region -> 3D card view

    private get3DView(settings: SRSettings): Card3DView {
        if (this.card3DView === null) {
            this.card3DView = new Card3DView(
                this.scrollWrapper,
                { front: t("CARD_3D_QUESTION_SIDE"), back: t("CARD_3D_ANSWER_SIDE") },
                () => {
                    // Turning the card over by hand counts as "show answer"
                    if (this.cardState === CardState.Front) this.showAnswerHandler();
                },
            );
        }
        const surface = settings.flashcard3DTableSurface;
        this.card3DView.setSurface(isTableSurface(surface) ? surface : DEFAULT_TABLE_SURFACE);
        return this.card3DView;
    }

    private show3DView(visible: boolean) {
        this.view.toggleClass("sr-3d-mode", visible);
        this.card3DView?.setVisible(visible);
    }

    /**
     * Renders the current card onto both faces of the 3D card.
     * @param options.animate - Slide the previous card off and this one on
     * @param options.showBack - Leave the card resting on its back, e.g. when switching views
     */
    private async draw3DCard(
        sessionData: SessionData,
        settings: SRSettings,
        options: { animate?: boolean; showBack?: boolean } = {},
    ) {
        const view = this.get3DView(settings);
        this.show3DView(true);
        view.beginNextCard(options.animate ?? true);

        await this.draw3DCardFace(view, sessionData, settings, CardState.Front);
        await this.draw3DCardFace(view, sessionData, settings, CardState.Back);
        view.fitText();

        if (options.showBack) view.turnToBack(false);
    }

    private async draw3DCardFace(
        view: Card3DView,
        sessionData: SessionData,
        settings: SRSettings,
        side: CardState.Front | CardState.Back,
    ) {
        const isFront = side === CardState.Front;
        const contextEl = isFront ? view.frontContextEl : view.backContextEl;
        const contentEl = isFront ? view.frontContentEl : view.backContentEl;
        contextEl.empty();
        contentEl.empty();
        this.drawCardContext(sessionData, settings, contextEl);
        // The context may be cut short, so show all of it on hover
        const contextText = contextEl.getText().trim();
        if (contextText) contextEl.setAttribute("aria-label", contextText);
        else contextEl.removeAttribute("aria-label");

        const wrapper: RenderMarkdownWrapper = new RenderMarkdownWrapper(
            this.app,
            this.plugin,
            sessionData.currentNote.filePath,
        );
        const textDirection = sessionData.currentQuestion.questionText.textDirection;
        const card = sessionData.cardData.currentCard;

        if (isFront) {
            await wrapper.renderMarkdownWrapper(card.front.trimStart(), contentEl, textDirection);
            return;
        }

        // The answer side repeats the question in smaller grey text above the answer,
        // except for cloze cards, whose back already contains the whole text
        if (sessionData.currentQuestion.questionType !== CardType.Cloze) {
            const recapEl = contentEl.createDiv("sr-3d-question-recap");
            await wrapper.renderMarkdownWrapper(card.front.trimStart(), recapEl, textDirection);
        }
        await wrapper.renderMarkdownWrapper(card.back, contentEl, textDirection);
    }

    /**
     * Switches between the 3D and the flat card view, and redraws the current card in place.
     */
    private async toggle3DView() {
        const enabled = !this.settings.flashcard3DView;
        const settingsManager = this.plugin.dataManager.settingsManager;
        this.settings.flashcard3DView = enabled;
        settingsManager.settings.flashcard3DView = enabled;
        this.toolbar.set3DViewActive(enabled);
        await settingsManager.save();

        const sessionData = this.sessionData;
        if (sessionData === null || this.cardState === CardState.Closed) return;

        if (enabled) {
            await this.draw3DCard(sessionData, this.settings, {
                animate: false,
                showBack: this.cardState === CardState.Back,
            });
        } else if (this.cardState === CardState.Back) {
            await this.drawFlatBackContent(sessionData, this.settings);
        } else {
            await this.drawFlatFrontContent(sessionData, this.settings);
        }
        this._setupClozeInputListeners();
    }

    /**
     * Changes the table surface of the 3D card view right away and saves the choice.
     */
    private async setTableSurface(surface: TableSurface) {
        const settingsManager = this.plugin.dataManager.settingsManager;
        this.settings.flashcard3DTableSurface = surface;
        settingsManager.settings.flashcard3DTableSurface = surface;
        this.card3DView?.setSurface(surface);
        await settingsManager.save();
    }

    public drawPendingState(nextPendingDueUnix: number): void {
        this.show3DView(false);
        this.toolbar.setResetButtonDisabled(true);
        this.cardState = CardState.Front;
        this.content.empty();
        this.response.hideAllButtons();
        this.pendingClock = this.content.createDiv({
            cls: "sr-centered",
        });

        const updatePendingClock = () => {
            const startTime = moment();
            const endTime = moment(nextPendingDueUnix);

            // Calculate the difference in milliseconds
            const duration = moment.duration(endTime.diff(startTime));

            const hours = Math.floor(duration.asHours());
            const minutes = duration.minutes();
            const seconds = duration.seconds();

            const formatted = `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

            this.pendingClock?.setText(
                `Waiting for the next FSRS review step. Next card due in ${formatted} (HH:mm:ss).`,
            );
            this.pendingResumeTimeout = window.setTimeout(() => {
                updatePendingClock();
            }, 1000);
        };

        updatePendingClock();
    }

    // #region -> Deck Info

    private setCustomHotKeyState(state: boolean) {
        if (state) {
            if (!this.view.hasClass("sr-custom-hotkeys")) {
                this.view.addClass("sr-custom-hotkeys");
            }
        } else {
            if (this.view.hasClass("sr-custom-hotkeys")) {
                this.view.removeClass("sr-custom-hotkeys");
            }
        }
    }

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
        this.clozeInputs = activeDocument.querySelectorAll(".cloze-input");

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
        this.clozeAnswers = activeDocument.querySelectorAll(".cloze-answer");

        if (this.clozeInputs !== null && this.clozeAnswers.length === this.clozeInputs.length) {
            for (let i = 0; i < this.clozeAnswers.length; i++) {
                const clozeInput = this.clozeInputs[i];
                const clozeAnswer = this.clozeAnswers[i] as HTMLElement;

                const inputText = clozeInput.value.trim();
                const answerText = clozeAnswer.innerText.trim();

                clozeAnswer.empty();

                const answerElement = clozeAnswer.createSpan({
                    text: escapeHtml(inputText),
                    cls: "cloze-answer",
                });

                answerElement.setCssProps({
                    color: inputText === answerText ? "green" : "red",
                    "text-Decoration": inputText === answerText ? "none" : "line-through",
                });

                if (inputText !== answerText) {
                    const span = clozeAnswer.createSpan({
                        text: escapeHtml(answerText),
                        cls: "cloze-answer-wrong",
                    });
                    span.setCssProps({
                        color: "green",
                        "text-decoration": "none",
                    });
                }
            }
        }
    }

    public async drawBack(
        sessionData: SessionData,
        reviewMode: FlashcardReviewMode,
        settings: SRSettings,
        determineButtonSchedule: (response: ReviewResponse) => RepItemScheduleInfo | null,
    ) {
        this.setCustomHotKeyState(settings.useCustomHotkeys);
        this.cardState = sessionData.cardData.currentCardState;

        this.toolbar.setResetButtonDisabled(false);
        this.sessionData = sessionData;

        // Show answer text
        if (settings.flashcard3DView) {
            const view = this.get3DView(settings);
            this.show3DView(true);
            // Redrawn so edits made while the card was open show up on its back
            await this.draw3DCardFace(view, sessionData, settings, CardState.Back);
            view.fitText();
            view.turnToBack();
        } else {
            await this.drawFlatBackContent(sessionData, settings);
        }

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
            determineButtonSchedule,
        );
        // NEW: restore keyboard focus after cloze confirmation
        if (this.plugin.uiManager === null) throw new Error("UI manager not initialized!!!");
        this.plugin.uiManager.setSRViewInFocus(true);
        this.response.againButton.buttonEl.focus();
    }

    private async drawFlatBackContent(sessionData: SessionData, settings: SRSettings) {
        if (sessionData.currentQuestion.questionType !== CardType.Cloze) {
            await this.drawFlatFrontContent(sessionData, settings);
            const hr: HTMLElement = activeDocument.createElement("hr");
            this.content.appendChild(hr);
        } else {
            this.show3DView(false);
            this.content.empty();
            this.drawCardContext(sessionData, settings);
        }

        const wrapper: RenderMarkdownWrapper = new RenderMarkdownWrapper(
            this.app,
            this.plugin,
            sessionData.currentNote.filePath,
        );
        await wrapper.renderMarkdownWrapper(
            sessionData.cardData.currentCard.back,
            this.content,
            sessionData.currentQuestion.questionText.textDirection,
            // sessionData.cardData.currentCardState,
        );
    }

    private _keydownHandler = (e: KeyboardEvent) => {
        if (!this.plugin.isInitialized) throw new Error("SR plugin or data not initialized!!!");
        if (this.plugin.uiManager === null) throw new Error("UI manager not initialized!!!");
        // Prevents any input, if the edit modal is open or if the view is not in focus
        if (
            this.plugin.dataManager.data.settings.useCustomHotkeys ||
            (activeDocument.activeElement !== null &&
                (activeDocument.activeElement.nodeName === "TEXTAREA" ||
                    activeDocument.activeElement.nodeName === "INPUT")) ||
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
            case "KeyJ":
                void this.jumpToCardHandler();
                consumeKeyEvent();
                break;
            case "Enter":
            case "NumpadEnter":
            case "Space":
                if (this.cardState === CardState.Front) {
                    this.showAnswerHandler();
                    consumeKeyEvent();
                } else if (this.cardState === CardState.Back) {
                    void this.processReviewHandler(ReviewResponse.Good);
                    consumeKeyEvent();
                }
                break;
            case "Numpad1":
            case "Digit1":
                if (this.cardState !== CardState.Back) {
                    break;
                }
                void this.processReviewHandler(ReviewResponse.Hard);
                consumeKeyEvent();
                break;
            case "Numpad2":
            case "Digit2":
                if (this.cardState !== CardState.Back) {
                    break;
                }
                void this.processReviewHandler(ReviewResponse.Good);
                consumeKeyEvent();
                break;
            case "Numpad3":
            case "Digit3":
                if (this.cardState !== CardState.Back) {
                    break;
                }
                void this.processReviewHandler(ReviewResponse.Easy);
                consumeKeyEvent();
                break;
            case "Numpad0":
            case "Digit0":
                if (this.cardState !== CardState.Back) {
                    break;
                }
                void this.processReviewHandler(ReviewResponse.Reset);
                consumeKeyEvent();
                break;
            case "ArrowLeft":
            case "ArrowRight":
                // Turn the 3D card over; the first turn shows the answer
                if (!this.settings.flashcard3DView || this.card3DView === null) {
                    break;
                }
                if (this.cardState === CardState.Front) {
                    this.showAnswerHandler();
                } else if (this.cardState === CardState.Back) {
                    this.card3DView.turnOver(e.code === "ArrowLeft" ? -1 : 1);
                }
                consumeKeyEvent();
                break;
            default:
                break;
        }
    };
}
