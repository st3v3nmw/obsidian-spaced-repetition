import { Setting, SettingGroup } from "obsidian";

import { DataManager } from "src/data/data-manager";
import { DEFAULT_SETTINGS } from "src/data/settings";
import { SettingsManager } from "src/data/settings-manager";
import { t, tHTML } from "src/lang/helpers";
import SRPlugin from "src/main";
import { SettingsPage } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page";
import { SettingsPageType } from "src/ui/obsidian-ui-components/content-container/settings-page/settings-page-manager";
import { ConfirmationModal } from "src/ui/obsidian-ui-components/modals/confirmation-modal";

/**
 * Represents a flashcards settings page.
 *
 * @class FlashcardsPage
 * @extends {SettingsPage}
 */
export class FlashcardsPage extends SettingsPage {
    constructor(
        pageContainerEl: HTMLElement,
        plugin: SRPlugin,
        settingsManager: SettingsManager,
        dataManager: DataManager,
        pageType: SettingsPageType,
        didReadMultilineEndMarkerWarning: boolean,
        applySettingsUpdate: (callback: () => unknown) => void,
        display: () => void,
        openPage: (pageType: SettingsPageType) => void,
        scrollListener: (scrollPosition: number) => void,
        changeMultilineEndMarkerWarningState: (didReadMultilineEndMarkerWarning: boolean) => void,
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

        new SettingGroup(this.containerEl)
            .setHeading(t("GROUP_TAGS_FOLDERS"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("FLASHCARD_TAGS"))
                    .setDesc(t("FLASHCARD_TAGS_DESC"))
                    .addTextArea((text) =>
                        text
                            .setValue(this.settingsManager.settings.flashcardTags.join(" "))
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.settingsManager.settings.flashcardTags =
                                        value.split(/\s+/);
                                    await this.settingsManager.save();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("CONVERT_FOLDERS_TO_DECKS"))
                    .setDesc(t("CONVERT_FOLDERS_TO_DECKS_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.convertFoldersToDecks)
                            .onChange(async (value) => {
                                this.settingsManager.settings.convertFoldersToDecks = value;
                                await this.settingsManager.save();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("BURY_SIBLINGS_TILL_NEXT_DAY"))
                    .setDesc(t("BURY_SIBLINGS_TILL_NEXT_DAY_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.burySiblingCards)
                            .onChange(async (value) => {
                                this.settingsManager.settings.burySiblingCards = value;
                                await this.settingsManager.save();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("FLASHCARD_TAGS_TO_IGNORE"))
                    .setDesc(t("FLASHCARD_TAGS_TO_IGNORE_DESC"))
                    .addTextArea((text) =>
                        text
                            .setValue(this.settingsManager.settings.flashcardTagsToIgnore.join(" "))
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.settingsManager.settings.flashcardTagsToIgnore = value
                                        .split(/\s+/)
                                        .filter((v) => v);
                                    await this.settingsManager.save();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("FOLDERS_TO_IGNORE"))
                    .setDesc(t("FOLDERS_TO_IGNORE_DESC"))
                    .addTextArea((text) =>
                        text
                            .setValue(this.settingsManager.settings.noteFoldersToIgnore.join("\n"))
                            .onChange((value) => {
                                this.applySettingsUpdate(async () => {
                                    this.settingsManager.settings.noteFoldersToIgnore = value
                                        .split(/\n+/)
                                        .map((v) => v.trim())
                                        .filter((v) => v);
                                    await this.settingsManager.save();
                                });
                            }),
                    );
            });

        new SettingGroup(this.containerEl)
            .setHeading(t("GROUP_FLASHCARD_REVIEW"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("BURY_SIBLINGS_TILL_NEXT_DAY"))
                    .setDesc(t("BURY_SIBLINGS_TILL_NEXT_DAY_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.settingsManager.settings.burySiblingCards)
                            .onChange(async (value) => {
                                this.settingsManager.settings.burySiblingCards = value;
                                await this.settingsManager.save();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting.setName(t("REVIEW_CARD_ORDER_WITHIN_DECK")).addDropdown((dropdown) =>
                    dropdown
                        .addOptions({
                            NewFirstSequential: t("REVIEW_CARD_ORDER_NEW_FIRST_SEQUENTIAL"),
                            DueFirstSequential: t("REVIEW_CARD_ORDER_DUE_FIRST_SEQUENTIAL"),
                            NewFirstRandom: t("REVIEW_CARD_ORDER_NEW_FIRST_RANDOM"),
                            DueFirstRandom: t("REVIEW_CARD_ORDER_DUE_FIRST_RANDOM"),
                            EveryCardRandomDeckAndCard: t("REVIEW_CARD_ORDER_RANDOM_DECK_AND_CARD"),
                        })
                        .setValue(this.settingsManager.settings.flashcardCardOrder)
                        .onChange(async (value) => {
                            this.settingsManager.settings.flashcardCardOrder = value;
                            await this.settingsManager.save();
                            this.display();
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                const deckOrderEnabled: boolean =
                    this.settingsManager.settings.flashcardCardOrder !==
                    "EveryCardRandomDeckAndCard";
                setting.setName(t("REVIEW_DECK_ORDER")).addDropdown((dropdown) =>
                    dropdown
                        .addOptions(
                            deckOrderEnabled
                                ? {
                                      // eslint-disable-next-line camelcase
                                      PrevDeckComplete_Sequential: t(
                                          "REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_SEQUENTIAL",
                                      ),
                                      // eslint-disable-next-line camelcase
                                      PrevDeckComplete_Random: t(
                                          "REVIEW_DECK_ORDER_PREV_DECK_COMPLETE_RANDOM",
                                      ),
                                  }
                                : {
                                      EveryCardRandomDeckAndCard: t(
                                          "REVIEW_DECK_ORDER_RANDOM_DECK_AND_CARD",
                                      ),
                                  },
                        )
                        .setValue(
                            deckOrderEnabled
                                ? this.settingsManager.settings.flashcardDeckOrder
                                : "EveryCardRandomDeckAndCard",
                        )
                        .setDisabled(!deckOrderEnabled)
                        .onChange(async (value) => {
                            this.settingsManager.settings.flashcardDeckOrder = value;
                            await this.settingsManager.save();
                        }),
                );
            });

        new SettingGroup(this.containerEl)
            .setHeading(t("GROUP_FLASHCARD_SEPARATORS"))
            .addSetting((setting: Setting) => {
                const convertHighlightsToClozesEl = setting.setName(
                    t("CONVERT_HIGHLIGHTS_TO_CLOZES"),
                );

                const elements: (HTMLElement | Text)[] = tHTML(
                    "CONVERT_HIGHLIGHTS_TO_CLOZES_DESC",
                    {
                        defaultPattern: "==[123;;]answer[;;hint]==",
                    },
                );

                setting.descEl.empty();

                for (let i = 0; i < elements.length; i++) {
                    setting.descEl.append(elements[i]);
                }

                convertHighlightsToClozesEl.addToggle((toggle) =>
                    toggle
                        .setValue(this.settingsManager.settings.convertHighlightsToClozes)
                        .onChange(async (value) => {
                            const defaultHightlightPattern = "==[123;;]answer[;;hint]==";
                            const clozePatternSet = new Set(
                                this.settingsManager.settings.clozePatterns,
                            );

                            if (value) {
                                clozePatternSet.add(defaultHightlightPattern);
                            } else {
                                clozePatternSet.delete(defaultHightlightPattern);
                            }

                            this.settingsManager.settings.clozePatterns = [...clozePatternSet];
                            this.settingsManager.settings.convertHighlightsToClozes = value;
                            await this.settingsManager.save();

                            this.display();
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                const convertBoldTextToClozesEl = setting.setName(t("CONVERT_BOLD_TEXT_TO_CLOZES"));
                const elements: (HTMLElement | Text)[] = tHTML("CONVERT_BOLD_TEXT_TO_CLOZES_DESC", {
                    defaultPattern: "**[123;;]answer[;;hint]**",
                });

                setting.descEl.empty();

                for (let i = 0; i < elements.length; i++) {
                    setting.descEl.append(elements[i]);
                }

                convertBoldTextToClozesEl.addToggle((toggle) =>
                    toggle
                        .setValue(this.settingsManager.settings.convertBoldTextToClozes)
                        .onChange(async (value) => {
                            const defaultBoldPattern = "**[123;;]answer[;;hint]**";
                            const clozePatternSet = new Set(
                                this.settingsManager.settings.clozePatterns,
                            );

                            if (value) {
                                clozePatternSet.add(defaultBoldPattern);
                            } else {
                                clozePatternSet.delete(defaultBoldPattern);
                            }

                            this.settingsManager.settings.clozePatterns = [...clozePatternSet];
                            this.settingsManager.settings.convertBoldTextToClozes = value;
                            await this.settingsManager.save();

                            this.display();
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                const convertCurlyBracketsToClozesEl = setting.setName(
                    t("CONVERT_CURLY_BRACKETS_TO_CLOZES"),
                );

                const elements: (HTMLElement | Text)[] = tHTML(
                    "CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC",
                    {
                        defaultPattern: "{{[123;;]answer[;;hint]}}",
                    },
                );

                setting.descEl.empty();

                for (let i = 0; i < elements.length; i++) {
                    setting.descEl.append(elements[i]);
                }

                convertCurlyBracketsToClozesEl.addToggle((toggle) =>
                    toggle
                        .setValue(this.settingsManager.settings.convertCurlyBracketsToClozes)
                        .onChange(async (value) => {
                            const defaultCurlyBracketsPattern = "{{[123;;]answer[;;hint]}}";
                            const clozePatternSet = new Set(
                                this.settingsManager.settings.clozePatterns,
                            );

                            if (value) {
                                clozePatternSet.add(defaultCurlyBracketsPattern);
                            } else {
                                clozePatternSet.delete(defaultCurlyBracketsPattern);
                            }

                            this.settingsManager.settings.clozePatterns = [...clozePatternSet];
                            this.settingsManager.settings.convertCurlyBracketsToClozes = value;
                            await this.settingsManager.save();

                            this.display();
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                const clozePatterns = setting.setName(t("CLOZE_PATTERNS"));
                const elements: (HTMLElement | Text)[] = tHTML("CLOZE_PATTERNS_DESC", {
                    docsUrl:
                        "https://stephenmwangi.com/obsidian-spaced-repetition/flashcards/cloze-cards/#cloze-types",
                });

                setting.descEl.empty();

                for (let i = 0; i < elements.length; i++) {
                    setting.descEl.append(elements[i]);
                }

                clozePatterns.addTextArea((text) =>
                    text
                        .setPlaceholder(
                            "Example:\n==[123;;]answer[;;hint]==\n**[123;;]answer[;;hint]**\n{{[123;;]answer[;;hint]}}",
                        )
                        .setValue(this.settingsManager.settings.clozePatterns.join("\n"))
                        .onChange((value) => {
                            applySettingsUpdate(async () => {
                                const defaultHightlightPattern = "==[123;;]answer[;;hint]==";
                                const defaultBoldPattern = "**[123;;]answer[;;hint]**";
                                const defaultCurlyBracketsPattern = "{{[123;;]answer[;;hint]}}";

                                const clozePatternSet = new Set(
                                    value
                                        .split(/\n+/)
                                        .map((v) => v.trim())
                                        .filter((v) => v),
                                );

                                if (clozePatternSet.has(defaultHightlightPattern)) {
                                    this.settingsManager.settings.convertHighlightsToClozes = true;
                                } else {
                                    this.settingsManager.settings.convertHighlightsToClozes = false;
                                }

                                if (clozePatternSet.has(defaultBoldPattern)) {
                                    this.settingsManager.settings.convertBoldTextToClozes = true;
                                } else {
                                    this.settingsManager.settings.convertBoldTextToClozes = false;
                                }

                                if (clozePatternSet.has(defaultCurlyBracketsPattern)) {
                                    this.settingsManager.settings.convertCurlyBracketsToClozes = true;
                                } else {
                                    this.settingsManager.settings.convertCurlyBracketsToClozes = false;
                                }

                                this.settingsManager.settings.clozePatterns = [...clozePatternSet];
                                await this.settingsManager.save();
                            });
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("INLINE_CARDS_SEPARATOR"))
                    .setDesc(t("FIX_SEPARATORS_MANUALLY_WARNING"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.settingsManager.settings.singleLineCardSeparator =
                                    DEFAULT_SETTINGS.singleLineCardSeparator;
                                await this.settingsManager.save();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.settingsManager.settings.singleLineCardSeparator)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.settingsManager.settings.singleLineCardSeparator = value;
                                    await this.settingsManager.save();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("INLINE_REVERSED_CARDS_SEPARATOR"))
                    .setDesc(t("FIX_SEPARATORS_MANUALLY_WARNING"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.settingsManager.settings.singleLineReversedCardSeparator =
                                    DEFAULT_SETTINGS.singleLineReversedCardSeparator;
                                await this.settingsManager.save();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.settingsManager.settings.singleLineReversedCardSeparator)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.settingsManager.settings.singleLineReversedCardSeparator =
                                        value;
                                    await this.settingsManager.save();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("MULTILINE_CARDS_SEPARATOR"))
                    .setDesc(t("FIX_SEPARATORS_MANUALLY_WARNING"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.settingsManager.settings.multilineCardSeparator =
                                    DEFAULT_SETTINGS.multilineCardSeparator;
                                await this.settingsManager.save();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.settingsManager.settings.multilineCardSeparator)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.settingsManager.settings.multilineCardSeparator = value;
                                    await this.settingsManager.save();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("MULTILINE_REVERSED_CARDS_SEPARATOR"))
                    .setDesc(t("FIX_SEPARATORS_MANUALLY_WARNING"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.settingsManager.settings.multilineReversedCardSeparator =
                                    DEFAULT_SETTINGS.multilineReversedCardSeparator;
                                await this.settingsManager.save();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.settingsManager.settings.multilineReversedCardSeparator)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.settingsManager.settings.multilineReversedCardSeparator =
                                        value;
                                    await this.settingsManager.save();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("MULTILINE_CARDS_END_MARKER"))
                    .setDesc(t("FIX_SEPARATORS_MANUALLY_WARNING"));

                if (didReadMultilineEndMarkerWarning) {
                    setting
                        .addExtraButton((button) => {
                            button
                                .setIcon("reset")
                                .setTooltip(t("RESET_DEFAULT"))
                                .onClick(async () => {
                                    this.settingsManager.settings.multilineCardEndMarker =
                                        DEFAULT_SETTINGS.multilineCardEndMarker;
                                    await this.settingsManager.save();

                                    this.display();
                                });
                        })
                        .addText((text) =>
                            text
                                .setValue(this.settingsManager.settings.multilineCardEndMarker)
                                .onChange((value) => {
                                    applySettingsUpdate(async () => {
                                        this.settingsManager.settings.multilineCardEndMarker =
                                            value;
                                        await this.settingsManager.save();
                                    });
                                }),
                        );
                } else {
                    setting.addButton((button) => {
                        button
                            .setButtonText("Unlock Setting")
                            .setClass("mod-warning")
                            .onClick(() => {
                                new ConfirmationModal(
                                    this.plugin.app,
                                    "Please read!",
                                    "Please only change this setting if you already added the characters denoting the end marker to all your multiline / cloze cards. Else you might loose your scheduling data!",
                                    "Unlocking setting.",
                                    () => {
                                        changeMultilineEndMarkerWarningState(true);
                                    },
                                ).open();
                            });
                    });
                }
            });
    }
}
