import {
    ButtonComponent,
    Modal,
    App,
    MarkdownRenderer,
    Notice,
    Platform,
    TFile,
    setIcon,
} from "obsidian";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import h from "vhtml";

import type SRPlugin from "src/main";
import { SRSettings } from "src/settings";
import { schedule, textInterval, ReviewResponse } from "src/scheduling";
import {
    COLLAPSE_ICON,
    IMAGE_FORMATS,
    AUDIO_FORMATS,
    VIDEO_FORMATS,
} from "src/constants";
import { escapeRegexString, cyrb53 } from "src/utils";
import { t } from "src/lang/helpers";
import { unwatchFile } from "fs";
import { Card } from "../card";
import { CardListType, Deck } from "../deck";
import { CardType, Question } from "../question";
import { IFlashcardReviewSequencer as IFlashcardReviewSequencer } from "src/FlashcardReviewSequencer";
import { FlashcardEditModal } from "./flashcards-edit-modal";
import { INoteUpdator, Note } from "src/note";
import { RenderMarkdownWrapper } from "src/renderMarkdownWrapper";

export enum FlashcardModalMode {
    DecksList,
    Front,
    Back,
    Closed,
}


export class FlashcardModal extends Modal {
    public plugin: SRPlugin;
    public answerBtn: HTMLElement;
    public flashcardView: HTMLElement;
    public hardBtn: HTMLElement;
    public goodBtn: HTMLElement;
    public easyBtn: HTMLElement;
    public nextBtn: HTMLElement;
    public responseDiv: HTMLElement;
    public resetButton: HTMLButtonElement;
    public editButton: HTMLElement;
    public contextView: HTMLElement;
    public mode: FlashcardModalMode;
    public ignoreStats: boolean;
    private reviewSequencer: IFlashcardReviewSequencer;
    private noteUpdator: INoteUpdator;
    private currentNote: Note;

    private get currentCard(): Card {
        return this.reviewSequencer.currentCard;
    }

    private get currentQuestion(): Question {
        return this.reviewSequencer.currentQuestion;
    }

    constructor(app: App, plugin: SRPlugin, reviewSequencer: IFlashcardReviewSequencer, noteUpdator: INoteUpdator, ignoreStats = false) {
        super(app);

        this.plugin = plugin;
        this.reviewSequencer = reviewSequencer;
        this.noteUpdator = noteUpdator;
        this.ignoreStats = ignoreStats;

        this.titleEl.setText(t("DECKS"));
        this.titleEl.addClass("sr-centered");

        if (Platform.isMobile) {
            this.contentEl.style.display = "block";
        }
        this.modalEl.style.height = this.plugin.data.settings.flashcardHeightPercentage + "%";
        this.modalEl.style.width = this.plugin.data.settings.flashcardWidthPercentage + "%";

        this.contentEl.style.position = "relative";
        this.contentEl.style.height = "92%";
        this.contentEl.addClass("sr-modal-content");

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
                    (e.code === "Space" || e.code === "Enter")
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

    onOpen(): void {
        this.renderDecksList();
    }

    onClose(): void {
        this.mode = FlashcardModalMode.Closed;
    }

    renderDecksList(): void {
        /* const aimDeck = this.plugin.deckTree.subdecks.filter(
            (deck) => deck.deckName === this.plugin.data.historyDeck,
        );
        if (this.plugin.data.historyDeck && aimDeck.length > 0) {
            const deck = aimDeck[0];
            this.currentDeck = deck;
            this.checkDeck = deck.parent;
            this.setupCardsView();
            deck.nextCard(this);
            return;
        } */

        this.mode = FlashcardModalMode.DecksList;
        this.titleEl.setText(t("DECKS"));
        this.titleEl.innerHTML += (
            <p style="margin:0px;line-height:12px;">
                <span
                    style="background-color:#4caf50;color:#ffffff;"
                    aria-label={t("DUE_CARDS")}
                    class="tag-pane-tag-count tree-item-flair sr-deck-counts"
                >
                    {this.plugin.deckTree.getCardCount(CardListType.All, true).toString()}
                </span>
                <span
                    style="background-color:#2196f3;"
                    aria-label={t("NEW_CARDS")}
                    class="tag-pane-tag-count tree-item-flair sr-deck-counts"
                >
                    {this.plugin.deckTree.getCardCount(CardListType.NewCard, true).toString()}
                </span>
                <span
                    style="background-color:#ff7043;"
                    aria-label={t("TOTAL_CARDS")}
                    class="tag-pane-tag-count tree-item-flair sr-deck-counts"
                >
                    {this.plugin.deckTree.getCardCount(CardListType.DueCard, true).toString()}
                </span>
            </p>
        );
        this.contentEl.empty();
        this.contentEl.setAttribute("id", "sr-flashcard-view");

        for (const deck of this.plugin.deckTree.subdecks) {
            this.renderDeck(deck, this.contentEl, this);
        }
    }

    renderDeck(deck: Deck, containerEl: HTMLElement, modal: FlashcardModal): void {
        const deckView: HTMLElement = containerEl.createDiv("tree-item");

        const deckViewSelf: HTMLElement = deckView.createDiv(
            "tree-item-self tag-pane-tag is-clickable",
        );
        const shouldBeInitiallyExpanded: boolean =
            modal.plugin.data.settings.initiallyExpandAllSubdecksInTree;
        let collapsed = !shouldBeInitiallyExpanded;
        let collapseIconEl: HTMLElement | null = null;
        if (deck.subdecks.length > 0) {
            collapseIconEl = deckViewSelf.createDiv("tree-item-icon collapse-icon");
            collapseIconEl.innerHTML = COLLAPSE_ICON;
            (collapseIconEl.childNodes[0] as HTMLElement).style.transform = collapsed
                ? "rotate(-90deg)"
                : "";
        }

        const deckViewInner: HTMLElement = deckViewSelf.createDiv("tree-item-inner");
        deckViewInner.addEventListener("click", () => {
            /* modal.plugin.data.historyDeck = deck.deckName; */
            this.startReviewOfDeck(deck);
        });
        const deckViewInnerText: HTMLElement = deckViewInner.createDiv("tag-pane-tag-text");
        deckViewInnerText.innerHTML += <span class="tag-pane-tag-self">{deck.deckName}</span>;
        const deckViewOuter: HTMLElement = deckViewSelf.createDiv("tree-item-flair-outer");
        let deckStats = this.reviewSequencer.getDeckStats(deck.getTopicPath());
        deckViewOuter.innerHTML += (
            <span>
                <span
                    style="background-color:#4caf50;"
                    class="tag-pane-tag-count tree-item-flair sr-deck-counts"
                >
                    {deckStats.dueCount.toString()}
                </span>
                <span
                    style="background-color:#2196f3;"
                    class="tag-pane-tag-count tree-item-flair sr-deck-counts"
                >
                    {deckStats.newCount.toString()}
                </span>
                <span
                    style="background-color:#ff7043;"
                    class="tag-pane-tag-count tree-item-flair sr-deck-counts"
                >
                    {deckStats.totalCount.toString()}
                </span>
            </span>
        );

        const deckViewChildren: HTMLElement = deckView.createDiv("tree-item-children");
        deckViewChildren.style.display = collapsed ? "none" : "block";
        if (deck.subdecks.length > 0) {
            collapseIconEl.addEventListener("click", () => {
                if (collapsed) {
                    (collapseIconEl.childNodes[0] as HTMLElement).style.transform = "";
                    deckViewChildren.style.display = "block";
                } else {
                    (collapseIconEl.childNodes[0] as HTMLElement).style.transform =
                        "rotate(-90deg)";
                    deckViewChildren.style.display = "none";
                }
                collapsed = !collapsed;
            });
        }
        for (const subdeck of deck.subdecks) {
            this.renderDeck(subdeck, deckViewChildren, modal);
        }
    }

    startReviewOfDeck(deck: Deck) {
        this.reviewSequencer.setCurrentDeck(deck.getTopicPath());
        this.setupCardsView();
    }

    setupCardsView(): void {
        this.contentEl.empty();

        const flashCardMenu = this.contentEl.createDiv("sr-flashcard-menu");

        createBackButton();
        createEditButton();
        createResetButton();
        createCardInfoButton();
        createSkipButton();

        if (this.plugin.data.settings.showContextInCards) {
            this.contextView = this.contentEl.createDiv();
            this.contextView.setAttribute("id", "sr-context");
        }

        this.flashcardView = this.contentEl.createDiv("div");
        this.flashcardView.setAttribute("id", "sr-flashcard-view");

        createResponseButtons();

        createShowAnswerButton();

        if (this.ignoreStats) {
            this.goodBtn.style.display = "none";

            this.responseDiv.addClass("sr-ignorestats-response");
            this.easyBtn.addClass("sr-ignorestats-btn");
            this.hardBtn.addClass("sr-ignorestats-btn");
        }

        function createShowAnswerButton() {
            this.answerBtn = this.contentEl.createDiv();
            this.answerBtn.setAttribute("id", "sr-show-answer");
            this.answerBtn.setText(t("SHOW_ANSWER"));
            this.answerBtn.addEventListener("click", () => {
                this.showAnswer();
            });
        }

        function createResponseButtons() {
            this.responseDiv = this.contentEl.createDiv("sr-flashcard-response");

            this.hardBtn = document.createElement("button");
            this.hardBtn.setAttribute("id", "sr-hard-btn");
            this.hardBtn.setText(this.plugin.data.settings.flashcardHardText);
            this.hardBtn.addEventListener("click", () => {
                this.processReview(ReviewResponse.Hard);
            });
            this.responseDiv.appendChild(this.hardBtn);

            this.goodBtn = document.createElement("button");
            this.goodBtn.setAttribute("id", "sr-good-btn");
            this.goodBtn.setText(this.plugin.data.settings.flashcardGoodText);
            this.goodBtn.addEventListener("click", () => {
                this.processReview(ReviewResponse.Good);
            });
            this.responseDiv.appendChild(this.goodBtn);

            this.easyBtn = document.createElement("button");
            this.easyBtn.setAttribute("id", "sr-easy-btn");
            this.easyBtn.setText(this.plugin.data.settings.flashcardEasyText);
            this.easyBtn.addEventListener("click", () => {
                this.processReview(ReviewResponse.Easy);
            });
            this.responseDiv.appendChild(this.easyBtn);
            this.responseDiv.style.display = "none";
        }

        function createSkipButton() {
            const skipButton = flashCardMenu.createEl("button");
            skipButton.addClass("sr-flashcard-menu-item");
            setIcon(skipButton, "chevrons-right");
            skipButton.setAttribute("aria-label", t("SKIP"));
            skipButton.addEventListener("click", () => {
                this.skipCurrentCard();
            });
        }

        function createCardInfoButton() {
            const cardInfo = flashCardMenu.createEl("button");
            cardInfo.addClass("sr-flashcard-menu-item");
            setIcon(cardInfo, "info");
            cardInfo.setAttribute("aria-label", "View Card Info");
            cardInfo.addEventListener("click", async () => {
                const currentEaseStr = t("CURRENT_EASE_HELP_TEXT") + (this.currentCard.ease ?? t("NEW"));
                const currentIntervalStr = t("CURRENT_INTERVAL_HELP_TEXT") + textInterval(this.currentCard.interval, false);
                const generatedFromStr = t("CARD_GENERATED_FROM", {
                    notePath: this.currentCard.note.path,
                });
                new Notice(currentEaseStr + "\n" + currentIntervalStr + "\n" + generatedFromStr);
            });
        }

        function createBackButton() {
            const backButton = flashCardMenu.createEl("button");
            backButton.addClass("sr-flashcard-menu-item");
            setIcon(backButton, "arrow-left");
            backButton.setAttribute("aria-label", t("BACK"));
            backButton.addEventListener("click", () => {
                /* this.plugin.data.historyDeck = ""; */
                this.renderDecksList();
            });
        }

        function createEditButton() {
            this.reviewSequencer.currentQuestion.questionTextStrippedSR;
            this.editButton = flashCardMenu.createEl("button");
            this.editButton.addClass("sr-flashcard-menu-item");
            setIcon(this.editButton, "edit");
            this.editButton.setAttribute("aria-label", t("EDIT_CARD"));
            this.editButton.addEventListener("click", async () => {
                this.doEditQuestionText();
            });
        }

        function createResetButton() {
            this.resetButton = flashCardMenu.createEl("button");
            this.resetButton.addClass("sr-flashcard-menu-item");
            setIcon(this.resetButton, "refresh-cw");
            this.resetButton.setAttribute("aria-label", t("RESET_CARD_PROGRESS"));
            this.resetButton.addEventListener("click", () => {
                this.processReview(ReviewResponse.Reset);
            });
        }
    }

    async doEditQuestionText(): Promise<void> {
        let currentQ: Question = this.reviewSequencer.currentQuestion;
        let currentNote: Note = this.reviewSequencer.currentNote;
        let textPrompt = currentQ.questionTextStrippedSR;

        const editModal = FlashcardEditModal.Prompt(this.app, this.plugin, textPrompt);
        editModal
            .then(async (modifiedCardText) => {
                this.noteUpdator.modifyQuestionText(currentNote.file, currentQ, modifiedCardText);
            })
            .catch((reason) => console.log(reason));
    }

    private showAnswer(): void {
        this.mode = FlashcardModalMode.Back;

        this.answerBtn.style.display = "none";
        this.responseDiv.style.display = "grid";

        if (this.currentCard.isDue) {
            this.resetButton.disabled = false;
        }

        if (this.currentQuestion.questionType !== CardType.Cloze) {
            const hr: HTMLElement = document.createElement("hr");
            hr.setAttribute("id", "sr-hr-card-divide");
            this.flashcardView.appendChild(hr);
        } else {
            this.flashcardView.empty();
        }

        let wrapper: RenderMarkdownWrapper = new RenderMarkdownWrapper(this.app, this.plugin, this.currentNote.filePath);
        wrapper.renderMarkdownWrapper(this.currentCard.back, this.flashcardView);
    }

    private async processReview(response: ReviewResponse): Promise<void> {
        this.reviewSequencer.processReview(response);

    }

/*     private async burySiblingCards(tillNextDay: boolean): Promise<void> {
        if (tillNextDay) {
            this.plugin.data.buryList.push(cyrb53(this.currentCard.cardText));
            await this.plugin.savePluginData();
        }

        for (const sibling of this.currentCard.siblings) {
            const dueIdx = this.currentDeck.dueFlashcards.indexOf(sibling);
            const newIdx = this.currentDeck.newFlashcards.indexOf(sibling);

            if (dueIdx !== -1) {
                this.currentDeck.deleteFlashcardAtIndex(
                    dueIdx,
                    this.currentDeck.dueFlashcards[dueIdx].isDue,
                );
            } else if (newIdx !== -1) {
                this.currentDeck.deleteFlashcardAtIndex(
                    newIdx,
                    this.currentDeck.newFlashcards[newIdx].isDue,
                );
            }
        }
    } */

    private skipCurrentCard(): void {
        this.reviewSequencer.skipCurrentCard();
    }
}

