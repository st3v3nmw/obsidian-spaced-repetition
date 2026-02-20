import { Platform } from "obsidian";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import BackButtonComponent from "src/gui/card-ui/controls-bar/back-button";
import CardInfoButtonComponent from "src/gui/card-ui/controls-bar/card-info-button";
import EditButtonComponent from "src/gui/card-ui/controls-bar/edit-button";
import ResetButtonComponent from "src/gui/card-ui/controls-bar/reset-button";
import SkipButtonComponent from "src/gui/card-ui/controls-bar/skip-button";
import ModalCloseButtonComponent from "src/gui/modal-close-button";
import EmulatedPlatform from "src/utils/platform-detector";

export default class ControlsBarComponent {
    public controlsBar: HTMLDivElement;
    public cardControls: HTMLDivElement;
    public backButton: BackButtonComponent;
    public modalCloseButton: ModalCloseButtonComponent;
    public editButton: EditButtonComponent;
    public resetButton: ResetButtonComponent;
    public infoButton: CardInfoButtonComponent;
    public skipButton: SkipButtonComponent;

    constructor(container: HTMLElement, backToDeck: () => void, editClickHandler: () => void, processReview: (response: ReviewResponse) => void, displayCurrentCardInfoNotice: () => void, skipCurrentCard: () => void, closeModal?: () => void) {
        this.controlsBar = container.createDiv();
        this.controlsBar.addClass("sr-controls-bar");

        this.backButton = new BackButtonComponent(this.controlsBar, () => backToDeck(), ["clickable-icon"]);

        this.cardControls = this.controlsBar.createDiv();
        this.cardControls.addClass("sr-card-controls");

        this.editButton = new EditButtonComponent(this.cardControls, () => editClickHandler(),
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : undefined
        );

        this.resetButton = new ResetButtonComponent(this.cardControls, () => processReview(ReviewResponse.Reset),
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : undefined
        );

        this.infoButton = new CardInfoButtonComponent(this.cardControls, () => displayCurrentCardInfoNotice(),
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : undefined
        );

        this.skipButton = new SkipButtonComponent(this.cardControls, () => skipCurrentCard(),
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : undefined
        );

        this.modalCloseButton = new ModalCloseButtonComponent(this.controlsBar, () => closeModal && closeModal(), [
            !closeModal && "sr-hide-by-scaling",
            EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : "clickable-icon"
        ]);
    }
}