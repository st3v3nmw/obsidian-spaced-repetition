import "src/ui/obsidian-ui-components/content-container/deck-container/deck-list-header.css";
import { DropdownComponent, Platform, setIcon } from "obsidian";

import { t } from "src/lang/helpers";
import { FlashcardReviewMode } from "src/scheduling/flashcard-review-sequencer";
import UndoButtonComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/toolbar-buttons/undo-button";
import ModalCloseButtonComponent from "src/ui/obsidian-ui-components/content-container/modal-close-button";
import EmulatedPlatform from "src/utils/platform-detector";

export default class DeckListHeaderComponent {
    private header: HTMLDivElement;
    private deckIcon: HTMLElement;
    private title: HTMLDivElement;
    private reviewModeDropdown: DropdownComponent;
    private undoButton: UndoButtonComponent;

    public constructor(
        parentEl: HTMLElement,
        changeReviewMode: (reviewMode: FlashcardReviewMode) => void,
        undoLastAction: () => Promise<void>,
        closeModal?: () => void,
    ) {
        this.header = parentEl.createDiv();
        this.header.addClass("sr-deck-list-header");
        this.header.addClass("sr-header");

        this.deckIcon = this.header.createDiv();
        this.deckIcon.addClass("sr-deck-icon");
        setIcon(this.deckIcon, "layers");

        this.title = this.header.createDiv();
        this.title.addClass("sr-title");
        this.title.setText(t("DECKS"));

        this.header.createDiv().addClass("sr-flex-spacer");

        // E.g. to undo the review of the last card of a deck, after which the deck list is shown
        this.undoButton = new UndoButtonComponent(this.header, undoLastAction, [
            EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : "clickable-icon",
        ]);
        this.setUndoAvailable(false);

        this.reviewModeDropdown = new DropdownComponent(this.header);
        const reviewModeOptions: Record<string, string> = {
            Review: t("REVIEW_MODE"),
            Cram: t("CRAM_MODE"),
        };
        this.reviewModeDropdown.addOptions(reviewModeOptions);
        this.reviewModeDropdown.setValue("Review");

        this.reviewModeDropdown.onChange((value) => {
            if (value === undefined) return;
            if (value === "Review") changeReviewMode(FlashcardReviewMode.Review);
            if (value === "Cram") changeReviewMode(FlashcardReviewMode.Cram);
        });

        // TODO: Add a menu button here, if there are any more actions we want to add

        // If we don't have a close modal, we don't need the close button
        if (closeModal === undefined) return;

        const closeButtonClasses = [
            "sr-modal-close-button",
            EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : "clickable-icon",
        ];

        if (EmulatedPlatform().isPhone || Platform.isPhone) {
            closeButtonClasses.push("mod-raised");
            closeButtonClasses.push("clickable-icon");
        }

        new ModalCloseButtonComponent(
            this.header,
            () => closeModal && closeModal(),
            closeButtonClasses,
        );
    }

    public setUndoAvailable(available: boolean) {
        this.undoButton.setAvailable(available);
        this.undoButton.buttonEl.toggleClass("sr-is-hidden", !available);
    }

    public updateReviewMode(reviewMode: FlashcardReviewMode) {
        this.reviewModeDropdown.setValue(
            reviewMode === FlashcardReviewMode.Review ? "Review" : "Cram",
        );
    }
}
