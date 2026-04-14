import { App } from "obsidian";

import { t } from "src/lang/helpers";
import { ConfirmationModal } from "src/ui/obsidian-ui-components/modals/confirmation-modal";
import SRButtonComponent from "src/ui/sr-button";

export default class ResetButtonComponent extends SRButtonComponent {
    public constructor(
        container: HTMLElement,
        app: App,
        resetClickHandler: () => Promise<void>,
        classNames?: string[],
    ) {
        super(container, {
            classNames: ["sr-reset-button", "mod-warning", ...(classNames ?? [])],
            icon: "history",
            tooltip: t("RESET_CARD_PROGRESS"),
            onClick: () => {
                new ConfirmationModal(
                    app,
                    t("DELETE_SCHEDULING_DATA_OF_CURRENT_CARD"),
                    t("CONFIRM_SCHEDULING_DATA_DELETION_OF_CURRENT_CARD"),
                    t("SCHEDULING_DATA_DELETION_IN_PROGRESS_OF_CURRENT_CARD"),
                    async () => {
                        await resetClickHandler();
                    },
                ).open();
            },
        });
    }
}
