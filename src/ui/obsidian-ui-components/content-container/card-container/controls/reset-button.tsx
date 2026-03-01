import { t } from "src/lang/helpers";
import SRButtonComponent from "src/ui/sr-button";

export default class ResetButtonComponent extends SRButtonComponent {
    public constructor(
        container: HTMLElement,
        resetClickHandler: () => void,
        classNames?: string[],
    ) {
        super(container, {
            classNames: ["sr-reset-button", "mod-warning", ...(classNames ?? [])],
            icon: "rotate-ccw",
            tooltip: t("RESET_CARD_PROGRESS"),
            onClick: () => {
                resetClickHandler();
            },
        });
    }
}
