import SRPlugin from "src/main";

export class SettingsPage {
    protected containerEl: HTMLElement;
    protected plugin: SRPlugin;
    protected applySettingsUpdate: (callback: () => unknown) => void;
    protected display: () => void;

    constructor(containerEl: HTMLElement, plugin: SRPlugin, applySettingsUpdate: (callback: () => unknown) => void, display: () => void) {
        this.display = display;
        this.plugin = plugin;
        this.applySettingsUpdate = applySettingsUpdate;
        this.containerEl = containerEl;
    }
}