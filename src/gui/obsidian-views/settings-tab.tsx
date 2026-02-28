import { App, PluginSettingTab } from "obsidian";

import {
    SettingsPageManager,
    SettingsPageType,
} from "src/gui/content-container/settings-page/settings-page-manager";
import type SRPlugin from "src/main";

export class SRSettingTab extends PluginSettingTab {
    private plugin: SRPlugin;
    private settingsPageManager: SettingsPageManager;
    private lastPage: SettingsPageType = "main-page";
    private lastScrollPosition: number = 0;

    constructor(app: App, plugin: SRPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.icon = "SpacedRepIcon";
        this.containerEl.addClass("sr-settings-tab");
    }

    display(): void {
        this.settingsPageManager = new SettingsPageManager(
            this.app,
            this.containerEl,
            this.plugin,
            this.lastPage,
            this.lastScrollPosition,
            (lastPage, lastScrollPosition) => {
                this.lastPage = lastPage;
                this.lastScrollPosition = lastScrollPosition;
            },
            this.display.bind(this),
        );
    }

    hide(): void {
        if (this.settingsPageManager) this.settingsPageManager.destroy();
        this.containerEl.empty();
    }
}
