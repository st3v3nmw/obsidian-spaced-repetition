import { App, SecretComponent, Setting, SettingGroup } from "obsidian";

import { SettingsPage } from "src/gui/content-container/settings-page/settings-page";
import { SettingsPageType } from "src/gui/content-container/settings-page/settings-page-manager";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";

/**
 * Represents a gamification settings page.
 * @ulr https://habitica.com/user/settings/siteData
 * @class GamificationPage
 * @extends {SettingsPage}
 */
export class GamificationPage extends SettingsPage {
    private app: App;
    constructor(
        app: App,
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
        this.app = app;

        new SettingGroup(this.containerEl)
            .setHeading(t("GROUP_HABITICA"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("ENABLE_HABITICA_INTEGRATION"))
                    .setDesc(t("ENABLE_HABITICA_INTEGRATION_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.plugin.data.settings.enableHabiticaIntegration)
                            .onChange(async (value) => {
                                applySettingsUpdate(async () => {
                                    this.plugin.data.settings.enableHabiticaIntegration = value;
                                    await this.plugin.savePluginData();

                                    this.display();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("HABITICA_USER_ID"))
                    .setDesc(t("HABITICA_USER_ID_DESC"))
                    .addComponent((el) =>
                        new SecretComponent(this.app, el)
                            .setValue(this.plugin.data.settings.habiticaUserId)
                            .onChange(async (value) => {
                                this.plugin.data.settings.habiticaUserId = value;
                                await this.plugin.savePluginData();
                            }),
                    )
                    .setDisabled(!this.plugin.data.settings.enableHabiticaIntegration);
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("HABITICA_API_TOKEN"))
                    .setDesc(t("HABITICA_API_TOKEN_DESC"))
                    .addComponent((el) =>
                        new SecretComponent(this.app, el)
                            .setValue(this.plugin.data.settings.habiticaApiToken)
                            .onChange(async (value) => {
                                this.plugin.data.settings.habiticaApiToken = value;
                                await this.plugin.savePluginData();
                            }),
                    )
                    .setDisabled(!this.plugin.data.settings.enableHabiticaIntegration);
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("HABITICA_EASY_TASK_ID"))
                    .setDesc(t("HABITICA_EASY_TASK_ID_DESC"))
                    .addText(
                        (text) =>
                            text
                                .setValue(this.plugin.data.settings.flashcardEasyTaskId)
                                .onChange((value) => {
                                    applySettingsUpdate(async () => {
                                        this.plugin.data.settings.flashcardEasyTaskId = value;
                                        await this.plugin.savePluginData();
                                    });
                                }),
                        // .inputEl.type = "password"),
                    )
                    .setDisabled(!this.plugin.data.settings.enableHabiticaIntegration);
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("HABITICA_GOOD_TASK_ID"))
                    .setDesc(t("HABITICA_GOOD_TASK_ID_DESC"))
                    .addText(
                        (text) =>
                            text
                                .setValue(this.plugin.data.settings.flashcardGoodTaskId)
                                .onChange((value) => {
                                    applySettingsUpdate(async () => {
                                        this.plugin.data.settings.flashcardGoodTaskId = value;
                                        await this.plugin.savePluginData();
                                    });
                                }),
                        // .inputEl.type = "password"),
                    )
                    .setDisabled(!this.plugin.data.settings.enableHabiticaIntegration);
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("HABITICA_HARD_TASK_ID"))
                    .setDesc(t("HABITICA_HARD_TASK_ID_DESC"))
                    .addText(
                        (text) =>
                            text
                                .setValue(this.plugin.data.settings.flashcardHardTaskId)
                                .onChange((value) => {
                                    applySettingsUpdate(async () => {
                                        this.plugin.data.settings.flashcardHardTaskId = value;
                                        await this.plugin.savePluginData();
                                    });
                                }),
                        // .inputEl.type = "password"),
                    )
                    .setDisabled(!this.plugin.data.settings.enableHabiticaIntegration);
            });
    }
}
