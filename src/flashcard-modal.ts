import { Modal, App, MarkdownRenderer, Notice } from "obsidian";
import type SRPlugin from "./main";
import { Card, CardType } from "./types";
import { schedule, ReviewResponse } from "./sched";
import { CLOZE_SCHEDULING_EXTRACTOR } from "./constants";

enum Mode {
    Front,
    Back,
    Closed,
}

export class FlashcardModal extends Modal {
    private plugin: SRPlugin;
    private answerBtn: HTMLElement;
    private flashcardView: HTMLElement;
    private hardBtn: HTMLElement;
    private goodBtn: HTMLElement;
    private easyBtn: HTMLElement;
    private responseDiv: HTMLElement;
    private fileLinkView: HTMLElement;
    private resetLinkView: HTMLElement;
    private contextView: HTMLElement;
    private currentCard: Card;
    private mode: Mode;

    constructor(app: App, plugin: SRPlugin) {
        super(app);

        this.plugin = plugin;

        this.titleEl.setText("Queue");
        this.modalEl.style.height = "80%";
        this.modalEl.style.width = "40%";

        this.contentEl.style.position = "relative";
        this.contentEl.style.height = "92%";

        this.fileLinkView = createDiv("sr-link");
        this.fileLinkView.setText("Open file");
        this.fileLinkView.addEventListener("click", (_) => {
            this.close();
            this.plugin.app.workspace.activeLeaf.openFile(
                this.currentCard.note
            );
        });
        this.contentEl.appendChild(this.fileLinkView);

        this.resetLinkView = createDiv("sr-link");
        this.resetLinkView.setText("Reset card's progress");
        this.resetLinkView.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Reset);
        });
        this.resetLinkView.style.float = "right";
        this.contentEl.appendChild(this.resetLinkView);

        this.contextView = document.createElement("div");
        this.contextView.setAttribute("id", "sr-context");
        this.contentEl.appendChild(this.contextView);

        this.flashcardView = document.createElement("div");
        this.flashcardView.setAttribute("id", "sr-flashcard-view");
        this.contentEl.appendChild(this.flashcardView);

        this.responseDiv = createDiv("sr-response");

        this.hardBtn = document.createElement("button");
        this.hardBtn.setAttribute("id", "sr-hard-btn");
        this.hardBtn.setText("Hard");
        this.hardBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Hard);
        });
        this.responseDiv.appendChild(this.hardBtn);

        this.goodBtn = document.createElement("button");
        this.goodBtn.setAttribute("id", "sr-good-btn");
        this.goodBtn.setText("Good");
        this.goodBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Good);
        });
        this.responseDiv.appendChild(this.goodBtn);

        this.easyBtn = document.createElement("button");
        this.easyBtn.setAttribute("id", "sr-easy-btn");
        this.easyBtn.setText("Easy");
        this.easyBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Easy);
        });
        this.responseDiv.appendChild(this.easyBtn);
        this.responseDiv.style.display = "none";

        this.contentEl.appendChild(this.responseDiv);

        this.answerBtn = document.createElement("div");
        this.answerBtn.setAttribute("id", "sr-show-answer");
        this.answerBtn.setText("Show Answer");
        this.answerBtn.addEventListener("click", (_) => {
            this.showAnswer();
        });
        this.contentEl.appendChild(this.answerBtn);

        document.body.onkeypress = (e) => {
            if (this.mode != Mode.Closed && e.code == "KeyS") {
                if (this.currentCard.isDue)
                    this.plugin.dueFlashcards.splice(0, 1);
                else this.plugin.newFlashcards.splice(0, 1);
                if (this.currentCard.cardType == CardType.Cloze)
                    this.buryRelatedCards(this.currentCard.relatedCards);
                this.nextCard();
            } else if (
                this.mode == Mode.Front &&
                (e.code == "Space" || e.code == "Enter")
            )
                this.showAnswer();
            else if (this.mode == Mode.Back) {
                if (e.code == "Numpad1" || e.code == "Digit1")
                    this.processReview(ReviewResponse.Hard);
                else if (e.code == "Numpad2" || e.code == "Digit2")
                    this.processReview(ReviewResponse.Good);
                else if (e.code == "Numpad3" || e.code == "Digit3")
                    this.processReview(ReviewResponse.Easy);
                else if (e.code == "Numpad0" || e.code == "Digit0")
                    this.processReview(ReviewResponse.Reset);
            }
        };
    }

    onOpen() {
        this.nextCard();
    }

    onClose() {
        this.mode = Mode.Closed;
    }

    nextCard() {
        this.responseDiv.style.display = "none";
        this.resetLinkView.style.display = "none";
        let count =
            this.plugin.newFlashcards.length + this.plugin.dueFlashcards.length;
        this.titleEl.setText(`Queue - ${count}`);

        if (count == 0) {
            this.answerBtn.style.display = "none";
            this.fileLinkView.innerHTML = "";
            this.resetLinkView.innerHTML = "";
            this.contextView.innerHTML = "";
            this.flashcardView.innerHTML =
                "<h3 style='text-align: center; margin-top: 45%;'>You're done for the day :D.</h3>";
            return;
        }

        this.answerBtn.style.display = "initial";
        this.flashcardView.innerHTML = "";
        this.mode = Mode.Front;

        if (this.plugin.dueFlashcards.length > 0) {
            this.currentCard = this.plugin.dueFlashcards[0];
            MarkdownRenderer.renderMarkdown(
                this.currentCard.front,
                this.flashcardView,
                this.currentCard.note.path,
                null
            );

            let hardInterval = schedule(
                ReviewResponse.Hard,
                this.currentCard.interval,
                this.currentCard.ease,
                this.plugin.data.settings.lapsesIntervalChange,
                this.plugin.data.settings.easyBonus,
                false
            ).interval;
            let goodInterval = schedule(
                ReviewResponse.Good,
                this.currentCard.interval,
                this.currentCard.ease,
                this.plugin.data.settings.lapsesIntervalChange,
                this.plugin.data.settings.easyBonus,
                false
            ).interval;
            let easyInterval = schedule(
                ReviewResponse.Easy,
                this.currentCard.interval,
                this.currentCard.ease,
                this.plugin.data.settings.lapsesIntervalChange,
                this.plugin.data.settings.easyBonus,
                false
            ).interval;

            this.hardBtn.setText(`Hard - ${hardInterval} day(s)`);
            this.goodBtn.setText(`Good - ${goodInterval} day(s)`);
            this.easyBtn.setText(`Easy - ${easyInterval} day(s)`);
        } else if (this.plugin.newFlashcards.length > 0) {
            this.currentCard = this.plugin.newFlashcards[0];
            MarkdownRenderer.renderMarkdown(
                this.currentCard.front,
                this.flashcardView,
                this.currentCard.note.path,
                null
            );
            this.hardBtn.setText("Hard - 1.0 day(s)");
            this.goodBtn.setText("Good - 2.5 day(s)");
            this.easyBtn.setText("Easy - 3.5 day(s)");
        }

        this.contextView.setText(this.currentCard.context);
    }

    showAnswer() {
        this.mode = Mode.Back;

        this.answerBtn.style.display = "none";
        this.responseDiv.style.display = "grid";

        if (this.currentCard.isDue)
            this.resetLinkView.style.display = "inline-block";

        if (this.currentCard.cardType != CardType.Cloze) {
            let hr = document.createElement("hr");
            hr.setAttribute("id", "sr-hr-card-divide");
            this.flashcardView.appendChild(hr);
        } else this.flashcardView.innerHTML = "";

        MarkdownRenderer.renderMarkdown(
            this.currentCard.back,
            this.flashcardView,
            this.currentCard.note.path,
            null
        );
    }

    async processReview(response: ReviewResponse) {
        let interval, ease, due;

        if (response != ReviewResponse.Reset) {
            // scheduled card
            if (this.currentCard.isDue) {
                this.plugin.dueFlashcards.splice(0, 1);
                let schedObj = schedule(
                    response,
                    this.currentCard.interval,
                    this.currentCard.ease,
                    this.plugin.data.settings.lapsesIntervalChange,
                    this.plugin.data.settings.easyBonus
                );
                interval = Math.round(schedObj.interval);
                ease = schedObj.ease;
            } else {
                let schedObj = schedule(
                    response,
                    1,
                    this.plugin.data.settings.baseEase,
                    this.plugin.data.settings.lapsesIntervalChange,
                    this.plugin.data.settings.easyBonus
                );
                this.plugin.newFlashcards.splice(0, 1);
                interval = Math.round(schedObj.interval);
                ease = schedObj.ease;
            }

            due = window.moment(Date.now() + interval * 24 * 3600 * 1000);
        } else {
            interval = 1.0;
            ease = this.plugin.data.settings.baseEase;
            this.plugin.dueFlashcards.splice(0, 1);
            this.plugin.dueFlashcards.push(this.currentCard);
            due = window.moment(Date.now());
            new Notice("Card's progress has been reset");
        }

        let dueString = due.format("DD-MM-YYYY");

        let fileText = await this.app.vault.read(this.currentCard.note);
        let replacementRegex = new RegExp(
            this.currentCard.cardText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), // escape string
            "gm"
        );

        if (this.currentCard.cardType == CardType.Cloze) {
            let schedIdx = this.currentCard.cardText.lastIndexOf("<!--SR:");
            if (schedIdx == -1) {
                // first time adding scheduling information to flashcard
                this.currentCard.cardText = `${this.currentCard.cardText}\n<!--SR:!${dueString},${interval},${ease}-->`;
            } else {
                let scheduling = [
                    ...this.currentCard.cardText.matchAll(
                        CLOZE_SCHEDULING_EXTRACTOR
                    ),
                ];

                let deletionSched = ["0", dueString, `${interval}`, `${ease}`];
                if (this.currentCard.isDue)
                    scheduling[
                        this.currentCard.clozeDeletionIdx
                    ] = deletionSched;
                else scheduling.push(deletionSched);

                this.currentCard.cardText = this.currentCard.cardText.replace(
                    /<!--SR:.+-->/gm,
                    ""
                );
                this.currentCard.cardText += "<!--SR:";
                for (let i = 0; i < scheduling.length; i++)
                    this.currentCard.cardText += `!${scheduling[i][1]},${scheduling[i][2]},${scheduling[i][3]}`;
                this.currentCard.cardText += "-->";
            }

            fileText = fileText.replace(
                replacementRegex,
                this.currentCard.cardText
            );
            for (let relatedCard of this.currentCard.relatedCards)
                relatedCard.cardText = this.currentCard.cardText;
            if (this.plugin.data.settings.buryRelatedCards)
                this.buryRelatedCards(this.currentCard.relatedCards);
        } else {
            if (this.currentCard.cardType == CardType.SingleLineBasic) {
                let sep = this.plugin.data.settings.singleLineCommentOnSameLine
                    ? " "
                    : "\n";

                fileText = fileText.replace(
                    replacementRegex,
                    `${this.currentCard.front}::${this.currentCard.back}${sep}<!--SR:${dueString},${interval},${ease}-->`
                );
            } else {
                fileText = fileText.replace(
                    replacementRegex,
                    `${this.currentCard.front}\n?\n${this.currentCard.back}\n<!--SR:${dueString},${interval},${ease}-->`
                );
            }
        }

        await this.app.vault.modify(this.currentCard.note, fileText);
        this.nextCard();
    }

    buryRelatedCards(arr: Card[]) {
        for (let relatedCard of arr) {
            let dueIdx = this.plugin.dueFlashcards.indexOf(relatedCard);
            let newIdx = this.plugin.newFlashcards.indexOf(relatedCard);

            if (dueIdx != -1) this.plugin.dueFlashcards.splice(dueIdx, 1);
            else if (newIdx != -1) this.plugin.newFlashcards.splice(newIdx, 1);
        }
    }
}
