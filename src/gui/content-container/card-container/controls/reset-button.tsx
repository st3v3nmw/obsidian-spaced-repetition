import SRButtonComponent from "src/gui/sr-button";
import { t } from "src/lang/helpers";

export default class ResetButtonComponent extends SRButtonComponent {
    public constructor(
        container: HTMLElement,
        resetClickHandler: () => void,
        classNames?: string[],
    ) {
        super(container, {
            classNames: ["sr-reset-button", "mod-warning", ...(classNames ?? [])],
            icon: "refresh-cw",
            tooltip: t("RESET_CARD_PROGRESS"),
            onClick: () => {
                resetClickHandler();
            },
        });
    }
}
