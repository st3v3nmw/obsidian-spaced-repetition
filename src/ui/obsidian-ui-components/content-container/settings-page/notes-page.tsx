import { Notice, Setting, SettingGroup } from "obsidian";

import { DataManager } from "src/data/data-manager";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { DEFAULT_SETTINGS } from "src/settings";
import { SettingsPage } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page";
import { SettingsPageType } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page-manager";

/**
 * Represents a notes settings page.
 *
 * @class NotesPage
 * @extends {SettingsPage}
 */
export class NotesPage extends SettingsPage {
    constructor(
        pageContainerEl: HTMLElement,
        plugin: SRPlugin,
        dataManager: DataManager,
        pageType: SettingsPageType,
        applySettingsUpdate: (callback: () => unknown) => void,
        display: () => void,
        openPage: (pageType: SettingsPageType) => void,
        scrollListener: (scrollPosition: number) => void,
    ) {
        super(
            pageContainerEl,
            plugin,
            dataManager,
            pageType,
            applySettingsUpdate,
            display,
            openPage,
            scrollListener,
        );

        new SettingGroup(this.containerEl)
            .setHeading(t("GROUP_TAGS_FOLDERS"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("TAGS_TO_REVIEW"))
                    .setDesc(t("TAGS_TO_REVIEW_DESC"))
                    .addTextArea((text) =>
                        text
                            .setValue(this.dataManager.data.settings.tagsToReview.join(" "))
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.tagsToReview =
                                        value.split(/\s+/);
                                    await this.dataManager.savePluginData();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("NOTE_TAGS_TO_IGNORE"))
                    .setDesc(t("NOTE_TAGS_TO_IGNORE_DESC"))
                    .addTextArea((text) =>
                        text
                            .setValue(this.dataManager.data.settings.noteTagsToIgnore.join(" "))
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.noteTagsToIgnore = value
                                        .split(/\s+/)
                                        .filter((v) => v);
                                    await this.dataManager.savePluginData();
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
                            .setValue(this.dataManager.data.settings.noteFoldersToIgnore.join("\n"))
                            .onChange((value) => {
                                this.applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.noteFoldersToIgnore = value
                                        .split(/\n+/)
                                        .map((v) => v.trim())
                                        .filter((v) => v);
                                    await this.dataManager.savePluginData();
                                });
                            }),
                    );
            });

        new SettingGroup(this.containerEl)
            .setHeading(t("NOTES_REVIEW_QUEUE"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("DATE_FORMAT_FOR_NOTE_REVIEW_QUEUE"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.dataManager.data.settings.preferredDateFormatForNoteReviewQueue =
                                    DEFAULT_SETTINGS.preferredDateFormatForNoteReviewQueue;
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(
                                this.dataManager.data.settings
                                    .preferredDateFormatForNoteReviewQueue,
                            )
                            .onChange((value) => {
                                this.applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.preferredDateFormatForNoteReviewQueue =
                                        value;
                                    await this.dataManager.savePluginData();
                                });
                            }),
                    );

                setting.descEl.insertAdjacentHTML(
                    "beforeend",
                    t("DATE_FORMAT_FOR_NOTE_REVIEW_QUEUE_DESC", {
                        docsUrl: "https://momentjs.com/docs/#/displaying/format/",
                    }),
                );
            })
            .addSetting((setting: Setting) => {
                setting.setName(t("AUTO_NEXT_NOTE")).addToggle((toggle) =>
                    toggle
                        .setValue(this.dataManager.data.settings.autoNextNote)
                        .onChange(async (value) => {
                            this.dataManager.data.settings.autoNextNote = value;
                            await this.dataManager.savePluginData();
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("OPEN_RANDOM_NOTE"))
                    .setDesc(t("OPEN_RANDOM_NOTE_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.openRandomNote)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.openRandomNote = value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting.setName(t("REVIEW_PANE_ON_STARTUP")).addToggle((toggle) =>
                    toggle
                        .setValue(this.dataManager.data.settings.enableNoteReviewPaneOnStartup)
                        .onChange(async (value) => {
                            this.dataManager.data.settings.enableNoteReviewPaneOnStartup = value;
                            await this.dataManager.savePluginData();
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
                                this.dataManager.data.settings.maxNDaysNotesReviewQueue =
                                    DEFAULT_SETTINGS.maxNDaysNotesReviewQueue;
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(
                                this.dataManager.data.settings.maxNDaysNotesReviewQueue.toString(),
                            )
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    const numValue: number = Number.parseInt(value);
                                    if (!isNaN(numValue)) {
                                        if (numValue < 1) {
                                            new Notice(t("MIN_ONE_DAY"));
                                            text.setValue(
                                                this.dataManager.data.settings.maxNDaysNotesReviewQueue.toString(),
                                            );
                                            return;
                                        }

                                        this.dataManager.data.settings.maxNDaysNotesReviewQueue =
                                            numValue;
                                        await this.dataManager.savePluginData();
                                    } else {
                                        new Notice(t("VALID_NUMBER_WARNING"));
                                    }
                                });
                            }),
                    );
            });
    }
}
