import { Notice, Setting, SettingGroup } from "obsidian";

import { DataManager } from "src/data/data-manager";
import { DEFAULT_SETTINGS } from "src/data/settings";
import { t, tHTML } from "src/lang/helpers";
import SRPlugin from "src/main";
import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
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
    private async setAlgorithm(algorithm: SRAlgorithmType): Promise<void> {
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

        // These controls live under Scheduling because they govern when review is surfaced to the
        // user, not how flashcards are parsed or reviewed once a session is already open.
        new SettingGroup(this.containerEl)
            .setHeading(t("REVIEW_REMINDERS"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("REVIEW_REMINDERS"))
                    .setDesc(t("REVIEW_REMINDERS_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.enableReviewReminders)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.enableReviewReminders = value;
                                await this.dataManager.savePluginData();
                                // The interval loop is stateful, so settings changes must be
                                // applied immediately instead of waiting for the next reload.
                                this.plugin.restartReviewReminders();
                                this.display();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("REVIEW_REMINDER_CHECK_ON_STARTUP"))
                    .setDesc(t("REVIEW_REMINDER_CHECK_ON_STARTUP_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.reviewReminderCheckOnStartup)
                            .setDisabled(!this.dataManager.data.settings.enableReviewReminders)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.reviewReminderCheckOnStartup = value;
                                await this.dataManager.savePluginData();
                                this.plugin.restartReviewReminders();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("REVIEW_REMINDER_INTERVAL"))
                    .setDesc(t("REVIEW_REMINDER_INTERVAL_DESC"))
                    .addText((text) => {
                        text.setValue(
                            this.dataManager.data.settings.reviewReminderIntervalMinutes.toString(),
                        );
                        text.inputEl.type = "number";
                        text.inputEl.min = "1";
                        text.inputEl.max = "1440";
                        text.inputEl.step = "1";
                        text.setDisabled(!this.dataManager.data.settings.enableReviewReminders);

                        const commitIntervalValue = (value: string) => {
                            this.applySettingsUpdate(async () => {
                                const parsedValue = Number.parseInt(value);
                                if (
                                    Number.isNaN(parsedValue) ||
                                    parsedValue < 1 ||
                                    parsedValue > 1440
                                ) {
                                    new Notice(t("REVIEW_REMINDER_INTERVAL_MIN_WARNING"));
                                    text.setValue(
                                        this.dataManager.data.settings.reviewReminderIntervalMinutes.toString(),
                                    );
                                    return;
                                }

                                this.dataManager.data.settings.reviewReminderIntervalMinutes =
                                    parsedValue;
                                await this.dataManager.savePluginData();
                                // Interval changes only take effect once the existing timer is
                                // rebuilt with the new cadence.
                                this.plugin.restartReviewReminders();
                            });
                        };

                        text.inputEl.addEventListener("blur", () => {
                            commitIntervalValue(text.getValue());
                        });
                        text.inputEl.addEventListener("keydown", (event) => {
                            if (event.key === "Enter") {
                                commitIntervalValue(text.getValue());
                            }
                        });
                    });
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("REVIEW_REMINDER_MESSAGE"))
                    .setDesc(t("REVIEW_REMINDER_MESSAGE_DESC"))
                    .addTextArea((text) =>
                        text
                            .setValue(this.dataManager.data.settings.reviewReminderMessage)
                            .setDisabled(!this.dataManager.data.settings.enableReviewReminders)
                            .onChange((value) => {
                                this.applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.reviewReminderMessage = value;
                                    await this.dataManager.savePluginData();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("REVIEW_REMINDER_AUTO_OPEN"))
                    .setDesc(t("REVIEW_REMINDER_AUTO_OPEN_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.reviewReminderAutoOpen)
                            .setDisabled(!this.dataManager.data.settings.enableReviewReminders)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.reviewReminderAutoOpen = value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("REVIEW_REMINDER_SHOW_NOTICE"))
                    .setDesc(t("REVIEW_REMINDER_SHOW_NOTICE_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.reviewReminderShowNotice)
                            .setDisabled(!this.dataManager.data.settings.enableReviewReminders)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.reviewReminderShowNotice = value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("REVIEW_REMINDER_PLAY_SOUND"))
                    .setDesc(t("REVIEW_REMINDER_PLAY_SOUND_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.reviewReminderPlaySound)
                            .setDisabled(!this.dataManager.data.settings.enableReviewReminders)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.reviewReminderPlaySound = value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("REVIEW_REMINDER_BOUNCE_DOCK"))
                    .setDesc(t("REVIEW_REMINDER_BOUNCE_DOCK_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.reviewReminderBounceDock)
                            .setDisabled(!this.dataManager.data.settings.enableReviewReminders)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.reviewReminderBounceDock = value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            });

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
                            const selectedAlgorithm = value as SRAlgorithmType;
                            const currentAlgorithm = this.dataManager.data.settings.algorithm;

                            if (selectedAlgorithm === currentAlgorithm) {
                                return;
                            }

                            if (
                                currentAlgorithm === SRAlgorithmType.SM_2_OSR &&
                                selectedAlgorithm === SRAlgorithmType.FSRS
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

            const elements: (HTMLElement | Text)[] = tHTML("CHECK_ALGORITHM_WIKI", {
                algoUrl: "https://stephenmwangi.com/obsidian-spaced-repetition/algorithms/",
            });

            algoSettingEl.descEl.empty();

            for (let i = 0; i < elements.length; i++) {
                algoSettingEl.descEl.append(elements[i]);
            }
        });

        algorithmGroup.addSetting((setting: Setting) => {
            setting
                .setName("Flashcard algorithm scope")
                .setDesc(
                    "The selected algorithm applies to flashcards and clozes only. Whole-note review continues to use the existing OSR scheduler.",
                );
        });

        if (this.dataManager.data.settings.algorithm === SRAlgorithmType.FSRS) {
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
                            .setValue(
                                this.dataManager.data.settings.fsrsDesiredRetention.toString(),
                            )
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

        if (this.dataManager.data.settings.algorithm === SRAlgorithmType.SM_2_OSR) {
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
                                    this.dataManager.data.settings.baseEase =
                                        DEFAULT_SETTINGS.baseEase;
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
                                    this.dataManager.data.settings.lapsesIntervalChange =
                                        value / 100;
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
                                .setValue(
                                    (this.dataManager.data.settings.easyBonus * 100).toString(),
                                )
                                .onChange((value) => {
                                    applySettingsUpdate(async () => {
                                        const numValue: number = Number.parseInt(value) / 100;
                                        if (!isNaN(numValue)) {
                                            if (numValue < 1.0) {
                                                new Notice(t("EASY_BONUS_MIN_WARNING"));
                                                text.setValue(
                                                    (
                                                        this.dataManager.data.settings.easyBonus *
                                                        100
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
                                this.dataManager.data.settings.startOfDay =
                                    DEFAULT_SETTINGS.startOfDay;
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.dataManager.data.settings.startOfDay)
                            .onChange((value) => {
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
