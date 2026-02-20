import SRButton from "src/gui/sr-button";
import { t } from "src/lang/helpers";

export default class BackButton extends SRButton {
    public constructor(container: HTMLElement, backToDeck: () => void, className?: string) {
        super(container, {
            className: ["sr-back-button", className].join(" "),
            icon: "arrow-left",
            tooltip: t("BACK"),
            onClick: () => {
                backToDeck();
            },
        });
    }
}