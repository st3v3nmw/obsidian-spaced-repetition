import { Modal, App, MarkdownRenderer, Platform } from "obsidian";

import type SRPlugin from "src/main";
import { getKeysPreserveType } from "src/utils";
import { textInterval } from "src/scheduling";
import { OBSIDIAN_CHARTS_ID } from "src/constants";
import { t } from "src/lang/helpers";

export interface Stats {
    eases: Record<number, number>;
    intervals: Record<number, number>;
    newCount: number;
    youngCount: number;
    matureCount: number;
}

export class StatsModal extends Modal {
    private plugin: SRPlugin;

    constructor(app: App, plugin: SRPlugin) {
        super(app);

        this.plugin = plugin;

        this.titleEl.setText(t("STATS_TITLE"));

        this.modalEl.style.height = "100%";
        this.modalEl.style.width = "100%";

        if (Platform.isMobile) {
            this.contentEl.style.display = "block";
        }
    }

    onOpen(): void {
        const { contentEl } = this;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (!this.app.plugins.enabledPlugins.has(OBSIDIAN_CHARTS_ID)) {
            contentEl.innerHTML +=
                "<div style='text-align:center'><span>" +
                t("OBSIDIAN_CHARTS_REQUIRED") +
                "</span></div>";
            return;
        }

        let text = "";

        // Add forecast
        let maxN: number = Math.max(...getKeysPreserveType(this.plugin.dueDatesFlashcards));
        for (let dueOffset = 0; dueOffset <= maxN; dueOffset++) {
            if (!Object.prototype.hasOwnProperty.call(this.plugin.dueDatesFlashcards, dueOffset)) {
                this.plugin.dueDatesFlashcards[dueOffset] = 0;
            }
        }

        const dueDatesFlashcardsCopy: Record<number, number> = { 0: 0 };
        for (const [dueOffset, dueCount] of Object.entries(this.plugin.dueDatesFlashcards)) {
            if (dueOffset <= 0) {
                dueDatesFlashcardsCopy[0] += dueCount;
            } else {
                dueDatesFlashcardsCopy[dueOffset] = dueCount;
            }
        }

        const cardStats: Stats = this.plugin.cardStats;
        const scheduledCount: number = cardStats.youngCount + cardStats.matureCount;
        maxN = Math.max(maxN, 1);

        // let the horrors begin LOL
        text +=
            "\n<div style='text-align:center'>" +
            "<h2 style='text-align:center'>" +
            t("FORECAST") +
            "</h2>" +
            "<p style='text-align:center'>" +
            t("FORECAST_DESC") +
            "</p>" +
            "</div>\n\n" +
            "```chart\n" +
            "\ttype: bar\n" +
            `\tlabels: [${Object.keys(dueDatesFlashcardsCopy)}]\n` +
            "\tseries:\n" +
            "\t\t- title: " +
            t("SCHEDULED") +
            `\n\t\t  data: [${Object.values(dueDatesFlashcardsCopy)}]\n` +
            "\txTitle: " +
            t("DAYS") +
            "\n\tyTitle: " +
            t("NUMBER_OF_CARDS") +
            "\n\tlegend: false\n" +
            "\tstacked: true\n" +
            "````\n" +
            "\n<div style='text-align:center'>" +
            t("REVIEWS_PER_DAY", { avg: (scheduledCount / maxN).toFixed(1) }) +
            "</div>";

        maxN = Math.max(...getKeysPreserveType(cardStats.intervals));
        for (let interval = 0; interval <= maxN; interval++) {
            if (!Object.prototype.hasOwnProperty.call(cardStats.intervals, interval)) {
                cardStats.intervals[interval] = 0;
            }
        }

        // Add intervals
        const average_interval: string = textInterval(
            Math.round(
                (Object.entries(cardStats.intervals)
                    .map(([interval, count]) => interval * count)
                    .reduce((a, b) => a + b, 0) /
                    scheduledCount) *
                10
            ) / 10,
            false
        ),
            longest_interval: string = textInterval(
                Math.max(...getKeysPreserveType(cardStats.intervals)),
                false
            );
        text +=
            "\n<div style='text-align:center'>" +
            "<h2 style='text-align:center'>" +
            t("INTERVALS") +
            "</h2>" +
            "<p style='text-align:center'>" +
            t("INTERVALS_DESC") +
            "</p>" +
            "</div>\n\n" +
            "```chart\n" +
            "\ttype: bar\n" +
            `\tlabels: [${Object.keys(cardStats.intervals)}]\n` +
            "\tseries:\n" +
            "\t\t- title: " +
            t("COUNT") +
            `\n\t\t  data: [${Object.values(cardStats.intervals)}]\n` +
            "\txTitle: " +
            t("DAYS") +
            "\n\tyTitle: " +
            t("NUMBER_OF_CARDS") +
            "\n\tlegend: false\n" +
            "\tstacked: true\n" +
            "````\n" +
            "\n<div style='text-align:center'>" +
            t("INTERVALS_SUMMARY", {
                avg: average_interval,
                longest: longest_interval,
            }) +
            "</div>";

        // Add eases
        const eases: number[] = getKeysPreserveType(cardStats.eases);
        for (let ease = Math.min(...eases); ease <= Math.max(...eases); ease++) {
            if (!Object.prototype.hasOwnProperty.call(cardStats.eases, ease)) {
                cardStats.eases[ease] = 0;
            }
        }
        const average_ease: number = Math.round(
            Object.entries(cardStats.eases)
                .map(([ease, count]) => ease * count)
                .reduce((a, b) => a + b, 0) / scheduledCount
        );
        text +=
            "\n<div style='text-align:center'>" +
            "<h2 style='text-align:center'>" +
            t("EASES") +
            "</h2>" +
            "</div>\n\n" +
            "```chart\n" +
            "\ttype: bar\n" +
            `\tlabels: [${Object.keys(cardStats.eases)}]\n` +
            "\tseries:\n" +
            "\t\t- title: " +
            t("COUNT") +
            `\n\t\t  data: [${Object.values(cardStats.eases)}]\n` +
            "\txTitle: " +
            t("EASES") +
            "\n\tyTitle: " +
            t("NUMBER_OF_CARDS") +
            "\n\tlegend: false\n" +
            "\tstacked: true\n" +
            "````\n" +
            "\n<div style='text-align:center'>" +
            t("EASES_SUMMARY", { avgEase: average_ease }) +
            "</div>";

        // Add card types
        const totalCardsCount: number = this.plugin.deckTree.totalFlashcards;
        text +=
            "\n<div style='text-align:center'>" +
            "<h2 style='text-align:center'>" +
            t("CARD_TYPES") +
            "</h2>" +
            "<p style='text-align:center'>" +
            t("CARD_TYPES_DESC") +
            "</p>" +
            "</div>\n\n" +
            "```chart\n" +
            "\ttype: pie\n" +
            `\tlabels: ['${t("CARD_TYPE_NEW")} - ${Math.round(
                (cardStats.newCount / totalCardsCount) * 100
            )}%', '${t("CARD_TYPE_YOUNG")} - ${Math.round(
                (cardStats.youngCount / totalCardsCount) * 100
            )}%', '${t("CARD_TYPE_MATURE")} - ${Math.round((cardStats.matureCount / totalCardsCount) * 100)}%']\n` +
            "\tseries:\n" +
            `\t\t- data: [${cardStats.newCount}, ${cardStats.youngCount}, ${cardStats.matureCount}]\n` +
            "\twidth: 40%\n" +
            "\tlabelColors: true\n" +
            "```\n" +
            "\n<div style='text-align:center'>" +
            t("CARD_TYPES_SUMMARY", { totalCardsCount }) +
            "</div>";

        MarkdownRenderer.renderMarkdown(text, contentEl, "", this.plugin);
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
