import { Notice, Setting, SettingGroup } from "obsidian";

import { Algorithm } from "src/algorithms/base/isrs-algorithm";
import { DataManager } from "src/data/data-manager";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { DEFAULT_SETTINGS } from "src/settings";
import { SettingsPage } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page";
import { SettingsPageType } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page-manager";
import { ConfirmationModal } from "src/ui/obsidian-ui-components/modals/confirmation-modal";
import { DateUtil, globalDateProvider, IDayBoundary } from "src/utils/dates";

/**
 * Represents a scheduling settings page.
 *
 * @class SchedulingPage
 * @extends {SettingsPage}
 */
export class SchedulingPage extends SettingsPage {
    private async setAlgorithm(algorithm: Algorithm): Promise<void> {
        this.dataManager.data.settings.algorithm = algorithm;
        await this.dataManager.savePluginData();
        this.dataManager.setupDataStoreAndAlgorithmInstances(this.dataManager.data.settings);
        this.display();
    }

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

        const algorithmGroup = new SettingGroup(this.containerEl).setHeading(t("ALGORITHM"));

        algorithmGroup.addSetting((setting: Setting) => {
            const algoSettingEl = setting
                .setName(t("ALGORITHM"))
                .setDesc("")
                .addDropdown((dropdown) =>
                    dropdown
                        .addOptions({
                            "SM-2-OSR": t("SM2_OSR_VARIANT"),
                            FSRS: "FSRS",
                        })
                        .setValue(this.dataManager.data.settings.algorithm)
                        .onChange(async (value) => {
                            const selectedAlgorithm = value as Algorithm;
                            const currentAlgorithm = this.dataManager.data.settings
                                .algorithm as Algorithm;

                            if (selectedAlgorithm === currentAlgorithm) {
                                return;
                            }

                            if (
                                currentAlgorithm === Algorithm.SM_2_OSR &&
                                selectedAlgorithm === Algorithm.FSRS
                            ) {
                                dropdown.setValue(currentAlgorithm);
                                new ConfirmationModal(
                                    this.plugin.app,
                                    t("SWITCH_TO_FSRS_ALGORITHM"),
                                    t("CONFIRM_FSRS_ALGORITHM_SWITCH"),
                                    undefined,
                                    async () => {
                                        await this.setAlgorithm(selectedAlgorithm);
                                    },
                                ).open();
                                return;
                            }

                            await this.setAlgorithm(selectedAlgorithm);
                        }),
                );

            algoSettingEl.descEl.insertAdjacentHTML(
                "beforeend",
                t("CHECK_ALGORITHM_WIKI", {
                    algoUrl: "https://stephenmwangi.com/obsidian-spaced-repetition/algorithms/",
                }),
            );
        });

        algorithmGroup.addSetting((setting: Setting) => {
            setting
                .setName("Flashcard algorithm scope")
                .setDesc(
                    "The selected algorithm applies to flashcards and clozes only. Whole-note review continues to use the existing OSR scheduler.",
                );
        });

        if (this.dataManager.data.settings.algorithm === Algorithm.FSRS) {
            algorithmGroup.addSetting((setting: Setting) => {
                setting
                    .setName("FSRS desired retention")
                    .setDesc("Target recall probability used by FSRS for flashcard scheduling.")
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.dataManager.data.settings.fsrsDesiredRetention =
                                    DEFAULT_SETTINGS.fsrsDesiredRetention;
                                await this.dataManager.savePluginData();
                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.dataManager.data.settings.fsrsDesiredRetention.toString())
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    const numValue = Number.parseFloat(value);
                                    if (Number.isNaN(numValue) || numValue <= 0 || numValue > 1) {
                                        new Notice(
                                            "FSRS desired retention must be between 0 and 1.",
                                        );
                                        text.setValue(
                                            this.dataManager.data.settings.fsrsDesiredRetention.toString(),
                                        );
                                        return;
                                    }

                                    this.dataManager.data.settings.fsrsDesiredRetention = numValue;
                                    await this.dataManager.savePluginData();
                                });
                            }),
                    );
            });
        }

        if (this.dataManager.data.settings.algorithm === Algorithm.SM_2_OSR) {
            algorithmGroup
                .addSetting((setting: Setting) => {
                    setting
                        .setName(t("BASE_EASE"))
                        .setDesc(t("BASE_EASE_DESC"))
                        .addExtraButton((button) => {
                            button
                                .setIcon("reset")
                                .setTooltip(t("RESET_DEFAULT"))
                                .onClick(async () => {
                                    this.dataManager.data.settings.baseEase = DEFAULT_SETTINGS.baseEase;
                                    await this.dataManager.savePluginData();

                                    this.display();
                                });
                        })
                        .addText((text) =>
                            text
                                .setValue(this.dataManager.data.settings.baseEase.toString())
                                .onChange((value) => {
                                    applySettingsUpdate(async () => {
                                        const numValue: number = Number.parseInt(value);
                                        if (!isNaN(numValue)) {
                                            if (numValue < 130) {
                                                new Notice(t("BASE_EASE_MIN_WARNING"));
                                                text.setValue(
                                                    this.dataManager.data.settings.baseEase.toString(),
                                                );
                                                return;
                                            }

                                            this.dataManager.data.settings.baseEase = numValue;
                                            await this.dataManager.savePluginData();
                                        } else {
                                            new Notice(t("VALID_NUMBER_WARNING"));
                                        }
                                    });
                                }),
                        );
                })
                .addSetting((setting: Setting) => {
                    setting
                        .setName(t("MAX_LINK_CONTRIB"))
                        .setDesc(t("MAX_LINK_CONTRIB_DESC"))
                        .addExtraButton((button) => {
                            button
                                .setIcon("reset")
                                .setTooltip(t("RESET_DEFAULT"))
                                .onClick(async () => {
                                    this.dataManager.data.settings.maxLinkFactor =
                                        DEFAULT_SETTINGS.maxLinkFactor;
                                    await this.dataManager.savePluginData();

                                    this.display();
                                });
                        })
                        .addSlider((slider) =>
                            slider
                                .setLimits(0, 100, 1)
                                .setValue(this.dataManager.data.settings.maxLinkFactor * 100)
                                .setDynamicTooltip()
                                .onChange(async (value: number) => {
                                    this.dataManager.data.settings.maxLinkFactor = value / 100;
                                    await this.dataManager.savePluginData();
                                }),
                        );
                })
                .addSetting((setting: Setting) => {
                    setting
                        .setName(t("LAPSE_INTERVAL_CHANGE"))
                        .setDesc(t("LAPSE_INTERVAL_CHANGE_DESC"))
                        .addExtraButton((button) => {
                            button
                                .setIcon("reset")
                                .setTooltip(t("RESET_DEFAULT"))
                                .onClick(async () => {
                                    this.dataManager.data.settings.lapsesIntervalChange =
                                        DEFAULT_SETTINGS.lapsesIntervalChange;
                                    await this.dataManager.savePluginData();

                                    this.display();
                                });
                        })
                        .addSlider((slider) =>
                            slider
                                .setLimits(1, 99, 1)
                                .setValue(this.dataManager.data.settings.lapsesIntervalChange * 100)
                                .setDynamicTooltip()
                                .onChange(async (value: number) => {
                                    this.dataManager.data.settings.lapsesIntervalChange = value / 100;
                                    await this.dataManager.savePluginData();
                                }),
                        );
                })
                .addSetting((setting: Setting) => {
                    setting
                        .setName(t("EASY_BONUS"))
                        .setDesc(t("EASY_BONUS_DESC"))
                        .addExtraButton((button) => {
                            button
                                .setIcon("reset")
                                .setTooltip(t("RESET_DEFAULT"))
                                .onClick(async () => {
                                    this.dataManager.data.settings.easyBonus =
                                        DEFAULT_SETTINGS.easyBonus;
                                    await this.dataManager.savePluginData();

                                    this.display();
                                });
                        })
                        .addText((text) =>
                            text
                                .setValue((this.dataManager.data.settings.easyBonus * 100).toString())
                                .onChange((value) => {
                                    applySettingsUpdate(async () => {
                                        const numValue: number = Number.parseInt(value) / 100;
                                        if (!isNaN(numValue)) {
                                            if (numValue < 1.0) {
                                                new Notice(t("EASY_BONUS_MIN_WARNING"));
                                                text.setValue(
                                                    (
                                                        this.dataManager.data.settings.easyBonus * 100
                                                    ).toString(),
                                                );
                                                return;
                                            }

                                            this.dataManager.data.settings.easyBonus = numValue;
                                            await this.dataManager.savePluginData();
                                        } else {
                                            new Notice(t("VALID_NUMBER_WARNING"));
                                        }
                                    });
                                }),
                        );
                })
                .addSetting((setting: Setting) => {
                    setting
                        .setName(t("LOAD_BALANCE"))
                        .setDesc(t("LOAD_BALANCE_DESC"))
                        .addToggle((toggle) =>
                            toggle
                                .setValue(this.dataManager.data.settings.loadBalance)
                                .onChange(async (value) => {
                                    this.dataManager.data.settings.loadBalance = value;
                                    await this.dataManager.savePluginData();
                                }),
                        );
                });
        }

        algorithmGroup
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("MAX_INTERVAL"))
                    .setDesc(t("MAX_INTERVAL_DESC"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.dataManager.data.settings.maximumInterval =
                                    DEFAULT_SETTINGS.maximumInterval;
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.dataManager.data.settings.maximumInterval.toString())
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    const numValue: number = Number.parseInt(value);
                                    if (!isNaN(numValue)) {
                                        if (numValue < 1) {
                                            new Notice(t("MAX_INTERVAL_MIN_WARNING"));
                                            text.setValue(
                                                this.dataManager.data.settings.maximumInterval.toString(),
                                            );
                                            return;
                                        }

                                        this.dataManager.data.settings.maximumInterval = numValue;
                                        await this.dataManager.savePluginData();
                                    } else {
                                        new Notice(t("VALID_NUMBER_WARNING"));
                                    }
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("START_OF_DAY"))
                    .setDesc(t("START_OF_DAY_DESC"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.dataManager.data.settings.startOfDay = DEFAULT_SETTINGS.startOfDay;
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text.setValue(this.dataManager.data.settings.startOfDay).onChange((value) => {
                            applySettingsUpdate(async () => {
                                const dayBoundary: IDayBoundary | null =
                                    DateUtil.strToDayBoundary(value);
                                if (dayBoundary === null) {
                                    new Notice(t("INVALID_START_OF_DAY_WARNING"));
                                    return;
                                } else {
                                    this.dataManager.data.settings.startOfDay = value;
                                    await this.dataManager.savePluginData();
                                    globalDateProvider.setDayBoundary(dayBoundary);
                                }
                            });
                        }),
                    );
            });
    }
}
