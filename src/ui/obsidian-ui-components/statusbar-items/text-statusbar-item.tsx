import SRPlugin from "src/main";
import StatusBarItem from "src/ui/obsidian-ui-components/statusbar-items/statusbar-item";
import { StatusBarItemType } from "src/ui/status-bar-manager";

export default class TextStatusBarItem extends StatusBarItem {
    protected text: string | string[] | DocumentFragment | DocumentFragment[];

    constructor(
        plugin: SRPlugin,
        type: StatusBarItemType,
        props: {
            text?: string | string[];
            show?: boolean;
            tooltip?: string;
            tooltipPosition?: string;
            onClick?: () => unknown;
        },
    ) {
        super(plugin, type, props);

        this.setText(props.text);
    }

    setText(text: string | string[] | DocumentFragment | DocumentFragment[]): void {
        this.segments = [];
        this.statusBarItem.empty();

        if (text !== undefined && typeof text === "string") {
            this.text = text;
            this.createTextSegment(text);
        } else if (text !== undefined && Array.isArray(text)) {
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
