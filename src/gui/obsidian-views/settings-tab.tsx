import { App, PluginSettingTab } from "obsidian";

import { SettingsPageManager, SettingsPageType } from "src/gui/content-container/settings-page/settings-page-manager";
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
            this.containerEl,
            this.plugin,
            this.lastPage,
            this.lastScrollPosition,
            (lastPage, lastScrollPosition) => {
                this.lastPage = lastPage;
                this.lastScrollPosition = lastScrollPosition;
            },
        );
    }

    hide(): void {
        if (this.settingsPageManager) this.settingsPageManager.destroy();
        this.containerEl.empty();
    }



    // private lastPosition: {
    //     scrollPosition: number;
    //     tabName: string;
    // } = {
    //         scrollPosition: 0,
    //         tabName: "main-flashcards",
    //     };

    // private rememberLastPosition(containerElement: HTMLElement) {
    //     const lastPosition = this.lastPosition;

    //     // Go to last position now
    //     this.tabStructure.buttons[lastPosition.tabName].click();
    //     // Need to delay the scrolling a bit.
    //     // Without this, something else would override scrolling and scroll back to 0.
    //     containerElement.scrollTo({
    //         top: this.lastPosition.scrollPosition,
    //         behavior: "auto",
    //     });

    //     // Listen to changes
    //     containerElement.addEventListener("scroll", (_) => {
    //         this.lastPosition.scrollPosition = containerElement.scrollTop;
    //     });
    //     for (const tabName in this.tabStructure.buttons) {
    //         const button = this.tabStructure.buttons[tabName];
    //         button.onClickEvent((_: MouseEvent) => {
    //             lastPosition.tabName = tabName;
    //         });
    //     }
    // }
}
