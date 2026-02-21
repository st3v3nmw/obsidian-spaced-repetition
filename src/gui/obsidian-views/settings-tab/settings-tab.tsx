import { App, PluginSettingTab } from "obsidian";

import { FlashcardsPage } from "src/gui/obsidian-views/settings-tab/settings-page/flashcards-page";
import { HelpPage } from "src/gui/obsidian-views/settings-tab/settings-page/help-page";
import { NotesPage } from "src/gui/obsidian-views/settings-tab/settings-page/notes-page";
import { SchedulingPage } from "src/gui/obsidian-views/settings-tab/settings-page/scheduling-page";
import { UIPreferencesPage } from "src/gui/obsidian-views/settings-tab/settings-page/ui-preferences-page";
import { StatisticsView } from "src/gui/obsidian-views/settings-tab/statistics";
import { createTabs, TabStructure } from "src/gui/obsidian-views/settings-tab/tabs";
import { t } from "src/lang/helpers";
import type SRPlugin from "src/main";
import { setDebugParser } from "src/parser";

// https://github.com/mgmeyers/obsidian-kanban/blob/main/src/Settings.ts
let applyDebounceTimer = 0;
function applySettingsUpdate(callback: () => void): void {
    clearTimeout(applyDebounceTimer);
    applyDebounceTimer = window.setTimeout(callback, 512);
}

export class SRSettingTab extends PluginSettingTab {
    private plugin: SRPlugin;
    private tabStructure: TabStructure;
    private statistics: StatisticsView;

    constructor(app: App, plugin: SRPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        this.containerEl.empty();
        this.containerEl.addClass("sr-settings-tab");

        this.tabStructure = createTabs(
            this.containerEl,
            {
                "main-flashcards": {
                    title: t("FLASHCARDS"),
                    icon: "SpacedRepIcon",
                    contentGenerator: (containerElement: HTMLElement) => {
                        new FlashcardsPage(containerElement, this.plugin, applySettingsUpdate, this.display.bind(this));
                        return new Promise<void>((resolve) => { resolve(); });
                    }
                },
                "main-notes": {
                    title: t("NOTES"),
                    icon: "book-text",
                    contentGenerator: (containerElement: HTMLElement) => {
                        new NotesPage(containerElement, this.plugin, applySettingsUpdate, this.display.bind(this));
                        return new Promise<void>((resolve) => { resolve(); });
                    }
                },
                "main-algorithm": {
                    title: t("SCHEDULING"),
                    icon: "calendar",
                    contentGenerator: (containerElement: HTMLElement) => {
                        new SchedulingPage(containerElement, this.plugin, applySettingsUpdate, this.display.bind(this));
                        return new Promise<void>((resolve) => { resolve(); });
                    }
                },
                "main-ui-preferences": {
                    title: t("UI"),
                    icon: "presentation",
                    contentGenerator: (containerElement: HTMLElement) => {
                        new UIPreferencesPage(containerElement, this.plugin, applySettingsUpdate, this.display.bind(this));
                        return new Promise<void>((resolve) => { resolve(); });
                    }
                },
                "main-statistics": {
                    title: t("STATS_TITLE"),
                    icon: "bar-chart-3",
                    contentGenerator: async (containerElement: HTMLElement): Promise<void> => {
                        if (this.plugin.osrAppCore.cardStats === null) {
                            await this.plugin.sync();
                        }

                        this.statistics = new StatisticsView(
                            containerElement,
                            this.plugin.osrAppCore,
                            this.plugin.app,
                        );
                        this.statistics.render();
                    },
                },
                "main-help": {
                    title: t("HELP"),
                    icon: "badge-help",
                    contentGenerator: (containerElement: HTMLElement) => {
                        new HelpPage(containerElement, this.plugin, applySettingsUpdate, this.display.bind(this), setDebugParser);
                        return new Promise<void>((resolve) => { resolve(); });
                    }
                },
            },
            this.lastPosition.tabName,
        );

        // KEEP THIS AFTER CREATING ALL ELEMENTS:
        // Scroll to the position when the settings modal was last open,
        //  but do it after content generating has finished.
        this.tabStructure.contentGeneratorPromises[this.tabStructure.activeTabId].then(() => {
            this.rememberLastPosition(this.containerEl);
        });
    }

    hide(): void {
        this.statistics.destroy();
        this.containerEl.empty();
    }

    private lastPosition: {
        scrollPosition: number;
        tabName: string;
    } = {
            scrollPosition: 0,
            tabName: "main-flashcards",
        };

    private rememberLastPosition(containerElement: HTMLElement) {
        const lastPosition = this.lastPosition;

        // Go to last position now
        this.tabStructure.buttons[lastPosition.tabName].click();
        // Need to delay the scrolling a bit.
        // Without this, something else would override scrolling and scroll back to 0.
        containerElement.scrollTo({
            top: this.lastPosition.scrollPosition,
            behavior: "auto",
        });

        // Listen to changes
        containerElement.addEventListener("scroll", (_) => {
            this.lastPosition.scrollPosition = containerElement.scrollTop;
        });
        for (const tabName in this.tabStructure.buttons) {
            const button = this.tabStructure.buttons[tabName];
            button.onClickEvent((_: MouseEvent) => {
                lastPosition.tabName = tabName;
            });
        }
    }
}
