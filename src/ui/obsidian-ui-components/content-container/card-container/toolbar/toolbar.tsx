import "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar.css";
import { Menu, Platform } from "obsidian";

import { DeckStats } from "src/card/flashcard-review-sequencer";
import { Deck } from "src/deck/deck";
import { t } from "src/lang/helpers";
import DeckInfoComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/deck-info/deck-info";
import BackButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar-buttons/back-button";
import EditButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar-buttons/edit-button";
import MenuDotsButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar-buttons/menu-dots-button";
import ResetButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar-buttons/reset-button";
import SkipButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar-buttons/skip-button";
import ModalCloseButtonComponent from "src/ui/obsidian-ui-components/content-container/modal-close-button";
import EmulatedPlatform from "src/utils/platform-detector";

export default class CardToolbarComponent {
    private toolbar: HTMLDivElement;
    private infoSection: DeckInfoComponent;
    private resetButton: ResetButtonComponent;

    public constructor(
        parentEl: HTMLElement,
        isModal: boolean,
        backToDeckHandler: () => void,
        editClickHandler: () => void,
        jumpToCurrentCard: () => Promise<void>,
        displayCurrentCardInfoNotice: () => void,
        skipCurrentCard: () => void,
        onOpenResetModalClick: () => void,
        closeModal?: () => void,
    ) {
        // Build ui
        this.toolbar = parentEl.createDiv();
        this.toolbar.addClass("sr-card-toolbar");

        new BackButtonComponent(this.toolbar, () => backToDeckHandler(), [
            (EmulatedPlatform().isPhone || Platform.isPhone) && isModal
                ? "mod-raised"
                : "clickable-icon",
        ]);

        this.infoSection = new DeckInfoComponent(this.toolbar);

        this.toolbar.createDiv().addClass("sr-flex-spacer");

        new EditButtonComponent(
            this.toolbar,
            () => editClickHandler(),
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : undefined,
        );

        this.resetButton = new ResetButtonComponent(this.toolbar, onOpenResetModalClick, [
            EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : "undefined",
        ]);
        this.resetButton.setDisabled(true);

        new SkipButtonComponent(
            this.toolbar,
            () => skipCurrentCard(),
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : undefined,
        );

        new MenuDotsButtonComponent(
            this.toolbar,
            (evt: MouseEvent) => {
                const cardMenu = new Menu();

                cardMenu.addItem((item) => {
                    item.setTitle("Jump to card") // TODO: Translate
                        .setIcon("arrow-up-right")
                        .onClick(() => {
                            jumpToCurrentCard();
                        });
                });
                cardMenu.addItem((item) => {
                    item.setTitle(t("VIEW_CARD_INFO"))
                        .setIcon("info")
                        .onClick(() => {
                            displayCurrentCardInfoNotice();
                        });
                });

                cardMenu.showAtMouseEvent(evt);
            },
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : undefined,
        ).setClass("sr-short-menu-button");

        new MenuDotsButtonComponent(
            this.toolbar,
            (evt: MouseEvent) => {
                const cardMenu = new Menu();

                cardMenu.addItem((item) => {
                    item.setTitle(t("EDIT_CARD"))
                        .setIcon("pencil")
                        .onClick(() => {
                            editClickHandler();
                        });
                });

                cardMenu.addItem((item) => {
                    item.setTitle(t("RESET_CARD_PROGRESS"))
                        .setIcon("reset")
                        .onClick(() => {
                            onOpenResetModalClick();
                        }).setDisabled(this.resetButton.disabled);
                });

                cardMenu.addItem((item) => {
                    item.setTitle(t("SKIP"))
                        .setIcon("chevrons-right")
                        .onClick(() => {
                            skipCurrentCard();
                        });
                });

                cardMenu.addItem((item) => {
                    item.setTitle("Jump to card") // TODO: Translate
                        .setIcon("arrow-up-right")
                        .onClick(() => {
                            jumpToCurrentCard();
                        });
                });
                cardMenu.addItem((item) => {
                    item.setTitle(t("VIEW_CARD_INFO"))
                        .setIcon("info")
                        .onClick(() => {
                            displayCurrentCardInfoNotice();
                        });
                });

                cardMenu.showAtMouseEvent(evt);
            },
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : undefined,
        ).setClass("sr-extended-menu-button");

        // If we don't have a close modal, we don't need the close button
        if (closeModal === undefined) return;

        const closeButtonClasses = [
            EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : "clickable-icon",
        ];

        new ModalCloseButtonComponent(
            this.toolbar,
            () => closeModal && closeModal(),
            closeButtonClasses,
        );
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
    public updateInfo(
        chosenDeck: Deck,
        currentDeck: Deck,
        chosenDeckStats: DeckStats,
        currentDeckStats: DeckStats,
        totalCardsInSession: number,
        totalDecksInSession: number,
        currentDeckTotalCardsInQueue: number,
        flashcardCardOrder: string,
    ) {
        this.infoSection.updateChosenDeckInfo(
            chosenDeck,
            chosenDeckStats,
            totalCardsInSession,
            totalDecksInSession,
        );
        this.infoSection.updateCurrentDeckInfo(
            chosenDeck,
            currentDeck,
            currentDeckStats,
            flashcardCardOrder,
            currentDeckTotalCardsInQueue,
        );
    }

    /**
     * Sets the reset button disabled state
     * @param disabled - The disabled state
     */
    public setResetButtonDisabled(disabled: boolean) {
        this.resetButton.buttonEl.toggleClass("mod-disabled", disabled);
    }
}
