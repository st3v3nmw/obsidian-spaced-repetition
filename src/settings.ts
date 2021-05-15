import { Notice, PluginSettingTab, Setting, App } from "obsidian";
import type SRPlugin from "./main";
import { SRSettings } from "./types";

export const DEFAULT_SETTINGS: SRSettings = {
    // flashcards
    flashcardTags: ["#flashcards"],
    singleLineCommentOnSameLine: false,
    buryRelatedCards: false,
    // notes
    tagsToReview: ["#review"],
    openRandomNote: false,
    autoNextNote: false,
    disableFileMenuReviewOptions: false,
    // algorithm
    baseEase: 250,
    lapsesIntervalChange: 0.5,
    easyBonus: 1.3,
    maximumInterval: 36525,
    maxLinkFactor: 1.0,
};

export function getSetting(
    settingName: keyof SRSettings,
    settingsObj: SRSettings
): any {
    let value: any = settingsObj[settingName];
    value ??= DEFAULT_SETTINGS[settingName];
    return value;
}

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
            'For more information, check the <a href="https://github.com/st3v3nmw/obsidian-spaced-repetition/wiki">wiki</a>.';

        containerEl.createDiv().innerHTML = "<h3>Flashcards</h3>";

        new Setting(containerEl)
            .setName("Flashcard tags")
            .setDesc(
                "Enter tags separated by spaces i.e. #flashcards #deck2 #deck3."
            )
            .addTextArea((text) =>
                text
                    .setValue(
                        `${getSetting(
                            "flashcardTags",
                            this.plugin.data.settings
                        ).join(" ")}`
                    )
                    .onChange(async (value) => {
                        this.plugin.data.settings.flashcardTags =
                            value.split(" ");
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
                        getSetting(
                            "singleLineCommentOnSameLine",
                            this.plugin.data.settings
                        )
                    )
                    .onChange(async (value) => {
                        this.plugin.data.settings.singleLineCommentOnSameLine =
                            value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName("Bury related cards until the next review session?")
            .setDesc("This applies to other cloze deletions in cloze cards")
            .addToggle((toggle) =>
                toggle
                    .setValue(
                        getSetting(
                            "buryRelatedCards",
                            this.plugin.data.settings
                        )
                    )
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
                        `${getSetting(
                            "tagsToReview",
                            this.plugin.data.settings
                        ).join(" ")}`
                    )
                    .onChange(async (value) => {
                        this.plugin.data.settings.tagsToReview =
                            value.split(" ");
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
                    .setValue(
                        getSetting("openRandomNote", this.plugin.data.settings)
                    )
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
                    .setValue(
                        getSetting("autoNextNote", this.plugin.data.settings)
                    )
                    .onChange(async (value) => {
                        this.plugin.data.settings.autoNextNote = value;
                        await this.plugin.savePluginData();
                    })
            );

        new Setting(containerEl)
            .setName(
                "Disable review options in the file menu i.e. Review: Easy Good Hard"
            )
            .setDesc(
                "After disabling, you can review using the command hotkeys. Reload Obsidian after changing this."
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(
                        getSetting(
                            "disableFileMenuReviewOptions",
                            this.plugin.data.settings
                        )
                    )
                    .onChange(async (value) => {
                        this.plugin.data.settings.disableFileMenuReviewOptions =
                            value;
                        await this.plugin.savePluginData();
                    })
            );

        containerEl.createDiv().innerHTML = "<h3>Algorithm</h3>";

        containerEl.createDiv().innerHTML =
            'For more information, check the <a href="https://github.com/st3v3nmw/obsidian-spaced-repetition/wiki/Spaced-Repetition-Algorithm">algorithm implementation</a>.';

        new Setting(containerEl)
            .setName("Base ease")
            .setDesc("minimum = 130, preferrably approximately 250")
            .addText((text) =>
                text
                    .setValue(
                        `${getSetting("baseEase", this.plugin.data.settings)}`
                    )
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
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.baseEase =
                            DEFAULT_SETTINGS.baseEase;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName("Interval change when you review a flashcard/note as hard")
            .setDesc("newInterval = oldInterval * intervalChange / 100")
            .addSlider((slider) =>
                slider
                    .setLimits(1, 99, 1)
                    .setValue(
                        getSetting(
                            "lapsesIntervalChange",
                            this.plugin.data.settings
                        ) * 100
                    )
                    .setDynamicTooltip()
                    .onChange(async (value: number) => {
                        this.plugin.data.settings.lapsesIntervalChange = value;
                        await this.plugin.savePluginData();
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.lapsesIntervalChange =
                            DEFAULT_SETTINGS.lapsesIntervalChange;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName("Easy bonus")
            .setDesc(
                "The easy bonus allows you to set the difference in intervals between answering Good and Easy on a flashcard/note (minimum = 100%)"
            )
            .addText((text) =>
                text
                    .setValue(
                        `${
                            getSetting("easyBonus", this.plugin.data.settings) *
                            100
                        }`
                    )
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
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.easyBonus =
                            DEFAULT_SETTINGS.easyBonus;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName("Maximum Interval")
            .setDesc(
                "Allows you to place an upper limit on the interval (default = 100 years)"
            )
            .addText((text) =>
                text
                    .setValue(
                        `${getSetting(
                            "maximumInterval",
                            this.plugin.data.settings
                        )}`
                    )
                    .onChange(async (value) => {
                        let numValue: number = Number.parseInt(value);
                        if (!isNaN(numValue)) {
                            if (numValue < 1) {
                                new Notice(
                                    "The maximum interval must be at least 1 day."
                                );
                                text.setValue(
                                    `${this.plugin.data.settings.maximumInterval}`
                                );
                                return;
                            }

                            this.plugin.data.settings.maximumInterval =
                                numValue;
                            await this.plugin.savePluginData();
                        } else {
                            new Notice("Please provide a valid number.");
                        }
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.maximumInterval =
                            DEFAULT_SETTINGS.maximumInterval;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });

        new Setting(containerEl)
            .setName("Maximum link contribution")
            .setDesc(
                "Max. contribution of the weighted ease of linked notes to the initial ease"
            )
            .addSlider((slider) =>
                slider
                    .setLimits(0, 100, 1)
                    .setValue(
                        getSetting("maxLinkFactor", this.plugin.data.settings) *
                            100
                    )
                    .setDynamicTooltip()
                    .onChange(async (value: number) => {
                        this.plugin.data.settings.maxLinkFactor = value;
                        await this.plugin.savePluginData();
                    })
            )
            .addExtraButton((button) => {
                button
                    .setIcon("reset")
                    .setTooltip("Reset to default")
                    .onClick(async () => {
                        this.plugin.data.settings.maxLinkFactor =
                            DEFAULT_SETTINGS.maxLinkFactor;
                        await this.plugin.savePluginData();
                        this.display();
                    });
            });
    }
}
