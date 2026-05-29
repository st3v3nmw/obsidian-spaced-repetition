import "src/ui/obsidian-ui-components/content-container/settings-page/statistics-page/statistics-page.css";
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

import { DataManager } from "src/data/data-manager";
import { Stats } from "src/data/data-structures/deck/stats";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { RepItemState } from "src/scheduling/algorithms/base/repetition-item";
import { SRAlgorithm } from "src/scheduling/algorithms/base/sr-algorithm";
import { textInterval } from "src/scheduling/algorithms/osr/note-scheduling";
import { SettingsPage } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page";
import { SettingsPageType } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page-manager";
import ChartComponent from "src/ui/obsidian-ui-components/content-container/settings-page/statistics-page/chart-component";
import NoteStatsComponent from "src/ui/obsidian-ui-components/content-container/settings-page/statistics-page/note-stats-component";
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
    private forecastChart: ChartComponent | null = null;
    private intervalsChart: ChartComponent | null = null;
    private easesChart: ChartComponent | null = null;
    private cardTypesChart: ChartComponent | null = null;
    private noteStatsGrid: NoteStatsComponent | null = null;

    constructor(
        pageContainerEl: HTMLElement,
        plugin: SRPlugin,
        dataManager: DataManager,
        pageType: SettingsPageType,
        openPage: (pageType: SettingsPageType) => void,
        scrollListener: (scrollPosition: number) => void,
    ) {
        super(
            pageContainerEl,
            plugin,
            dataManager,
            pageType,
            () => {},
            () => {},
            openPage,
            scrollListener,
        );
        this.containerEl.addClass("sr-statistics-page");
        this.plugin = plugin;
    }

    render(): void {
        this.destroyCharts();
        void this.renderCharts();
    }

    /**
     * Destroys the StatisticsPagea and all its components.
     */
    destroy(): void {
        this.destroyCharts();
        this.containerEl.removeEventListener("scroll", (_) => {
            this.scrollListener(this.containerEl.scrollTop);
        });
    }

    destroyCharts(): void {
        if (this.forecastChart !== null) this.forecastChart.destroy();
        if (this.intervalsChart !== null) this.intervalsChart.destroy();
        if (this.easesChart !== null) this.easesChart.destroy();
        if (this.cardTypesChart !== null) this.cardTypesChart.destroy();
        if (this.noteStatsGrid !== null) this.noteStatsGrid.destroy();

        this.forecastChart = null;
        this.intervalsChart = null;
        this.easesChart = null;
        this.cardTypesChart = null;
        this.noteStatsGrid = null;

        this.containerEl.empty();
    }

    private async renderCharts(): Promise<void> {
        await this.dataManager.sync();

        // TODO: Add a loading screen while it syncs

        // Add forecast
        const cardStats: Stats | null = this.dataManager.osrCore.cardStats;
        if (cardStats === null) {
            return;
        }

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

        new Setting(this.containerEl)
            .setName(t("PERIOD_TITLE"))
            .setDesc(t("PERIOD_DESC"))
            .addDropdown((el) => {
                el.addOption("month", t("MONTH"))
                    .addOption("quarter", t("QUARTER"))
                    .addOption("year", t("YEAR"))
                    .addOption("lifetime", t("LIFETIME"))
                    .setValue("month");

                el.selectEl.setAttr("id", "sr-chart-period");
            });

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
        });

        // Add card types
        const totalCardsCount: number =
            this.dataManager.osrCore.reviewableDeckTree.getDistinctRepItemCount(
                RepItemState.AnyItem,
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
            });

        const noteEases = mapRecord(
            SRAlgorithm.getInstance().noteStats().dict,
            (key: string, value: number): [string, number] => {
                return [key.split(".")[0], Math.round(value)];
            },
        );

        new SettingGroup(this.containerEl).setHeading(t("NOTES")).addSetting((setting: Setting) => {
            this.noteStatsGrid = new NoteStatsComponent(setting.settingEl, noteEases);
        });
    }
}
