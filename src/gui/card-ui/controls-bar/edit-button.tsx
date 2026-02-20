import SRButtonComponent from "src/gui/sr-button";
import { t } from "src/lang/helpers";

export default class EditButtonComponent extends SRButtonComponent {
    public constructor(container: HTMLElement, editClickHandler: () => void, classNames?: string[]) {
        super(container, {
            classNames: ["sr-edit-button", ...(classNames ?? [])],
            icon: "edit",
            tooltip: t("EDIT_CARD"),
            onClick: () => {
                editClickHandler();
            },
        });
    }
}