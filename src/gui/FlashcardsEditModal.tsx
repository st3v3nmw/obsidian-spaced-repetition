import { App, Modal } from "obsidian";
import { t } from "src/lang/helpers";

// from https://github.com/chhoumann/quickadd/blob/bce0b4cdac44b867854d6233796e3406dfd163c6/src/gui/GenericInputPrompt/GenericInputPrompt.ts#L5
export class FlashcardEditModal extends Modal {
    public input: string;
    public waitForClose: Promise<string>;

    public title: HTMLDivElement;
    public textArea: HTMLTextAreaElement;
    public response: HTMLDivElement;
    public saveButton: HTMLButtonElement;
    public cancelButton: HTMLButtonElement;

    private resolvePromise: (input: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private rejectPromise: (reason?: any) => void;
    private didSubmit = false;
    private readonly modalText: string;

    public static Prompt(app: App, placeholder: string): Promise<string> {
        const newPromptModal = new FlashcardEditModal(app, placeholder);
        return newPromptModal.waitForClose;
    }

    constructor(app: App, existingText: string) {
        super(app);

        this.modalText = existingText;
        this.input = existingText;

        this.waitForClose = new Promise<string>((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
        });

        this.modalEl.addClass("sr-edit-modal");

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
        this.textArea.addEventListener("keydown", this.submitEnterCallback);

        this.createResponse(this.contentEl);
    }

    private _createResponseButton(
        container: HTMLElement,
        text: string,
        colorClass: string,
        callback: (evt: MouseEvent) => void,
    ) {
        const button = container.createEl("button");
        button.addClasses(["sr-response-button", colorClass]);
        button.setText(text);
        button.addEventListener("click", callback);
    }

    private createResponse(mainContentContainer: HTMLElement) {
        const response: HTMLDivElement = mainContentContainer.createDiv();
        response.addClass("sr-response");
        this._createResponseButton(response, t("CANCEL"), "sr-bg-red", this.cancelClickCallback);
        this._createResponseButton(response, "", "sr-spacer", () => { });
        this._createResponseButton(
            response,
            t("SAVE"),
            "sr-bg-green",
            this.submitClickCallback,
        );
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
        this.input = this.textArea.value;
        this.close();
    }

    private cancel() {
        this.close();
    }

    onOpen() {
        super.onOpen();

        this.textArea.focus();
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
        this.textArea.removeEventListener("keydown", this.submitEnterCallback);
    }
}
