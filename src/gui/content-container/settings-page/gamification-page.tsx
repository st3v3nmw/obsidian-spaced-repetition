import { App, Notice, SecretComponent, Setting, SettingGroup } from "obsidian";

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
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("RETRIEVE_HABITICA_TASK_IDS"))
                    .setDesc(t("RETRIEVE_HABITICA_TASK_IDS_DESC"))
                    .addButton((button) =>
                        button
                            .setButtonText(t("RETRIEVE_TASK_IDS"))
                            .onClick(async () => {
                                await this.retrieveHabiticaTaskIds();
                            })
                            .setDisabled(
                                !this.plugin.data.settings.habiticaUserId ||
                                    !this.plugin.data.settings.habiticaApiToken,
                            ),
                    )
                    .setDisabled(!this.plugin.data.settings.enableHabiticaIntegration);
            });
    }

    private async retrieveHabiticaTaskIds(): Promise<void> {
        const userId = this.app.secretStorage.getSecret(this.plugin.data.settings.habiticaUserId);
        const apiToken = this.app.secretStorage.getSecret(
            this.plugin.data.settings.habiticaApiToken,
        );

        if (!userId || !apiToken) {
            new Notice("Please set Habitica User ID and API Token first");
            return;
        }

        const url = "https://habitica.com/api/v3/tasks/user?type=habits";

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-user": userId,
                    "x-api-key": apiToken,
                    "x-client": `${userId}-obsidian-spaced-repetition`,
                },
            });

            const body = await response.json();

            if (!response.ok || body.success === false) {
                const message = body?.message || `HTTP ${response.status}`;
                const error = body?.error ? ` (${body.error})` : "";
                new Notice(`Habitica API error${error}: ${message}`);
                return;
            }

            const habits = body?.data;
            if (!Array.isArray(habits)) {
                new Notice("Invalid response from Habitica API");
                return;
            }

            const taskMapping: Record<string, keyof typeof this.plugin.data.settings> = {
                "Spaced Repetition Easy": "flashcardEasyTaskId",
                "Spaced Repetition Good": "flashcardGoodTaskId",
                "Spaced Repetition Hard": "flashcardHardTaskId",
            };

            let foundCount = 0;

            for (const habit of habits) {
                if (typeof habit.text === "string" && habit.text in taskMapping) {
                    const settingKey = taskMapping[habit.text];
                    (this.plugin.data.settings[settingKey] as string) = habit.id;
                    foundCount++;
                }
            }

            if (foundCount > 0) {
                await this.plugin.savePluginData();
                this.display();
                new Notice(
                    `Successfully retrieved ${foundCount} task ID${foundCount > 1 ? "s" : ""} from Habitica`,
                );
            } else {
                new Notice(
                    "No matching tasks found. Please create habits named 'Spaced Repetition Easy', 'Spaced Repetition Good', and 'Spaced Repetition Hard' in Habitica.",
                );
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            new Notice(`Error retrieving Habitica tasks: ${message}`);
        }
    }
}
