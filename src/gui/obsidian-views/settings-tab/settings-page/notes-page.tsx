import { Notice, Setting, SettingGroup } from "obsidian";

import { SettingsPage } from "src/gui/obsidian-views/settings-tab/settings-page/settings-page";
import { SettingsPageType } from "src/gui/obsidian-views/settings-tab/settings-page-manager";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { DEFAULT_SETTINGS } from "src/settings";

export class NotesPage extends SettingsPage {
    constructor(
        pageContainerEl: HTMLElement,
        plugin: SRPlugin,
        pageType: SettingsPageType,
        applySettingsUpdate: (callback: () => unknown) => void,
        display: () => void,
        openPage: (pageType: SettingsPageType) => void,
        scrollListener: (scrollPosition: number) => void,
    ) {
        super(pageContainerEl, plugin, pageType, applySettingsUpdate, display, openPage, scrollListener);

        new SettingGroup(this.containerEl)
            .setHeading(t("GROUP_TAGS_FOLDERS"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("TAGS_TO_REVIEW"))
                    .setDesc(t("TAGS_TO_REVIEW_DESC"))
                    .addTextArea((text) =>
                        text
                            .setValue(this.plugin.data.settings.tagsToReview.join(" "))
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.plugin.data.settings.tagsToReview = value.split(/\s+/);
                                    await this.plugin.savePluginData();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("FOLDERS_TO_IGNORE"))
                    .setDesc(t("FOLDERS_TO_IGNORE_DESC"))
                    .addTextArea((text) =>
                        text
                            .setValue(this.plugin.data.settings.noteFoldersToIgnore.join("\n"))
                            .onChange((value) => {
                                this.applySettingsUpdate(async () => {
                                    this.plugin.data.settings.noteFoldersToIgnore = value
                                        .split(/\n+/)
                                        .map((v) => v.trim())
                                        .filter((v) => v);
                                    await this.plugin.savePluginData();

                                    this.display();
                                });
                            }),
                    );
            });

        new SettingGroup(this.containerEl)
            .setHeading(t("NOTES_REVIEW_QUEUE"))
            .addSetting((setting: Setting) => {
                setting.setName(t("AUTO_NEXT_NOTE")).addToggle((toggle) =>
                    toggle
                        .setValue(this.plugin.data.settings.autoNextNote)
                        .onChange(async (value) => {
                            this.plugin.data.settings.autoNextNote = value;
                            await this.plugin.savePluginData();
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("OPEN_RANDOM_NOTE"))
                    .setDesc(t("OPEN_RANDOM_NOTE_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.plugin.data.settings.openRandomNote)
                            .onChange(async (value) => {
                                this.plugin.data.settings.openRandomNote = value;
                                await this.plugin.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting.setName(t("REVIEW_PANE_ON_STARTUP")).addToggle((toggle) =>
                    toggle
                        .setValue(this.plugin.data.settings.enableNoteReviewPaneOnStartup)
                        .onChange(async (value) => {
                            this.plugin.data.settings.enableNoteReviewPaneOnStartup = value;
                            await this.plugin.savePluginData();
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("MAX_N_DAYS_REVIEW_QUEUE"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.plugin.data.settings.maxNDaysNotesReviewQueue =
                                    DEFAULT_SETTINGS.maxNDaysNotesReviewQueue;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.plugin.data.settings.maxNDaysNotesReviewQueue.toString())
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    const numValue: number = Number.parseInt(value);
                                    if (!isNaN(numValue)) {
                                        if (numValue < 1) {
                                            new Notice(t("MIN_ONE_DAY"));
                                            text.setValue(
                                                this.plugin.data.settings.maxNDaysNotesReviewQueue.toString(),
                                            );
                                            return;
                                        }

                                        this.plugin.data.settings.maxNDaysNotesReviewQueue =
                                            numValue;
                                        await this.plugin.savePluginData();
                                    } else {
                                        new Notice(t("VALID_NUMBER_WARNING"));
                                    }
                                });
                            }),
                    );
            });
    }
}
