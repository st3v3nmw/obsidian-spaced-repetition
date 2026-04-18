import "src/ui/obsidian-ui-components/content-container/deck-container/deck-list-header.css";
import { Platform, setIcon } from "obsidian";

import { t } from "src/lang/helpers";
import ModalCloseButtonComponent from "src/ui/obsidian-ui-components/content-container/modal-close-button";
import EmulatedPlatform from "src/utils/platform-detector";

export default class DeckListHeaderComponent {
    private header: HTMLDivElement;
    private titleWrapper: HTMLDivElement;
    private deckIcon: HTMLElement;
    private title: HTMLDivElement;
    private closeButton: ModalCloseButtonComponent;

    public constructor(parentEl: HTMLElement, closeModal?: () => void) {
        this.header = parentEl.createDiv();
        this.header.addClass("sr-deck-list-header");
        this.header.addClass("sr-header");

        this.titleWrapper = this.header.createDiv();
        this.titleWrapper.addClass("sr-title-wrapper");

        this.deckIcon = this.titleWrapper.createDiv();
        this.deckIcon.addClass("sr-deck-icon");
        setIcon(this.deckIcon, "layers");

        this.title = this.titleWrapper.createDiv();
        this.title.addClass("sr-title");
        this.title.setText(t("DECKS"));

        this.titleWrapper.createDiv().addClass("sr-flex-spacer");

        const closeButtonClasses = [
            "sr-modal-close-button",
            EmulatedPlatform().isPhone || Platform.isPhone ? "mod-raised" : "clickable-icon",
        ];

        if (closeModal === undefined) {
            closeButtonClasses.push("sr-hide-by-scaling");
            closeButtonClasses.push("hide-height");
        }

        if (EmulatedPlatform().isPhone || Platform.isPhone) {
            closeButtonClasses.push("mod-raised");
            closeButtonClasses.push("clickable-icon");
        }

        this.closeButton = new ModalCloseButtonComponent(
            this.titleWrapper,
            () => closeModal && closeModal(),
            closeButtonClasses,
        );
    }
}
