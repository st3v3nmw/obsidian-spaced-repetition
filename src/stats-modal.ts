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

        this.titleEl.setText(t("Statistics"));

        this.modalEl.style.height = "100%";
        this.modalEl.style.width = "100%";

        if (Platform.isMobile) {
            this.contentEl.style.display = "block";
        }
    }

    onOpen(): void {
        let { contentEl } = this;

        // @ts-ignore: Property 'plugins' does not exist on type 'App'
        if (!this.app.plugins.enabledPlugins.has(OBSIDIAN_CHARTS_ID)) {
            contentEl.innerHTML +=
                "<div style='text-align:center'>" +
                "<span>" +
                t("Note that this requires the Obsidian Charts plugin to work") +
                "</span>" +
                "</div>";
            return;
        }

        let text: string = "";

        // Add forecast
        let maxN: number = Math.max(...getKeysPreserveType(this.plugin.dueDatesFlashcards));
        for (let dueOffset = 0; dueOffset <= maxN; dueOffset++) {
            if (!this.plugin.dueDatesFlashcards.hasOwnProperty(dueOffset)) {
                this.plugin.dueDatesFlashcards[dueOffset] = 0;
            }
        }

        let dueDatesFlashcardsCopy: Record<number, number> = { 0: 0 };
        for (let [dueOffset, dueCount] of Object.entries(this.plugin.dueDatesFlashcards)) {
            if (dueOffset <= 0) {
                dueDatesFlashcardsCopy[0] += dueCount;
            } else {
                dueDatesFlashcardsCopy[dueOffset] = dueCount;
            }
        }

        let cardStats: Stats = this.plugin.cardStats;
        let scheduledCount: number = cardStats.youngCount + cardStats.matureCount;
        maxN = Math.max(maxN, 1);

        // let the horrors begin LOL
        text +=
            "\n<div style='text-align:center'>" +
            "<h2 style='text-align:center'>" +
            t("Forecast") +
            "</h2>" +
            "<p style='text-align:center'>" +
            t("The number of cards due in the future") +
            "</p>" +
            "</div>\n\n" +
            "```chart\n" +
            "\ttype: bar\n" +
            `\tlabels: [${Object.keys(dueDatesFlashcardsCopy)}]\n` +
            "\tseries:\n" +
            "\t\t- title: " +
            t("Scheduled") +
            `\n\t\t  data: [${Object.values(dueDatesFlashcardsCopy)}]\n` +
            "\txTitle: " +
            t("Days") +
            "\n\tyTitle: " +
            t("Number of cards") +
            "\n\tlegend: false\n" +
            "\tstacked: true\n" +
            "````\n" +
            "\n<div style='text-align:center'>" +
            `Average: ${(scheduledCount / maxN).toFixed(1)} reviews/day` +
            "</div>";

        maxN = Math.max(...getKeysPreserveType(cardStats.intervals));
        for (let interval = 0; interval <= maxN; interval++) {
            if (!cardStats.intervals.hasOwnProperty(interval)) {
                cardStats.intervals[interval] = 0;
            }
        }

        // Add intervals
        let average_interval: string = textInterval(
                Math.round(
                    (Object.entries(cardStats.intervals)
                        .map(([interval, count]) => interval * count)
                        .reduce((a, b) => a + b) /
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
            t("Intervals") +
            "</h2>" +
            "<p style='text-align:center'>" +
            t("Delays until reviews are shown again") +
            "</p>" +
            "</div>\n\n" +
            "```chart\n" +
            "\ttype: bar\n" +
            `\tlabels: [${Object.keys(cardStats.intervals)}]\n` +
            "\tseries:\n" +
            "\t\t- title: " +
            t("Count") +
            `\n\t\t  data: [${Object.values(cardStats.intervals)}]\n` +
            "\txTitle: " +
            t("Days") +
            "\n\tyTitle: " +
            t("Number of cards") +
            "\n\tlegend: false\n" +
            "\tstacked: true\n" +
            "````\n" +
            "\n<div style='text-align:center'>" +
            `Average interval: ${average_interval}, ` +
            `Longest interval: ${longest_interval}` +
            "</div>";

        // Add eases
        let average_ease: number = Math.round(
            Object.entries(cardStats.eases)
                .map(([ease, count]) => ease * count)
                .reduce((a, b) => a + b) / scheduledCount
        );
        text +=
            "\n<div style='text-align:center'>" +
            "<h2 style='text-align:center'>" +
            t("Eases") +
            "</h2>" +
            "</div>\n\n" +
            "```chart\n" +
            "\ttype: bar\n" +
            `\tlabels: [${Object.keys(cardStats.eases)}]\n` +
            "\tseries:\n" +
            "\t\t- title: " +
            t("Count") +
            `\n\t\t  data: [${Object.values(cardStats.eases)}]\n` +
            "\txTitle: " +
            t("Days") +
            "\n\tyTitle: " +
            t("Number of cards") +
            "\n\tlegend: false\n" +
            "\tstacked: true\n" +
            "````\n" +
            "\n<div style='text-align:center'>" +
            `Average ease: ${average_ease}` +
            "</div>";

        // Add card types
        let totalCards: number = this.plugin.deckTree.totalFlashcards;
        text +=
            "\n<div style='text-align:center'>" +
            "<h2 style='text-align:center'>" +
            t("Card Types") +
            "</h2>" +
            "<p style='text-align:center'>" +
            t("This includes buried cards as well, if any") +
            "</p>" +
            "</div>\n\n" +
            "```chart\n" +
            "\ttype: pie\n" +
            `\tlabels: ['New - ${Math.round(
                (cardStats.newCount / totalCards) * 100
            )}%', 'Young - ${Math.round(
                (cardStats.youngCount / totalCards) * 100
            )}%', 'Mature - ${Math.round((cardStats.matureCount / totalCards) * 100)}%']\n` +
            `\tseries:\n` +
            `\t\t- data: [${cardStats.newCount}, ${cardStats.youngCount}, ${cardStats.matureCount}]\n` +
            "\twidth: 40%\n" +
            "\tlabelColors: true\n" +
            "```\n" +
            "\n<div style='text-align:center'>" +
            `Total cards: ${totalCards}` +
            "</div>";

        MarkdownRenderer.renderMarkdown(text, contentEl, "", this.plugin);
    }

    onClose(): void {
        let { contentEl } = this;
        contentEl.empty();
    }
}
