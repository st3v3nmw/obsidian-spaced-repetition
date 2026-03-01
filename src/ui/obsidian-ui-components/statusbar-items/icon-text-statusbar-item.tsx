import { setIcon } from "obsidian";

import SRPlugin from "src/main";
import TextStatusBarItem from "src/ui/obsidian-ui-components/statusbar-items/text-statusbar-item";
import { StatusBarItemType } from "src/ui/status-bar-manager";

export default class IconTextStatusBarItem extends TextStatusBarItem {
    protected icon: string;
    protected iconEl: HTMLElement;
    constructor(
        plugin: SRPlugin,
        type: StatusBarItemType,
        props: {
            icon: string;
            text?: string | string[];
            show?: boolean;
            tooltip?: string;
            tooltipPosition?: string;
            onClick?: () => unknown;
        },
    ) {
        super(plugin, type, props);

        this.setText(props.text ? props.text : "", props.icon);
    }

    setText(text: string | string[] | DocumentFragment | DocumentFragment[], icon?: string): void {
        this.segments = [];
        this.statusBarItem.empty();

        if (this.icon !== undefined || icon !== undefined)
            this.setStatusBarItemIcon(icon ? icon : this.icon);

        if (text !== undefined && typeof text === "string") {
            this.createTextSegment(text);
        } else if (text !== undefined && Array.isArray(text)) {
            for (const textSegment of text) {
                this.createTextSegment(textSegment);
            }
        }
    }

    setStatusBarItemIcon(icon: string): void {
        this.icon = icon;
        if (this.iconEl === undefined || !this.statusBarItem.hasChildNodes()) {
            this.iconEl = document.createElement("span");
            this.iconEl.addClass("status-bar-item-icon");
            this.addSegment(this.iconEl);
        } else {
            this.iconEl.empty();
        }
        setIcon(this.iconEl, this.icon);
        if (!this.iconEl.hasClass("status-bar-item-icon")) {
            this.iconEl.addClass("status-bar-item-icon");
        }
    }
}
