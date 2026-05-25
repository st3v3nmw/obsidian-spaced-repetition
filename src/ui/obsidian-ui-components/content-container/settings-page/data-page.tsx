import { Setting, SettingGroup } from "obsidian";

import { DataManager } from "src/data/data-manager";
import { DataStore } from "src/data/data-store/base/data-store";
import { DEFAULT_SETTINGS } from "src/data/settings";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
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

        const dataStorageGroup = new SettingGroup(this.containerEl).setHeading(
            t("GROUP_DATA_STORAGE"),
        );

        dataStorageGroup
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("INLINE_SCHEDULING_COMMENTS"))
                    .setDesc(t("INLINE_SCHEDULING_COMMENTS_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.cardCommentOnSameLine)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.cardCommentOnSameLine = value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("USE_CALLOUTS_FOR_SCHEDULING_COMMENTS"))
                    .setDesc(t("USE_CALLOUTS_FOR_SCHEDULING_COMMENTS_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(
                                this.dataManager.data.settings.useCalloutsForSchedulingComments,
                            )
                            .onChange(async (value) => {
                                this.dataManager.data.settings.useCalloutsForSchedulingComments =
                                    value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT"))
                    .setDesc(t("MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT_DESC"))
                    .addButton((button) => {
                        button
                            .setButtonText(t("MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT_BUTTON"))
                            .setClass("mod-warning")
                            .onClick(() => {
                                new ConfirmationModal(
                                    this.plugin.app,
                                    t("MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT"),
                                    t("CONFIRM_MIGRATE_SCHEDULING_COMMENTS_TO_CALLOUT"),
                                    t("MIGRATING_SCHEDULING_COMMENTS_TO_CALLOUT"),
                                    async () => {
                                        await DataStore.instance.fileModifier.migrateCommentsToCallouts();
                                        this.display();
                                    },
                                ).open();
                            });
                    });
            });

        new SettingGroup(this.containerEl)
            .setHeading(t("DELETE_SCHEDULING_DATA_ALL"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("DELETE_TAGS_WHEN_DELETING_SCHEDULING_DATA"))
                    .setDesc(t("DELETE_TAGS_WHEN_DELETING_SCHEDULING_DATA_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(
                                this.dataManager.data.settings.deleteTagsOnSchedulingDataDeletion,
                            )
                            .onChange(async (value) => {
                                this.dataManager.data.settings.deleteTagsOnSchedulingDataDeletion =
                                    value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("DELETE_SCHEDULING_DATA_IN_CARDS"))
                    .setDesc(t("DELETE_SCHEDULING_DATA_IN_CARDS_DESC"))
                    .addButton((button) => {
                        button
                            .setButtonText(t("DELETE"))
                            .setClass("mod-warning")
                            .onClick(() => {
                                new ConfirmationModal(
                                    this.plugin.app,
                                    t("DELETE_SCHEDULING_DATA_IN_CARDS"),
                                    t("CONFIRM_SCHEDULING_DATA_IN_CARDS_DELETION"),
                                    t("SCHEDULING_DATA_IN_CARDS_DELETION_IN_PROGRESS"),
                                    async () => {
                                        await DataStore.instance.fileModifier.deleteAllSchedulingDataInCards(
                                            this.dataManager.data.settings
                                                .deleteTagsOnSchedulingDataDeletion,
                                            this.dataManager.data.settings.flashcardTags,
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
                            .onClick(() => {
                                new ConfirmationModal(
                                    this.plugin.app,
                                    t("RESET_SETTINGS"),
                                    t("CONFIRM_RESET_SETTINGS"),
                                    t("RESET_SETTINGS_CONFIRMATION"),
                                    async () => {
                                        this.dataManager.data.settings = DEFAULT_SETTINGS;
                                        await this.dataManager.savePluginData();
                                        this.display();
                                    },
                                ).open();
                            });
                    });
            });
    }
}
