import SRButton from "src/gui/sr-button";
import { t } from "src/lang/helpers";

export default class EditButton extends SRButton {
    public constructor(container: HTMLElement, editClickHandler: () => void, className?: string) {
        super(container, {
            className: ["sr-edit-button", className].join(" "),
            icon: "edit",
            tooltip: t("EDIT_CARD"),
            onClick: () => {
                editClickHandler();
            },
        });
    }
}