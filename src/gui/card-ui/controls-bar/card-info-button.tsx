import SRButton from "src/gui/sr-button";
import { t } from "src/lang/helpers";

export default class CardInfoButton extends SRButton {
    public constructor(container: HTMLElement, infoClickHandler: () => void, className?: string) {
        super(container, {
            className: ["sr-info-button", className].join(" "),
            icon: "info",
            tooltip: t("VIEW_CARD_INFO"),
            onClick: () => {
                infoClickHandler();
            },
        });
    }
}