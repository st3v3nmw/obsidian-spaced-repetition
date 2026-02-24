import { StatusBarItemType } from "src/gui/obsidian-views/statusbar-items/status-bar-manager";
import StatusBarItem from "src/gui/obsidian-views/statusbar-items/statusbar-item";
import SRPlugin from "src/main";

export default class TextStatusBarItem extends StatusBarItem {
    constructor(plugin: SRPlugin, type: StatusBarItemType, props: { text?: string | string[], show?: boolean, tooltip?: string, tooltipPosition?: string, onClick?: () => unknown }) {
        super(plugin, type, props);

        this.setText(props.text);
    }

    setText(text: string | string[] | DocumentFragment | DocumentFragment[]): void {
        this.segments = [];
        this.statusBarItem.empty();

        if (text !== undefined && typeof text === "string") {
            this.createTextSegment(text);
        } else if (text !== undefined && Array.isArray(text)) {
            for (const textSegment of text) {
                this.createTextSegment(textSegment);
            }
        }
    }

    protected createTextSegment(text: string | DocumentFragment): void {
        const segment = document.createElement("span");
        segment.setText(text);
        this.addSegment(segment);
    }
}