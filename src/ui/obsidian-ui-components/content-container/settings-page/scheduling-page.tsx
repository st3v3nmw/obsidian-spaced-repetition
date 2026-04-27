import { Notice, Setting, SettingGroup } from "obsidian";

import { Algorithm } from "src/algorithms/base/isrs-algorithm";
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
        this.plugin.data.settings.algorithm = algorithm;
        await this.plugin.savePluginData();
        this.plugin.setupDataStoreAndAlgorithmInstances(this.plugin.data.settings);
        this.display();
    }

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
                        .setValue(this.plugin.data.settings.algorithm)
                        .onChange(async (value) => {
                            const selectedAlgorithm = value as Algorithm;
                            const currentAlgorithm = this.plugin.data.settings
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

        if (this.plugin.data.settings.algorithm === Algorithm.FSRS) {
            algorithmGroup.addSetting((setting: Setting) => {
                setting
                    .setName("FSRS desired retention")
                    .setDesc("Target recall probability used by FSRS for flashcard scheduling.")
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.plugin.data.settings.fsrsDesiredRetention =
                                    DEFAULT_SETTINGS.fsrsDesiredRetention;
                                await this.plugin.savePluginData();
                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.plugin.data.settings.fsrsDesiredRetention.toString())
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    const numValue = Number.parseFloat(value);
                                    if (Number.isNaN(numValue) || numValue <= 0 || numValue > 1) {
                                        new Notice(
                                            "FSRS desired retention must be between 0 and 1.",
                                        );
                                        text.setValue(
                                            this.plugin.data.settings.fsrsDesiredRetention.toString(),
                                        );
                                        return;
                                    }

                                    this.plugin.data.settings.fsrsDesiredRetention = numValue;
                                    await this.plugin.savePluginData();
                                });
                            }),
                    );
            });
        }

        algorithmGroup.addSetting((setting: Setting) => {
            setting
                .setName(t("BASE_EASE"))
                .setDesc(t("BASE_EASE_DESC"))
                .addExtraButton((button) => {
                    button
                        .setIcon("reset")
                        .setTooltip(t("RESET_DEFAULT"))
                        .onClick(async () => {
                            this.plugin.data.settings.baseEase = DEFAULT_SETTINGS.baseEase;
                            await this.plugin.savePluginData();

                            this.display();
                        });
                })
                .addText((text) =>
                    text
                        .setValue(this.plugin.data.settings.baseEase.toString())
                        .onChange((value) => {
                            applySettingsUpdate(async () => {
                                const numValue: number = Number.parseInt(value);
                                if (!isNaN(numValue)) {
                                    if (numValue < 130) {
                                        new Notice(t("BASE_EASE_MIN_WARNING"));
                                        text.setValue(
                                            this.plugin.data.settings.baseEase.toString(),
                                        );
                                        return;
                                    }

                                    this.plugin.data.settings.baseEase = numValue;
                                    await this.plugin.savePluginData();
                                } else {
                                    new Notice(t("VALID_NUMBER_WARNING"));
                                }
                            });
                        }),
                );
        });
        algorithmGroup
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("LAPSE_INTERVAL_CHANGE"))
                    .setDesc(t("LAPSE_INTERVAL_CHANGE_DESC"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.plugin.data.settings.lapsesIntervalChange =
                                    DEFAULT_SETTINGS.lapsesIntervalChange;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addSlider((slider) =>
                        slider
                            .setLimits(1, 99, 1)
                            .setValue(this.plugin.data.settings.lapsesIntervalChange * 100)
                            .setDynamicTooltip()
                            .onChange(async (value: number) => {
                                this.plugin.data.settings.lapsesIntervalChange = value / 100;
                                await this.plugin.savePluginData();
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
                                this.plugin.data.settings.easyBonus = DEFAULT_SETTINGS.easyBonus;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue((this.plugin.data.settings.easyBonus * 100).toString())
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    const numValue: number = Number.parseInt(value) / 100;
                                    if (!isNaN(numValue)) {
                                        if (numValue < 1.0) {
                                            new Notice(t("EASY_BONUS_MIN_WARNING"));
                                            text.setValue(
                                                (
                                                    this.plugin.data.settings.easyBonus * 100
                                                ).toString(),
                                            );
                                            return;
                                        }

                                        this.plugin.data.settings.easyBonus = numValue;
                                        await this.plugin.savePluginData();
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
                            .setValue(this.plugin.data.settings.loadBalance)
                            .onChange(async (value) => {
                                this.plugin.data.settings.loadBalance = value;
                                await this.plugin.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("MAX_INTERVAL"))
                    .setDesc(t("MAX_INTERVAL_DESC"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.plugin.data.settings.maximumInterval =
                                    DEFAULT_SETTINGS.maximumInterval;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.plugin.data.settings.maximumInterval.toString())
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    const numValue: number = Number.parseInt(value);
                                    if (!isNaN(numValue)) {
                                        if (numValue < 1) {
                                            new Notice(t("MAX_INTERVAL_MIN_WARNING"));
                                            text.setValue(
                                                this.plugin.data.settings.maximumInterval.toString(),
                                            );
                                            return;
                                        }

                                        this.plugin.data.settings.maximumInterval = numValue;
                                        await this.plugin.savePluginData();
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
                                this.plugin.data.settings.startOfDay = DEFAULT_SETTINGS.startOfDay;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text.setValue(this.plugin.data.settings.startOfDay).onChange((value) => {
                            applySettingsUpdate(async () => {
                                const dayBoundary: IDayBoundary | null =
                                    DateUtil.strToDayBoundary(value);
                                if (dayBoundary === null) {
                                    new Notice(t("INVALID_START_OF_DAY_WARNING"));
                                    return;
                                } else {
                                    this.plugin.data.settings.startOfDay = value;
                                    await this.plugin.savePluginData();
                                    globalDateProvider.setDayBoundary(dayBoundary);
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
                                this.plugin.data.settings.maxLinkFactor =
                                    DEFAULT_SETTINGS.maxLinkFactor;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addSlider((slider) =>
                        slider
                            .setLimits(0, 100, 1)
                            .setValue(this.plugin.data.settings.maxLinkFactor * 100)
                            .setDynamicTooltip()
                            .onChange(async (value: number) => {
                                this.plugin.data.settings.maxLinkFactor = value / 100;
                                await this.plugin.savePluginData();
                            }),
                    );
            });
    }
}
