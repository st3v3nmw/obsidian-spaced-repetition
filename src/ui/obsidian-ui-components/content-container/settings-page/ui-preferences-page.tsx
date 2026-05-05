import { Platform, Setting, SettingGroup } from "obsidian";

import { DataManager } from "src/data/data-manager";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { DEFAULT_SETTINGS } from "src/settings";
import { SettingsPage } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page";
import { SettingsPageType } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page-manager";
import { UIManager } from "src/ui/ui-manager";
import EmulatedPlatform from "src/utils/platform-detector";

export class UIPreferencesPage extends SettingsPage {
    private uiManager: UIManager;
    constructor(
        containerEl: HTMLElement,
        plugin: SRPlugin,
        dataManager: DataManager,
        uiManager: UIManager,
        pageType: SettingsPageType,
        applySettingsUpdate: (callback: () => unknown) => void,
        display: () => void,
        openPage: (pageType: SettingsPageType) => void,
        scrollListener: (scrollPosition: number) => void,
    ) {
        super(
            containerEl,
            plugin,
            dataManager,
            pageType,
            applySettingsUpdate,
            display,
            openPage,
            scrollListener,
        );

        this.uiManager = uiManager;

        new SettingGroup(this.containerEl)
            .setHeading(t("OBSIDIAN_INTEGRATION"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("OPEN_IN_TAB"))
                    .setDesc(t("OPEN_IN_TAB_DESC"))
                    .addToggle((toggle) => {
                        const isMobile = Platform.isMobile || EmulatedPlatform().isMobile;
                        toggle
                            .setValue(
                                isMobile
                                    ? this.dataManager.data.settings.openViewInNewTabMobile
                                    : this.dataManager.data.settings.openViewInNewTab,
                            )
                            .onChange(async (value) => {
                                if (isMobile) {
                                    this.dataManager.data.settings.openViewInNewTabMobile = value;
                                    this.dataManager.data.settings.flashcardHeightPercentageMobile = 100;
                                    this.dataManager.data.settings.flashcardWidthPercentageMobile = 100;
                                } else {
                                    this.dataManager.data.settings.openViewInNewTab = value;
                                    this.dataManager.data.settings.flashcardHeightPercentage = 100;
                                    this.dataManager.data.settings.flashcardWidthPercentage = 100;
                                }

                                if (value) {
                                    this.uiManager.registerSRFocusListener();
                                } else {
                                    this.uiManager.tabViewManager.closeAllTabViews();
                                    this.dataManager.data.settings.useCustomHotkeys = false;

                                    // Remove focus from SR and remove event listener for focus change
                                    this.uiManager.removeSRFocusListener();
                                }
                                await this.dataManager.savePluginData();
                                this.display();
                            });
                    });
            })
            .addSetting((setting: Setting) => {
                const isMobile = Platform.isMobile || EmulatedPlatform().isMobile;
                setting
                    .setName(t("USE_CUSTOM_HOTKEYS"))
                    .setDesc(t("USE_CUSTOM_HOTKEYS_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.useCustomHotkeys)
                            .setDisabled(
                                (isMobile && !this.dataManager.data.settings.openViewInNewTabMobile) ||
                                (!isMobile && !this.dataManager.data.settings.openViewInNewTab),
                            )
                            .onChange(async (value) => {
                                this.dataManager.data.settings.useCustomHotkeys = value;
                                if (this.dataManager.data.settings.useCustomHotkeys) {
                                    this.plugin.addCustomHotkeys();
                                } else {
                                    this.plugin.removeCustomHotkeys();
                                }
                                this.plugin.addCustomHotkeys();
                                await this.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_RIBBON_ICON"))
                    .setDesc(t("SHOW_RIBBON_ICON_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.showRibbonIcon)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.showRibbonIcon = value;
                                await this.dataManager.savePluginData();
                                this.uiManager.showRibbonIcon(value);
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("ENABLE_FILE_MENU_REVIEW_OPTIONS"))
                    .setDesc(t("ENABLE_FILE_MENU_REVIEW_OPTIONS_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.showFileMenuReviewOptions)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.showFileMenuReviewOptions = value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("ENABLE_FILE_MENU_DELETE_BUTTON"))
                    .setDesc(t("ENABLE_FILE_MENU_DELETE_BUTTON_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.showDeleteButtonInFileMenu)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.showDeleteButtonInFileMenu = value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_DELETE_BUTTON"))
                    .setDesc(t("SHOW_DELETE_BUTTON_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.showDeleteButtonInCardView)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.showDeleteButtonInCardView = value;
                                await this.dataManager.savePluginData();
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
                                const isMobile = Platform.isMobile || EmulatedPlatform().isMobile;
                                if (isMobile) {
                                    this.dataManager.data.settings.flashcardHeightPercentageMobile =
                                        DEFAULT_SETTINGS.flashcardHeightPercentageMobile;
                                } else {
                                    this.dataManager.data.settings.flashcardHeightPercentage =
                                        DEFAULT_SETTINGS.flashcardHeightPercentage;
                                }
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addSlider((slider) => {
                        const isMobile = Platform.isMobile || EmulatedPlatform().isMobile;
                        slider
                            .setLimits(10, 100, 5)
                            .setValue(
                                isMobile
                                    ? this.dataManager.data.settings.flashcardHeightPercentageMobile
                                    : this.dataManager.data.settings.flashcardHeightPercentage,
                            )
                            .setDynamicTooltip()
                            .onChange(async (value) => {
                                if (isMobile) {
                                    this.dataManager.data.settings.flashcardHeightPercentageMobile =
                                        value;
                                } else {
                                    this.dataManager.data.settings.flashcardHeightPercentage = value;
                                }
                                await this.dataManager.savePluginData();
                            });
                    });
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
                                const isMobile = Platform.isMobile || EmulatedPlatform().isMobile;
                                if (isMobile) {
                                    this.dataManager.data.settings.flashcardWidthPercentageMobile =
                                        DEFAULT_SETTINGS.flashcardWidthPercentageMobile;
                                } else {
                                    this.dataManager.data.settings.flashcardWidthPercentage =
                                        DEFAULT_SETTINGS.flashcardWidthPercentage;
                                }
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addSlider((slider) => {
                        const isMobile = Platform.isMobile || EmulatedPlatform().isMobile;
                        slider
                            .setLimits(10, 100, 5)
                            .setValue(
                                isMobile
                                    ? this.dataManager.data.settings.flashcardWidthPercentageMobile
                                    : this.dataManager.data.settings.flashcardWidthPercentage,
                            )
                            .setDynamicTooltip()
                            .onChange(async (value) => {
                                if (isMobile) {
                                    this.dataManager.data.settings.flashcardWidthPercentageMobile =
                                        value;
                                } else {
                                    this.dataManager.data.settings.flashcardWidthPercentage = value;
                                }
                                await this.dataManager.savePluginData();
                            });
                    });
            });

        new SettingGroup(this.containerEl)
            .setHeading(t("STATUS_BAR_SETTINGS"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_STATUS_BAR"))
                    .setDesc(t("SHOW_STATUS_BAR_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.showStatusBar)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.showStatusBar = value;
                                await this.dataManager.savePluginData();
                                this.uiManager.updateStatusBar();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_CARD_STATUS_BAR_ITEM"))
                    .setDesc(t("SHOW_CARD_STATUS_BAR_ITEM_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.showCardStatusBarItem)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.showCardStatusBarItem = value;
                                await this.dataManager.savePluginData();
                                this.uiManager.updateStatusBar();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_NOTE_STATUS_BAR_ITEM"))
                    .setDesc(t("SHOW_NOTE_STATUS_BAR_ITEM_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.showNoteStatusBarItem)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.showNoteStatusBarItem = value;
                                await this.dataManager.savePluginData();
                                this.uiManager.updateStatusBar();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_UPDATE_AVAILABLE_STATUS_BAR_ITEM"))
                    .setDesc(t("SHOW_UPDATE_AVAILABLE_STATUS_BAR_ITEM_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.showUpdateAvailableStatusBarItem)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.showUpdateAvailableStatusBarItem = value;
                                await this.dataManager.savePluginData();
                                this.uiManager.updateStatusBar();
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
                            .setValue(this.dataManager.data.settings.initiallyExpandAllSubdecksInTree)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.initiallyExpandAllSubdecksInTree = value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_CARD_CONTEXT"))
                    .setDesc(t("SHOW_CARD_CONTEXT_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.showContextInCards)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.showContextInCards = value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("CONVERT_CLOZE_PATTERNS_TO_INPUTS"))
                    .setDesc(t("CONVERT_CLOZE_PATTERNS_TO_INPUTS_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.convertClozePatternsToInputs)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.convertClozePatternsToInputs = value;
                                await this.dataManager.savePluginData();

                                this.display();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_INTERVAL_IN_REVIEW_BUTTONS"))
                    .setDesc(t("SHOW_INTERVAL_IN_REVIEW_BUTTONS_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.showIntervalInReviewButtons)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.showIntervalInReviewButtons = value;
                                await this.dataManager.savePluginData();
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
                                this.dataManager.data.settings.flashcardEasyText =
                                    DEFAULT_SETTINGS.flashcardEasyText;
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.dataManager.data.settings.flashcardEasyText)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.flashcardEasyText = value;
                                    await this.dataManager.savePluginData();
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
                                this.dataManager.data.settings.flashcardGoodText =
                                    DEFAULT_SETTINGS.flashcardGoodText;
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.dataManager.data.settings.flashcardGoodText)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.flashcardGoodText = value;
                                    await this.dataManager.savePluginData();
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
                                this.dataManager.data.settings.flashcardHardText =
                                    DEFAULT_SETTINGS.flashcardHardText;
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.dataManager.data.settings.flashcardHardText)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.flashcardHardText = value;
                                    await this.dataManager.savePluginData();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("FLASHCARD_AGAIN_LABEL"))
                    .setDesc(t("FLASHCARD_AGAIN_DESC"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.dataManager.data.settings.flashcardAgainText =
                                    DEFAULT_SETTINGS.flashcardAgainText;
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.dataManager.data.settings.flashcardAgainText)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.flashcardAgainText = value;
                                    await this.dataManager.savePluginData();
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
                                this.dataManager.data.settings.reviewButtonDelay =
                                    DEFAULT_SETTINGS.reviewButtonDelay;
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addSlider((slider) =>
                        slider
                            .setLimits(0, 5000, 100)
                            .setValue(this.dataManager.data.settings.reviewButtonDelay)
                            .setDynamicTooltip()
                            .onChange(async (value) => {
                                this.dataManager.data.settings.reviewButtonDelay = value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            });
    }
}
