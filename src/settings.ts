import { Notice, PluginSettingTab, Setting, App } from "obsidian";
import type SRPlugin from "./main";

export interface SRSettings {
    baseEase: number;
    maxLinkFactor: number;
    openRandomNote: boolean;
    lapsesIntervalChange: number;
    autoNextNote: boolean;
    tagsToReview: string[];
    flashcardsTag: string;
    singleLineCommentOnSameLine: boolean;
}

export const DEFAULT_SETTINGS: SRSettings = {
    baseEase: 250,
    maxLinkFactor: 1.0,
    openRandomNote: false,
    lapsesIntervalChange: 0.5,
    autoNextNote: false,
    tagsToReview: ["#review"],
    flashcardsTag: "#flashcards",
    singleLineCommentOnSameLine: false,
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
            .setName("Save comment for single-line notes on the same line?")
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
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.data.settings.autoNextNote)
                    .onChange(async (value) => {
                        this.plugin.data.settings.autoNextNote = value;
                        await this.plugin.savePluginData();
                    })
            );

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

        let helpEl = containerEl.createDiv("sr-help-div");
        helpEl.innerHTML =
            '<a href="https://github.com/st3v3nmw/obsidian-spaced-repetition/blob/master/README.md">For more information, check the README.</a>';
    }
}
