import SRButtonComponent from "src/gui/sr-button";
import { t } from "src/lang/helpers";

export default class SkipButtonComponent extends SRButtonComponent {
    public constructor(container: HTMLElement, skipClickHandler: () => void, classNames?: string[]) {
        super(container, {
            classNames: ["sr-skip-button", ...(classNames ?? [])],
            icon: "chevrons-right",
            tooltip: t("SKIP"),
            onClick: () => {
                skipClickHandler();
            },
        });
    }
}