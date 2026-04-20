import { t } from "src/lang/helpers";
import SRButtonComponent from "src/ui/sr-button";

export default class CardInfoButtonComponent extends SRButtonComponent {
    public constructor(
        container: HTMLElement,
        infoClickHandler: () => void,
        classNames?: string[],
    ) {
        super(container, {
            classNames: ["sr-info-button", ...(classNames ?? [])],
            icon: "info",
            tooltip: t("VIEW_CARD_INFO"),
            onClick: () => {
                infoClickHandler();
            },
        });
    }
}
