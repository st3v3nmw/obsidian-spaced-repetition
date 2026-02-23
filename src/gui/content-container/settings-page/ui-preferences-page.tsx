import { Setting, SettingGroup } from "obsidian";

import { SettingsPage } from "src/gui/content-container/settings-page/settings-page";
import { SettingsPageType } from "src/gui/content-container/settings-page/settings-page-manager";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { DEFAULT_SETTINGS } from "src/settings";

export class UIPreferencesPage extends SettingsPage {
    constructor(
        containerEl: HTMLElement,
        plugin: SRPlugin,
        pageType: SettingsPageType,
        applySettingsUpdate: (callback: () => unknown) => void,
        display: () => void,
        openPage: (pageType: SettingsPageType) => void,
        scrollListener: (scrollPosition: number) => void,
    ) {
        super(
            containerEl,
            plugin,
            pageType,
            applySettingsUpdate,
            display,
            openPage,
            scrollListener,
        );

        new SettingGroup(this.containerEl)
            .setHeading(t("OBSIDIAN_INTEGRATION"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("OPEN_IN_TAB"))
                    .setDesc(t("OPEN_IN_TAB_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.plugin.data.settings.openViewInNewTab)
                            .onChange(async (value) => {
                                if (value) {
                                    this.plugin.registerSRFocusListener();
                                    this.plugin.data.settings.flashcardHeightPercentage = 100;
                                    this.plugin.data.settings.flashcardWidthPercentage = 100;
                                } else {
                                    this.plugin.tabViewManager.closeAllTabViews();

                                    // Remove focus from SR and remove event listener for focus change
                                    this.plugin.removeSRFocusListener();
                                }
                                this.plugin.data.settings.openViewInNewTab = value;
                                await this.plugin.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_RIBBON_ICON"))
                    .setDesc(t("SHOW_RIBBON_ICON_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.plugin.data.settings.showRibbonIcon)
                            .onChange(async (value) => {
                                this.plugin.data.settings.showRibbonIcon = value;
                                await this.plugin.savePluginData();
                                this.plugin.showRibbonIcon(value);
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_STATUS_BAR"))
                    .setDesc(t("SHOW_STATUS_BAR_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.plugin.data.settings.showStatusBar)
                            .onChange(async (value) => {
                                this.plugin.data.settings.showStatusBar = value;
                                await this.plugin.savePluginData();
                                this.plugin.showStatusBar(value);
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("ENABLE_FILE_MENU_REVIEW_OPTIONS"))
                    .setDesc(t("ENABLE_FILE_MENU_REVIEW_OPTIONS_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(!this.plugin.data.settings.disableFileMenuReviewOptions)
                            .onChange(async (value) => {
                                this.plugin.data.settings.disableFileMenuReviewOptions = !value;
                                await this.plugin.savePluginData();
                                this.plugin.showFileMenuItems(value);
                            }),
                    );
            });

        new SettingGroup(this.containerEl)
            .setHeading(t("FLASHCARDS"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("INITIALLY_EXPAND_SUBDECKS_IN_TREE"))
                    .setDesc(t("INITIALLY_EXPAND_SUBDECKS_IN_TREE_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.plugin.data.settings.initiallyExpandAllSubdecksInTree)
                            .onChange(async (value) => {
                                this.plugin.data.settings.initiallyExpandAllSubdecksInTree = value;
                                await this.plugin.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_CARD_CONTEXT"))
                    .setDesc(t("SHOW_CARD_CONTEXT_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.plugin.data.settings.showContextInCards)
                            .onChange(async (value) => {
                                this.plugin.data.settings.showContextInCards = value;
                                await this.plugin.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_INTERVAL_IN_REVIEW_BUTTONS"))
                    .setDesc(t("SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.plugin.data.settings.showIntervalInReviewButtons)
                            .onChange(async (value) => {
                                this.plugin.data.settings.showIntervalInReviewButtons = value;
                                await this.plugin.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("CARD_MODAL_HEIGHT_PERCENT"))
                    .setDesc(t("CARD_MODAL_SIZE_PERCENT_DESC"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.plugin.data.settings.flashcardHeightPercentage =
                                    DEFAULT_SETTINGS.flashcardHeightPercentage;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addSlider((slider) =>
                        slider
                            .setLimits(10, 100, 5)
                            .setValue(this.plugin.data.settings.flashcardHeightPercentage)
                            .setDynamicTooltip()
                            .onChange(async (value) => {
                                this.plugin.data.settings.flashcardHeightPercentage = value;
                                await this.plugin.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("CARD_MODAL_WIDTH_PERCENT"))
                    .setDesc(t("CARD_MODAL_SIZE_PERCENT_DESC"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.plugin.data.settings.flashcardWidthPercentage =
                                    DEFAULT_SETTINGS.flashcardWidthPercentage;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addSlider((slider) =>
                        slider
                            .setLimits(10, 100, 5)
                            .setValue(this.plugin.data.settings.flashcardWidthPercentage)
                            .setDynamicTooltip()
                            .onChange(async (value) => {
                                this.plugin.data.settings.flashcardWidthPercentage = value;
                                await this.plugin.savePluginData();
                            }),
                    );
            });

        new SettingGroup(this.containerEl)
            .setHeading(t("GROUP_FLASHCARDS_NOTES"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("FLASHCARD_EASY_LABEL"))
                    .setDesc(t("FLASHCARD_EASY_DESC"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.plugin.data.settings.flashcardEasyText =
                                    DEFAULT_SETTINGS.flashcardEasyText;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.plugin.data.settings.flashcardEasyText)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.plugin.data.settings.flashcardEasyText = value;
                                    await this.plugin.savePluginData();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("FLASHCARD_GOOD_LABEL"))
                    .setDesc(t("FLASHCARD_GOOD_DESC"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.plugin.data.settings.flashcardGoodText =
                                    DEFAULT_SETTINGS.flashcardGoodText;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.plugin.data.settings.flashcardGoodText)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.plugin.data.settings.flashcardGoodText = value;
                                    await this.plugin.savePluginData();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("FLASHCARD_HARD_LABEL"))
                    .setDesc(t("FLASHCARD_HARD_DESC"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.plugin.data.settings.flashcardHardText =
                                    DEFAULT_SETTINGS.flashcardHardText;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.plugin.data.settings.flashcardHardText)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.plugin.data.settings.flashcardHardText = value;
                                    await this.plugin.savePluginData();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("REVIEW_BUTTON_DELAY"))
                    .setDesc(t("REVIEW_BUTTON_DELAY_DESC"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.plugin.data.settings.reviewButtonDelay =
                                    DEFAULT_SETTINGS.reviewButtonDelay;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addSlider((slider) =>
                        slider
                            .setLimits(0, 5000, 100)
                            .setValue(this.plugin.data.settings.reviewButtonDelay)
                            .setDynamicTooltip()
                            .onChange(async (value) => {
                                this.plugin.data.settings.reviewButtonDelay = value;
                                await this.plugin.savePluginData();
                            }),
                    );
            });
    }
}
