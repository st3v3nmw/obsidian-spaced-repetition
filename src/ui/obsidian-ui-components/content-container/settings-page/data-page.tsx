import { Setting, SettingGroup } from "obsidian";

import { DataManager } from "src/data/data-manager";
import { DataStore, StorageType } from "src/data/data-store/base/data-store";
import { ScheduleDataFileRepository } from "src/data/data-store/sr-md-data-store/schedule-data-file-repository";
import { ScheduleDataMigrator } from "src/data/data-store/sr-md-data-store/schedule-data-migrator";
import { DEFAULT_SETTINGS } from "src/data/settings";
import { SettingsManager } from "src/data/settings-manager";
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
        settingsManager: SettingsManager,
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
            settingsManager,
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

        dataStorageGroup.addSetting((setting: Setting) => {
            setting
                .setName(t("GROUP_DATA_STORAGE"))
                .setDesc(t("GROUP_DATA_STORAGE_DESC"))
                .addDropdown((dropdown) => {
                    dropdown
                        .addOptions({
                            [StorageType.NOTES]: t("STORE_IN_NOTES"),
                            [StorageType.SR_MD]: t("STORE_IN_SR_MD"),
                        })
                        .setValue(this.settingsManager.settings.dataStore)
                        .onChange((value) => {
                            const oldMode = this.settingsManager.settings.dataStore;
                            const newMode = value as StorageType;
                            if (oldMode === newMode) return;

                            // Revert the dropdown immediately; only apply after confirmation.
                            dropdown.setValue(oldMode);

                            const messages = this.migrationMessages(newMode);
                            new ConfirmationModal(
                                this.plugin.app,
                                messages.title,
                                messages.confirm,
                                messages.inProgress,
                                async () => {
                                    await this.switchDataStore(oldMode, newMode);
                                    this.display();
                                },
                            ).open();
                        });
                });
        });

        if (this.settingsManager.settings.dataStore === StorageType.SR_MD) {
            dataStorageGroup
                .addSetting((setting: Setting) => {
                    setting.setDesc(t("SR_MD_STORE_INFO"));
                })
                .addSetting((setting: Setting) => {
                    setting
                        .setName(t("SCHEDULE_DATA_LOCATION"))
                        .setDesc(t("SCHEDULE_DATA_LOCATION_DESC"))
                        .addText((text) => {
                            text.setPlaceholder(DEFAULT_SETTINGS.scheduleDataVaultLocation)
                                .setValue(this.settingsManager.settings.scheduleDataVaultLocation)
                                .onChange((value) => {
                                    this.settingsManager.settings.scheduleDataVaultLocation =
                                        value.trim() || DEFAULT_SETTINGS.scheduleDataVaultLocation;
                                });

                            text.inputEl.addEventListener("blur", () => {
                                void this.settingsManager.save();
                            });
                        });
                });
        }

        dataStorageGroup
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("INLINE_SCHEDULING_COMMENTS"))
                    .setDesc(t("INLINE_SCHEDULING_COMMENTS_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.cardCommentOnSameLine)
                            .onChange(async (value) => {
                                this.settingsManager.settings.cardCommentOnSameLine = value;
                                await this.settingsManager.save();
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
                                this.settingsManager.settings.useCalloutsForSchedulingComments,
                            )
                            .onChange(async (value) => {
                                this.settingsManager.settings.useCalloutsForSchedulingComments =
                                    value;
                                await this.settingsManager.save();
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
                                this.settingsManager.settings.deleteTagsOnSchedulingDataDeletion,
                            )
                            .onChange(async (value) => {
                                this.settingsManager.settings.deleteTagsOnSchedulingDataDeletion =
                                    value;
                                await this.settingsManager.save();
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
                            .onClick(() => {
                                new ConfirmationModal(
                                    this.plugin.app,
                                    t("DELETE_SCHEDULING_DATA_ALL"),
                                    t("CONFIRM_SCHEDULING_DATA_ALL_DELETION"),
                                    t("SCHEDULING_DATA_ALL_DELETION_IN_PROGRESS"),
                                    async () => {
                                        const settings = this.settingsManager.settings;
                                        await DataStore.instance.fileModifier.deleteAllSchedulingData(
                                            settings.deleteTagsOnSchedulingDataDeletion,
                                            settings.flashcardTags,
                                            settings.tagsToReview,
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
                            .onClick(() => {
                                new ConfirmationModal(
                                    this.plugin.app,
                                    t("DELETE_SCHEDULING_DATA_IN_NOTES"),
                                    t("CONFIRM_SCHEDULING_DATA_IN_NOTES_DELETION"),
                                    t("SCHEDULING_DATA_IN_NOTES_DELETION_IN_PROGRESS"),
                                    async () => {
                                        await DataStore.instance.fileModifier.deleteAllSchedulingDataInNotes(
                                            this.settingsManager.settings
                                                .deleteTagsOnSchedulingDataDeletion,
                                            this.settingsManager.settings.tagsToReview,
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
                            .onClick(() => {
                                new ConfirmationModal(
                                    this.plugin.app,
                                    t("DELETE_SCHEDULING_DATA_IN_CARDS"),
                                    t("CONFIRM_SCHEDULING_DATA_IN_CARDS_DELETION"),
                                    t("SCHEDULING_DATA_IN_CARDS_DELETION_IN_PROGRESS"),
                                    async () => {
                                        await DataStore.instance.fileModifier.deleteAllSchedulingDataInCards(
                                            this.settingsManager.settings
                                                .deleteTagsOnSchedulingDataDeletion,
                                            this.settingsManager.settings.flashcardTags,
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
                                        await this.settingsManager.saveSettings(DEFAULT_SETTINGS);
                                        this.display();
                                    },
                                ).open();
                            });
                    });
            });
    }

    /**
     * Returns the confirmation-modal copy for migrating to `newMode`.
     */
    private migrationMessages(newMode: StorageType): {
        title: string;
        confirm: string;
        inProgress: string;
    } {
        if (newMode === StorageType.SR_MD) {
            return {
                title: t("MIGRATE_TO_SR_MD"),
                confirm: t("CONFIRM_MIGRATE_TO_SR_MD"),
                inProgress: t("MIGRATING_TO_SR_MD"),
            };
        }
        return {
            title: t("MIGRATE_TO_NOTES"),
            confirm: t("CONFIRM_MIGRATE_TO_NOTES"),
            inProgress: t("MIGRATING_TO_NOTES"),
        };
    }

    /**
     * Activates `newMode`, migrates the existing scheduling data into it, and persists settings.
     */
    private async switchDataStore(oldMode: StorageType, newMode: StorageType): Promise<void> {
        this.settingsManager.settings.dataStore = newMode;
        this.dataManager.setupDataStoreAndAlgorithmInstances(this.settingsManager.settings);
        await DataStore.instance.isStructureInitialized;

        const repository =
            this.dataManager.scheduleDataRepository ??
            new ScheduleDataFileRepository(this.plugin.app.vault, this.settingsManager.settings);
        const migrator = new ScheduleDataMigrator(
            this.plugin,
            this.settingsManager.settings,
            repository,
        );
        await migrator.migrate(oldMode, newMode);

        await this.settingsManager.save();
    }
}
