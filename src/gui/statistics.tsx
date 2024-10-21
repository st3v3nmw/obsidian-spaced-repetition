import {
    ArcElement,
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    ChartTypeRegistry,
    Legend,
    LinearScale,
    PieController,
    SubTitle,
    Title,
    Tooltip,
} from "chart.js";
import { Grid } from "gridjs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import h from "vhtml";

import { SrsAlgorithm } from "src/algorithms/base/srs-algorithm";
import { textInterval } from "src/algorithms/osr/note-scheduling";
import { OsrCore } from "src/core";
import { CardListType } from "src/deck";
import { t } from "src/lang/helpers";
import { Stats } from "src/stats";
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

export class StatisticsView {
    private containerEl: HTMLElement;
    private osrCore: OsrCore;

    private forecastChart: Chart;
    private intervalsChart: Chart;
    private easesChart: Chart;
    private cardTypesChart: Chart;
    private noteStatsGrid: Grid;

    constructor(containerEl: HTMLElement, osrCore: OsrCore) {
        this.containerEl = containerEl;
        this.osrCore = osrCore;
    }

    render(): void {
        this.containerEl.style.textAlign = "center";

        this.containerEl.innerHTML += (
            <select id="sr-chart-period">
                <option value="month" selected>
                    {t("MONTH")}
                </option>
                <option value="quarter">{t("QUARTER")}</option>
                <option value="year">{t("YEAR")}</option>
                <option value="lifetime">{t("LIFETIME")}</option>
            </select>
        );

        // Add forecast
        const cardStats: Stats = this.osrCore.cardStats;
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

        this.containerEl.innerHTML += (
            <div>
                <canvas id="forecastChart"></canvas>
                <span id="forecastChartSummary"></span>
                <br />
                <br />
                <canvas id="intervalsChart"></canvas>
                <span id="intervalsChartSummary"></span>
                <br />
                <br />
                <canvas id="easesChart"></canvas>
                <span id="easesChartSummary"></span>
                <br />
                <br />
                <canvas id="cardTypesChart"></canvas>
                <br />
                <span id="cardTypesChartSummary"></span>
                <br />
                <br />
                <h1>Notes</h1>
                <div id="noteStats"></div>
            </div>
        );

        this.forecastChart = createStatsChart(
            "bar",
            "forecastChart",
            t("FORECAST"),
            t("FORECAST_DESC"),
            Object.keys(dueDatesFlashcardsCopy),
            Object.values(dueDatesFlashcardsCopy),
            t("REVIEWS_PER_DAY", { avg: (scheduledCount / maxN).toFixed(1) }),
            t("SCHEDULED"),
            t("DAYS"),
            t("NUMBER_OF_CARDS"),
        );

        maxN = cardStats.intervals.getMaxValue();
        for (let interval = 0; interval <= maxN; interval++) {
            cardStats.intervals.clearCountIfMissing(interval);
        }

        // Add intervals
        const averageInterval: string = textInterval(
                Math.round(
                    (cardStats.intervals.getTotalOfValueMultiplyCount() / scheduledCount) * 10,
                ) / 10 || 0,
                false,
            ),
            longestInterval: string = textInterval(cardStats.intervals.getMaxValue(), false);

        this.intervalsChart = createStatsChart(
            "bar",
            "intervalsChart",
            t("INTERVALS"),
            t("INTERVALS_DESC"),
            Object.keys(cardStats.intervals.dict),
            Object.values(cardStats.intervals.dict),
            t("INTERVALS_SUMMARY", { avg: averageInterval, longest: longestInterval }),
            t("COUNT"),
            t("DAYS"),
            t("NUMBER_OF_CARDS"),
        );

        // Add eases
        const eases: number[] = getKeysPreserveType(cardStats.eases.dict);
        for (let ease = Math.min(...eases); ease <= Math.max(...eases); ease++) {
            cardStats.eases.clearCountIfMissing(ease);
        }
        const averageEase: number =
            Math.round(cardStats.eases.getTotalOfValueMultiplyCount() / scheduledCount) || 0;

        this.easesChart = createStatsChart(
            "bar",
            "easesChart",
            t("EASES"),
            "",
            Object.keys(cardStats.eases.dict),
            Object.values(cardStats.eases.dict),
            t("EASES_SUMMARY", { avgEase: averageEase }),
            t("COUNT"),
            t("EASES"),
            t("NUMBER_OF_CARDS"),
        );

        // Add card types
        const totalCardsCount: number = this.osrCore.reviewableDeckTree.getDistinctCardCount(
            CardListType.All,
            true,
        );
        this.cardTypesChart = createStatsChart(
            "pie",
            "cardTypesChart",
            t("CARD_TYPES"),
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

        const noteEases = mapRecord(
            SrsAlgorithm.getInstance().noteStats().dict,
            (key: string, value: number): [string, number] => [
                path.parse(key).name,
                Math.round(value),
            ],
        );

        this.noteStatsGrid = new Grid({
            columns: [
                {
                    name: t("NOTE"),
                },
                {
                    name: t("EASE"),
                    sort: true,
                    width: "200px",
                },
            ],
            search: true,
            autoWidth: false,
            data: Object.entries(noteEases).sort((a, b) => b[1] - a[1]),
            pagination: {
                limit: 10,
                summary: false,
            },
            language: {
                search: {
                    placeholder: t("SEARCH"),
                },
                pagination: {
                    previous: t("PREVIOUS"),
                    next: t("NEXT"),
                },
            },
        });
        this.noteStatsGrid.render(document.getElementById("noteStats"));
    }

    destroy(): void {
        this.forecastChart.destroy();
        this.intervalsChart.destroy();
        this.easesChart.destroy();
        this.cardTypesChart.destroy();
        this.noteStatsGrid.destroy();
    }
}

function createStatsChart(
    type: keyof ChartTypeRegistry,
    canvasId: string,
    title: string,
    subtitle: string,
    labels: string[],
    data: number[],
    summary: string,
    seriesTitle = "",
    xAxisTitle = "",
    yAxisTitle = "",
): Chart {
    const style = getComputedStyle(document.body);
    const textColor = style.getPropertyValue("--text-normal");

    let scales = {},
        backgroundColor = ["#2196f3"];
    if (type !== "pie") {
        scales = {
            x: {
                title: {
                    display: true,
                    text: xAxisTitle,
                    color: textColor,
                },
            },
            y: {
                title: {
                    display: true,
                    text: yAxisTitle,
                    color: textColor,
                },
            },
        };
    } else {
        backgroundColor = ["#2196f3", "#4caf50", "green"];
    }

    const shouldFilter = canvasId === "forecastChart" || canvasId === "intervalsChart";

    const statsChart = new Chart(document.getElementById(canvasId) as HTMLCanvasElement, {
        type,
        data: {
            labels: shouldFilter ? labels.slice(0, 31) : labels,
            datasets: [
                {
                    label: seriesTitle,
                    backgroundColor,
                    data: shouldFilter ? data.slice(0, 31) : data,
                },
            ],
        },
        options: {
            scales,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 22,
                    },
                    color: textColor,
                },
                subtitle: {
                    display: true,
                    text: subtitle,
                    font: {
                        size: 16,
                        style: "italic",
                    },
                    color: textColor,
                },
                legend: {
                    display: false,
                },
            },
            aspectRatio: 2,
        },
    });

    if (shouldFilter) {
        const chartPeriodEl = document.getElementById("sr-chart-period") as HTMLSelectElement;
        chartPeriodEl.addEventListener("click", () => {
            let filteredLabels, filteredData;
            const chartPeriod = chartPeriodEl.value;
            if (chartPeriod === "month") {
                filteredLabels = labels.slice(0, 31);
                filteredData = data.slice(0, 31);
            } else if (chartPeriod === "quarter") {
                filteredLabels = labels.slice(0, 91);
                filteredData = data.slice(0, 91);
            } else if (chartPeriod === "year") {
                filteredLabels = labels.slice(0, 366);
                filteredData = data.slice(0, 366);
            } else {
                filteredLabels = labels;
                filteredData = data;
            }

            statsChart.data.labels = filteredLabels;
            statsChart.data.datasets[0] = {
                label: seriesTitle,
                backgroundColor,
                data: filteredData,
            };
            statsChart.update();
        });
    }

    document.getElementById(`${canvasId}Summary`).innerText = summary;

    return statsChart;
}
