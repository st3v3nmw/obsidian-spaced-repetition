// eslint-disable-next-line @typescript-eslint/no-unused-vars
import h from "vhtml";

import { FlashcardsPage } from "src/gui/obsidian-views/settings-tab/settings-page/flashcards-page";
import { MainPage } from "src/gui/obsidian-views/settings-tab/settings-page/main-page";
import { NotesPage } from "src/gui/obsidian-views/settings-tab/settings-page/notes-page";
import { SchedulingPage } from "src/gui/obsidian-views/settings-tab/settings-page/scheduling-page";
import { SettingsPage } from "src/gui/obsidian-views/settings-tab/settings-page/settings-page";
import { StatisticsPage } from "src/gui/obsidian-views/settings-tab/settings-page/statistics-page/statistics-page";
import { UIPreferencesPage } from "src/gui/obsidian-views/settings-tab/settings-page/ui-preferences-page";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";

export type SettingsPageType = "main-page" | "flashcards-page" | "notes-page" | "scheduling-page" | "ui-preferences-page" | "statistics-page";

export const SettingsPageTypesArray: ReadonlyArray<SettingsPageType> = ["main-page", "flashcards-page", "notes-page", "scheduling-page", "ui-preferences-page", "statistics-page"];

export function getPageName(pageType: SettingsPageType): string {
    switch (pageType) {
        case "main-page":
            return "MAIN_SETTINGS"; // TODO: add t("MAIN_SETTINGS")
        case "flashcards-page":
            return t("FLASHCARDS");
        case "notes-page":
            return t("NOTES");
        case "scheduling-page":
            return t("SCHEDULING");
        case "ui-preferences-page":
            return t("UI");
        case "statistics-page":
            return t("STATS_TITLE");
    }
}

export function getPageIcon(pageType: SettingsPageType): string {
    switch (pageType) {
        case "main-page":
            return "Settings";
        case "flashcards-page":
            return "SpacedRepIcon";
        case "notes-page":
            return "book-text";
        case "scheduling-page":
            return "calendar";
        case "ui-preferences-page":
            return "presentation";
        case "statistics-page":
            return "bar-chart-3";
    }
}

export class SettingsPageManager {
    private containerEl: HTMLElement;
    private plugin: SRPlugin;
    private pages: SettingsPage[] = [];
    private applyDebounceTimer: number = 0;
    private currentPage: SettingsPageType;
    private updateLastPageState: (lastPage: SettingsPageType, lastScrollPosition: number) => void;

    constructor(containerEl: HTMLElement, plugin: SRPlugin, lastPage: SettingsPageType, lastScrollPosition: number, updateLastPageState: (lastPage: SettingsPageType, lastScrollPosition: number) => void) {
        this.containerEl = containerEl;
        this.plugin = plugin;
        this.updateLastPageState = updateLastPageState;

        this.createPages();
        this.currentPage = lastPage;
        this.pages[this.getPageIndex(this.currentPage)].show();
        this.pages[this.getPageIndex(this.currentPage)].scrollTo(lastScrollPosition);
    }

    destroy() {
        this.pages.forEach(page => page.destroy && page.destroy());
    }

    render() {
        this.pages.forEach(page => page.render && page.render());
    }

    // https://github.com/mgmeyers/obsidian-kanban/blob/main/src/Settings.ts
    private applySettingsUpdate(callback: () => void): void {
        clearTimeout(this.applyDebounceTimer);
        this.applyDebounceTimer = window.setTimeout(callback, 512);
    }

    private createPages() {
        this.containerEl.empty();
        for (const pageType of SettingsPageTypesArray) {
            const newPageContainerEl = this.containerEl.createDiv();
            switch (pageType) {
                case "main-page":
                    this.pages.push(
                        new MainPage(
                            newPageContainerEl,
                            this.plugin,
                            pageType,
                            this.openPage.bind(this),
                            this.scrollListener.bind(this)
                        )
                    );
                    break;
                case "flashcards-page":
                    this.pages.push(
                        new FlashcardsPage(
                            newPageContainerEl,
                            this.plugin,
                            pageType,
                            this.applySettingsUpdate.bind(this),
                            this.createPages.bind(this),
                            this.openPage.bind(this),
                            this.scrollListener.bind(this)
                        )
                    );
                    break;
                case "notes-page":
                    this.pages.push(
                        new NotesPage(
                            newPageContainerEl,
                            this.plugin,
                            pageType,
                            this.applySettingsUpdate.bind(this),
                            this.createPages.bind(this),
                            this.openPage.bind(this),
                            this.scrollListener.bind(this)
                        )
                    );
                    break;
                case "scheduling-page":
                    this.pages.push(
                        new SchedulingPage(
                            newPageContainerEl,
                            this.plugin,
                            pageType,
                            this.applySettingsUpdate.bind(this),
                            this.createPages.bind(this),
                            this.openPage.bind(this),
                            this.scrollListener.bind(this)
                        )
                    );
                    break;
                case "ui-preferences-page":
                    this.pages.push(
                        new UIPreferencesPage(
                            newPageContainerEl,
                            this.plugin,
                            pageType,
                            this.applySettingsUpdate.bind(this),
                            this.createPages.bind(this),
                            this.openPage.bind(this),
                            this.scrollListener.bind(this)
                        )
                    );
                    break;
                case "statistics-page":
                    this.pages.push(
                        new StatisticsPage(
                            newPageContainerEl,
                            this.plugin,
                            pageType,
                            this.openPage.bind(this),
                            this.scrollListener.bind(this)
                        )
                    );
                    break;
            }
        }
    }

    private scrollListener(scrollPosition: number): void {
        this.updateLastPageState(this.currentPage, scrollPosition);
    }

    private getPageIndex(pageType: SettingsPageType): number {
        return this.pages.findIndex(page => page.getPageType() === pageType);
    }

    private openPage(pageType: SettingsPageType): void {
        if (this.currentPage === pageType) return;
        this.pages[this.getPageIndex(this.currentPage)].hide();

        this.currentPage = pageType;
        this.updateLastPageState(this.currentPage, 0);
        this.pages[this.getPageIndex(this.currentPage)].show();
    }
}
