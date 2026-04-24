import SRPlugin from "src/main";
import TextStatusBarItem from "src/ui/obsidian-ui-components/statusbar-items/text-statusbar-item";
import { StatusBarItemPurpose } from "src/ui/status-bar-manager";

export default class CounterStatusBarItem extends TextStatusBarItem {
    protected count: number = 0;
    constructor(
        plugin: SRPlugin,
        type: StatusBarItemPurpose,
        props: {
            icon: string;
            text: string;
            count: number;
            hideIcon?: boolean;
            show?: boolean;
            tooltip?: string;
            tooltipPosition?: string;
            onClick?: () => unknown;
        },
    ) {
        super(plugin, type, {
            ...props,
            text: `${props.count} ${props.text}`,
        });
        this.count = props.count;
    }

    setCounter(count: number): void {
        const oldCount = this.count;
        this.count = count;
        if (typeof this.text === "string") {
            const textWithoutCount = this.text.replace(oldCount.toString(), "");
            this.setText(`${this.count}${textWithoutCount}`);
        }
    }

    getCount(): number {
        return this.count;
    }
}
