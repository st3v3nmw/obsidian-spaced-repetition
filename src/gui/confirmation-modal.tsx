import { App, Modal, Notice, Setting } from "obsidian";

import { t } from "src/lang/helpers";

/**
 * A reusable confirmation modal.
 */
export class ConfirmationModal extends Modal {
    /**
     * Creates a confirmation modal.
     * @param app - The Obsidian app instance.
     * @param title - Title of the modal.
     * @param message - Body message of the modal.
     * @param confirmationMessage - Notice message to display upon confirmation.
     * @param onConfirm - Callback function to execute upon confirmation.
     */
    constructor(
        app: App,
        title: string,
        message: string,
        confirmationMessage?: string,
        onConfirm?: () => void,
    ) {
        super(app);

        this.setTitle(title);
        this.titleEl.addClass("modal-header");

        this.setContent(message);
        this.contentEl.addClass("modal-content");

        new Setting(this.contentEl)
            .setClass("modal-button-container")
            .addButton((button) =>
                button
                    .setButtonText(t("CONFIRM"))
                    .setClass("mod-warning")
                    .onClick(() => {
                        if (onConfirm) {
                            onConfirm();
                        }
                        if (confirmationMessage) {
                            new Notice(confirmationMessage);
                        }
                        this.close();
                    }),
            )
            .addButton((button) =>
                button.setButtonText(t("CANCEL")).onClick(() => {
                    this.close();
                }),
            );
    }
}
