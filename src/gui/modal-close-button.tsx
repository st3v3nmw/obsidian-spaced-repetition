import SRButtonComponent from "src/gui/sr-button";
import { t } from "src/lang/helpers";

export default class ModalCloseButtonComponent extends SRButtonComponent {
    public constructor(container: HTMLElement, closeModal: () => void, classNames?: string[]) {
        super(container, {
            classNames: ["sr-modal-close-button", ...(classNames ?? [])],
            icon: "x",
            tooltip: t("CLOSE"),
            onClick: () => {
                closeModal();
            },
        });
    }
}