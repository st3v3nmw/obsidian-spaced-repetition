import { Setting, SettingGroup } from "obsidian";

import { DataManager } from "src/data/data-manager";
import { DEFAULT_SETTINGS } from "src/data/settings";
import { t } from "src/lang/helpers";
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
                            .setValue(this.dataManager.data.settings.flashcardTags.join(" "))
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.flashcardTags =
                                        value.split(/\s+/);
                                    await this.dataManager.savePluginData();
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
                            .setValue(this.dataManager.data.settings.convertFoldersToDecks)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.convertFoldersToDecks = value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("BURY_SIBLINGS_TILL_NEXT_DAY"))
                    .setDesc(t("BURY_SIBLINGS_TILL_NEXT_DAY_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.dataManager.data.settings.burySiblingCards)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.burySiblingCards = value;
                                await this.dataManager.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("FLASHCARD_TAGS_TO_IGNORE"))
                    .setDesc(t("FLASHCARD_TAGS_TO_IGNORE_DESC"))
                    .addTextArea((text) =>
                        text
                            .setValue(
                                this.dataManager.data.settings.flashcardTagsToIgnore.join(" "),
                            )
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.flashcardTagsToIgnore = value
                                        .split(/\s+/)
                                        .filter((v) => v);
                                    await this.dataManager.savePluginData();
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
                            .setValue(this.dataManager.data.settings.noteFoldersToIgnore.join("\n"))
                            .onChange((value) => {
                                this.applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.noteFoldersToIgnore = value
                                        .split(/\n+/)
                                        .map((v) => v.trim())
                                        .filter((v) => v);
                                    await this.dataManager.savePluginData();
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
                            .setValue(this.dataManager.data.settings.burySiblingCards)
                            .onChange(async (value) => {
                                this.dataManager.data.settings.burySiblingCards = value;
                                await this.dataManager.savePluginData();
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
                        .setValue(this.dataManager.data.settings.flashcardCardOrder)
                        .onChange(async (value) => {
                            this.dataManager.data.settings.flashcardCardOrder = value;
                            await this.dataManager.savePluginData();
                            this.display();
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                const deckOrderEnabled: boolean =
                    this.dataManager.data.settings.flashcardCardOrder !==
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
                                ? this.dataManager.data.settings.flashcardDeckOrder
                                : "EveryCardRandomDeckAndCard",
                        )
                        .setDisabled(!deckOrderEnabled)
                        .onChange(async (value) => {
                            this.dataManager.data.settings.flashcardDeckOrder = value;
                            await this.dataManager.savePluginData();
                        }),
                );
            });

        new SettingGroup(this.containerEl)
            .setHeading(t("GROUP_FLASHCARD_SEPARATORS"))
            .addSetting((setting: Setting) => {
                const convertHighlightsToClozesEl = setting.setName(
                    t("CONVERT_HIGHLIGHTS_TO_CLOZES"),
                );
                convertHighlightsToClozesEl.descEl.insertAdjacentHTML(
                    "beforeend",
                    t("CONVERT_HIGHLIGHTS_TO_CLOZES_DESC", {
                        defaultPattern: "==[123;;]answer[;;hint]==",
                    }),
                );
                convertHighlightsToClozesEl.addToggle((toggle) =>
                    toggle
                        .setValue(this.dataManager.data.settings.convertHighlightsToClozes)
                        .onChange(async (value) => {
                            const defaultHightlightPattern = "==[123;;]answer[;;hint]==";
                            const clozePatternSet = new Set(
                                this.dataManager.data.settings.clozePatterns,
                            );

                            if (value) {
                                clozePatternSet.add(defaultHightlightPattern);
                            } else {
                                clozePatternSet.delete(defaultHightlightPattern);
                            }

                            this.dataManager.data.settings.clozePatterns = [...clozePatternSet];
                            this.dataManager.data.settings.convertHighlightsToClozes = value;
                            await this.dataManager.savePluginData();

                            this.display();
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                const convertBoldTextToClozesEl = setting.setName(t("CONVERT_BOLD_TEXT_TO_CLOZES"));
                convertBoldTextToClozesEl.descEl.insertAdjacentHTML(
                    "beforeend",
                    t("CONVERT_BOLD_TEXT_TO_CLOZES_DESC", {
                        defaultPattern: "**[123;;]answer[;;hint]**",
                    }),
                );
                convertBoldTextToClozesEl.addToggle((toggle) =>
                    toggle
                        .setValue(this.dataManager.data.settings.convertBoldTextToClozes)
                        .onChange(async (value) => {
                            const defaultBoldPattern = "**[123;;]answer[;;hint]**";
                            const clozePatternSet = new Set(
                                this.dataManager.data.settings.clozePatterns,
                            );

                            if (value) {
                                clozePatternSet.add(defaultBoldPattern);
                            } else {
                                clozePatternSet.delete(defaultBoldPattern);
                            }

                            this.dataManager.data.settings.clozePatterns = [...clozePatternSet];
                            this.dataManager.data.settings.convertBoldTextToClozes = value;
                            await this.dataManager.savePluginData();

                            this.display();
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                const convertCurlyBracketsToClozesEl = setting.setName(
                    t("CONVERT_CURLY_BRACKETS_TO_CLOZES"),
                );
                convertCurlyBracketsToClozesEl.descEl.insertAdjacentHTML(
                    "beforeend",
                    t("CONVERT_CURLY_BRACKETS_TO_CLOZES_DESC", {
                        defaultPattern: "{{[123;;]answer[;;hint]}}",
                    }),
                );
                convertCurlyBracketsToClozesEl.addToggle((toggle) =>
                    toggle
                        .setValue(this.dataManager.data.settings.convertCurlyBracketsToClozes)
                        .onChange(async (value) => {
                            const defaultCurlyBracketsPattern = "{{[123;;]answer[;;hint]}}";
                            const clozePatternSet = new Set(
                                this.dataManager.data.settings.clozePatterns,
                            );

                            if (value) {
                                clozePatternSet.add(defaultCurlyBracketsPattern);
                            } else {
                                clozePatternSet.delete(defaultCurlyBracketsPattern);
                            }

                            this.dataManager.data.settings.clozePatterns = [...clozePatternSet];
                            this.dataManager.data.settings.convertCurlyBracketsToClozes = value;
                            await this.dataManager.savePluginData();

                            this.display();
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                const clozePatterns = setting.setName(t("CLOZE_PATTERNS"));

                clozePatterns.descEl.insertAdjacentHTML(
                    "beforeend",
                    t("CLOZE_PATTERNS_DESC", {
                        docsUrl:
                            "https://stephenmwangi.com/obsidian-spaced-repetition/flashcards/cloze-cards/#cloze-types",
                    }),
                );

                clozePatterns.addTextArea((text) =>
                    text
                        .setPlaceholder(
                            "Example:\n==[123;;]answer[;;hint]==\n**[123;;]answer[;;hint]**\n{{[123;;]answer[;;hint]}}",
                        )
                        .setValue(this.dataManager.data.settings.clozePatterns.join("\n"))
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
                                    this.dataManager.data.settings.convertHighlightsToClozes = true;
                                } else {
                                    this.dataManager.data.settings.convertHighlightsToClozes = false;
                                }

                                if (clozePatternSet.has(defaultBoldPattern)) {
                                    this.dataManager.data.settings.convertBoldTextToClozes = true;
                                } else {
                                    this.dataManager.data.settings.convertBoldTextToClozes = false;
                                }

                                if (clozePatternSet.has(defaultCurlyBracketsPattern)) {
                                    this.dataManager.data.settings.convertCurlyBracketsToClozes = true;
                                } else {
                                    this.dataManager.data.settings.convertCurlyBracketsToClozes = false;
                                }

                                this.dataManager.data.settings.clozePatterns = [...clozePatternSet];
                                await this.dataManager.savePluginData();
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
                                this.dataManager.data.settings.singleLineCardSeparator =
                                    DEFAULT_SETTINGS.singleLineCardSeparator;
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.dataManager.data.settings.singleLineCardSeparator)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.singleLineCardSeparator = value;
                                    await this.dataManager.savePluginData();
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
                                this.dataManager.data.settings.singleLineReversedCardSeparator =
                                    DEFAULT_SETTINGS.singleLineReversedCardSeparator;
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(
                                this.dataManager.data.settings.singleLineReversedCardSeparator,
                            )
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.singleLineReversedCardSeparator =
                                        value;
                                    await this.dataManager.savePluginData();
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
                                this.dataManager.data.settings.multilineCardSeparator =
                                    DEFAULT_SETTINGS.multilineCardSeparator;
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.dataManager.data.settings.multilineCardSeparator)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.multilineCardSeparator = value;
                                    await this.dataManager.savePluginData();
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
                                this.dataManager.data.settings.multilineReversedCardSeparator =
                                    DEFAULT_SETTINGS.multilineReversedCardSeparator;
                                await this.dataManager.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.dataManager.data.settings.multilineReversedCardSeparator)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.dataManager.data.settings.multilineReversedCardSeparator =
                                        value;
                                    await this.dataManager.savePluginData();
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
                                    this.dataManager.data.settings.multilineCardEndMarker =
                                        DEFAULT_SETTINGS.multilineCardEndMarker;
                                    await this.dataManager.savePluginData();

                                    this.display();
                                });
                        })
                        .addText((text) =>
                            text
                                .setValue(this.dataManager.data.settings.multilineCardEndMarker)
                                .onChange((value) => {
                                    applySettingsUpdate(async () => {
                                        this.dataManager.data.settings.multilineCardEndMarker =
                                            value;
                                        await this.dataManager.savePluginData();
                                    });
                                }),
                        );
                } else {
                    setting.addButton((button) => {
                        button
                            .setButtonText("Unlock Setting")
                            .setClass("mod-warning")
                            .onClick(async () => {
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
