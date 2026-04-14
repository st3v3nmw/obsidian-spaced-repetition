import { BaseComponent } from "obsidian";

/**
 * Represents a component that overrides the settings item fully.
 *
 * @class SettingsItemOverrideComponent
 * @extends {BaseComponent}
 */
export default abstract class SettingsItemOverrideComponent extends BaseComponent {
    protected containerEl: HTMLElement;

    constructor(parentContainerEl: HTMLElement) {
        super();
        parentContainerEl.addClass("sr-setting-override");
        this.containerEl = parentContainerEl.createDiv();
    }

    /**
     * Destroys the component.
     */
    destroy(): void {
        this.containerEl.empty();
    }
}
