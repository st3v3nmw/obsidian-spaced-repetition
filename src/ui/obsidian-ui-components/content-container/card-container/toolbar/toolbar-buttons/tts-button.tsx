import { setIcon } from "obsidian";
import EmulatedPlatform from "src/utils/platform-detector";
import { Platform } from "obsidian";

export default class TTSButtonComponent {
    public buttonEl: HTMLButtonElement;

    constructor(
        containerEl: HTMLElement,
        onClick: () => void,
        classes: string[] = []
    ) {
        this.buttonEl = containerEl.createEl("button", {
            cls: [...classes, "sr-tts-button"],
        });
        setIcon(this.buttonEl, "volume-2");
        this.buttonEl.setAttribute("aria-label", "Text-to-Speech");
        this.buttonEl.addEventListener("click", onClick);
    }

    public setCached(cached: boolean) {
        if (cached) {
            this.buttonEl.addClass("sr-tts-cached");
            this.buttonEl.setAttribute("aria-label", "Text-to-Speech (Cached - Instant)");
            this.buttonEl.style.color = "var(--interactive-accent)";
        } else {
            this.buttonEl.removeClass("sr-tts-cached");
            this.buttonEl.setAttribute("aria-label", "Text-to-Speech");
            this.buttonEl.style.color = "";
        }
    }
}
