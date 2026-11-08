import { t } from "src/lang/helpers";
import SRButtonComponent from "src/ui/sr-button";

export default class SuspendButtonComponent extends SRButtonComponent {
    public constructor(
        container: HTMLElement,
        suspendClickHandler: () => Promise<void>,
        classNames?: string[],
    ) {
        super(container, {
            classNames: ["sr-suspend-button", ...(classNames ?? [])],
            icon: "pause",
            tooltip: t("SUSPEND_CARD"),
            onClick: () => {
                void suspendClickHandler();
            },
        });
    }
}
