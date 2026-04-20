import "src/ui/obsidian-ui-components/content-container/deck-container/deck-list-header.css";
import { DropdownComponent, Platform, setIcon } from "obsidian";

import { FlashcardReviewMode } from "src/card/flashcard-review-sequencer";
import { t } from "src/lang/helpers";
import ModalCloseButtonComponent from "src/ui/obsidian-ui-components/content-container/modal-close-button";
import EmulatedPlatform from "src/utils/platform-detector";

export default class DeckListHeaderComponent {
    private header: HTMLDivElement;
    private deckIcon: HTMLElement;
    private title: HTMLDivElement;
    private reviewModeDropdown: DropdownComponent;

    public constructor(
        parentEl: HTMLElement,
        changeReviewMode: (reviewMode: FlashcardReviewMode) => void,
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
        this.reviewModeDropdown = new DropdownComponent(this.header);
        const reviewModeOptions: Record<string, string> = {
            Review: t("REVIEW_MODE"),
            Cram: t("CRAM_MODE"),
        };
        this.reviewModeDropdown.addOptions(reviewModeOptions);
        this.reviewModeDropdown.setValue("Review");

        this.reviewModeDropdown.onChange(async (value) => {
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

    public updateReviewMode(reviewMode: FlashcardReviewMode) {
        this.reviewModeDropdown.setValue(
            reviewMode === FlashcardReviewMode.Review ? "Review" : "Cram",
        );
    }
}
