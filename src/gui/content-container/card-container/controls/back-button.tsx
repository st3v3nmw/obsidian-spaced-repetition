import SRButtonComponent from "src/gui/sr-button";
import { t } from "src/lang/helpers";

export default class BackButtonComponent extends SRButtonComponent {
    public constructor(container: HTMLElement, backToDeck: () => void, classNames?: string[]) {
        super(container, {
            classNames: ["sr-back-button", ...(classNames ?? [])],
            icon: "arrow-left",
            tooltip: t("BACK"),
            onClick: () => {
                backToDeck();
            },
        });
    }
}
