import { ButtonComponent, setIcon, Setting, SettingGroup } from "obsidian";

import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { SettingsPage } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page";
import {
    getPageIcon,
    getPageName,
    SettingsPageType,
    SettingsPageTypesArray,
} from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page-manager";
import { CardParser } from "src/utils/parsers/card-parser";

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

        const mainSettingsGroup = new SettingGroup(this.containerEl).setHeading(
            t("SETTINGS_TAB_HEADING"),
        );
        SettingsPageTypesArray.forEach((pageType) => {
            if (pageType === "main-page") return;
            if (pageType === "statistics-page") return;
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
                setting.settingEl.addClass("sr-settings-page-title-setting");
                setting.settingEl.addEventListener("click", () => {
                    this.openPage(pageType);
                });
            });
        });

        new SettingGroup(this.containerEl)
            .setHeading(t("INFO"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(getPageName("statistics-page"))
                    .addButton((button: ButtonComponent) => {
                        button.setIcon("chevron-right").onClick(() => {
                            this.openPage("statistics-page");
                        });

                        button.buttonEl.addClass("clickable-icon");
                    });
                const iconEl = document.createElement("div");
                iconEl.addClass("sr-settings-page-title-icon");
                setIcon(iconEl, getPageIcon("statistics-page"));

                setting.nameEl.insertBefore(iconEl, setting.nameEl.firstChild);
                setting.nameEl.addClass("sr-settings-page-title");
                setting.settingEl.addClass("sr-settings-page-title-setting");
                setting.settingEl.addEventListener("click", () => {
                    this.openPage("statistics-page");
                });
            })
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
                    t("CHECK_ROADMAP", {
                        roadMapUrl: "https://github.com/users/st3v3nmw/projects/6",
                    }),
                );
            })
            .addSetting((setting: Setting) => {
                setting.infoEl.insertAdjacentHTML(
                    "beforeend",
                    t("CHECK_DEV_NEWS", {
                        devNewsUrl:
                            "https://github.com/st3v3nmw/obsidian-spaced-repetition/discussions/categories/development-news",
                    }),
                );
            });

        new SettingGroup(this.containerEl)
            .setHeading(t("HELP") + " & " + t("GROUP_CONTRIBUTING"))
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
            })
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
                            CardParser.setDebugParser(
                                this.plugin.data.settings.showParserDebugMessages,
                            );
                            await this.plugin.savePluginData();
                        }),
                );
            });
    }
}
