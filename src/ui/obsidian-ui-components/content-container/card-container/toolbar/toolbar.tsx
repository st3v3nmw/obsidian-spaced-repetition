import "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar.css";
import { Platform, App } from "obsidian";

import TTSButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar-buttons/tts-button";
import { TTSUtil } from "src/utils/tts";
import { SRSettings } from "src/data/settings";
import { Deck } from "src/data/data-structures/deck/deck";
import DeckInfoComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/deck-info/deck-info";
import BackButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar-buttons/back-button";
import CardMenuButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar-buttons/card-menu-button";
import EditButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar-buttons/edit-button";
import ResetButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar-buttons/reset-button";
import SkipButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar-buttons/skip-button";
import ModalCloseButtonComponent from "src/ui/obsidian-ui-components/content-container/modal-close-button";
import EmulatedPlatform from "src/utils/platform-detector";

export default class CardToolbarComponent {
    private toolbar: HTMLDivElement;
    private infoSection: DeckInfoComponent;
    private resetButton: ResetButtonComponent;
    private ttsButton: TTSButtonComponent | null = null;
    private extendedMenuButton: CardMenuButtonComponent;
    private shortMenuButton: CardMenuButtonComponent;

    public constructor(
        app: App,
        parentEl: HTMLElement,
        showDeleteButton: boolean,
        deleteCurrentCard: () => void,
        backToDeckHandler: () => Promise<void>,
        editClickHandler: () => void,
        jumpToCurrentCard: () => Promise<void>,
        displayCurrentCardInfoNotice: () => void,
        skipCurrentCard: () => void,
        onOpenResetModalClick: () => void,
        settings: SRSettings,
        getCardText: () => string,
        closeModal?: () => void,
    ) {
        // Build ui
        this.toolbar = parentEl.createDiv();
        this.toolbar.addClass("sr-card-toolbar");
        const isModal = closeModal !== undefined;

        new BackButtonComponent(this.toolbar, async () => await backToDeckHandler(), [
            (EmulatedPlatform().isPhone || Platform.isPhone) && isModal
                ? "mod-raised"
                : "clickable-icon",
        ]);

        const centerSpacer = this.toolbar.createDiv();
        centerSpacer.addClass("sr-flex-spacer");
        centerSpacer.addClass("sr-center-spacer");

        this.infoSection = new DeckInfoComponent(this.toolbar);

        this.toolbar.createDiv().addClass("sr-flex-spacer");

        new EditButtonComponent(
            this.toolbar,
            editClickHandler,
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : ["clickable-icon"],
        );

        this.resetButton = new ResetButtonComponent(
            this.toolbar,
            onOpenResetModalClick,
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : ["clickable-icon"],
        );
        this.resetButton.setDisabled(true);

        new SkipButtonComponent(
            this.toolbar,
            () => skipCurrentCard(),
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : ["clickable-icon"],
        );

        this.toolbar.createDiv("sr-divider");

        if (settings.enableTTS) {
            const detectLang = (text: string): string => {
                // Japanese (Hiragana / Katakana)
                if (/[\u3040-\u30ff]/.test(text)) {
                    return "ja-JP";
                }
                // Korean (Hangul)
                if (/[\uac00-\ud7af]/.test(text)) {
                    return "ko-KR";
                }
                // Mandarin Chinese (Han characters)
                if (/[\u4e00-\u9fa5]/.test(text)) {
                    return "zh-CN";
                }
                // Cyrillic (Russian, etc.)
                if (/[\u0400-\u04ff]/.test(text)) {
                    return "ru-RU";
                }
                // Arabic
                if (/[\u0600-\u06ff]/.test(text)) {
                    return "ar-SA";
                }
                // Hebrew
                if (/[\u0590-\u05ff]/.test(text)) {
                    return "he-IL";
                }
                // Default fallback (Portuguese)
                return "pt-BR";
            };

            this.ttsButton = new TTSButtonComponent(
                this.toolbar,
                async () => {
                    const text = getCardText();
                    await TTSUtil.speak(app, text, settings, detectLang(text));
                    this.ttsButton?.setCached(true);
                },
                EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : ["clickable-icon"]
            );
        }

        this.shortMenuButton = new CardMenuButtonComponent(
            this.toolbar,
            false, // isExtended = false
            showDeleteButton,
            isModal,
            this.resetButton.disabled,
            deleteCurrentCard,
            editClickHandler,
            jumpToCurrentCard,
            displayCurrentCardInfoNotice,
            skipCurrentCard,
            onOpenResetModalClick,
            closeModal,
            EmulatedPlatform().isPhone || Platform.isPhone
                ? ["mod-raised", "sr-short-menu-button"]
                : ["clickable-icon", "sr-short-menu-button"],
        );

        this.extendedMenuButton = new CardMenuButtonComponent(
            this.toolbar,
            true, // isExtended = true
            showDeleteButton,
            isModal,
            this.resetButton.disabled,
            deleteCurrentCard,
            editClickHandler,
            jumpToCurrentCard,
            displayCurrentCardInfoNotice,
            skipCurrentCard,
            onOpenResetModalClick,
            closeModal,
            EmulatedPlatform().isPhone || Platform.isPhone
                ? ["mod-raised", "sr-extended-menu-button"]
                : ["clickable-icon", "sr-extended-menu-button"],
        );

        // If we don't have a close modal, we don't need the close button
        if (closeModal === undefined) return;

        const closeButtonClasses = [
            EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : "clickable-icon",
        ];

        new ModalCloseButtonComponent(this.toolbar, closeModal, closeButtonClasses);
    }

    public setTTSCached(cached: boolean) {
        this.ttsButton?.setCached(cached);
    }

    /**
     * Updates the deck info section
     * @param chosenDeck - The chosen deck
     * @param currentDeck - The current deck
     * @param chosenDeckStats - The stats of the chosen deck
     * @param currentDeckStats - The stats of the current deck
     * @param totalCardsInSession - The total number of cards in the session
     * @param totalDecksInSession - The total number of decks in the session
     * @param currentDeckTotalCardsInQueue - The total number of cards in the current deck
     * @param settings - The settings object
     */
    // @ts-ignore
    public updateInfo(
        chosenDeck: any,
        currentDeck: any,
        chosenDeckStats: any,
        currentDeckStats: any,
        totalCardsInSession: number,
        totalDecksInSession: number,
        currentDeckTotalCardsInQueue: number,
        flashcardCardOrder: string,
    ) {
        this.infoSection.updateInfo(
            chosenDeck.deckName,
            totalCardsInSession,
            totalCardsInSession - chosenDeckStats.cardsInQueueCount,
            totalDecksInSession,
            totalDecksInSession - chosenDeckStats.decksInQueueOfThisDeckCount,
            currentDeck.deckName,
            currentDeckTotalCardsInQueue,
            currentDeckTotalCardsInQueue - currentDeckStats.cardsInQueueOfThisDeckCount,
            flashcardCardOrder === "EveryCardRandomDeckAndCard",
        );
    }

    /**
     * Sets the reset button disabled state
     * @param disabled - The disabled state
     */
    public setResetButtonDisabled(disabled: boolean) {
        this.resetButton.buttonEl.toggleClass("mod-disabled", disabled);
        this.extendedMenuButton.setResetButtonDisabled(disabled);
        this.shortMenuButton.setResetButtonDisabled(disabled);
    }
}
