import { Modal, App, MarkdownRenderer, Platform } from "obsidian";
import type SRPlugin from "src/main";
import { getKeysPreserveType } from "src/utils";
import { t } from "src/lang/helpers";

export class StatsModal extends Modal {
    private plugin: SRPlugin;
    private dueDatesFlashcards: Record<number, number>;

    constructor(app: App, dueDatesFlashcards: Record<number, number>, plugin: SRPlugin) {
        super(app);

        this.plugin = plugin;
        this.dueDatesFlashcards = dueDatesFlashcards;

        this.titleEl.setText(t("Statistics"));

        this.modalEl.style.height = "100%";
        this.modalEl.style.width = "100%";

        if (Platform.isMobile) {
            this.contentEl.style.display = "block";
        }
    }

    onOpen(): void {
        let { contentEl } = this;

        contentEl.innerHTML +=
            "<div style='text-align:center'>" +
            "<span>" +
            t("Note that this requires the Obsidian Charts plugin to work") +
            "</span>" +
            "<h2 style='text-align:center'>" +
            t("Forecast") +
            "</h2>" +
            "<h4 style='text-align:center'>" +
            t("The number of cards due in the future") +
            "</h4>" +
            "</div>";

        let maxN: number = Math.max(...getKeysPreserveType(this.dueDatesFlashcards));
        for (let dueOffset = 0; dueOffset <= maxN; dueOffset++) {
            if (!this.dueDatesFlashcards.hasOwnProperty(dueOffset)) {
                this.dueDatesFlashcards[dueOffset] = 0;
            }
        }

        let dueDatesFlashcardsCopy: Record<number, number> = { 0: 0 };
        for (let [dueOffset, dueCount] of Object.entries(this.dueDatesFlashcards)) {
            if (dueOffset <= 0) {
                dueDatesFlashcardsCopy[0] += dueCount;
            } else {
                dueDatesFlashcardsCopy[dueOffset] = dueCount;
            }
        }

        let text: string =
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
            "````";

        MarkdownRenderer.renderMarkdown(text, contentEl, "", this.plugin);
    }

    onClose(): void {
        let { contentEl } = this;
        contentEl.empty();
    }
}
