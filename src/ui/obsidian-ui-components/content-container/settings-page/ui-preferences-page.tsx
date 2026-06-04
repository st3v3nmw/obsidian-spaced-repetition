import { Platform, Setting, SettingGroup } from "obsidian";

import { DataManager } from "src/data/data-manager";
import { DEFAULT_SETTINGS } from "src/data/settings";
import { SettingsManager } from "src/data/settings-manager";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { SettingsPage } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page";
import { SettingsPageType } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page-manager";
import { UIManager } from "src/ui/ui-manager";
import EmulatedPlatform from "src/utils/platform-detector";

export class UIPreferencesPage extends SettingsPage {
    private uiManager: UIManager;
    constructor(
        containerEl: HTMLElement,
        plugin: SRPlugin,
        settingsManager: SettingsManager,
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
            settingsManager,
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
                                    ? this.settingsManager.settings.openViewInNewTabMobile
                                    : this.settingsManager.settings.openViewInNewTab,
                            )
                            .onChange(async (value) => {
                                if (isMobile) {
                                    this.settingsManager.settings.openViewInNewTabMobile = value;
                                    this.settingsManager.settings.flashcardHeightPercentageMobile = 100;
                                    this.settingsManager.settings.flashcardWidthPercentageMobile = 100;
                                } else {
                                    this.settingsManager.settings.openViewInNewTab = value;
                                    this.settingsManager.settings.flashcardHeightPercentage = 100;
                                    this.settingsManager.settings.flashcardWidthPercentage = 100;
                                }

                                if (value) {
                                    this.uiManager.registerSRFocusListener();
                                } else {
                                    this.uiManager.tabViewManager.closeAllTabViews();
                                    this.settingsManager.settings.useCustomHotkeys = false;

                                    // Remove focus from SR and remove event listener for focus change
                                    this.uiManager.removeSRFocusListener();
                                }
                                await this.settingsManager.save();
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
                            .setValue(this.settingsManager.settings.useCustomHotkeys)
                            .setDisabled(
                                (isMobile &&
                                    !this.settingsManager.settings.openViewInNewTabMobile) ||
                                    (!isMobile && !this.settingsManager.settings.openViewInNewTab),
                            )
                            .onChange(async (value) => {
                                this.settingsManager.settings.useCustomHotkeys = value;
                                if (this.settingsManager.settings.useCustomHotkeys) {
                                    this.plugin.commandManager.addCustomHotkeys();
                                } else {
                                    this.plugin.commandManager.removeCustomHotkeys();
                                }
                                this.plugin.commandManager.addCustomHotkeys();
                                await this.settingsManager.save();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_RIBBON_ICON"))
                    .setDesc(t("SHOW_RIBBON_ICON_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.showRibbonIcon)
                            .onChange(async (value) => {
                                this.settingsManager.settings.showRibbonIcon = value;
                                await this.settingsManager.save();
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
                            .setValue(this.settingsManager.settings.showFileMenuReviewOptions)
                            .onChange(async (value) => {
                                this.settingsManager.settings.showFileMenuReviewOptions = value;
                                await this.settingsManager.save();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("ENABLE_FILE_MENU_DELETE_BUTTON"))
                    .setDesc(t("ENABLE_FILE_MENU_DELETE_BUTTON_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.showDeleteButtonInFileMenu)
                            .onChange(async (value) => {
                                this.settingsManager.settings.showDeleteButtonInFileMenu = value;
                                await this.settingsManager.save();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_DELETE_BUTTON"))
                    .setDesc(t("SHOW_DELETE_BUTTON_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.showDeleteButtonInCardView)
                            .onChange(async (value) => {
                                this.settingsManager.settings.showDeleteButtonInCardView = value;
                                await this.settingsManager.save();
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
                                    this.settingsManager.settings.flashcardHeightPercentageMobile =
                                        DEFAULT_SETTINGS.flashcardHeightPercentageMobile;
                                } else {
                                    this.settingsManager.settings.flashcardHeightPercentage =
                                        DEFAULT_SETTINGS.flashcardHeightPercentage;
                                }
                                await this.settingsManager.save();

                                this.display();
                            });
                    })
                    .addSlider((slider) => {
                        const isMobile = Platform.isMobile || EmulatedPlatform().isMobile;
                        slider
                            .setLimits(10, 100, 5)
                            .setValue(
                                isMobile
                                    ? this.settingsManager.settings.flashcardHeightPercentageMobile
                                    : this.settingsManager.settings.flashcardHeightPercentage,
                            )
                            .setDynamicTooltip()
                            .onChange(async (value) => {
                                if (isMobile) {
                                    this.settingsManager.settings.flashcardHeightPercentageMobile =
                                        value;
                                } else {
                                    this.settingsManager.settings.flashcardHeightPercentage = value;
                                }
                                await this.settingsManager.save();
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
                                    this.settingsManager.settings.flashcardWidthPercentageMobile =
                                        DEFAULT_SETTINGS.flashcardWidthPercentageMobile;
                                } else {
                                    this.settingsManager.settings.flashcardWidthPercentage =
                                        DEFAULT_SETTINGS.flashcardWidthPercentage;
                                }
                                await this.settingsManager.save();

                                this.display();
                            });
                    })
                    .addSlider((slider) => {
                        const isMobile = Platform.isMobile || EmulatedPlatform().isMobile;
                        slider
                            .setLimits(10, 100, 5)
                            .setValue(
                                isMobile
                                    ? this.settingsManager.settings.flashcardWidthPercentageMobile
                                    : this.settingsManager.settings.flashcardWidthPercentage,
                            )
                            .setDynamicTooltip()
                            .onChange(async (value) => {
                                if (isMobile) {
                                    this.settingsManager.settings.flashcardWidthPercentageMobile =
                                        value;
                                } else {
                                    this.settingsManager.settings.flashcardWidthPercentage = value;
                                }
                                await this.settingsManager.save();
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
                            .setValue(this.settingsManager.settings.showStatusBar)
                            .onChange(async (value) => {
                                this.settingsManager.settings.showStatusBar = value;
                                await this.settingsManager.save();
                                await this.uiManager.updateStatusBar();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_CARD_STATUS_BAR_ITEM"))
                    .setDesc(t("SHOW_CARD_STATUS_BAR_ITEM_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.showCardStatusBarItem)
                            .onChange(async (value) => {
                                this.settingsManager.settings.showCardStatusBarItem = value;
                                await this.settingsManager.save();
                                await this.uiManager.updateStatusBar();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_NOTE_STATUS_BAR_ITEM"))
                    .setDesc(t("SHOW_NOTE_STATUS_BAR_ITEM_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.showNoteStatusBarItem)
                            .onChange(async (value) => {
                                this.settingsManager.settings.showNoteStatusBarItem = value;
                                await this.settingsManager.save();
                                await this.uiManager.updateStatusBar();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_UPDATE_AVAILABLE_STATUS_BAR_ITEM"))
                    .setDesc(t("SHOW_UPDATE_AVAILABLE_STATUS_BAR_ITEM_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(
                                this.settingsManager.settings.showUpdateAvailableStatusBarItem,
                            )
                            .onChange(async (value) => {
                                this.settingsManager.settings.showUpdateAvailableStatusBarItem =
                                    value;
                                await this.settingsManager.save();
                                await this.uiManager.updateStatusBar();
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
                            .setValue(
                                this.settingsManager.settings.initiallyExpandAllSubdecksInTree,
                            )
                            .onChange(async (value) => {
                                this.settingsManager.settings.initiallyExpandAllSubdecksInTree =
                                    value;
                                await this.settingsManager.save();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("SHOW_CARD_CONTEXT"))
                    .setDesc(t("SHOW_CARD_CONTEXT_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.showContextInCards)
                            .onChange(async (value) => {
                                this.settingsManager.settings.showContextInCards = value;
                                await this.settingsManager.save();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("CONVERT_CLOZE_PATTERNS_TO_INPUTS"))
                    .setDesc(t("CONVERT_CLOZE_PATTERNS_TO_INPUTS_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.convertClozePatternsToInputs)
                            .onChange(async (value) => {
                                this.settingsManager.settings.convertClozePatternsToInputs = value;
                                await this.settingsManager.save();

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
                            .setValue(this.settingsManager.settings.showIntervalInReviewButtons)
                            .onChange(async (value) => {
                                this.settingsManager.settings.showIntervalInReviewButtons = value;
                                await this.settingsManager.save();
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
                                this.settingsManager.settings.flashcardEasyText =
                                    DEFAULT_SETTINGS.flashcardEasyText;
                                await this.settingsManager.save();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.settingsManager.settings.flashcardEasyText)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.settingsManager.settings.flashcardEasyText = value;
                                    await this.settingsManager.save();
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
                                this.settingsManager.settings.flashcardGoodText =
                                    DEFAULT_SETTINGS.flashcardGoodText;
                                await this.settingsManager.save();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.settingsManager.settings.flashcardGoodText)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.settingsManager.settings.flashcardGoodText = value;
                                    await this.settingsManager.save();
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
                                this.settingsManager.settings.flashcardHardText =
                                    DEFAULT_SETTINGS.flashcardHardText;
                                await this.settingsManager.save();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.settingsManager.settings.flashcardHardText)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.settingsManager.settings.flashcardHardText = value;
                                    await this.settingsManager.save();
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
                                this.settingsManager.settings.flashcardAgainText =
                                    DEFAULT_SETTINGS.flashcardAgainText;
                                await this.settingsManager.save();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.settingsManager.settings.flashcardAgainText)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.settingsManager.settings.flashcardAgainText = value;
                                    await this.settingsManager.save();
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
                                this.settingsManager.settings.reviewButtonDelay =
                                    DEFAULT_SETTINGS.reviewButtonDelay;
                                await this.settingsManager.save();

                                this.display();
                            });
                    })
                    .addSlider((slider) =>
                        slider
                            .setLimits(0, 5000, 100)
                            .setValue(this.settingsManager.settings.reviewButtonDelay)
                            .setDynamicTooltip()
                            .onChange(async (value) => {
                                this.settingsManager.settings.reviewButtonDelay = value;
                                await this.settingsManager.save();
                            }),
                    );
            });
    }
}
