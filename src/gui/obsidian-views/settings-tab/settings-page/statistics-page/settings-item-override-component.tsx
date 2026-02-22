import { BaseComponent } from "obsidian";

export default abstract class SettingsItemOverrideComponent extends BaseComponent {
    protected containerEl: HTMLElement;

    constructor(parentContainerEl: HTMLElement) {
        super();
        parentContainerEl.addClass("sr-setting-override");
        this.containerEl = parentContainerEl.createDiv();
    }

    destroy(): void {
        this.containerEl.empty();
    }
}