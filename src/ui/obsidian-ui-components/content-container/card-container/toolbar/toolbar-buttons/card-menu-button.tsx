import { Menu } from "obsidian";

import { t } from "src/lang/helpers";
import MenuButtonComponent from "src/ui/obsidian-ui-components/content-container/menu-button";

export default class CardMenuButtonComponent extends MenuButtonComponent {
    private isResetButtonDisabled: boolean;
    private isUndoAvailable: boolean = false;
    private isRedoAvailable: boolean = false;
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
        suspendCurrentCard: () => Promise<void>,
        onOpenResetModalClick: () => void,
        undoLastAction: () => Promise<void>,
        redoLastUndoneAction: () => Promise<void>,
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
                    suspendCurrentCard,
                    jumpToCurrentCard,
                    displayCurrentCardInfoNotice,
                    deleteCurrentCard,
                    undoLastAction,
                    redoLastUndoneAction,
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

    public setUndoAvailable(canUndo: boolean, canRedo: boolean) {
        this.isUndoAvailable = canUndo;
        this.isRedoAvailable = canRedo;
    }

    private buildMenu(
        cardMenu: Menu,
        showDeleteButton: boolean,
        isModal: boolean,
        isExtended: boolean,
        editClickHandler: () => void,
        onOpenResetModalClick: () => void,
        skipCurrentCard: () => void,
        suspendCurrentCard: () => Promise<void>,
        jumpToCurrentCard: () => Promise<void>,
        displayCurrentCardInfoNotice: () => void,
        deleteCurrentCard: () => void,
        undoLastAction: () => Promise<void>,
        redoLastUndoneAction: () => Promise<void>,
        closeModal?: () => void,
    ) {
        if (isExtended) {
            cardMenu.addItem((item) => {
                item.setTitle(t("UNDO_LAST_ACTION"))
                    .setIcon("undo-2")
                    .onClick(async () => {
                        await undoLastAction();
                    })
                    .setDisabled(!this.isUndoAvailable);
            });
            cardMenu.addItem((item) => {
                item.setTitle(t("REDO_LAST_ACTION"))
                    .setIcon("redo-2")
                    .onClick(async () => {
                        await redoLastUndoneAction();
                    })
                    .setDisabled(!this.isRedoAvailable);
            });
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
            cardMenu.addItem((item) => {
                item.setTitle(t("SUSPEND_CARD"))
                    .setIcon("pause")
                    .onClick(async () => {
                        await suspendCurrentCard();
                    });
            });
        }

        if (isModal) {
            cardMenu.addItem((item) => {
                item.setTitle(t("OPEN_IN_BACKGROUND"))
                    .setIcon("send-to-back")
                    .onClick(async () => {
                        // Doesn't close modal, just opens in background and focuses
                        await jumpToCurrentCard();
                    });
            });
            cardMenu.addItem((item) => {
                item.setTitle(t("JUMP_TO_AND_CLOSE"))
                    .setIcon("arrow-up-right")
                    .onClick(async () => {
                        await jumpToCurrentCard();
                        if (closeModal) {
                            closeModal();
                        }
                    });
            });
        } else {
            cardMenu.addItem((item) => {
                item.setTitle(t("JUMP_TO"))
                    .setIcon("arrow-up-right")
                    .onClick(async () => {
                        await jumpToCurrentCard();
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
