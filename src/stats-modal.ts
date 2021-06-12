import { Modal, App, MarkdownRenderer, Notice, Platform } from "obsidian";

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

        let text = "```chart\n" +
	                    "\ttype: bar\n" +
	                    `\tlabels: [${Object.keys(this.dueDatesFlashcards)}]\n` +
	                    "\tseries:\n" +
	                    "\t\t- title: Scheduled\n" +
		                `\t\t  data: [${Object.values(this.dueDatesFlashcards)}]\n` +
	                    '\txTitle: "Days"\n' +
	                    '\tyTitle: "Number of cards"\n' +
	                    '\tlegend: false\n' +
	                    '\tstacked: true\n' +
                    "````";

        MarkdownRenderer.renderMarkdown(
            text,
            contentEl,
            null,
            null
        );
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}
