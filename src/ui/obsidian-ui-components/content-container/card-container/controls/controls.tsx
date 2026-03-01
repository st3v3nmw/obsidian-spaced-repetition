import { Platform } from "obsidian";

import { ReviewResponse } from "src/algorithms/base/repetition-item";
import BackButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/controls/back-button";
import CardInfoButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/controls/card-info-button";
import EditButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/controls/edit-button";
import ResetButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/controls/reset-button";
import SkipButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/controls/skip-button";
import ModalCloseButtonComponent from "src/ui/obsidian-ui-components/content-container/modal-close-button";
import EmulatedPlatform from "src/utils/platform-detector";

export default class ControlsComponent {
    public controls: HTMLDivElement;
    public backButton: BackButtonComponent;
    public modalCloseButton: ModalCloseButtonComponent;
    public editButton: EditButtonComponent;
    public resetButton: ResetButtonComponent;
    public infoButton: CardInfoButtonComponent;
    public skipButton: SkipButtonComponent;

    constructor(
        container: HTMLElement,
        isModal: boolean,
        backToDeck: () => void,
        editClickHandler: () => void,
        processReview: (response: ReviewResponse) => void,
        displayCurrentCardInfoNotice: () => void,
        skipCurrentCard: () => void,
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

        this.editButton = new EditButtonComponent(
            this.controls,
            () => editClickHandler(),
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : undefined,
        );

        this.resetButton = new ResetButtonComponent(
            this.controls,
            () => processReview(ReviewResponse.Reset),
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : undefined,
        );

        this.infoButton = new CardInfoButtonComponent(
            this.controls,
            () => displayCurrentCardInfoNotice(),
            EmulatedPlatform().isPhone || Platform.isPhone ? ["mod-raised"] : undefined,
        );

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
}
