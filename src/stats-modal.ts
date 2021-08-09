import { Modal, App, MarkdownRenderer, Notice, Platform } from "obsidian";
import { getKeysPreserveType } from "./utils";

export class StatsModal extends Modal {
    private dueDatesFlashcards: Record<number, number>;

    constructor(app: App, dueDatesFlashcards: Record<number, number>) {
        super(app);

        this.dueDatesFlashcards = dueDatesFlashcards;

        this.titleEl.setText("Statistics");

        if (Platform.isMobile) {
            this.modalEl.style.height = "100%";
            this.modalEl.style.width = "100%";
            this.contentEl.style.display = "block";
        } else {
            this.modalEl.style.height = "100%";
            this.modalEl.style.width = "100%";
        }
    }

    onOpen() {
        let { contentEl } = this;

        contentEl.innerHTML +=
            "<div style='text-align:center'>" +
            "<span>Note that this requires the Obsidian Charts plugin to work</span>" +
            "<h2 style='text-align:center'>Forecast</h2>" +
            "<h4 style='text-align:center'>The number of cards due in the future</h4>" +
            "</div>";

        let maxN: number = Math.max(
            ...getKeysPreserveType(this.dueDatesFlashcards)
        );
        for (let dueOffset = 0; dueOffset <= maxN; dueOffset++) {
            if (!this.dueDatesFlashcards.hasOwnProperty(dueOffset))
                this.dueDatesFlashcards[dueOffset] = 0;
        }

        let dueDatesFlashcardsCopy: Record<number, number> = { 0: 0 };
        for (let [dueOffset, dueCount] of Object.entries(
            this.dueDatesFlashcards
        )) {
            if (dueOffset <= 0) dueDatesFlashcardsCopy[0] += dueCount;
            else dueDatesFlashcardsCopy[dueOffset] = dueCount;
        }

        let text =
            "```chart\n" +
            "\ttype: bar\n" +
            `\tlabels: [${Object.keys(dueDatesFlashcardsCopy)}]\n` +
            "\tseries:\n" +
            "\t\t- title: Scheduled\n" +
            `\t\t  data: [${Object.values(dueDatesFlashcardsCopy)}]\n` +
            '\txTitle: "Days"\n' +
            '\tyTitle: "Number of cards"\n' +
            "\tlegend: false\n" +
            "\tstacked: true\n" +
            "````";

        MarkdownRenderer.renderMarkdown(text, contentEl, null, null);
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}
