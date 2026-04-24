import { Setting, SettingGroup } from "obsidian";

import {
    deleteAllSchedulingData,
    deleteAllSchedulingDataInCards,
    deleteAllSchedulingDataInNotes,
} from "src/delete-scheduling-data";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { SettingsPage } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page";
import { SettingsPageType } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page-manager";
import { ConfirmationModal } from "src/ui/obsidian-ui-components/modals/confirmation-modal";

/**
 * Represents a data settings page.
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
                    .addDropdown((dropdown) =>
                        dropdown
                            .addOptions({
                                NOTES: t("STORE_IN_NOTES"),
                            })
                            .setValue(this.plugin.data.settings.dataStore)
                            .onChange(async (value) => {
                                this.plugin.data.settings.dataStore = value;
                                await this.plugin.savePluginData();
                            }),
                    );
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
    }
}
