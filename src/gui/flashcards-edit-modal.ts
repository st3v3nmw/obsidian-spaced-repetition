import { App, ButtonComponent, Modal, TextAreaComponent } from "obsidian";
import { t } from "src/lang/helpers";

// from https://github.com/chhoumann/quickadd/blob/bce0b4cdac44b867854d6233796e3406dfd163c6/src/gui/GenericInputPrompt/GenericInputPrompt.ts#L5
export class FlashcardEditModal extends Modal {
    public input: string;
    public waitForClose: Promise<string>;

    private resolvePromise: (input: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private rejectPromise: (reason?: any) => void;
    private didSubmit = false;
    private inputComponent: TextAreaComponent;
    private readonly modalText: string;

    public static Prompt(app: App, placeholder: string): Promise<string> {
        const newPromptModal = new FlashcardEditModal(app, placeholder);
        return newPromptModal.waitForClose;
    }
    constructor(app: App, existingText: string) {
        super(app);
        this.titleEl.setText(t("EDIT_CARD"));
        this.titleEl.addClass("sr-centered");
        this.modalText = existingText;

        this.waitForClose = new Promise<string>((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
        });
        this.display();
        this.open();
    }

    private display() {
        this.contentEl.empty();
        this.modalEl.addClass("sr-flashcard-input-modal");

        const mainContentContainer: HTMLDivElement = this.contentEl.createDiv();
        mainContentContainer.addClass("sr-flashcard-input-area");
        this.inputComponent = this.createInputField(mainContentContainer, this.modalText);
        this.createButtonBar(mainContentContainer);
    }

    private createButton(
        container: HTMLElement,
        text: string,
        callback: (evt: MouseEvent) => void,
    ) {
        const btn = new ButtonComponent(container);
        btn.setButtonText(text).onClick(callback);
        return btn;
    }

    private createButtonBar(mainContentContainer: HTMLDivElement) {
        const buttonBarContainer: HTMLDivElement = mainContentContainer.createDiv();
        buttonBarContainer.addClass("sr-flashcard-edit-button-bar");
        this.createButton(
            buttonBarContainer,
            t("SAVE"),
            this.submitClickCallback,
        ).setCta().buttonEl.style.marginRight = "0";
        this.createButton(buttonBarContainer, t("CANCEL"), this.cancelClickCallback);
    }

    protected createInputField(container: HTMLElement, value: string) {
        const textComponent = new TextAreaComponent(container);

        textComponent.inputEl.style.width = "100%";
        textComponent
            .setValue(value ?? "")
            .onChange((value) => (this.input = value))
            .inputEl.addEventListener("keydown", this.submitEnterCallback);

        return textComponent;
    }

    private submitClickCallback = (_: MouseEvent) => this.submit();
    private cancelClickCallback = (_: MouseEvent) => this.cancel();

    private submitEnterCallback = (evt: KeyboardEvent) => {
        if ((evt.ctrlKey || evt.metaKey) && evt.key === "Enter") {
            evt.preventDefault();
            this.submit();
        }
    };

    private submit() {
        this.didSubmit = true;

        this.close();
    }

    private cancel() {
        this.close();
    }

    onOpen() {
        super.onOpen();

        this.inputComponent.inputEl.focus();
    }

    onClose() {
        super.onClose();
        this.resolveInput();
        this.removeInputListener();
    }

    private resolveInput() {
        if (!this.didSubmit) this.rejectPromise(t("NO_INPUT"));
        else this.resolvePromise(this.input);
    }

    private removeInputListener() {
        this.inputComponent.inputEl.removeEventListener("keydown", this.submitEnterCallback);
    }
}
