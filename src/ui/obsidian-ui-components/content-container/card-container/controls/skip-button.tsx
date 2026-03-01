import { t } from "src/lang/helpers";
import SRButtonComponent from "src/ui/sr-button";

export default class SkipButtonComponent extends SRButtonComponent {
    public constructor(
        container: HTMLElement,
        skipClickHandler: () => void,
        classNames?: string[],
    ) {
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
