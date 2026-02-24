import {
    ArcElement,
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    Legend,
    LinearScale,
    PieController,
    SubTitle,
    Title,
    Tooltip,
} from "chart.js";
import { Setting, SettingGroup } from "obsidian";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import h from "vhtml";

import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import { textInterval } from "src/algorithms/osr/note-scheduling";
import { OsrCore } from "src/core";
import { CardListType } from "src/deck/deck";
import { Stats } from "src/deck/stats";
import { SettingsPage } from "src/gui/content-container/settings-page/settings-page";
import { SettingsPageType } from "src/gui/content-container/settings-page/settings-page-manager";
import ChartComponent from "src/gui/content-container/settings-page/statistics-page/chart-component";
import NoteStatsComponent from "src/gui/content-container/settings-page/statistics-page/note-stats-component";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { getKeysPreserveType, getTypedObjectEntries, mapRecord } from "src/utils/types";

Chart.register(
    BarElement,
    BarController,
    Legend,
    Title,
    Tooltip,
    SubTitle,
    CategoryScale,
    LinearScale,
    PieController,
    ArcElement,
);

/**
 * Represents a statistics settings page.
 *
 * @class StatisticsPage
 * @extends {SettingsPage}
 */
export class StatisticsPage extends SettingsPage {
    private forecastChart: ChartComponent;
    private intervalsChart: ChartComponent;
    private easesChart: ChartComponent;
    private cardTypesChart: ChartComponent;
    private noteStatsGrid: NoteStatsComponent;

    constructor(
        pageContainerEl: HTMLElement,
        plugin: SRPlugin,
        pageType: SettingsPageType,
        openPage: (pageType: SettingsPageType) => void,
        scrollListener: (scrollPosition: number) => void,
    ) {
        super(
            pageContainerEl,
            plugin,
            pageType,
            () => {},
            () => {},
            openPage,
            scrollListener,
        );
        this.containerEl.addClass("sr-statistics-page");
        this.plugin = plugin;

        new Setting(this.containerEl)
            .setName("Period") // TODO: add t("CHART_PERIOD")
            .setDesc("Period of time to display in the charts") // TODO: add t("CHART_PERIOD_DESC")
            .addDropdown((el) => {
                el.addOption("month", t("MONTH"))
                    .addOption("quarter", t("QUARTER"))
                    .addOption("year", t("YEAR"))
                    .addOption("lifetime", t("LIFETIME"))
                    .setValue("month");

                el.selectEl.setAttr("id", "sr-chart-period");
            });

        this.renderCharts(this.plugin.osrAppCore);
    }

    /**
     * Destroys the StatisticsPagea and all its components.
     */
    destroy(): void {
        if (this.forecastChart) this.forecastChart.destroy();
        if (this.intervalsChart) this.intervalsChart.destroy();
        if (this.easesChart) this.easesChart.destroy();
        if (this.cardTypesChart) this.cardTypesChart.destroy();
        if (this.noteStatsGrid) this.noteStatsGrid.destroy();
        this.containerEl.removeEventListener("scroll", (_) => {
            this.scrollListener(this.containerEl.scrollTop);
        });
    }

    private renderCharts(osrCore: OsrCore): void {
        if (!osrCore.cardStats) {
            this.plugin.sync().then((_) => this.renderCharts(this.plugin.osrAppCore));
            return;
        }

        // Add forecast
        const cardStats: Stats = osrCore.cardStats;
        let maxN: number = cardStats.delayedDays.getMaxValue();
        for (let dueOffset = 0; dueOffset <= maxN; dueOffset++) {
            cardStats.delayedDays.clearCountIfMissing(dueOffset);
        }

        const dueDatesFlashcardsCopy: Record<number, number> = { 0: 0 };
        for (const [dueOffset, dueCount] of getTypedObjectEntries(cardStats.delayedDays.dict)) {
            if (dueOffset <= 0) {
                dueDatesFlashcardsCopy[0] += dueCount;
            } else {
                dueDatesFlashcardsCopy[dueOffset] = dueCount;
            }
        }

        const scheduledCount: number = cardStats.youngCount + cardStats.matureCount;
        maxN = Math.max(maxN, 1);

        new SettingGroup(this.containerEl)
            .setHeading(t("FORECAST"))
            .addSetting((setting: Setting) => {
                this.forecastChart = new ChartComponent(
                    setting.settingEl,
                    "forecastChart",
                    "forecastChartSummary",
                    "bar",
                    "",
                    t("FORECAST_DESC"),
                    Object.keys(dueDatesFlashcardsCopy),
                    Object.values(dueDatesFlashcardsCopy),
                    t("REVIEWS_PER_DAY", { avg: (scheduledCount / maxN).toFixed(1) }),
                    t("SCHEDULED"),
                    t("DAYS"),
                    t("NUMBER_OF_CARDS"),
                );
            });

        maxN = cardStats.intervals.getMaxValue();
        for (let interval = 0; interval <= maxN; interval++) {
            cardStats.intervals.clearCountIfMissing(interval);
        }

        // Add intervals
        const averageInterval: string = textInterval(
            Math.round((cardStats.intervals.getTotalOfValueMultiplyCount() / scheduledCount) * 10) /
                10 || 0,
            false,
        );
        const longestInterval: string = textInterval(cardStats.intervals.getMaxValue(), false);

        new SettingGroup(this.containerEl)
            .setHeading(t("INTERVALS"))
            .addSetting((setting: Setting) => {
                this.intervalsChart = new ChartComponent(
                    setting.settingEl,
                    "intervalsChart",
                    "intervalsChartSummary",
                    "bar",
                    "",
                    t("INTERVALS_DESC"),
                    Object.keys(cardStats.intervals.dict),
                    Object.values(cardStats.intervals.dict),
                    t("INTERVALS_SUMMARY", { avg: averageInterval, longest: longestInterval }),
                    t("COUNT"),
                    t("DAYS"),
                    t("NUMBER_OF_CARDS"),
                );
                return this.intervalsChart;
            });

        // Add eases
        const eases: number[] = getKeysPreserveType(cardStats.eases.dict);
        for (let ease = Math.min(...eases); ease <= Math.max(...eases); ease++) {
            cardStats.eases.clearCountIfMissing(ease);
        }
        const averageEase: number =
            Math.round(cardStats.eases.getTotalOfValueMultiplyCount() / scheduledCount) || 0;

        new SettingGroup(this.containerEl).setHeading(t("EASES")).addSetting((setting: Setting) => {
            this.easesChart = new ChartComponent(
                setting.settingEl,
                "easesChart",
                "easesChartSummary",
                "bar",
                "",
                "",
                Object.keys(cardStats.eases.dict),
                Object.values(cardStats.eases.dict),
                t("EASES_SUMMARY", { avgEase: averageEase }),
                t("COUNT"),
                t("EASES"),
                t("NUMBER_OF_CARDS"),
            );
            return this.easesChart;
        });

        // Add card types
        const totalCardsCount: number = osrCore.reviewableDeckTree.getDistinctCardCount(
            CardListType.All,
            true,
        );

        new SettingGroup(this.containerEl)
            .setHeading(t("CARD_TYPES"))
            .addSetting((setting: Setting) => {
                this.cardTypesChart = new ChartComponent(
                    setting.settingEl,
                    "cardTypesChart",
                    "cardTypesChartSummary",
                    "pie",
                    "",
                    t("CARD_TYPES_DESC"),
                    [
                        `${t("CARD_TYPE_NEW")} - ${Math.round((cardStats.newCount / totalCardsCount) * 100)}%`,
                        `${t("CARD_TYPE_YOUNG")} - ${Math.round(
                            (cardStats.youngCount / totalCardsCount) * 100,
                        )}%`,
                        `${t("CARD_TYPE_MATURE")} - ${Math.round(
                            (cardStats.matureCount / totalCardsCount) * 100,
                        )}%`,
                    ],
                    [cardStats.newCount, cardStats.youngCount, cardStats.matureCount],
                    t("CARD_TYPES_SUMMARY", { totalCardsCount }),
                );
                return this.cardTypesChart;
            });

        const noteEases = mapRecord(
            SrsAlgorithm.getInstance().noteStats().dict,
            (key: string, value: number): [string, number] => {
                return [key.split(".")[0], Math.round(value)];
            },
        );

        new SettingGroup(this.containerEl).setHeading(t("NOTES")).addSetting((setting: Setting) => {
            this.noteStatsGrid = new NoteStatsComponent(setting.settingEl, noteEases);
            return this.noteStatsGrid;
        });
    }
}
