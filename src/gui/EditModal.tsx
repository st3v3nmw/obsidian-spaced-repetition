import { App, Modal } from "obsidian";
import { t } from "src/lang/helpers";
import { SRSettings } from "src/settings";
import { includedSeperator } from "src/util/utils";

// from https://github.com/chhoumann/quickadd/blob/bce0b4cdac44b867854d6233796e3406dfd163c6/src/gui/GenericInputPrompt/GenericInputPrompt.ts#L5
export class FlashcardEditModal extends Modal {
    public changedText: string;
    public waitForClose: Promise<string>;

    public title: HTMLDivElement;
    public textAreaFront: HTMLTextAreaElement;
    public textAreaBack: HTMLTextAreaElement;
    public response: HTMLDivElement;
    public saveButton: HTMLButtonElement;
    public cancelButton: HTMLButtonElement;

    private resolvePromise: (input: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private rejectPromise: (reason?: any) => void;
    private didSaveChanges = false;
    private readonly modalText: string;
    private textFront: string;
    private textBack: string;
    private seperator: string;
    private multilineSeperator: boolean;

    public static Prompt(app: App, settings: SRSettings, placeholder: string): Promise<string> {
        const newPromptModal = new FlashcardEditModal(app, settings, placeholder);
        return newPromptModal.waitForClose;
    }

    constructor(app: App, settings: SRSettings, existingText: string) {
        super(app);

        this.modalText = existingText;
        this.changedText = existingText;

        // Select the seperator used
        this.seperator = includedSeperator(this.modalText, [
            settings.singleLineReversedCardSeparator,
            settings.multilineReversedCardSeparator,
            settings.singleLineCardSeparator,
            settings.multilineCardSeparator,
        ]);
        // Split Text based on the Seperator
        [this.textFront, this.textBack] = this.modalText.split(this.seperator);
        // Trim leading \n for multiline
        this.multilineSeperator = this.seperator
            ? [settings.multilineCardSeparator, settings.multilineReversedCardSeparator].contains(
                  this.seperator,
              )
            : false;
        if (this.multilineSeperator) {
            this.textBack = this.textBack.trimStart();
            this.textFront = this.textFront.trimEnd();
        }

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

        this.textAreaFront = this.contentEl.createEl("textarea");
        this.textAreaFront.addClass("sr-input");
        this.textAreaFront.setText(this.textFront ?? "");
        this.textAreaFront.addEventListener("keydown", this.saveOnEnterCallback);

        // Only for cards with seperator
        if (this.seperator) {
            this.textAreaBack = this.contentEl.createEl("textarea");
            this.textAreaBack.addClass("sr-input");
            this.textAreaBack.setText(this.textBack ?? "");
            this.textAreaBack.addEventListener("keydown", this.saveOnEnterCallback);
        }

        this._createResponse(this.contentEl);
    }

    /**
     * Opens the EditModal
     */
    onOpen() {
        super.onOpen();

        this.textAreaFront.focus();
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
        this.changedText = this.textAreaFront.value;
        if (this.seperator) {
            // New line at end of Front
            if (this.multilineSeperator && !this.textAreaFront.value.endsWith("\n")) {
                this.changedText += "\n";
            }
            this.changedText += this.seperator;
            // New line at start of Back
            if (this.multilineSeperator && !this.textAreaBack.value.startsWith("\n")) {
                this.changedText += "\n";
            }
            this.changedText += this.textAreaBack.value;
        }
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
        this.textAreaFront.removeEventListener("keydown", this.saveOnEnterCallback);
    }

    // -> Response section

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

    private _createResponse(mainContentContainer: HTMLElement) {
        const response: HTMLDivElement = mainContentContainer.createDiv();
        response.addClass("sr-response");
        this._createResponseButton(response, t("CANCEL"), "sr-bg-red", this.cancelClickCallback);
        this._createResponseButton(response, "", "sr-spacer", () => {});
        this._createResponseButton(response, t("SAVE"), "sr-bg-green", this.saveClickCallback);
    }
}
