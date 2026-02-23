import { Chart, ChartTypeRegistry } from "chart.js";

import SettingsItemOverrideComponent from "src/gui/content-container/settings-page/statistics-page/settings-item-override-component";

export default class ChartComponent extends SettingsItemOverrideComponent {
    private canvasContainerEl: HTMLDivElement;
    private canvasEl: HTMLCanvasElement;
    private summaryEl: HTMLDivElement;
    private chart: Chart;

    constructor(
        parentContainerEl: HTMLElement,
        canvasId: string,
        summaryId: string,
        type: keyof ChartTypeRegistry,
        title: string,
        subtitle: string,
        labels: string[],
        data: number[],
        summary: string,
        seriesTitle = "",
        xAxisTitle = "",
        yAxisTitle = "",
    ) {
        super(parentContainerEl);
        this.containerEl.addClass("sr-chart-container");
        this.canvasContainerEl = this.containerEl.createDiv();
        this.canvasContainerEl.addClass("sr-chart-canvas-container");
        this.canvasEl = this.canvasContainerEl.createEl("canvas");
        this.canvasEl.id = canvasId;
        this.summaryEl = this.containerEl.createDiv();
        this.summaryEl.id = summaryId;

        const style = getComputedStyle(document.body);
        const textColor = style.getPropertyValue("--text-normal");

        let scales = {};
        let backgroundColor = ["#2196f3"];

        if (type !== "pie") {
            scales = {
                x: {
                    title: {
                        display: xAxisTitle !== "",
                        text: xAxisTitle,
                        color: textColor,
                    },
                },
                y: {
                    title: {
                        display: yAxisTitle !== "",
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
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                scales,
                plugins: {
                    title: {
                        display: title !== "",
                        text: title,
                        font: {
                            size: 22,
                        },
                        color: textColor,
                    },
                    subtitle: {
                        display: subtitle !== "",
                        text: subtitle,
                        font: {
                            size: 16,
                            style: "italic",
                        },
                        color: textColor,
                        padding: { top: 0, bottom: 24 },
                    },
                    legend: {
                        display: false,
                    },
                },
                aspectRatio: 2,
                responsive: true,
                animation: {
                    duration: 0,
                }
            },
        });

        if (shouldFilter) {
            const chartPeriodEl = document.getElementById("sr-chart-period") as HTMLSelectElement;
            chartPeriodEl.addEventListener("change", () => {
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
                    ...statsChart.data.datasets[0],
                    label: seriesTitle,
                    backgroundColor,
                    data: filteredData,
                };
                statsChart.update();
            });
        }

        document.getElementById(`${canvasId}Summary`).innerText = summary;
        document.getElementById(`${canvasId}Summary`).style.textAlign =
            canvasId === "cardTypesChart" ? "right" : "center";

        this.chart = statsChart;
    }

    public destroy(): void {
        if (this.chart) this.chart.destroy();
        this.containerEl.empty();
    }
}
