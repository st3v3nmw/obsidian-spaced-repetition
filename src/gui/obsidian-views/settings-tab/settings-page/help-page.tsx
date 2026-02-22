import { Setting, SettingGroup } from "obsidian";

import { SettingsPage } from "src/gui/obsidian-views/settings-tab/settings-page/settings-page";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";

export class HelpPage extends SettingsPage {
    constructor(
        containerEl: HTMLElement,
        plugin: SRPlugin,
        applySettingsUpdate: (callback: () => unknown) => void,
        display: () => void,
        setDebugParser: (value: boolean) => void,
    ) {
        super(containerEl, plugin, applySettingsUpdate, display);

        new SettingGroup(containerEl)
            .setHeading(t("HELP"))
            .addSetting((setting: Setting) => {
                setting.infoEl.insertAdjacentHTML(
                    "beforeend",
                    t("CHECK_WIKI", {
                        wikiUrl: "https://stephenmwangi.com/obsidian-spaced-repetition/",
                    }),
                );
            })
            .addSetting((setting: Setting) => {
                setting.infoEl.insertAdjacentHTML(
                    "beforeend",
                    t("GITHUB_DISCUSSIONS", {
                        discussionsUrl:
                            "https://github.com/st3v3nmw/obsidian-spaced-repetition/discussions/",
                    }),
                );
            })
            .addSetting((setting: Setting) => {
                setting.infoEl.insertAdjacentHTML(
                    "beforeend",
                    t("GITHUB_ISSUES", {
                        issuesUrl: "https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/",
                    }),
                );
            });

        new SettingGroup(containerEl)
            .setHeading(t("GROUP_CONTRIBUTING"))
            .addSetting((setting: Setting) => {
                setting.infoEl.insertAdjacentHTML(
                    "beforeend",
                    t("GITHUB_SOURCE_CODE", {
                        githubProjectUrl: "https://github.com/st3v3nmw/obsidian-spaced-repetition",
                    }),
                );
            })
            .addSetting((setting: Setting) => {
                setting.infoEl.insertAdjacentHTML(
                    "beforeend",
                    t("CODE_CONTRIBUTION_INFO", {
                        codeContributionUrl:
                            "https://stephenmwangi.com/obsidian-spaced-repetition/contributing/#code",
                    }),
                );
            })
            .addSetting((setting: Setting) => {
                setting.infoEl.insertAdjacentHTML(
                    "beforeend",
                    t("TRANSLATION_CONTRIBUTION_INFO", {
                        translationContributionUrl:
                            "https://stephenmwangi.com/obsidian-spaced-repetition/contributing/#translating",
                    }),
                );
            });

        new SettingGroup(containerEl)
            .setHeading(t("LOGGING"))
            .addSetting((setting: Setting) => {
                setting.setName(t("DISPLAY_SCHEDULING_DEBUG_INFO")).addToggle((toggle) =>
                    toggle
                        .setValue(this.plugin.data.settings.showSchedulingDebugMessages)
                        .onChange(async (value) => {
                            this.plugin.data.settings.showSchedulingDebugMessages = value;
                            await this.plugin.savePluginData();
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                setting.setName(t("DISPLAY_PARSER_DEBUG_INFO")).addToggle((toggle) =>
                    toggle
                        .setValue(this.plugin.data.settings.showParserDebugMessages)
                        .onChange(async (value) => {
                            this.plugin.data.settings.showParserDebugMessages = value;
                            setDebugParser(this.plugin.data.settings.showParserDebugMessages);
                            await this.plugin.savePluginData();
                        }),
                );
            });
    }
}
