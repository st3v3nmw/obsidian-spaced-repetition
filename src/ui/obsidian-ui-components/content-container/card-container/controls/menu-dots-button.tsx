import SRButtonComponent from "src/ui/sr-button";

export default class MenuDotsButtonComponent extends SRButtonComponent {
    public constructor(
        container: HTMLElement,
        openMenu: (evt: MouseEvent) => void,
        classNames?: string[],
    ) {
        super(container, {
            classNames: ["sr-menu-dots-button", ...(classNames ?? [])],
            icon: "ellipsis-vertical",
            tooltip: "Open menu", // TODO: Translate
            onClick: (evt: MouseEvent) => {
                openMenu(evt);
            },
        });
    }
}
