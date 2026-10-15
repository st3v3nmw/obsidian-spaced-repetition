import { t } from "src/lang/helpers";
import SRButtonComponent from "src/ui/sr-button";

export default class Card3DViewButtonComponent extends SRButtonComponent {
    public constructor(
        container: HTMLElement,
        toggle3DViewHandler: () => void,
        isActive: boolean,
        classNames?: string[],
    ) {
        super(container, {
            classNames: ["sr-3d-view-button", ...(classNames ?? [])],
            icon: "box",
            tooltip: t("TOGGLE_3D_CARD_VIEW"),
            onClick: () => {
                toggle3DViewHandler();
            },
        });
        this.setActive(isActive);
    }

    /**
     * Highlights the button while the 3D card view is on
     * @param active - Whether the 3D card view is on
     */
    public setActive(active: boolean) {
        this.buttonEl.toggleClass("is-active", active);
        this.buttonEl.setAttribute("aria-pressed", String(active));
    }
}
