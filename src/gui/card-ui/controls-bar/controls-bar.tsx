import { ButtonComponent, Platform } from "obsidian";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import BackButton from "src/gui/card-ui/controls-bar/back-button";
import CardInfoButton from "src/gui/card-ui/controls-bar/card-info-button";
import EditButton from "src/gui/card-ui/controls-bar/edit-button";
import ResetButton from "src/gui/card-ui/controls-bar/reset-button";
import SkipButton from "src/gui/card-ui/controls-bar/skip-button";
import ModalCloseButton from "src/gui/modal-close-button";
import EmulatedPlatform from "src/utils/platform-detector";

export default class ControlsBar {
    public controlsBar: HTMLDivElement;
    public cardControls: HTMLDivElement;
    public backButton: ButtonComponent;
    public modalCloseButton: ButtonComponent;
    public editButton: ButtonComponent;
    public resetButton: ButtonComponent;
    public infoButton: ButtonComponent;
    public skipButton: ButtonComponent;

    constructor(container: HTMLElement, backToDeck: () => void, editClickHandler: () => void, processReview: (response: ReviewResponse) => void, displayCurrentCardInfoNotice: () => void, skipCurrentCard: () => void, closeModal?: () => void) {
        this.controlsBar = container.createDiv();
        this.controlsBar.addClass("sr-controls-bar");

        this.backButton = new BackButton(this.controlsBar, () => backToDeck(), "clickable-icon");

        this.cardControls = this.controlsBar.createDiv();
        this.cardControls.addClass("sr-card-controls");

        this.editButton = new EditButton(this.cardControls, () => editClickHandler(),
            EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : undefined
        );

        this.resetButton = new ResetButton(this.cardControls, () => processReview(ReviewResponse.Reset),
            EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : undefined
        );

        this.infoButton = new CardInfoButton(this.cardControls, () => displayCurrentCardInfoNotice(),
            EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : undefined
        );

        this.skipButton = new SkipButton(this.cardControls, () => skipCurrentCard(),
            EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : undefined
        );

        this.modalCloseButton = new ModalCloseButton(this.controlsBar, () => closeModal && closeModal(), [
            closeModal && "sr-hide-by-scaling",
            EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : "clickable-icon"
        ].join(" "));
    }
}