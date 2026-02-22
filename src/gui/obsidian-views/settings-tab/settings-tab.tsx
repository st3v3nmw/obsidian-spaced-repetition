import { App, PluginSettingTab } from "obsidian";

import { FlashcardsPage } from "src/gui/obsidian-views/settings-tab/settings-page/flashcards-page";
import { HelpPage } from "src/gui/obsidian-views/settings-tab/settings-page/help-page";
import { NotesPage } from "src/gui/obsidian-views/settings-tab/settings-page/notes-page";
import { SchedulingPage } from "src/gui/obsidian-views/settings-tab/settings-page/scheduling-page";
import { StatisticsPage } from "src/gui/obsidian-views/settings-tab/settings-page/statistics-page/statistics-page";
import { UIPreferencesPage } from "src/gui/obsidian-views/settings-tab/settings-page/ui-preferences-page";
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
    private statisticsPage: StatisticsPage;

    constructor(app: App, plugin: SRPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.icon = "SpacedRepIcon";
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
                        new FlashcardsPage(
                            containerElement,
                            this.plugin,
                            applySettingsUpdate,
                            this.display.bind(this),
                        );
                    },
                },
                "main-notes": {
                    title: t("NOTES"),
                    icon: "book-text",
                    contentGenerator: (containerElement: HTMLElement) => {
                        new NotesPage(
                            containerElement,
                            this.plugin,
                            applySettingsUpdate,
                            this.display.bind(this),
                        );
                    },
                },
                "main-algorithm": {
                    title: t("SCHEDULING"),
                    icon: "calendar",
                    contentGenerator: (containerElement: HTMLElement) => {
                        new SchedulingPage(
                            containerElement,
                            this.plugin,
                            applySettingsUpdate,
                            this.display.bind(this),
                        );
                    },
                },
                "main-ui-preferences": {
                    title: t("UI"),
                    icon: "presentation",
                    contentGenerator: (containerElement: HTMLElement) => {
                        new UIPreferencesPage(
                            containerElement,
                            this.plugin,
                            applySettingsUpdate,
                            this.display.bind(this),
                        );
                    },
                },
                "main-statistics": {
                    title: t("STATS_TITLE"),
                    icon: "bar-chart-3",
                    contentGenerator: (containerElement: HTMLElement) => {
                        this.statisticsPage = new StatisticsPage(containerElement, this.plugin);
                        this.statisticsPage.render();
                    },
                },
                "main-help": {
                    title: t("HELP"),
                    icon: "badge-help",
                    contentGenerator: (containerElement: HTMLElement) => {
                        new HelpPage(
                            containerElement,
                            this.plugin,
                            applySettingsUpdate,
                            this.display.bind(this),
                            setDebugParser,
                        );
                    },
                },
            },
            this.lastPosition.tabName,
        );

        // Scroll to the position when the settings modal was last open,
        this.rememberLastPosition(this.containerEl);
    }

    hide(): void {
        this.statisticsPage.destroy();
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
