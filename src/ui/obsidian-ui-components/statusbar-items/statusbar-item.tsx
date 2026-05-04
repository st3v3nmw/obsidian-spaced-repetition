import "src/ui/obsidian-ui-components/statusbar-items/statusbar-items.css";

import SRPlugin from "src/main";
import { StatusBarItemPurpose } from "src/ui/status-bar-manager";

export default class StatusBarItem {
    protected statusBarItem: HTMLElement;
    protected segments: HTMLElement[];
    protected type: StatusBarItemPurpose;

    constructor(
        plugin: SRPlugin,
        type: StatusBarItemPurpose,
        props: {
            show?: boolean;
            segments?: HTMLElement[];
            tooltip?: string;
            tooltipPosition?: string;
            onClick?: () => unknown;
        },
    ) {
        this.type = type;
        this.statusBarItem = plugin.addStatusBarItem();
        this.statusBarItem.addClass("status-bar-item");
        this.statusBarItem.addClass(type);
        this.statusBarItem.addClass("sr-status-bar-item");
        this.segments = [];

        if (props.show === undefined || props.show === false) {
            this.statusBarItem.addClass("sr-is-hidden");
        }

        if (props.onClick !== undefined) {
            this.statusBarItem.addClass("mod-clickable");
            this.statusBarItem.addEventListener("click", async () => {
                if (props.onClick === undefined) return;
                await props.onClick();
            });
        }

        if (props.tooltip !== undefined) {
            this.statusBarItem.setAttribute("aria-label", props.tooltip);
            this.statusBarItem.setAttribute("aria-label-position", props.tooltipPosition ?? "top");
        }

        if (props.segments !== undefined) {
            for (const segment of props.segments) {
                this.addSegment(segment);
            }
        }
    }

    getItem(): HTMLElement {
        return this.statusBarItem;
    }

    show(): void {
        if (this.statusBarItem.hasClass("sr-is-hidden")) {
            this.statusBarItem.removeClass("sr-is-hidden");
        }
    }

    hide(): void {
        if (!this.statusBarItem.hasClass("sr-is-hidden")) {
            this.statusBarItem.addClass("sr-is-hidden");
        }
    }

    getStatusBarItemType(): StatusBarItemPurpose {
        return this.type;
    }

    protected addSegment(content: HTMLElement): HTMLElement {
        content.addClass("sr-status-bar-item-segment");
        this.segments.push(content);
        this.statusBarItem.appendChild(content);
        return content;
    }
}
