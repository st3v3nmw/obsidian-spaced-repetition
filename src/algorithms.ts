import { RepetitionItem, ReviewResult } from "./data";
import SRPlugin from "./main";
import { MiscUtils } from "./utils_recall";

export default abstract class SrsAlgorithm {
    settings: any;
    plugin: SRPlugin;

    updateSettings(plugin: SRPlugin, settings: any) {
        this.settings = MiscUtils.assignOnly(this.defaultSettings(), settings);
        this.plugin = plugin;
    }

    abstract defaultSettings(): any;
    abstract defaultData(): any;
    abstract onSelection(item: RepetitionItem, option: string, repeat: boolean): ReviewResult;
    abstract calcAllOptsIntervals(item: RepetitionItem): number[];
    abstract srsOptions(): string[];
    abstract displaySettings(containerEl: HTMLElement, update: (settings: any) => void): void;
}
