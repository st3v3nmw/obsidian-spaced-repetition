import { App, ButtonComponent, Modal } from "obsidian";

import { t } from "src/lang/helpers";
import { TextDirection } from "src/utils/strings";

// from https://github.com/chhoumann/quickadd/blob/bce0b4cdac44b867854d6233796e3406dfd163c6/src/gui/GenericInputPrompt/GenericInputPrompt.ts#L5
export class FlashcardEditModal extends Modal {
    public changedText: string;
    public waitForClose: Promise<string>;

    public title: HTMLDivElement;
    public textArea: HTMLTextAreaElement;
    public response: HTMLDivElement;
    public saveButton: ButtonComponent;
    public cancelButton: ButtonComponent;

    private resolvePromise: (input: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private rejectPromise: (reason?: any) => void;
    private didSaveChanges = false;
    private readonly modalText: string;
    private textDirection: TextDirection;

    public static Prompt(
        app: App,
        placeholder: string,
        textDirection: TextDirection,
    ): Promise<string> {
        const newPromptModal = new FlashcardEditModal(app, placeholder, textDirection);
        return newPromptModal.waitForClose;
    }

    constructor(app: App, existingText: string, textDirection: TextDirection) {
        super(app);

        this.modalText = existingText;
        this.changedText = existingText;
        this.textDirection = textDirection;

        this.waitForClose = new Promise<string>((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
        });

        // Init static elements in ui
        this.modalEl.addClasses(["sr-modal", "sr-edit-modal"]);
        this.init();

        this.open();
    }

    /**
     * Initializes all components of the EditModal
     */
    init() {
        this.contentEl.empty();
        this.contentEl.addClass("sr-edit-view");

        this.title = this.contentEl.createDiv();
        this.title.setText(t("EDIT_CARD"));
        this.title.addClass("sr-title");

        this.textArea = this.contentEl.createEl("textarea");
        this.textArea.addClass("sr-input");
        this.textArea.setText(this.modalText ?? "");
        this.textArea.addEventListener("keydown", this.saveOnEnterCallback);
        if (this.textDirection == TextDirection.Rtl) {
            this.textArea.setAttribute("dir", "rtl");
        }

        this._createResponse(this.contentEl);
    }

    /**
     * Opens the EditModal
     */
    onOpen() {
        super.onOpen();

        this.textArea.focus();
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

    private cancelClickCallback = (_: MouseEvent) => this.cancel();

    private saveOnEnterCallback = (evt: KeyboardEvent) => {
        if ((evt.ctrlKey || evt.metaKey) && evt.key === "Enter") {
            evt.preventDefault();
            this.save();
        }
    };

    private save() {
        this.didSaveChanges = true;
        this.changedText = this.textArea.value;
        this.close();
    }

    private cancel() {
        this.close();
    }

    private resolveInput() {
        if (!this.didSaveChanges) this.rejectPromise(t("NO_INPUT"));
        else this.resolvePromise(this.changedText);
    }

    private removeInputListener() {
        this.textArea.removeEventListener("keydown", this.saveOnEnterCallback);
    }

    // -> Response section

    private _createSaveButton(container: HTMLElement) {
        this.saveButton = new ButtonComponent(container);
        this.saveButton.setClass("sr-response-button");
        this.saveButton.setClass("sr-save-button");
        this.saveButton.setClass("sr-bg-green");
        this.saveButton.setButtonText(t("SAVE"));
        this.saveButton.onClick((evt) => {
            this.saveClickCallback(evt);
        });
    }

    private _createCancelButton(container: HTMLElement) {
        this.cancelButton = new ButtonComponent(container);
        this.cancelButton.setClass("sr-response-button");
        this.cancelButton.setClass("sr-cancel-button");
        this.cancelButton.setClass("sr-bg-red");
        this.cancelButton.setButtonText(t("CANCEL"));
        this.cancelButton.onClick((evt) => {
            this.cancelClickCallback(evt);
        });
    }

    private _createSpacerButton(container: HTMLElement) {
        const button = container.createEl("button");
        button.addClasses(["sr-response-button", "sr-dummy-button"]);
        button.setText("");
    }

    private _createResponse(mainContentContainer: HTMLElement) {
        const response: HTMLDivElement = mainContentContainer.createDiv();
        response.addClass("sr-response");
        this._createCancelButton(response);
        this._createSpacerButton(response);
        this._createSaveButton(response);
    }
}
