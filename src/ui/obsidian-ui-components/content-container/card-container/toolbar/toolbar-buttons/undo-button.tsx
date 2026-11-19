import { Platform } from "obsidian";

import { t } from "src/lang/helpers";
import SRButtonComponent from "src/ui/sr-button";

export default class UndoButtonComponent extends SRButtonComponent {
    public constructor(
        container: HTMLElement,
        undoClickHandler: () => Promise<void>,
        classNames?: string[],
    ) {
        super(container, {
            classNames: ["sr-undo-button", ...(classNames ?? [])],
            icon: "undo-2",
            tooltip: `${t("UNDO_LAST_ACTION")} (${Platform.isMacOS ? "⌘Z" : "Ctrl+Z"})`,
            onClick: () => {
                void undoClickHandler();
            },
        });
    }

    public setAvailable(available: boolean): void {
        this.buttonEl.toggleClass("mod-disabled", !available);
        this.buttonEl.toggleAttribute("disabled", !available);
    }
}
