import { Notice, Setting, SettingGroup } from "obsidian";

import { DataManager } from "src/data/data-manager";
import { DEFAULT_SETTINGS } from "src/data/settings";
import { SettingsManager } from "src/data/settings-manager";
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
        this.settingsManager.settings.algorithm = algorithm;
        await this.settingsManager.save();
        this.dataManager.setupDataStoreAndAlgorithmInstances(this.settingsManager.settings);
        this.display();
    }

    constructor(
        pageContainerEl: HTMLElement,
        plugin: SRPlugin,
        settingsManager: SettingsManager,
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
            settingsManager,
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
                            .setValue(this.settingsManager.settings.enableReviewReminders)
                            .onChange(async (value) => {
                                this.settingsManager.settings.enableReviewReminders = value;
                                await this.settingsManager.save();
                                // The interval loop is stateful, so settings changes must be
                                // applied immediately instead of waiting for the next reload.
                                this.plugin.reminderManager.restartReviewReminders();
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
                            .setValue(this.settingsManager.settings.reviewReminderCheckOnStartup)
                            .setDisabled(!this.settingsManager.settings.enableReviewReminders)
                            .onChange(async (value) => {
                                this.settingsManager.settings.reviewReminderCheckOnStartup = value;
                                await this.settingsManager.save();
                                this.plugin.reminderManager.restartReviewReminders();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("REVIEW_REMINDER_INTERVAL"))
                    .setDesc(t("REVIEW_REMINDER_INTERVAL_DESC"))
                    .addText((text) => {
                        text.setValue(
                            this.settingsManager.settings.reviewReminderIntervalMinutes.toString(),
                        );
                        text.inputEl.type = "number";
                        text.inputEl.min = "1";
                        text.inputEl.max = "1440";
                        text.inputEl.step = "1";
                        text.setDisabled(!this.settingsManager.settings.enableReviewReminders);

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
                                        this.settingsManager.settings.reviewReminderIntervalMinutes.toString(),
                                    );
                                    return;
                                }

                                this.settingsManager.settings.reviewReminderIntervalMinutes =
                                    parsedValue;
                                await this.settingsManager.save();
                                // Interval changes only take effect once the existing timer is
                                // rebuilt with the new cadence.
                                this.plugin.reminderManager.restartReviewReminders();
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
                            .setValue(this.settingsManager.settings.reviewReminderMessage)
                            .setDisabled(!this.settingsManager.settings.enableReviewReminders)
                            .onChange((value) => {
                                this.applySettingsUpdate(async () => {
                                    this.settingsManager.settings.reviewReminderMessage = value;
                                    await this.settingsManager.save();
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
                            .setValue(this.settingsManager.settings.reviewReminderAutoOpen)
                            .setDisabled(!this.settingsManager.settings.enableReviewReminders)
                            .onChange(async (value) => {
                                this.settingsManager.settings.reviewReminderAutoOpen = value;
                                await this.settingsManager.save();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("REVIEW_REMINDER_SHOW_NOTICE"))
                    .setDesc(t("REVIEW_REMINDER_SHOW_NOTICE_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.reviewReminderShowNotice)
                            .setDisabled(!this.settingsManager.settings.enableReviewReminders)
                            .onChange(async (value) => {
                                this.settingsManager.settings.reviewReminderShowNotice = value;
                                await this.settingsManager.save();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("REVIEW_REMINDER_PLAY_SOUND"))
                    .setDesc(t("REVIEW_REMINDER_PLAY_SOUND_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.reviewReminderPlaySound)
                            .setDisabled(!this.settingsManager.settings.enableReviewReminders)
                            .onChange(async (value) => {
                                this.settingsManager.settings.reviewReminderPlaySound = value;
                                await this.settingsManager.save();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("REVIEW_REMINDER_BOUNCE_DOCK"))
                    .setDesc(t("REVIEW_REMINDER_BOUNCE_DOCK_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.reviewReminderBounceDock)
                            .setDisabled(!this.settingsManager.settings.enableReviewReminders)
                            .onChange(async (value) => {
                                this.settingsManager.settings.reviewReminderBounceDock = value;
                                await this.settingsManager.save();
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
                        .setValue(this.settingsManager.settings.algorithm)
                        .onChange(async (value) => {
                            const selectedAlgorithm = value as SRAlgorithmType;
                            const currentAlgorithm = this.settingsManager.settings.algorithm;

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

        if (this.settingsManager.settings.algorithm === SRAlgorithmType.FSRS) {
            algorithmGroup.addSetting((setting: Setting) => {
                setting
                    .setName("FSRS desired retention")
                    .setDesc("Target recall probability used by FSRS for flashcard scheduling.")
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.settingsManager.settings.fsrsDesiredRetention =
                                    DEFAULT_SETTINGS.fsrsDesiredRetention;
                                await this.settingsManager.save();
                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.settingsManager.settings.fsrsDesiredRetention.toString())
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    const numValue = Number.parseFloat(value);
                                    if (Number.isNaN(numValue) || numValue <= 0 || numValue > 1) {
                                        new Notice(
                                            "FSRS desired retention must be between 0 and 1.",
                                        );
                                        text.setValue(
                                            this.settingsManager.settings.fsrsDesiredRetention.toString(),
                                        );
                                        return;
                                    }

                                    this.settingsManager.settings.fsrsDesiredRetention = numValue;
                                    await this.settingsManager.save();
                                });
                            }),
                    );
            });
        }

        if (this.settingsManager.settings.algorithm === SRAlgorithmType.SM_2_OSR) {
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
                                    this.settingsManager.settings.baseEase =
                                        DEFAULT_SETTINGS.baseEase;
                                    await this.settingsManager.save();

                                    this.display();
                                });
                        })
                        .addText((text) =>
                            text
                                .setValue(this.settingsManager.settings.baseEase.toString())
                                .onChange((value) => {
                                    applySettingsUpdate(async () => {
                                        const numValue: number = Number.parseInt(value);
                                        if (!isNaN(numValue)) {
                                            if (numValue < 130) {
                                                new Notice(t("BASE_EASE_MIN_WARNING"));
                                                text.setValue(
                                                    this.settingsManager.settings.baseEase.toString(),
                                                );
                                                return;
                                            }

                                            this.settingsManager.settings.baseEase = numValue;
                                            await this.settingsManager.save();
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
                                    this.settingsManager.settings.maxLinkFactor =
                                        DEFAULT_SETTINGS.maxLinkFactor;
                                    await this.settingsManager.save();

                                    this.display();
                                });
                        })
                        .addSlider((slider) =>
                            slider
                                .setLimits(0, 100, 1)
                                .setValue(this.settingsManager.settings.maxLinkFactor * 100)
                                .setDynamicTooltip()
                                .onChange(async (value: number) => {
                                    this.settingsManager.settings.maxLinkFactor = value / 100;
                                    await this.settingsManager.save();
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
                                    this.settingsManager.settings.lapsesIntervalChange =
                                        DEFAULT_SETTINGS.lapsesIntervalChange;
                                    await this.settingsManager.save();

                                    this.display();
                                });
                        })
                        .addSlider((slider) =>
                            slider
                                .setLimits(1, 99, 1)
                                .setValue(this.settingsManager.settings.lapsesIntervalChange * 100)
                                .setDynamicTooltip()
                                .onChange(async (value: number) => {
                                    this.settingsManager.settings.lapsesIntervalChange =
                                        value / 100;
                                    await this.settingsManager.save();
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
                                    this.settingsManager.settings.easyBonus =
                                        DEFAULT_SETTINGS.easyBonus;
                                    await this.settingsManager.save();

                                    this.display();
                                });
                        })
                        .addText((text) =>
                            text
                                .setValue(
                                    (this.settingsManager.settings.easyBonus * 100).toString(),
                                )
                                .onChange((value) => {
                                    applySettingsUpdate(async () => {
                                        const numValue: number = Number.parseInt(value) / 100;
                                        if (!isNaN(numValue)) {
                                            if (numValue < 1.0) {
                                                new Notice(t("EASY_BONUS_MIN_WARNING"));
                                                text.setValue(
                                                    (
                                                        this.settingsManager.settings.easyBonus *
                                                        100
                                                    ).toString(),
                                                );
                                                return;
                                            }

                                            this.settingsManager.settings.easyBonus = numValue;
                                            await this.settingsManager.save();
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
                                .setValue(this.settingsManager.settings.loadBalance)
                                .onChange(async (value) => {
                                    this.settingsManager.settings.loadBalance = value;
                                    await this.settingsManager.save();
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
                                this.settingsManager.settings.maximumInterval =
                                    DEFAULT_SETTINGS.maximumInterval;
                                await this.settingsManager.save();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.settingsManager.settings.maximumInterval.toString())
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    const numValue: number = Number.parseInt(value);
                                    if (!isNaN(numValue)) {
                                        if (numValue < 1) {
                                            new Notice(t("MAX_INTERVAL_MIN_WARNING"));
                                            text.setValue(
                                                this.settingsManager.settings.maximumInterval.toString(),
                                            );
                                            return;
                                        }

                                        this.settingsManager.settings.maximumInterval = numValue;
                                        await this.settingsManager.save();
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
                                this.settingsManager.settings.startOfDay =
                                    DEFAULT_SETTINGS.startOfDay;
                                await this.settingsManager.save();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.settingsManager.settings.startOfDay)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    const dayBoundary: IDayBoundary | null =
                                        DateUtil.strToDayBoundary(value);
                                    if (dayBoundary === null) {
                                        new Notice(t("INVALID_START_OF_DAY_WARNING"));
                                        return;
                                    } else {
                                        this.settingsManager.settings.startOfDay = value;
                                        await this.settingsManager.save();
                                        globalDateProvider.setDayBoundary(dayBoundary);
                                    }
                                });
                            }),
                    );
            });
    }
}
