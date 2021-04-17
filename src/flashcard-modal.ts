import { Modal, App } from "obsidian";
import type SRPlugin from "./main";
import { BasicCard, ClozeCard } from "./main";

enum UserResponse {
    ShowAnswer,
    ReviewEasy,
    ReviewGood,
    ReviewHard,
    Skip,
}

export class FlashcardModal extends Modal {
    private plugin: SRPlugin;
    private answerBtn: HTMLElement;
    private flashcardView: HTMLElement;
    private fileLinkView: HTMLElement;
    private contextView: HTMLElement;
    private currentCard: BasicCard | ClozeCard;

    constructor(app: App, plugin: SRPlugin) {
        super(app);

        this.plugin = plugin;

        this.titleEl.setText("Queue");
        this.modalEl.style.height = "80%";
        this.modalEl.style.width = "40%";

        this.contentEl.style.position = "relative";
        this.contentEl.style.height = "92%";

        this.fileLinkView = createDiv("link");
        this.fileLinkView.setText("Open file");
        this.contentEl.appendChild(this.fileLinkView);

        this.contextView = document.createElement("div");
        this.contentEl.appendChild(this.contextView);

        this.flashcardView = document.createElement("div");
        this.contentEl.appendChild(this.flashcardView);

        this.answerBtn = document.createElement("div");
        this.answerBtn.setAttribute("id", "show-answer");
        this.answerBtn.setText("Show Answer");
        this.contentEl.appendChild(this.answerBtn);
    }

    onOpen() {
        document.body.onkeypress = (e) => {
            if (e.code === "Space")
                this.processResponse(UserResponse.ShowAnswer);
        };

        this.titleEl.setText(
            `Queue - ${
                this.plugin.newFlashcards.length +
                this.plugin.scheduledFlashcards.length
            }`
        );

        if (this.plugin.newFlashcards.length > 0) {
            this.currentCard = this.plugin.newFlashcards[0];
            this.flashcardView.setText(this.currentCard.front);
        } else if (this.plugin.scheduledFlashcards.length > 0) {
        }

        this.contextView.setText(this.currentCard.context);
        this.fileLinkView.addEventListener("click", (_) => {
            this.close();
            this.plugin.app.workspace.activeLeaf.openFile(
                this.currentCard.note
            );
        });
    }

    onClose() {}

    processResponse(response: UserResponse) {
        this.flashcardView.setText(this.currentCard.back);
    }
}
