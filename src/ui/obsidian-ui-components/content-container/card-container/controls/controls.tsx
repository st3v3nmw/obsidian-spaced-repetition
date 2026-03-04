import { App, Menu, Platform } from "obsidian";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { t } from "src/lang/helpers";
import BackButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/controls/back-button";
import MenuDotsButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/controls/menu-dots-button";
import ResetButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/controls/reset-button";
import SkipButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/controls/skip-button";
import ModalCloseButtonComponent from "src/ui/obsidian-ui-components/content-container/modal-close-button";
import EmulatedPlatform from "src/utils/platform-detector";

export default class ControlsComponent {
    public controls: HTMLDivElement;
    public backButton: BackButtonComponent;
    public modalCloseButton: ModalCloseButtonComponent;
    public resetButton: ResetButtonComponent;
    public skipButton: SkipButtonComponent;
    public menuDotsButton: MenuDotsButtonComponent;

    constructor(
        container: HTMLElement,
        isModal: boolean,
        app: App,
        backToDeck: () => void,
        editClickHandler: () => void,
        processReview: (response: ReviewResponse) => Promise<void>,
        displayCurrentCardInfoNotice: () => void,
        skipCurrentCard: () => void,
        jumpToCurrentCard: () => Promise<void>,
        closeModal?: () => void,
    ) {
        this.controls = container.createDiv();
        this.controls.addClass("sr-controls");

        this.backButton = new BackButtonComponent(this.controls, () => backToDeck(), [
            (EmulatedPlatform().isPhone || Platform.isPhone) && isModal
                ? "mod-raised"
                : "clickable-icon",
        ]);

        this.controls.createDiv().addClass("sr-flex-spacer");

        this.menuDotsButton = new MenuDotsButtonComponent(
            this.controls,
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
                    item.setTitle(t("EDIT_CARD"))
                        .setIcon("pencil")
                        .onClick(() => {
                            editClickHandler();
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
        );

        this.resetButton = new ResetButtonComponent(
            this.controls,
            app,
            async () => await processReview(ReviewResponse.Reset),
            [EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : "undefined"],
        );
        this.resetButton.setDisabled(true);

        this.skipButton = new SkipButtonComponent(
            this.controls,
            () => skipCurrentCard(),
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : undefined,
        );

        this.controls.createDiv().addClass("sr-flex-spacer");

        this.modalCloseButton = new ModalCloseButtonComponent(
            this.controls,
            () => closeModal && closeModal(),
            [
                !closeModal && "sr-hide-by-scaling",
                !closeModal && "hide-height",
                EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : "clickable-icon",
            ],
        );
    }

    setResetButtonDisabled(disabled: boolean) {
        this.resetButton.buttonEl.toggleClass("mod-disabled", disabled);
    }
}
