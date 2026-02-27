import { ButtonComponent, setIcon, Setting, SettingGroup } from "obsidian";

import { SettingsPage } from "src/gui/content-container/settings-page/settings-page";
import {
    getPageIcon,
    getPageName,
    SettingsPageType,
    SettingsPageTypesArray,
} from "src/gui/content-container/settings-page/settings-page-manager";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { setDebugParser } from "src/parser";

/**
 * Represents the main settings page, from which all other settings pages are accessed.
 *
 * @class MainPage
 * @extends {SettingsPage}
 */
export class MainPage extends SettingsPage {
    constructor(
        pageContainerEl: HTMLElement,
        plugin: SRPlugin,
        pageType: SettingsPageType,
        display: () => void,
        openPage: (pageType: SettingsPageType) => void,
        scrollListener: (scrollPosition: number) => void,
    ) {
        super(pageContainerEl, plugin, pageType, () => {}, display, openPage, scrollListener);

        this.containerEl.addClass("sr-main-page");

        const mainSettingsGroup = new SettingGroup(this.containerEl).setHeading("Settings"); // TODO: add t("MAIN_SETTINGS")

        SettingsPageTypesArray.forEach((pageType) => {
            if (pageType === "main-page") return;
            mainSettingsGroup.addSetting((setting: Setting) => {
                setting.setName(getPageName(pageType)).addButton((button: ButtonComponent) => {
                    button.setIcon("chevron-right").onClick(() => {
                        this.openPage(pageType);
                    });

                    button.buttonEl.addClass("clickable-icon");
                });
                const iconEl = document.createElement("div");
                iconEl.addClass("sr-settings-page-title-icon");
                setIcon(iconEl, getPageIcon(pageType));

                setting.nameEl.insertBefore(iconEl, setting.nameEl.firstChild);
                setting.nameEl.addClass("sr-settings-page-title");
                setting.settingEl.addEventListener("click", () => {
                    this.openPage(pageType);
                });
            });
        });

        new SettingGroup(this.containerEl)
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

        new SettingGroup(this.containerEl)
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

        new SettingGroup(this.containerEl)
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
