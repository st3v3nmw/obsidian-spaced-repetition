import { Menu } from "obsidian";

import { t } from "src/lang/helpers";
import {
    getTableSurfaceNames,
    TableSurface,
} from "src/ui/obsidian-ui-components/content-container/card-container/card-3d-view/card-3d-view";
import MenuButtonComponent from "src/ui/obsidian-ui-components/content-container/menu-button";

/**
 * Lets the card menu offer a choice of table surface for the 3D card view
 */
export interface TableSurfaceMenuOptions {
    /** Whether to offer the choice, i.e. whether the 3D card view is on */
    isAvailable: () => boolean;
    current: () => string;
    choose: (surface: TableSurface) => void;
}

export default class CardMenuButtonComponent extends MenuButtonComponent {
    private isResetButtonDisabled: boolean;
    private tableSurfaceMenu: TableSurfaceMenuOptions | undefined;
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
        tableSurfaceMenu?: TableSurfaceMenuOptions,
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
        this.tableSurfaceMenu = tableSurfaceMenu;
    }

    public setResetButtonDisabled(disabled: boolean) {
        this.isResetButtonDisabled = disabled;
    }

    /**
     * Opens a second menu listing the table surfaces, with the current one ticked.
     * Obsidian has no public API for submenus, so it opens where the first menu was.
     */
    private showTableSurfaceMenu(
        options: TableSurfaceMenuOptions,
        evt: MouseEvent | KeyboardEvent,
    ) {
        const surfaceMenu = new Menu();
        const current = options.current();
        for (const [surface, name] of Object.entries(getTableSurfaceNames())) {
            surfaceMenu.addItem((item) => {
                item.setTitle(name)
                    .setChecked(surface === current)
                    .onClick(() => {
                        options.choose(surface as TableSurface);
                    });
            });
        }

        if (evt instanceof MouseEvent) {
            surfaceMenu.showAtMouseEvent(evt);
        } else {
            const rect = this.buttonEl.getBoundingClientRect();
            surfaceMenu.showAtPosition({ x: rect.left, y: rect.bottom });
        }
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
        const tableSurfaceMenu = this.tableSurfaceMenu;
        if (tableSurfaceMenu !== undefined && tableSurfaceMenu.isAvailable()) {
            cardMenu.addItem((item) => {
                item.setTitle(t("TABLE_SURFACE"))
                    .setIcon("palette")
                    .onClick((evt) => {
                        this.showTableSurfaceMenu(tableSurfaceMenu, evt);
                    });
            });
        }
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
