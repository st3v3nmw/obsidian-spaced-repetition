import SRPlugin from "src/main";
import { StatusBarItemType } from "src/ui/status-bar-manager";

export default class StatusBarItem {
    protected plugin: SRPlugin;
    protected statusBarItem: HTMLElement;
    protected segments: HTMLElement[];
    protected type: StatusBarItemType;

    constructor(
        plugin: SRPlugin,
        type: StatusBarItemType,
        props: {
            show?: boolean;
            segments?: HTMLElement[];
            tooltip?: string;
            tooltipPosition?: string;
            onClick?: () => unknown;
        },
    ) {
        this.plugin = plugin;
        this.type = type;
        this.statusBarItem = this.plugin.addStatusBarItem();
        this.statusBarItem.addClass("status-bar-item");
        this.statusBarItem.addClass("sr-status-bar-item");

        if (props.show === undefined || props.show === false) {
            this.statusBarItem.addClass("sr-is-hidden");
        }

        if (props.onClick !== undefined) {
            this.statusBarItem.addClass("mod-clickable");
            this.statusBarItem.addEventListener("click", async () => {
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

    getStatusBarItemType(): StatusBarItemType {
        return this.type;
    }

    protected addSegment(content: HTMLElement): HTMLElement {
        content.addClass("sr-status-bar-item-segment");
        this.segments.push(content);
        this.statusBarItem.appendChild(content);
        return content;
    }
}
