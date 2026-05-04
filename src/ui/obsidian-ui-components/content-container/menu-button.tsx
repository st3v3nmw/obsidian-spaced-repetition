import { t } from "src/lang/helpers";
import SRButtonComponent from "src/ui/sr-button";

export default class MenuButtonComponent extends SRButtonComponent {
    public constructor(
        container: HTMLElement,
        openMenu: (evt: MouseEvent) => void,
        classNames?: string[],
    ) {
        super(container, {
            classNames: ["sr-menu-dots-button", ...(classNames ?? [])],
            icon: "ellipsis-vertical",
            tooltip: t("OPEN_MENU"),
            onClick: (evt: MouseEvent) => {
                openMenu(evt);
            },
        });
    }
}
