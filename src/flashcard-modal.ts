import { Modal, App, MarkdownRenderer, Notice } from "obsidian";
import type SRPlugin from "./main";
import { Card } from "./main";

enum UserResponse {
    ShowAnswer,
    ReviewHard,
    ReviewGood,
    ReviewEasy,
    Skip,
}

enum Mode {
    Front,
    Back,
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
        this.contentEl.appendChild(this.fileLinkView);

        this.contextView = document.createElement("div");
        this.contextView.setAttribute("id", "sr-context");
        this.contentEl.appendChild(this.contextView);

        this.flashcardView = document.createElement("div");
        this.contentEl.appendChild(this.flashcardView);

        this.responseDiv = createDiv("sr-response");

        this.hardBtn = document.createElement("button");
        this.hardBtn.setAttribute("id", "sr-hard-btn");
        this.hardBtn.setText("Hard");
        this.hardBtn.addEventListener("click", (_) => {
            this.processResponse(UserResponse.ReviewHard);
        });
        this.responseDiv.appendChild(this.hardBtn);

        this.goodBtn = document.createElement("button");
        this.goodBtn.setAttribute("id", "sr-good-btn");
        this.goodBtn.setText("Good");
        this.goodBtn.addEventListener("click", (_) => {
            this.processResponse(UserResponse.ReviewGood);
        });
        this.responseDiv.appendChild(this.goodBtn);

        this.easyBtn = document.createElement("button");
        this.easyBtn.setAttribute("id", "sr-easy-btn");
        this.easyBtn.setText("Easy");
        this.easyBtn.addEventListener("click", (_) => {
            this.processResponse(UserResponse.ReviewEasy);
        });
        this.responseDiv.appendChild(this.easyBtn);
        this.responseDiv.style.display = "none";

        this.contentEl.appendChild(this.responseDiv);

        this.answerBtn = document.createElement("div");
        this.answerBtn.setAttribute("id", "sr-show-answer");
        this.answerBtn.setText("Show Answer");
        this.answerBtn.addEventListener("click", (_) => {
            this.processResponse(UserResponse.ShowAnswer);
        });
        this.contentEl.appendChild(this.answerBtn);

        document.body.onkeypress = (e) => {
            if (
                this.mode == Mode.Front &&
                (e.code == "Space" || e.code == "Enter")
            )
                this.processResponse(UserResponse.ShowAnswer);
            else if (this.mode == Mode.Back) {
                if (e.code == "Numpad1" || e.code == "Digit1")
                    this.processResponse(UserResponse.ReviewHard);
                else if (e.code == "Numpad2" || e.code == "Digit2")
                    this.processResponse(UserResponse.ReviewGood);
                else if (e.code == "Numpad3" || e.code == "Digit3")
                    this.processResponse(UserResponse.ReviewEasy);
            }
        };
    }

    onOpen() {
        this.nextCard();
    }

    onClose() {}

    nextCard() {
        this.responseDiv.style.display = "none";
        let count =
            this.plugin.newFlashcards.length + this.plugin.dueFlashcards.length;
        this.titleEl.setText(`Queue - ${count}`);

        if (count == 0) {
            this.fileLinkView.innerHTML = "";
            this.contextView.innerHTML = "";
            this.flashcardView.innerHTML =
                "<h3 style='text-align: center; margin-top: 50%;'>You're done for the day :D.</h3>";
            return;
        }

        this.answerBtn.style.display = "initial";
        this.flashcardView.innerHTML = "";
        this.mode = Mode.Front;

        if (this.plugin.newFlashcards.length > 0) {
            this.currentCard = this.plugin.newFlashcards[0];
            MarkdownRenderer.renderMarkdown(
                this.currentCard.front,
                this.flashcardView,
                this.currentCard.note.path,
                this.plugin
            );
            this.hardBtn.setText("Hard - 1.0 day(s)");
            this.goodBtn.setText("Good - 2.5 day(s)");
            this.easyBtn.setText("Easy - 2.7 day(s)");
        } else if (this.plugin.dueFlashcards.length > 0) {
            this.currentCard = this.plugin.dueFlashcards[0];
            MarkdownRenderer.renderMarkdown(
                this.currentCard.front,
                this.flashcardView,
                this.currentCard.note.path,
                this.plugin
            );

            let hardInterval = this.nextState(
                UserResponse.ReviewHard,
                this.currentCard.interval,
                this.currentCard.ease
            ).interval;
            let goodInterval = this.nextState(
                UserResponse.ReviewGood,
                this.currentCard.interval,
                this.currentCard.ease
            ).interval;
            let easyInterval = this.nextState(
                UserResponse.ReviewEasy,
                this.currentCard.interval,
                this.currentCard.ease
            ).interval;

            this.hardBtn.setText(`Hard - ${hardInterval} day(s)`);
            this.goodBtn.setText(`Good - ${goodInterval} day(s)`);
            this.easyBtn.setText(`Easy - ${easyInterval} day(s)`);
        }

        this.contextView.setText(this.currentCard.context);
        this.fileLinkView.addEventListener("click", (_) => {
            this.close();
            this.plugin.app.workspace.activeLeaf.openFile(
                this.currentCard.note
            );
        });
    }

    processResponse(response: UserResponse) {
        if (response == UserResponse.ShowAnswer) {
            this.mode = Mode.Back;

            this.answerBtn.style.display = "none";
            this.responseDiv.style.display = "grid";

            let hr = document.createElement("hr");
            hr.setAttribute("id", "sr-hr-card-divide");
            this.flashcardView.appendChild(hr);
            MarkdownRenderer.renderMarkdown(
                this.currentCard.back,
                this.flashcardView,
                this.currentCard.note.path,
                this.plugin
            );
        } else if (
            response == UserResponse.ReviewHard ||
            response == UserResponse.ReviewGood ||
            response == UserResponse.ReviewEasy
        ) {
            let interval, ease;
            // scheduled card
            if (this.currentCard.dueUnix) {
                interval = this.currentCard.interval;
                ease = this.currentCard.ease;
                this.plugin.dueFlashcards.splice(0, 1);
            } else {
                interval = 250;
                ease = 1;
                this.plugin.newFlashcards.splice(0, 1);
            }

            // TODO: save responses

            this.nextCard();
        }
    }

    nextState(response: UserResponse, interval: number, ease: number) {
        if (response != UserResponse.ReviewGood) {
            ease =
                response == UserResponse.ReviewEasy
                    ? ease + 20
                    : Math.max(130, ease - 20);
        }

        interval = Math.max(
            1,
            response != UserResponse.ReviewHard
                ? (interval * ease) / 100
                : interval * this.plugin.data.settings.lapsesIntervalChange
        );

        return { ease, interval: Math.round(interval * 10) / 10 };
    }
}
