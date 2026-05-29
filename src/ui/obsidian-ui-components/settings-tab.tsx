import { App, PluginSettingTab } from "obsidian";

import type SRPlugin from "src/main";
import {
    SettingsPageManager,
    SettingsPageType,
} from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page-manager";
import { UIManager } from "src/ui/ui-manager";

export class SRSettingTab extends PluginSettingTab {
    private plugin: SRPlugin;
    private uiManager: UIManager;
    private settingsPageManager: SettingsPageManager | null = null;
    private lastPage: SettingsPageType = "main-page";
    private lastScrollPosition: number = 0;
    private didReadMultilineEndMarkerWarning: boolean = false;

    constructor(app: App, plugin: SRPlugin, uiManager: UIManager) {
        super(app, plugin);
        this.plugin = plugin;
        this.uiManager = uiManager;
        this.icon = "SpacedRepIcon";
        this.containerEl.addClass("sr-settings-tab");
    }

    display(): void {
        // TODO: Make the settings tab work with search settings plugin
        if (!this.plugin.isInitialized) {
            const infoDiv = this.containerEl.createDiv();
            infoDiv.setText(
                "I am sry, but please come back in a few seconds. The spaced repetition plugin is still initializing...",
            );
            return;
        }

        this.containerEl.empty();

        this.settingsPageManager = new SettingsPageManager(
            this.containerEl,
            this.plugin,
            this.plugin.dataManager,
            this.uiManager,
            this.lastPage,
            this.lastScrollPosition,
            this.didReadMultilineEndMarkerWarning,
            (lastPage, lastScrollPosition) => {
                this.lastPage = lastPage;
                this.lastScrollPosition = lastScrollPosition;
            },
            this.display.bind(this),
            (state: boolean) => {
                this.didReadMultilineEndMarkerWarning = state;
                this.display();
            },
        );
    }

    hide(): void {
        if (this.settingsPageManager) this.settingsPageManager.destroy();
        this.containerEl.empty();
    }
}
