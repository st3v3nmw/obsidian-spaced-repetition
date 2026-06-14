import "src/ui/obsidian-ui-components/modals/edit-modal.css";
import { App, ButtonComponent, Modal } from "obsidian";

import { Card } from "src/data/data-structures/card/card";
import { CardType } from "src/data/data-structures/card/questions/question";
import { SRSettings } from "src/data/settings";
import { t } from "src/lang/helpers";
import { TextDirection } from "src/utils/strings";

// from https://github.com/chhoumann/quickadd/blob/bce0b4cdac44b867854d6233796e3406dfd163c6/src/gui/GenericInputPrompt/GenericInputPrompt.ts#L5
export class FlashcardEditModal extends Modal {
    public changedText: string;
    public waitForClose: Promise<string>;

    public textAreaFront: HTMLTextAreaElement;
    public textAreaBack: HTMLTextAreaElement;
    private saveButton: ButtonComponent;

    private resolvePromise: ((input: string) => void) | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private rejectPromise: ((reason?: any) => void) | null = null;
    private didSaveChanges = false;
    private readonly modalText: string;
    private textDirection: TextDirection;
    private textFront: string = "";
    private textBack: string = "";
    private separator: string | null;
    private currentCard: Card;
    private cardType: CardType;

    public static Prompt(
        app: App,
        settings: SRSettings,
        currentCard: Card,
        placeholder: string,
        textDirection: TextDirection,
    ): Promise<string> {
        const newPromptModal = new FlashcardEditModal(
            app,
            settings,
            currentCard,
            placeholder,
            textDirection,
        );
        return newPromptModal.waitForClose;
    }

    constructor(
        app: App,
        settings: SRSettings,
        currentCard: Card,
        existingText: string,
        textDirection: TextDirection,
    ) {
        super(app);

        this.modalText = existingText;
        this.changedText = existingText;
        this.textDirection = textDirection;
        this.currentCard = currentCard;

        // Select the separator used
        this.cardType = this.currentCard.question.questionType;
        this.separator = this.getSeparatorFromCardType(this.cardType, settings);

        if (this.separator !== null) {
            this.textFront = this.currentCard.question.questionText.actualQuestion.split(
                this.separator,
            )[0];
            this.textBack = this.currentCard.question.questionText.actualQuestion.split(
                this.separator,
            )[1];

            if (
                this.cardType === CardType.MultiLineBasic ||
                this.cardType === CardType.MultiLineReversed
            ) {
                this.textBack = this.textBack.trimStart();
                this.textFront = this.textFront.trimEnd();
            }
        } else {
            this.textFront = this.modalText;
            this.textBack = "";
        }

        this.waitForClose = new Promise<string>((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
        });

        // Init static elements in ui
        this.modalEl.addClasses(["sr-modal", "sr-edit-modal"]);

        this.contentEl.empty();
        this.contentEl.addClass("sr-edit-view");

        const title = this.contentEl.createDiv();
        title.setText(t("EDIT_CARD"));
        title.addClass("sr-title");

        this.textAreaFront = this.contentEl.createEl("textarea");
        this.textAreaFront.addClass("sr-input");
        this.textAreaFront.setText(this.textFront);
        this.textAreaFront.addEventListener("keydown", this.keyListenerCallback);
        this.textAreaFront.addEventListener("input", this.emptyListenerCallback);

        if (this.textDirection === TextDirection.Rtl) {
            this.textAreaFront.setAttribute("dir", "rtl");
        }

        this.textAreaBack = this.contentEl.createEl("textarea");
        this.textAreaBack.addClass("sr-input");
        if (this.separator === null) {
            this.textAreaBack.addClass("sr-is-hidden");
        } else {
            this.textAreaBack.setText(this.textBack);
            this.textAreaBack.addEventListener("keydown", this.keyListenerCallback);
            this.textAreaBack.addEventListener("input", this.emptyListenerCallback);

            if (this.textDirection === TextDirection.Rtl) {
                this.textAreaBack.setAttribute("dir", "rtl");
            }
        }

        const response: HTMLDivElement = this.contentEl.createDiv();
        response.addClass("sr-response");

        const saveButton = new ButtonComponent(response);
        saveButton.setClass("sr-response-button");
        saveButton.setClass("sr-save-button");
        saveButton.setClass("sr-bg-green");
        saveButton.setButtonText(t("SAVE"));
        saveButton.onClick((evt) => {
            this.saveClickCallback(evt);
        });

        this.saveButton = saveButton;

        const button = response.createEl("button");
        button.addClasses(["sr-response-button", "sr-dummy-button"]);
        button.setText("");

        const cancelButton = new ButtonComponent(response);
        cancelButton.setClass("sr-response-button");
        cancelButton.setClass("sr-cancel-button");
        cancelButton.setClass("sr-bg-red");
        cancelButton.setButtonText(t("CANCEL"));
        cancelButton.onClick((evt) => {
            this.cancelClickCallback(evt);
        });

        this.open();
    }

    /**
     * Opens the EditModal
     */
    async onOpen() {
        await super.onOpen();
        if (this.textAreaFront !== null) {
            this.textAreaFront.focus();
        }
    }

    /**
     * Closes the EditModal
     */
    onClose() {
        super.onClose();
        this.resolveInput();
        this.removeInputListener();
    }

    // -> Functions & helpers

    private saveClickCallback = (_: MouseEvent) => this.save();

    private cancelClickCallback = (_: MouseEvent) => this.close();

    private emptyListenerCallback = (_: Event) => {
        const isBackEmpty =
            this.textAreaBack === null || this.separator === null
                ? false
                : this.textAreaBack.value.length === 0;
        const isFrontEmpty = this.textAreaFront !== null && this.textAreaFront.value.length === 0;

        this.saveButton.setDisabled(isBackEmpty || isFrontEmpty);
    };

    private keyListenerCallback = (evt: KeyboardEvent) => {
        if (evt.key === "Tab") {
            evt.preventDefault();

            const textarea = evt.target as HTMLTextAreaElement;
            const currentCaretStartPosition = textarea.selectionStart;
            const currentCaretEndPosition = textarea.selectionEnd;
            const newEndPosition = currentCaretStartPosition + 1;

            textarea.setRangeText("\t", currentCaretStartPosition, currentCaretEndPosition);
            textarea.setSelectionRange(newEndPosition, newEndPosition);
        }

        if ((evt.ctrlKey || evt.metaKey) && evt.key === "Enter") {
            evt.preventDefault();
            this.save();
        }
    };

    private save() {
        this.didSaveChanges = true;
        this.changedText = this.textAreaFront.value;
        if (this.separator) {
            // New line at end of Front
            if (
                (this.cardType === CardType.MultiLineBasic ||
                    this.cardType === CardType.MultiLineReversed) &&
                !this.textAreaFront.value.endsWith("\n")
            ) {
                this.changedText += "\n";
            }
            this.changedText += this.separator;
            // New line at start of Back
            if (
                (this.cardType === CardType.MultiLineBasic ||
                    this.cardType === CardType.MultiLineReversed) &&
                !this.textAreaBack.value.startsWith("\n")
            ) {
                this.changedText += "\n";
            }
            this.changedText += this.textAreaBack.value;
        }
        this.close();
    }

    private resolveInput() {
        if (this.rejectPromise === null || this.resolvePromise === null) return;

        if (!this.didSaveChanges) this.rejectPromise(t("NO_INPUT"));
        else this.resolvePromise(this.changedText);
    }

    private removeInputListener() {
        if (this.textAreaFront !== null) {
            this.textAreaFront.removeEventListener("keydown", this.keyListenerCallback);
            this.textAreaFront.removeEventListener("input", this.emptyListenerCallback);
        }

        if (this.textAreaBack !== null) {
            this.textAreaBack.removeEventListener("keydown", this.keyListenerCallback);
            this.textAreaBack.removeEventListener("input", this.emptyListenerCallback);
        }
    }

    private getSeparatorFromCardType(cardType: CardType, settings: SRSettings): string | null {
        switch (cardType) {
            case CardType.SingleLineBasic:
                return settings.singleLineCardSeparator;
            case CardType.SingleLineReversed:
                return settings.singleLineReversedCardSeparator;
            case CardType.MultiLineBasic:
                return settings.multilineCardSeparator;
            case CardType.MultiLineReversed:
                return settings.multilineReversedCardSeparator;
            case CardType.Cloze:
                return null;
        }
    }
}
