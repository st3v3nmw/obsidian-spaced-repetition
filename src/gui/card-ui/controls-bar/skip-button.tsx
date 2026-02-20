import SRButton from "src/gui/sr-button";
import { t } from "src/lang/helpers";

export default class SkipButton extends SRButton {
    public constructor(container: HTMLElement, skipClickHandler: () => void, className?: string) {
        super(container, {
            className: ["sr-skip-button", className].join(" "),
            icon: "chevrons-right",
            tooltip: t("SKIP"),
            onClick: () => {
                skipClickHandler();
            },
        });
    }
}