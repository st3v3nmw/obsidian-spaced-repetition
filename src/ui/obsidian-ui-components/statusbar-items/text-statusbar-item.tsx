import SRPlugin from "src/main";
import IconStatusBarItem from "src/ui/obsidian-ui-components/statusbar-items/icon-statusbar-item";
import { StatusBarItemPurpose } from "src/ui/status-bar-manager";

export default class TextStatusBarItem extends IconStatusBarItem {
    protected text: string | string[] | DocumentFragment | DocumentFragment[] = "";

    constructor(
        plugin: SRPlugin,
        type: StatusBarItemPurpose,
        props: {
            text: string | string[];
            icon?: string;
            hideIcon?: boolean;
            show?: boolean;
            tooltip?: string;
            tooltipPosition?: string;
            onClick?: () => unknown;
        },
    ) {
        super(plugin, type, {
            icon: props.icon ? props.icon : "",
            hideIcon: props.hideIcon,
            show: props.show,
            tooltip: props.tooltip,
            tooltipPosition: props.tooltipPosition,
            onClick: props.onClick,
        });

        this.setText(props.text, false);
    }

    setText(
        text: string | string[] | DocumentFragment | DocumentFragment[],
        cleanSegments: boolean = true,
    ): void {
        if (cleanSegments) {
            this.segments = [];
            this.statusBarItem.empty();
            this.iconEl = null;
            this.setStatusBarItemIcon(this.icon);
        }

        if (typeof text === "string") {
            this.text = text;
            this.createTextSegment(text);
        } else if (Array.isArray(text)) {
            this.text = text;

            for (const textSegment of text) {
                this.createTextSegment(textSegment);
            }
        }
    }

    getText(): string | string[] | DocumentFragment | DocumentFragment[] {
        return this.text;
    }

    protected createTextSegment(text: string | DocumentFragment): void {
        const segment = document.createElement("span");
        segment.setText(text);
        this.addSegment(segment);
    }
}
