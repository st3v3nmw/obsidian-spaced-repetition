import { setIcon } from "obsidian";

import SRPlugin from "src/main";
import StatusBarItem from "src/ui/obsidian-ui-components/statusbar-items/statusbar-item";
import { StatusBarItemPurpose } from "src/ui/status-bar-manager";

export default class IconStatusBarItem extends StatusBarItem {
    protected icon: string = "";
    protected iconEl: HTMLElement | null = null;
    protected hideIcon: boolean = false;

    constructor(
        plugin: SRPlugin,
        type: StatusBarItemPurpose,
        props: {
            icon: string;
            hideIcon?: boolean;
            show?: boolean;
            segments?: HTMLElement[];
            tooltip?: string;
            tooltipPosition?: string;
            onClick?: () => unknown;
        },
    ) {
        super(plugin, type, props);
        this.icon = props.icon;
        this.hideIcon = props.hideIcon !== undefined ? props.hideIcon : false;
        this.setStatusBarItemIcon(props.icon);
    }

    setStatusBarItemIcon(icon: string): void {
        this.icon = icon;

        if (this.iconEl === null || !this.statusBarItem.hasChildNodes()) {
            this.iconEl = document.createElement("span");
            this.iconEl.addClass("status-bar-item-icon");
            this.addSegment(this.iconEl);
        } else {
            if (this.iconEl !== null) {
                this.iconEl.empty();
            }
        }
        setIcon(this.iconEl, this.icon);
        if (!this.iconEl.hasClass("status-bar-item-icon")) {
            this.iconEl.addClass("status-bar-item-icon");
        }

        this.setHideIcon(this.hideIcon);
    }

    setHideIcon(hideIcon: boolean): void {
        this.hideIcon = hideIcon;
        if (this.iconEl === null) return;

        if (hideIcon) {
            if (this.iconEl.hasClass("sr-is-hidden")) return;
            this.iconEl.addClass("sr-is-hidden");
        } else {
            if (!this.iconEl.hasClass("sr-is-hidden")) return;
            this.iconEl.removeClass("sr-is-hidden");
        }
    }
}
