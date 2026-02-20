import SRButton from "src/gui/sr-button";
import { t } from "src/lang/helpers";

export default class ModalCloseButton extends SRButton {
    public constructor(container: HTMLElement, closeModal: () => void, className?: string) {
        super(container, {
            className: ["sr-modal-close-button", className].join(" "),
            icon: "x",
            tooltip: t("CLOSE"),
            onClick: () => {
                closeModal();
            },
        });
    }
}