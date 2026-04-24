import { Setting, SettingGroup } from "obsidian";

import { DataStoreName } from "src/data-stores/base/data-store";
import {
    deleteAllSchedulingData,
    deleteAllSchedulingDataInCards,
    deleteAllSchedulingDataInNotes,
} from "src/delete-scheduling-data";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { DEFAULT_SETTINGS } from "src/settings";
import { SettingsPage } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page";
import { SettingsPageType } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page-manager";
import { ConfirmationModal } from "src/ui/obsidian-ui-components/modals/confirmation-modal";

/**
 * Settings page for data storage options and scheduling data management.
 *
 * @class DataPage
 * @extends {SettingsPage}
 */
export class DataPage extends SettingsPage {
    constructor(
        pageContainerEl: HTMLElement,
        plugin: SRPlugin,
        pageType: SettingsPageType,
        applySettingsUpdate: (callback: () => unknown) => void,
        display: () => void,
        openPage: (pageType: SettingsPageType) => void,
        scrollListener: (scrollPosition: number) => void,
    ) {
        super(
            pageContainerEl,
            plugin,
            pageType,
            applySettingsUpdate,
            display,
            openPage,
            scrollListener,
        );

        new SettingGroup(this.containerEl)
            .setHeading(t("GROUP_DATA_STORAGE"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("GROUP_DATA_STORAGE"))
                    .setDesc(t("GROUP_DATA_STORAGE_DESC"))
                    .addDropdown((dropdown) => {
                        dropdown
                            .addOptions({
                                [DataStoreName.NOTES]: t("STORE_IN_NOTES"),
                                [DataStoreName.PLUGIN_DATA]: "Store in plugin data (beta)",
                            })
                            .setValue(this.plugin.data.settings.dataStore)
                            .onChange(async (value) => {
                                const oldMode = this.plugin.data.settings
                                    .dataStore as DataStoreName;
                                const newMode = value as DataStoreName;

                                // Revert the dropdown immediately; only apply after confirmation.
                                dropdown.setValue(oldMode);

                                const isToPluginData = newMode === DataStoreName.PLUGIN_DATA;
                                new ConfirmationModal(
                                    this.plugin.app,
                                    isToPluginData
                                        ? t("MIGRATE_TO_PLUGIN_DATA")
                                        : t("MIGRATE_TO_NOTES"),
                                    isToPluginData
                                        ? t("CONFIRM_MIGRATE_TO_PLUGIN_DATA")
                                        : t("CONFIRM_MIGRATE_TO_NOTES"),
                                    isToPluginData
                                        ? t("MIGRATING_TO_PLUGIN_DATA")
                                        : t("MIGRATING_TO_NOTES"),
                                    async () => {
                                        await this.plugin.migrateDataStore(oldMode, newMode);
                                        dropdown.setValue(newMode);
                                        this.plugin.data.settings.dataStore = newMode;
                                        this.plugin.setupDataStoreAndAlgorithmInstances(
                                            this.plugin.data.settings,
                                        );
                                        await this.plugin.savePluginData();
                                    },
                                ).open();
                            });
                    });
            })
            .addSetting((setting: Setting) => {
                setting.infoEl.insertAdjacentText("beforeend", t("PLUGIN_DATA_STORE_INFO"));
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("INLINE_SCHEDULING_COMMENTS"))
                    .setDesc(t("INLINE_SCHEDULING_COMMENTS_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.plugin.data.settings.cardCommentOnSameLine)
                            .onChange(async (value) => {
                                this.plugin.data.settings.cardCommentOnSameLine = value;
                                await this.plugin.savePluginData();
                            }),
                    );
            });

        new SettingGroup(this.containerEl)
            .setHeading(t("DELETE_SCHEDULING_DATA_ALL"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("DELETE_TAGS_WHEN_DELETING_SCHEDULING_DATA"))
                    .setDesc(t("DELETE_TAGS_WHEN_DELETING_SCHEDULING_DATA_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.plugin.data.settings.deleteTagsOnSchedulingDataDeletion)
                            .onChange(async (value) => {
                                this.plugin.data.settings.deleteTagsOnSchedulingDataDeletion =
                                    value;
                                await this.plugin.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("DELETE_SCHEDULING_DATA_ALL"))
                    .setDesc(t("DELETE_SCHEDULING_DATA_ALL_DESC"))
                    .addButton((button) => {
                        button
                            .setButtonText(t("DELETE"))
                            .setClass("mod-warning")
                            .onClick(async () => {
                                new ConfirmationModal(
                                    this.plugin.app,
                                    t("DELETE_SCHEDULING_DATA_ALL"),
                                    t("CONFIRM_SCHEDULING_DATA_ALL_DELETION"),
                                    t("SCHEDULING_DATA_ALL_DELETION_IN_PROGRESS"),
                                    () => {
                                        deleteAllSchedulingData(
                                            this.plugin.data.settings
                                                .deleteTagsOnSchedulingDataDeletion,
                                            this.plugin.data.settings.flashcardTags,
                                            this.plugin.data.settings.tagsToReview,
                                        );
                                    },
                                ).open();
                            });
                    });
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("DELETE_SCHEDULING_DATA_IN_NOTES"))
                    .setDesc(t("DELETE_SCHEDULING_DATA_IN_NOTES_DESC"))
                    .addButton((button) => {
                        button
                            .setButtonText(t("DELETE"))
                            .setClass("mod-warning")
                            .onClick(async () => {
                                new ConfirmationModal(
                                    this.plugin.app,
                                    t("DELETE_SCHEDULING_DATA_IN_NOTES"),
                                    t("CONFIRM_SCHEDULING_DATA_IN_NOTES_DELETION"),
                                    t("SCHEDULING_DATA_IN_NOTES_DELETION_IN_PROGRESS"),
                                    () => {
                                        deleteAllSchedulingDataInNotes(
                                            this.plugin.data.settings
                                                .deleteTagsOnSchedulingDataDeletion,
                                            this.plugin.data.settings.tagsToReview,
                                        );
                                    },
                                ).open();
                            });
                    });
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("DELETE_SCHEDULING_DATA_IN_CARDS"))
                    .setDesc(t("DELETE_SCHEDULING_DATA_IN_CARDS_DESC"))
                    .addButton((button) => {
                        button
                            .setButtonText(t("DELETE"))
                            .setClass("mod-warning")
                            .onClick(async () => {
                                new ConfirmationModal(
                                    this.plugin.app,
                                    t("DELETE_SCHEDULING_DATA_IN_CARDS"),
                                    t("CONFIRM_SCHEDULING_DATA_IN_CARDS_DELETION"),
                                    t("SCHEDULING_DATA_IN_CARDS_DELETION_IN_PROGRESS"),
                                    () => {
                                        deleteAllSchedulingDataInCards(
                                            this.plugin.data.settings
                                                .deleteTagsOnSchedulingDataDeletion,
                                            this.plugin.data.settings.flashcardTags,
                                        );
                                    },
                                ).open();
                            });
                    });
            });

        new SettingGroup(this.containerEl)
            .setHeading(t("GROUP_RESET_SETTINGS"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("GROUP_RESET_SETTINGS"))
                    .setDesc(t("GROUP_RESET_SETTINGS_DESC"))
                    .addButton((button) => {
                        button
                            .setButtonText(t("RESET_SETTINGS"))
                            .setClass("mod-warning")
                            .onClick(async () => {
                                new ConfirmationModal(
                                    this.plugin.app,
                                    t("RESET_SETTINGS"),
                                    t("CONFIRM_RESET_SETTINGS"),
                                    t("RESET_SETTINGS_CONFIRMATION"),
                                    () => {
                                        this.plugin.data.settings = DEFAULT_SETTINGS;
                                        this.plugin.savePluginData();
                                        this.display();
                                    },
                                ).open();
                            });
                    });
            });
    }
}
