import { Menu } from "obsidian";

import { t } from "src/lang/helpers";
import MenuButtonComponent from "src/ui/obsidian-ui-components/content-container/menu-button";

export default class CardMenuButtonComponent extends MenuButtonComponent {
    private isResetButtonDisabled: boolean;
    public constructor(
        container: HTMLElement,
        isExtended: boolean,
        showDeleteButton: boolean,
        isModal: boolean,
        isResetButtonDisabled: boolean,
        deleteCurrentCard: () => void,
        editClickHandler: () => void,
        jumpToCurrentCard: () => Promise<void>,
        displayCurrentCardInfoNotice: () => void,
        skipCurrentCard: () => void,
        onOpenResetModalClick: () => void,
        closeModal?: () => void,
        classNames?: string[],
    ) {
        super(
            container,
            (evt: MouseEvent) => {
                const cardMenu = new Menu();

                this.buildMenu(
                    cardMenu,
                    showDeleteButton,
                    isModal,
                    isExtended,
                    editClickHandler,
                    onOpenResetModalClick,
                    skipCurrentCard,
                    jumpToCurrentCard,
                    displayCurrentCardInfoNotice,
                    deleteCurrentCard,
                    closeModal,
                );

                cardMenu.showAtMouseEvent(evt);
            },
            classNames,
        );
        this.isResetButtonDisabled = isResetButtonDisabled;
    }

    public setResetButtonDisabled(disabled: boolean) {
        this.isResetButtonDisabled = disabled;
    }

    private buildMenu(
        cardMenu: Menu,
        showDeleteButton: boolean,
        isModal: boolean,
        isExtended: boolean,
        editClickHandler: () => void,
        onOpenResetModalClick: () => void,
        skipCurrentCard: () => void,
        jumpToCurrentCard: () => Promise<void>,
        displayCurrentCardInfoNotice: () => void,
        deleteCurrentCard: () => void,
        closeModal?: () => void,
    ) {
        if (isExtended) {
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
                    })
                    .setDisabled(this.isResetButtonDisabled);
            });
            cardMenu.addItem((item) => {
                item.setTitle(t("SKIP"))
                    .setIcon("chevrons-right")
                    .onClick(() => {
                        skipCurrentCard();
                    });
            });
        }

        if (isModal) {
            cardMenu.addItem((item) => {
                item.setTitle(t("OPEN_IN_BACKGROUND"))
                    .setIcon("send-to-back")
                    .onClick(() => {
                        // Doesn't close modal, just opens in background and focuses
                        jumpToCurrentCard();
                    });
            });
            cardMenu.addItem((item) => {
                item.setTitle(t("JUMP_TO_AND_CLOSE"))
                    .setIcon("arrow-up-right")
                    .onClick(() => {
                        jumpToCurrentCard();
                        if (closeModal) {
                            closeModal();
                        }
                    });
            });
        } else {
            cardMenu.addItem((item) => {
                item.setTitle(t("JUMP_TO"))
                    .setIcon("arrow-up-right")
                    .onClick(() => {
                        jumpToCurrentCard();
                    });
            });
        }
        cardMenu.addItem((item) => {
            item.setTitle(t("VIEW_CARD_INFO"))
                .setIcon("info")
                .onClick(() => {
                    displayCurrentCardInfoNotice();
                });
        });
        if (showDeleteButton) {
            cardMenu.addItem((item) => {
                item.setTitle(t("DELETE_CARD"))
                    .setIcon("trash")
                    .onClick(() => {
                        deleteCurrentCard();
                    });
            });
        }
    }
}
