import { Notice, PluginSettingTab, Setting, App } from "obsidian";
import type SRPlugin from "./main";

export interface SRSettings {
    // flashcards
    flashcardsTag: string;
    singleLineCommentOnSameLine: boolean;
    buryRelatedCards: boolean;
    // notes
    tagsToReview: string[];
    openRandomNote: boolean;
    autoNextNote: boolean;
    // algorithm
    baseEase: number;
    maxLinkFactor: number;
    lapsesIntervalChange: number;
    easyBonus: number;
}

export const DEFAULT_SETTINGS: SRSettings = {
    // flashcards
    flashcardsTag: "#flashcards",
    singleLineCommentOnSameLine: false,
    buryRelatedCards: false,
    // notes
    tagsToReview: ["#review"],
    openRandomNote: false,
    autoNextNote: false,
    // algorithm
    baseEase: 250,
    maxLinkFactor: 1.0,
    lapsesIntervalChange: 0.5,
    easyBonus: 1.3,
};

export class SRSettingTab extends PluginSettingTab {
    private plugin: SRPlugin;

    constructor(app: App, plugin: SRPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        let { containerEl } = this;

        containerEl.empty();

        containerEl.createDiv().innerHTML =
            "<h2>Spaced Repetition Plugin - Settings</h2>";

        containerEl.createDiv().innerHTML =
            'For more information, check the <a href="https://github.com/st3v3nmw/obsidian-spaced-repetition/blob/master/README.md">README</a>.';

        containerEl.createDiv().innerHTML = "<h3>Flashcards</h3>";

        new Setting(containerEl)
            .setName("Flashcards tag")
            .setDesc("Enter one tag i.e. #flashcards.")
            .addText((text) =>
                text
                    .setValue(`${this.plugin.data.settings.flashcardsTag}`)
                    .onChange(async (value) => {
                        this.plugin.data.settings.flashcardsTag = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName(
                "Save scheduling comment for single-line flashcards on the same line?"
            )
            .setDesc(
                "Turning this on will make the HTML comments not break list formatting"
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(
                        this.plugin.data.settings.singleLineCommentOnSameLine
                    )
                    .onChange(async (value) => {
                        this.plugin.data.settings.singleLineCommentOnSameLine = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Bury related cards until the next day?")
            .setDesc("This applies to other cloze deletions in cloze cards")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.buryRelatedCards)
                    .onChange(async (value) => {
                        this.plugin.data.settings.buryRelatedCards = value;
                        await this.plugin.savePluginData();
                    })
            );

        containerEl.createDiv().innerHTML = "<h3>Notes</h3>";

        new Setting(containerEl)
            .setName("Tags to review")
            .setDesc("Enter tags separated by spaces i.e. #review #tag2 #tag3.")
            .addTextArea((text) =>
                text
                    .setValue(
                        `${this.plugin.data.settings.tagsToReview.join(" ")}`
                    )
                    .onChange(async (value) => {
                        this.plugin.data.settings.tagsToReview = value.split(
                            " "
                        );
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Open a random note for review")
            .setDesc(
                "When you turn this off, notes are ordered by importance (PageRank)"
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.openRandomNote)
                    .onChange(async (value) => {
                        this.plugin.data.settings.openRandomNote = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Open next note automatically after a review")
            .setDesc("For faster reviews")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.autoNextNote)
                    .onChange(async (value) => {
                        this.plugin.data.settings.autoNextNote = value;
                        await this.plugin.savePluginData();
                    })
            );

        containerEl.createDiv().innerHTML = "<h3>Algorithm</h3>";

        containerEl.createDiv().innerHTML =
            'For more information, check the <a href="https://github.com/st3v3nmw/obsidian-spaced-repetition/blob/master/docs/Algorithm.md">algorithm implementation</a>.';

        new Setting(containerEl)
            .setName("Base ease")
            .setDesc("minimum = 130, preferrably approximately 250")
            .addText((text) =>
                text
                    .setValue(`${this.plugin.data.settings.baseEase}`)
                    .onChange(async (value) => {
                        let numValue: number = Number.parseInt(value);
                        if (!isNaN(numValue)) {
                            if (numValue < 130) {
                                new Notice(
                                    "The base ease must be at least 130."
                                );
                                text.setValue(
                                    `${this.plugin.data.settings.baseEase}`
                                );
                                return;
                            }

                            this.plugin.data.settings.baseEase = numValue;
                            await this.plugin.savePluginData();
                        } else {
                            new Notice("Please provide a valid number.");
                        }
                    })
            );

        new Setting(containerEl)
            .setName("Interval change when you review a note/concept as hard")
            .setDesc(
                "newInterval = oldInterval * intervalChange / 100, 0% < intervalChange < 100%"
            )
            .addText((text) =>
                text
                    .setValue(
                        `${
                            this.plugin.data.settings.lapsesIntervalChange * 100
                        }`
                    )
                    .onChange(async (value) => {
                        let numValue: number = Number.parseInt(value) / 100;
                        if (!isNaN(numValue)) {
                            if (numValue < 0.01 || numValue > 0.99) {
                                new Notice(
                                    "The load balancing threshold must be in the range 0% < intervalChange < 100%."
                                );
                                text.setValue(
                                    `${
                                        this.plugin.data.settings
                                            .lapsesIntervalChange * 100
                                    }`
                                );
                                return;
                            }

                            this.plugin.data.settings.lapsesIntervalChange = numValue;
                            await this.plugin.savePluginData();
                        } else {
                            new Notice("Please provide a valid number.");
                        }
                    })
            );

        console.log(this.plugin.data);

        new Setting(containerEl)
            .setName("Easy bonus")
            .setDesc(
                "The easy bonus allows you to set the difference in intervals between answering Good and Easy on a card (minimum = 100%)"
            )
            .addText((text) =>
                text
                    .setValue(`${this.plugin.data.settings.easyBonus * 100}`)
                    .onChange(async (value) => {
                        let numValue: number = Number.parseInt(value) / 100;
                        if (!isNaN(numValue)) {
                            if (numValue < 1.0) {
                                new Notice(
                                    "The easy bonus must be at least 100."
                                );
                                text.setValue(
                                    `${
                                        this.plugin.data.settings.easyBonus *
                                        100
                                    }`
                                );
                                return;
                            }

                            this.plugin.data.settings.easyBonus = numValue;
                            await this.plugin.savePluginData();
                        } else {
                            new Notice("Please provide a valid number.");
                        }
                    })
            );

        new Setting(containerEl)
            .setName("Maximum link contribution")
            .setDesc(
                "Max. contribution of the weighted ease of linked notes to the initial ease (0% <= maxLinkFactor <= 100%)"
            )
            .addText((text) =>
                text
                    .setValue(
                        `${this.plugin.data.settings.maxLinkFactor * 100}`
                    )
                    .onChange(async (value) => {
                        let numValue: number = Number.parseInt(value) / 100;
                        if (!isNaN(numValue)) {
                            if (numValue < 0 || numValue > 1.0) {
                                new Notice(
                                    "The link factor must be in the range 0% <= maxLinkFactor <= 100%."
                                );
                                text.setValue(
                                    `${
                                        this.plugin.data.settings
                                            .maxLinkFactor * 100
                                    }`
                                );
                                return;
                            }

                            this.plugin.data.settings.maxLinkFactor = numValue;
                            await this.plugin.savePluginData();
                        } else {
                            new Notice("Please provide a valid number.");
                        }
                    })
            );
    }
}
