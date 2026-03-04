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
     * @param description - Description text in the modal body.
     * @param confirmationMessage - Notice message to display upon confirmation.
     * @param onConfirm - Callback function to execute upon confirmation.
     */
    constructor(
        app: App,
        title: string,
        description: string,
        confirmationMessage?: string,
        onConfirm?: () => unknown,
    ) {
        super(app);

        this.setTitle(title);
        this.titleEl.addClass("sr-confirmation-modal-header");

        this.setContent(description);
        this.contentEl.addClass("sr-confirmation-modal-content");

        new Setting(this.contentEl)
            .setClass("sr-confirmation-modal-button-container")
            .addButton((button) =>
                button
                    .setButtonText(t("CONFIRM"))
                    .setClass("mod-warning")
                    .onClick(async () => {
                        if (confirmationMessage) {
                            new Notice(confirmationMessage);
                        }
                        if (onConfirm) {
                            await onConfirm();
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
