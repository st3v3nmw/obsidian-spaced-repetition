import { App, Modal, ButtonComponent } from "obsidian";

type ConfirmCallback = (confirmed: boolean) => void;

export default class ConfirmModal extends Modal {
    message: string;
    callback: ConfirmCallback;

    constructor(app: App, message: string, callback: ConfirmCallback) {
        super(app);
        this.message = message;
        this.callback = callback;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl("p").setText(this.message);

        const buttonDiv = contentEl.createDiv("srs-flex-row");

        new ButtonComponent(buttonDiv)
            .setButtonText("Confirm")
            .onClick(() => {
                this.callback(true);
                this.close();
            })
            .setCta();

        new ButtonComponent(buttonDiv).setButtonText("Cancel").onClick(() => {
            this.callback(false);
            this.close();
        });
    }
}
