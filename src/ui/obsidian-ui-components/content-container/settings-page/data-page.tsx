import { Setting, SettingGroup } from "obsidian";

import { DataManager } from "src/data/data-manager";
import { DataStore, StorageType } from "src/data/data-store/data-store-instances/base/data-store";
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

        const dataStorageGroup = new SettingGroup(this.containerEl)
            .setHeading(t("GROUP_DATA_STORAGE"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("GROUP_DATA_STORAGE"))
                    .setDesc(t("GROUP_DATA_STORAGE_DESC"))
                    .addDropdown((dropdown) => {
                        dropdown
                            .addOptions({
                                [StorageType.NOTES]: t("STORE_IN_NOTES"),
                                [StorageType.FOLDER]: "Store in vault folder (beta)",
                                [StorageType.PLUGIN_DATA]: "Store in plugin data (beta)",
                            })
                            .setValue(this.dataManager.data.settings.dataStore)
                            .onChange(async (value) => {
                                const oldMode = this.dataManager.data.settings
                                    .dataStore as StorageType;
                                const newMode = value as StorageType;

                                // Revert the dropdown immediately; only apply after confirmation.
                                dropdown.setValue(oldMode);

                                let migrateMessage: string = "";
                                let confirmMessage: string = "";
                                let migratingMessage: string = "";

                                switch (newMode) {
                                    case StorageType.FOLDER:
                                        migrateMessage = t("MIGRATE_TO_FOLDER");
                                        confirmMessage = t("CONFIRM_MIGRATE_TO_FOLDER");
                                        migratingMessage = t("MIGRATING_TO_FOLDER");
                                        break;
                                    case StorageType.PLUGIN_DATA:
                                        migrateMessage = t("MIGRATE_TO_PLUGIN_DATA");
                                        confirmMessage = t("CONFIRM_MIGRATE_TO_PLUGIN_DATA");
                                        migratingMessage = t("MIGRATING_TO_PLUGIN_DATA");
                                        break;
                                    case StorageType.NOTES:
                                        migrateMessage = t("MIGRATE_TO_NOTES");
                                        confirmMessage = t("CONFIRM_MIGRATE_TO_NOTES");
                                        migratingMessage = t("MIGRATING_TO_NOTES");
                                        break;
                                }

                                new ConfirmationModal(
                                    this.plugin.app,
                                    migrateMessage,
                                    confirmMessage,
                                    migratingMessage,
                                    async () => {
                                        await this.dataManager.migrateDataStore(oldMode, newMode);
                                        dropdown.setValue(newMode);
                                        this.dataManager.data.settings.dataStore = newMode;
                                        this.dataManager.setupDataStoreAndAlgorithmInstances(
                                            this.dataManager.data.settings,
                                        );
                                        await this.dataManager.savePluginData();
                                    },
                                ).open();
                            });
                    });
            });

        dataStorageGroup.addSetting((setting: Setting) => {
            setting.infoEl.insertAdjacentText("beforeend", t("PLUGIN_DATA_STORE_INFO"));
        });

        if (this.dataManager.data.settings.dataStore === StorageType.FOLDER) {
            dataStorageGroup.addSetting((setting: Setting) => {
                setting
                    .setName("Schedule data location in vault")
                    .setDesc(
                        'Root folder for schedule files. Data is stored in "Schedule Data" as markdown files.',
                    )
                    .addText((text) => {
                        const commitValue = async () => {
                            this.dataManager.data.settings.scheduleDataVaultLocation =
                                text.getValue().trim() ||
                                DEFAULT_SETTINGS.scheduleDataVaultLocation;
                            await this.dataManager.savePluginData();
                        };

                        text.setPlaceholder(DEFAULT_SETTINGS.scheduleDataVaultLocation)
                            .setValue(this.dataManager.data.settings.scheduleDataVaultLocation)
                            .onChange(() => {
                                this.dataManager.data.settings.scheduleDataVaultLocation =
                                    text.getValue().trim() ||
                                    DEFAULT_SETTINGS.scheduleDataVaultLocation;
                            });

                        text.inputEl.addEventListener("blur", () => {
                            void commitValue();
                        });
                    });
            });
        }

        dataStorageGroup.addSetting((setting: Setting) => {
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
                                        const settings = this.dataManager.data.settings;
                                        DataStore.instance.scheduleDeleter.deleteAllSchedulingData(
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
                            .onClick(async () => {
                                new ConfirmationModal(
                                    this.plugin.app,
                                    t("DELETE_SCHEDULING_DATA_IN_NOTES"),
                                    t("CONFIRM_SCHEDULING_DATA_IN_NOTES_DELETION"),
                                    t("SCHEDULING_DATA_IN_NOTES_DELETION_IN_PROGRESS"),
                                    () => {
                                        DataStore.instance.scheduleDeleter.deleteAllSchedulingDataInNotes(
                                            this.dataManager.data.settings
                                                .deleteTagsOnSchedulingDataDeletion,
                                            this.dataManager.data.settings.tagsToReview,
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
                                        DataStore.instance.scheduleDeleter.deleteAllSchedulingDataInCards(
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
                            .onClick(async () => {
                                new ConfirmationModal(
                                    this.plugin.app,
                                    t("RESET_SETTINGS"),
                                    t("CONFIRM_RESET_SETTINGS"),
                                    t("RESET_SETTINGS_CONFIRMATION"),
                                    () => {
                                        this.dataManager.data.settings = DEFAULT_SETTINGS;
                                        this.dataManager.savePluginData();
                                        this.display();
                                    },
                                ).open();
                            });
                    });
            });
    }
}
