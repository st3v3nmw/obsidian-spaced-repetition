import { Setting, SettingGroup } from "obsidian";

import { SettingsPage } from "src/gui/content-container/settings-page/settings-page";
import { SettingsPageType } from "src/gui/content-container/settings-page/settings-page-manager";
import { t } from "src/lang/helpers";
import SRPlugin from "src/main";
import { DEFAULT_SETTINGS } from "src/settings";

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

        new SettingGroup(this.containerEl)
            .setHeading(t("GROUP_TAGS_FOLDERS"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("FLASHCARD_TAGS"))
                    .setDesc(t("FLASHCARD_TAGS_DESC"))
                    .addTextArea((text) =>
                        text
                            .setValue(this.plugin.data.settings.flashcardTags.join(" "))
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.plugin.data.settings.flashcardTags = value.split(/\s+/);
                                    await this.plugin.savePluginData();
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
                            .setValue(this.plugin.data.settings.convertFoldersToDecks)
                            .onChange(async (value) => {
                                this.plugin.data.settings.convertFoldersToDecks = value;
                                await this.plugin.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("BURY_SIBLINGS_TILL_NEXT_DAY"))
                    .setDesc(t("BURY_SIBLINGS_TILL_NEXT_DAY_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.plugin.data.settings.burySiblingCards)
                            .onChange(async (value) => {
                                this.plugin.data.settings.burySiblingCards = value;
                                await this.plugin.savePluginData();
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("FOLDERS_TO_IGNORE"))
                    .setDesc(t("FOLDERS_TO_IGNORE_DESC"))
                    .addTextArea((text) =>
                        text
                            .setValue(this.plugin.data.settings.noteFoldersToIgnore.join("\n"))
                            .onChange((value) => {
                                this.applySettingsUpdate(async () => {
                                    this.plugin.data.settings.noteFoldersToIgnore = value
                                        .split(/\n+/)
                                        .map((v) => v.trim())
                                        .filter((v) => v);
                                    await this.plugin.savePluginData();

                                    this.display();
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
                            .setValue(this.plugin.data.settings.burySiblingCards)
                            .onChange(async (value) => {
                                this.plugin.data.settings.burySiblingCards = value;
                                await this.plugin.savePluginData();
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
                        .setValue(this.plugin.data.settings.flashcardCardOrder)
                        .onChange(async (value) => {
                            this.plugin.data.settings.flashcardCardOrder = value;
                            await this.plugin.savePluginData();
                            this.display();
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                const deckOrderEnabled: boolean =
                    this.plugin.data.settings.flashcardCardOrder != "EveryCardRandomDeckAndCard";
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
                                ? this.plugin.data.settings.flashcardDeckOrder
                                : "EveryCardRandomDeckAndCard",
                        )
                        .setDisabled(!deckOrderEnabled)
                        .onChange(async (value) => {
                            this.plugin.data.settings.flashcardDeckOrder = value;
                            await this.plugin.savePluginData();
                        }),
                );
            });

        new SettingGroup(this.containerEl)
            .setHeading(t("GROUP_FLASHCARD_SEPARATORS"))
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("CONVERT_CLOZE_PATTERNS_TO_INPUTS"))
                    .setDesc(t("CONVERT_CLOZE_PATTERNS_TO_INPUTS_DESC"))
                    .addToggle((toggle) =>
                        toggle
                            .setValue(this.plugin.data.settings.convertClozePatternsToInputs)
                            .onChange(async (value) => {
                                this.plugin.data.settings.convertClozePatternsToInputs = value;
                                await this.plugin.savePluginData();

                                this.display();
                            }),
                    );
            })
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
                        .setValue(this.plugin.data.settings.convertHighlightsToClozes)
                        .onChange(async (value) => {
                            const defaultHightlightPattern = "==[123;;]answer[;;hint]==";
                            const clozePatternSet = new Set(
                                this.plugin.data.settings.clozePatterns,
                            );

                            if (value) {
                                clozePatternSet.add(defaultHightlightPattern);
                            } else {
                                clozePatternSet.delete(defaultHightlightPattern);
                            }

                            this.plugin.data.settings.clozePatterns = [...clozePatternSet];
                            this.plugin.data.settings.convertHighlightsToClozes = value;
                            await this.plugin.savePluginData();

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
                        .setValue(this.plugin.data.settings.convertBoldTextToClozes)
                        .onChange(async (value) => {
                            const defaultBoldPattern = "**[123;;]answer[;;hint]**";
                            const clozePatternSet = new Set(
                                this.plugin.data.settings.clozePatterns,
                            );

                            if (value) {
                                clozePatternSet.add(defaultBoldPattern);
                            } else {
                                clozePatternSet.delete(defaultBoldPattern);
                            }

                            this.plugin.data.settings.clozePatterns = [...clozePatternSet];
                            this.plugin.data.settings.convertBoldTextToClozes = value;
                            await this.plugin.savePluginData();

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
                        .setValue(this.plugin.data.settings.convertCurlyBracketsToClozes)
                        .onChange(async (value) => {
                            const defaultCurlyBracketsPattern = "{{[123;;]answer[;;hint]}}";
                            const clozePatternSet = new Set(
                                this.plugin.data.settings.clozePatterns,
                            );

                            if (value) {
                                clozePatternSet.add(defaultCurlyBracketsPattern);
                            } else {
                                clozePatternSet.delete(defaultCurlyBracketsPattern);
                            }

                            this.plugin.data.settings.clozePatterns = [...clozePatternSet];
                            this.plugin.data.settings.convertCurlyBracketsToClozes = value;
                            await this.plugin.savePluginData();

                            this.display();
                        }),
                );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("CLOZE_PATTERNS"))
                    .setDesc(
                        t("CLOZE_PATTERNS_DESC", {
                            docsUrl:
                                "https://stephenmwangi.com/obsidian-spaced-repetition/flashcards/cloze-cards/#cloze-types",
                        }),
                    )
                    .addTextArea((text) =>
                        text
                            .setPlaceholder(
                                "Example:\n==[123;;]answer[;;hint]==\n**[123;;]answer[;;hint]**\n{{[123;;]answer[;;hint]}}",
                            )
                            .setValue(this.plugin.data.settings.clozePatterns.join("\n"))
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
                                        this.plugin.data.settings.convertHighlightsToClozes = true;
                                    } else {
                                        this.plugin.data.settings.convertHighlightsToClozes = false;
                                    }

                                    if (clozePatternSet.has(defaultBoldPattern)) {
                                        this.plugin.data.settings.convertBoldTextToClozes = true;
                                    } else {
                                        this.plugin.data.settings.convertBoldTextToClozes = false;
                                    }

                                    if (clozePatternSet.has(defaultCurlyBracketsPattern)) {
                                        this.plugin.data.settings.convertCurlyBracketsToClozes =
                                            true;
                                    } else {
                                        this.plugin.data.settings.convertCurlyBracketsToClozes =
                                            false;
                                    }

                                    this.plugin.data.settings.clozePatterns = [...clozePatternSet];
                                    await this.plugin.savePluginData();
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
                                this.plugin.data.settings.singleLineCardSeparator =
                                    DEFAULT_SETTINGS.singleLineCardSeparator;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.plugin.data.settings.singleLineCardSeparator)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.plugin.data.settings.singleLineCardSeparator = value;
                                    await this.plugin.savePluginData();
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
                                this.plugin.data.settings.singleLineReversedCardSeparator =
                                    DEFAULT_SETTINGS.singleLineReversedCardSeparator;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.plugin.data.settings.singleLineReversedCardSeparator)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.plugin.data.settings.singleLineReversedCardSeparator =
                                        value;
                                    await this.plugin.savePluginData();
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
                                this.plugin.data.settings.multilineCardSeparator =
                                    DEFAULT_SETTINGS.multilineCardSeparator;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.plugin.data.settings.multilineCardSeparator)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.plugin.data.settings.multilineCardSeparator = value;
                                    await this.plugin.savePluginData();
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
                                this.plugin.data.settings.multilineReversedCardSeparator =
                                    DEFAULT_SETTINGS.multilineReversedCardSeparator;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.plugin.data.settings.multilineReversedCardSeparator)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.plugin.data.settings.multilineReversedCardSeparator =
                                        value;
                                    await this.plugin.savePluginData();
                                });
                            }),
                    );
            })
            .addSetting((setting: Setting) => {
                setting
                    .setName(t("MULTILINE_CARDS_END_MARKER"))
                    .setDesc(t("FIX_SEPARATORS_MANUALLY_WARNING"))
                    .addExtraButton((button) => {
                        button
                            .setIcon("reset")
                            .setTooltip(t("RESET_DEFAULT"))
                            .onClick(async () => {
                                this.plugin.data.settings.multilineCardEndMarker =
                                    DEFAULT_SETTINGS.multilineCardEndMarker;
                                await this.plugin.savePluginData();

                                this.display();
                            });
                    })
                    .addText((text) =>
                        text
                            .setValue(this.plugin.data.settings.multilineCardEndMarker)
                            .onChange((value) => {
                                applySettingsUpdate(async () => {
                                    this.plugin.data.settings.multilineCardEndMarker = value;
                                    await this.plugin.savePluginData();
                                });
                            }),
                    );
            });
    }
}
