import { t } from "src/lang/helpers";
import SRButtonComponent from "src/ui/sr-button";

export default class MaximizeButtonComponent extends SRButtonComponent {
    public constructor(
        container: HTMLElement,
        toggleMaximized: () => boolean,
        classNames?: string[],
    ) {
        super(container, {
            classNames: ["sr-maximize-button", ...(classNames ?? [])],
            onClick: () => {
                this.showState(toggleMaximized());
            },
        });
        this.showState(false);
    }

    /**
     * Shows the action the button will take next: maximize, or restore the previous size
     * @param maximized - Whether the review window is currently maximized
     */
    private showState(maximized: boolean) {
        const label = maximized ? t("RESTORE_SIZE") : t("MAXIMIZE");
        this.setIcon(maximized ? "minimize-2" : "maximize-2");
        this.setTooltip(label);
        this.buttonEl.setAttribute("aria-label", label);
    }
}
