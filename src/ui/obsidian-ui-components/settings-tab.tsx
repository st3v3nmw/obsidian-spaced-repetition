import { App, PluginSettingTab } from "obsidian";

import { SettingsManager } from "src/data/settings-manager";
import type SRPlugin from "src/main";
import {
    SettingsPageManager,
    SettingsPageType,
} from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page-manager";
import { UIManager } from "src/ui/ui-manager";

export class SRSettingTab extends PluginSettingTab {
    private plugin: SRPlugin;
    private uiManager: UIManager;
    private settingsManager: SettingsManager;
    private settingsPageManager: SettingsPageManager | null = null;
    private lastPage: SettingsPageType = "main-page";
    private lastScrollPosition: number = 0;
    private didReadMultilineEndMarkerWarning: boolean = false;

    constructor(
        app: App,
        plugin: SRPlugin,
        uiManager: UIManager,
        settingsManager: SettingsManager,
    ) {
        super(app, plugin);
        this.plugin = plugin;
        this.uiManager = uiManager;
        this.settingsManager = settingsManager;
        this.icon = "SpacedRepIcon";
        this.containerEl.addClass("sr-settings-tab");
    }

    display(): void {
        // TODO: Make the settings tab work with search settings plugin

        this.containerEl.empty();

        this.settingsPageManager = new SettingsPageManager(
            this.containerEl,
            this.plugin,
            this.uiManager,
            this.settingsManager,
            this.lastPage,
            this.lastScrollPosition,
            this.didReadMultilineEndMarkerWarning,
            (lastPage, lastScrollPosition) => {
                this.lastPage = lastPage;
                this.lastScrollPosition = lastScrollPosition;
            },
            () => {
                this.display();
            },
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
