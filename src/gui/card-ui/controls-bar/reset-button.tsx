import SRButton from "src/gui/sr-button";
import { t } from "src/lang/helpers";

export default class ResetButton extends SRButton {
    public constructor(container: HTMLElement, resetClickHandler: () => void, className?: string) {
        super(container, {
            className: ["sr-reset-button", className].join(" "),
            icon: "refresh-cw",
            tooltip: t("RESET_CARD_PROGRESS"),
            onClick: () => {
                resetClickHandler();
            },
        });
    }
}