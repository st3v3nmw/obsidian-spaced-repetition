import "src/ui/obsidian-ui-components/content-container/settings-page/usage-history-page/usage-history-page.css";
import {
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    ChartDataset,
    Legend,
    LinearScale,
    Tooltip,
} from "chart.js";
import moment from "moment";
import { Notice, Setting, SettingGroup, TextComponent } from "obsidian";

import { DataManager } from "src/data/data-manager";
import { SettingsManager } from "src/data/settings-manager";
import { getPluginDir } from "src/history/create-history-recorder";
import { ReviewResponseName } from "src/history/history-events";
import { resolveHistoryFolder } from "src/history/history-folder";
import { HistoryReadResult } from "src/history/history-store";
import {
    addDaysToDayKey,
    computeUsageStats,
    createDayKeyFunction,
    DayUsage,
    formatDuration,
    getDayRange,
    IDLE_GAP_CAP_MS,
    sumDays,
    UsageStats,
} from "src/history/usage-stats";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { SettingsPage } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page";
import { SettingsPageType } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page-manager";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

type UsagePeriod = "30" | "90" | "365" | "all";

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : JSON.stringify(error);
}

// Categorical slots 1 & 2 of the validated chart palette (blue, orange), stepped per theme
const SERIES_COLORS = {
    light: ["#2a78d6", "#eb6834"],
    dark: ["#3987e5", "#d95926"],
};

const ANSWER_ORDER: ReadonlyArray<ReviewResponseName> = ["again", "hard", "good", "easy", "reset"];
const TABLE_DAY_COUNT = 14;

/**
 * Shows statistics about the usage of the plugin (time spent, reviews, ...), computed from the usage history.
 */
export class UsageHistoryPage extends SettingsPage {
    private charts: Chart[] = [];
    private period: UsagePeriod = "30";
    private history: HistoryReadResult | null = null;
    private stats: UsageStats | null = null;
    private chartsContainerEl: HTMLElement | null = null;

    constructor(
        pageContainerEl: HTMLElement,
        plugin: SRPlugin,
        settingsManager: SettingsManager,
        dataManager: DataManager,
        pageType: SettingsPageType,
        openPage: (pageType: SettingsPageType) => void,
        scrollListener: (scrollPosition: number) => void,
    ) {
        super(
            pageContainerEl,
            plugin,
            settingsManager,
            dataManager,
            pageType,
            () => {},
            () => {},
            openPage,
            scrollListener,
        );
        this.containerEl.addClass("sr-usage-history-page");
    }

    render(): void {
        this.destroyCharts();
        this.containerEl.empty();
        void this.renderPage();
    }

    destroy(): void {
        this.destroyCharts();
        super.destroy();
    }

    private destroyCharts(): void {
        this.charts.forEach((chart) => chart.destroy());
        this.charts = [];
    }

    private get today(): string {
        return this.dayKeyOf(Date.now());
    }

    private get dayKeyOf(): (ts: number) => string {
        return createDayKeyFunction(this.settingsManager.settings.startOfDay);
    }

    private async renderPage(): Promise<void> {
        const recorder = this.plugin.historyRecorder;

        new SettingGroup(this.containerEl)
            .setHeading(t("USAGE_HISTORY_RECORDING"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("RECORD_USAGE_HISTORY"))
                    .setDesc(t("RECORD_USAGE_HISTORY_DESC", { location: recorder.store.location }))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.recordUsageHistory)
                            .onChange(async (value) => {
                                this.settingsManager.settings.recordUsageHistory = value;
                                await this.plugin.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                const defaultFolder: string = resolveHistoryFolder("", getPluginDir(this.plugin));
                setting
                    .setName(t("USAGE_HISTORY_FOLDER"))
                    .setDesc(t("USAGE_HISTORY_FOLDER_DESC", { defaultFolder }))
                    .addText((text: TextComponent) => {
                        text.setPlaceholder(defaultFolder).setValue(
                            this.settingsManager.settings.usageHistoryFolder,
                        );
                        // Applied when leaving the field or pressing enter, not on every key press, as it moves files
                        text.inputEl.addEventListener("change", () => {
                            void this.applyHistoryFolder(text);
                        });
                    });
            });

        const loadingEl = this.containerEl.createDiv({
            cls: "sr-usage-loading",
            text: t("USAGE_HISTORY_LOADING"),
        });
        this.history = await recorder.store.readAll();
        this.stats = computeUsageStats(this.history.events, this.dayKeyOf, this.today);
        loadingEl.remove();

        if (this.history.corruptLines.length > 0) {
            const lines: string = this.history.corruptLines
                .slice(0, 5)
                .map((line) => `${line.file}:${line.lineNo}`)
                .join(", ");
            this.containerEl.createDiv({
                cls: "sr-usage-warning",
                text: t("USAGE_HISTORY_CORRUPT_LINES", {
                    count: this.history.corruptLines.length,
                    lines,
                }),
            });
        }

        if (this.stats.eventCount === 0) {
            this.containerEl.createDiv({
                cls: "sr-usage-empty",
                text: t("USAGE_HISTORY_EMPTY"),
            });
            return;
        }

        this.renderOverview(this.stats);

        new Setting(this.containerEl)
            .setName(t("PERIOD_TITLE"))
            .setDesc(t("USAGE_PERIOD_DESC"))
            .addDropdown((dropdown) => {
                dropdown
                    .addOption("30", t("USAGE_PERIOD_DAYS", { days: 30 }))
                    .addOption("90", t("USAGE_PERIOD_DAYS", { days: 90 }))
                    .addOption("365", t("USAGE_PERIOD_DAYS", { days: 365 }))
                    .addOption("all", t("LIFETIME"))
                    .setValue(this.period)
                    .onChange((value) => {
                        this.period = value as UsagePeriod;
                        this.renderCharts();
                    });
            });

        this.chartsContainerEl = this.containerEl.createDiv("sr-usage-charts");
        this.renderCharts();
    }

    /**
     * Stores the usage history in the folder entered in the text field from now on, and moves the existing history
     * files there.
     */
    private async applyHistoryFolder(text: TextComponent): Promise<void> {
        const value: string = text.getValue();
        let folder: string;
        try {
            folder = resolveHistoryFolder(value, getPluginDir(this.plugin));
        } catch (error) {
            // Invalid input: tell the user, and show the folder that is still used
            new Notice(t("USAGE_HISTORY_FOLDER_INVALID", { error: errorMessage(error) }));
            text.setValue(this.settingsManager.settings.usageHistoryFolder);
            return;
        }

        const store = this.plugin.historyRecorder.store;
        if (folder === store.location) return;

        let movedCount: number;
        try {
            movedCount = await store.moveTo(folder);
            this.settingsManager.settings.usageHistoryFolder =
                value.trim().length === 0 ? "" : folder;
            await this.plugin.dataManager.pluginDataManager.savePluginData();
        } catch (error) {
            // Triggered by a text field, so without this the error would only show up in the developer console
            new Notice(t("USAGE_HISTORY_FOLDER_MOVE_FAILED", { error: errorMessage(error) }));
            throw error;
        }

        new Notice(t("USAGE_HISTORY_FOLDER_CHANGED", { folder, count: movedCount }));
        this.render();
    }

    private renderOverview(stats: UsageStats): void {
        const today: string = this.today;
        const todayUsage: DayUsage = sumDays(getDayRange(stats, today, 1));
        const last7: DayUsage = sumDays(getDayRange(stats, today, 7));
        const last30: DayUsage = sumDays(getDayRange(stats, today, 30));

        const overviewEl = this.containerEl.createDiv("sr-usage-overview");
        const addTile = (label: string, value: string, detail: string) => {
            const tile = overviewEl.createDiv("sr-usage-tile");
            tile.createDiv({ cls: "sr-usage-tile-label", text: label });
            tile.createDiv({ cls: "sr-usage-tile-value", text: value });
            tile.createDiv({ cls: "sr-usage-tile-detail", text: detail });
        };
        const reviewsDetail = (usage: DayUsage) =>
            t("USAGE_REVIEWS_COUNT", { count: usage.reviews });

        addTile(t("USAGE_TODAY"), formatDuration(todayUsage.timeMs), reviewsDetail(todayUsage));
        addTile(t("USAGE_LAST_7_DAYS"), formatDuration(last7.timeMs), reviewsDetail(last7));
        addTile(t("USAGE_LAST_30_DAYS"), formatDuration(last30.timeMs), reviewsDetail(last30));
        addTile(
            t("USAGE_ALL_TIME"),
            formatDuration(stats.total.timeMs),
            reviewsDetail(stats.total),
        );
        addTile(
            t("USAGE_STREAK"),
            t("USAGE_DAYS_COUNT", { count: stats.currentStreak }),
            t("USAGE_LONGEST_STREAK", { count: stats.longestStreak }),
        );
        addTile(
            t("USAGE_DAYS_STUDIED"),
            String(stats.daysStudied),
            stats.firstEventTs === null
                ? ""
                : t("USAGE_SINCE", { date: moment(stats.firstEventTs).format("ll") }),
        );
    }

    private getPeriodDays(stats: UsageStats): DayUsage[] {
        const today: string = this.today;
        if (this.period !== "all") return getDayRange(stats, today, parseInt(this.period));

        if (stats.days.length === 0) return getDayRange(stats, today, 1);
        const firstDay: string = stats.days[0].day;
        const dayCount: number = moment(today).diff(moment(firstDay), "days") + 1;
        return getDayRange(stats, today, Math.max(dayCount, 1));
    }

    private renderCharts(): void {
        if (this.stats === null || this.history === null || this.chartsContainerEl === null) {
            throw new Error("UsageHistoryPage: statistics not loaded");
        }
        this.destroyCharts();
        this.chartsContainerEl.empty();

        const stats: UsageStats = this.stats;
        const days: DayUsage[] = this.getPeriodDays(stats);
        const periodTotal: DayUsage = sumDays(days);
        const labels: string[] = days.map((day) => moment(day.day).format("MMM D"));
        const colors: string[] = activeDocument.body.hasClass("theme-dark")
            ? SERIES_COLORS.dark
            : SERIES_COLORS.light;
        const activeDays: number = days.filter((day) => day.timeMs > 0).length;

        // Time spent per day
        this.addBarChart(
            t("USAGE_TIME_PER_DAY"),
            t("USAGE_TIME_PER_DAY_SUMMARY", {
                total: formatDuration(periodTotal.timeMs),
                avg: formatDuration(activeDays === 0 ? 0 : periodTotal.timeMs / activeDays),
                cap: Math.round(IDLE_GAP_CAP_MS / 60000),
            }),
            labels,
            [
                {
                    label: t("USAGE_MINUTES"),
                    data: days.map((day) => Math.round((day.timeMs / 60000) * 10) / 10),
                    backgroundColor: colors[0],
                },
            ],
            false,
            (value: number) => formatDuration(value * 60000),
        );

        // Reviews per day, new vs. known cards
        this.addBarChart(
            t("USAGE_REVIEWS_PER_DAY"),
            t("USAGE_REVIEWS_PER_DAY_SUMMARY", {
                total: periodTotal.reviews,
                newCards: periodTotal.newCardsReviewed,
                notes: periodTotal.notesReviewed,
            }),
            labels,
            [
                {
                    label: t("USAGE_KNOWN_CARDS"),
                    data: days.map((day) => day.reviews - day.newCardsReviewed),
                    backgroundColor: colors[0],
                },
                {
                    label: t("USAGE_NEW_CARDS"),
                    data: days.map((day) => day.newCardsReviewed),
                    backgroundColor: colors[1],
                },
            ],
            true,
        );

        // Answer buttons
        const answerLabels: Record<ReviewResponseName, string> = {
            again: this.settingsManager.settings.flashcardAgainText,
            hard: this.settingsManager.settings.flashcardHardText,
            good: this.settingsManager.settings.flashcardGoodText,
            easy: this.settingsManager.settings.flashcardEasyText,
            reset: t("RESET_CARD_PROGRESS"),
        };
        this.addBarChart(
            t("USAGE_ANSWERS"),
            t("USAGE_ANSWERS_SUMMARY", { count: periodTotal.reviews }),
            ANSWER_ORDER.map((name) => answerLabels[name]),
            [
                {
                    label: t("USAGE_REVIEWS"),
                    data: ANSWER_ORDER.map((name) => periodTotal.responses[name]),
                    backgroundColor: colors[0],
                },
            ],
            false,
        );

        // Reviews by hour of the day (over all time, the hour of a day doesn't depend on the period)
        this.addBarChart(
            t("USAGE_REVIEWS_BY_HOUR"),
            t("USAGE_REVIEWS_BY_HOUR_SUMMARY"),
            stats.reviewsByHour.map((_, hour) => String(hour).padStart(2, "0")),
            [
                {
                    label: t("USAGE_REVIEWS"),
                    data: stats.reviewsByHour,
                    backgroundColor: colors[0],
                },
            ],
            false,
        );

        this.renderDayTable(stats);

        this.chartsContainerEl.createDiv({
            cls: "sr-usage-footnote",
            text: t("USAGE_HISTORY_FOOTNOTE", {
                count: stats.eventCount,
                location: this.plugin.historyRecorder.store.location,
            }),
        });
    }

    private addBarChart(
        title: string,
        summary: string,
        labels: string[],
        datasets: ChartDataset<"bar", number[]>[],
        stacked: boolean,
        formatValue: (value: number) => string = (value: number) => String(value),
    ): void {
        if (this.chartsContainerEl === null) throw new Error("UsageHistoryPage: no container");

        const sectionEl = this.chartsContainerEl.createDiv("sr-usage-chart-section");
        sectionEl.createEl("h3", { cls: "sr-usage-chart-title", text: title });
        const canvasContainerEl = sectionEl.createDiv("sr-usage-chart-canvas-container");
        const canvasEl = canvasContainerEl.createEl("canvas");
        canvasEl.setAttr("role", "img");
        canvasEl.setAttr("aria-label", `${title}. ${summary}`);
        sectionEl.createDiv({ cls: "sr-usage-chart-summary", text: summary });

        const style: CSSStyleDeclaration = getComputedStyle(activeDocument.body);
        const textColor: string = style.getPropertyValue("--text-muted");
        const gridColor: string = style.getPropertyValue("--background-modifier-border");
        const surfaceColor: string = style.getPropertyValue("--background-primary");

        const chart = new Chart(canvasEl, {
            type: "bar",
            data: {
                labels,
                datasets: datasets.map((dataset) => ({
                    ...dataset,
                    // Rounded data end, square at the baseline; the surface colored border separates segments
                    borderRadius: 4,
                    borderSkipped: "start",
                    borderWidth: stacked ? { top: 2 } : 0,
                    borderColor: surfaceColor,
                    maxBarThickness: 28,
                })),
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                interaction: { mode: "index", intersect: false },
                scales: {
                    x: {
                        stacked,
                        grid: { display: false },
                        ticks: { color: textColor, autoSkip: true, maxRotation: 0 },
                    },
                    y: {
                        stacked,
                        beginAtZero: true,
                        grid: { color: gridColor },
                        border: { display: false },
                        ticks: {
                            color: textColor,
                            precision: 0,
                            callback: (value) => formatValue(Number(value)),
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: datasets.length > 1,
                        position: "top",
                        align: "start",
                        labels: { color: textColor, boxWidth: 12, boxHeight: 12 },
                    },
                    tooltip: {
                        callbacks: {
                            label: (item) =>
                                `${item.dataset.label}: ${formatValue(Number(item.raw))}`,
                        },
                    },
                },
            },
        });
        this.charts.push(chart);
    }

    private renderDayTable(stats: UsageStats): void {
        if (this.chartsContainerEl === null) throw new Error("UsageHistoryPage: no container");

        const sectionEl = this.chartsContainerEl.createDiv("sr-usage-chart-section");
        sectionEl.createEl("h3", {
            cls: "sr-usage-chart-title",
            text: t("USAGE_LAST_DAYS_TABLE", { days: TABLE_DAY_COUNT }),
        });

        const tableWrapperEl = sectionEl.createDiv("sr-usage-table-wrapper");
        const table = tableWrapperEl.createEl("table", { cls: "sr-usage-table" });
        const headerRow = table.createEl("thead").createEl("tr");
        const headers: string[] = [
            t("USAGE_COLUMN_DAY"),
            t("USAGE_COLUMN_TIME"),
            t("USAGE_REVIEWS"),
            t("USAGE_NEW_CARDS"),
            this.settingsManager.settings.flashcardAgainText,
            this.settingsManager.settings.flashcardHardText,
            t("USAGE_COLUMN_CARDS_SEEN"),
            t("SKIP"),
            t("USAGE_COLUMN_SUSPENDED"),
            t("USAGE_COLUMN_UNDONE"),
            t("NOTES"),
        ];
        headers.forEach((header, i) =>
            headerRow.createEl("th", { text: header, cls: i === 0 ? "" : "sr-usage-number" }),
        );

        const body = table.createEl("tbody");
        const days: DayUsage[] = getDayRange(stats, this.today, TABLE_DAY_COUNT).reverse();
        for (const day of days) {
            const row = body.createEl("tr");
            const cells: string[] = [
                day.day === this.today
                    ? t("USAGE_TODAY")
                    : day.day === addDaysToDayKey(this.today, -1)
                      ? t("USAGE_YESTERDAY")
                      : moment(day.day).format("ddd, ll"),
                day.timeMs === 0 ? "–" : formatDuration(day.timeMs),
                String(day.reviews),
                String(day.newCardsReviewed),
                String(day.responses.again),
                String(day.responses.hard),
                String(day.cardsSeen),
                String(day.skipped),
                String(day.suspended),
                String(day.undone),
                String(day.notesReviewed),
            ];
            cells.forEach((cell, i) =>
                row.createEl("td", { text: cell, cls: i === 0 ? "" : "sr-usage-number" }),
            );
        }
    }
}
