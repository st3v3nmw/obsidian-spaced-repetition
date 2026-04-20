import { setIcon } from "obsidian";

export default class CounterComponent {
    private counterEl: HTMLDivElement;
    private counterTextEl: HTMLDivElement;
    private counterIconEl: HTMLDivElement;

    constructor(parentEl: HTMLDivElement, iconId: string, classNames: string[]) {
        this.counterEl = parentEl.createDiv();
        this.counterEl.addClass("sr-counter-wrapper");
        classNames.forEach((className) => {
            this.counterEl.addClass(className);
        });

        this.counterTextEl = this.counterEl.createDiv();
        this.counterTextEl.addClass("sr-counter");

        this.counterIconEl = this.counterEl.createDiv();
        this.counterIconEl.addClass("sr-counter-icon");
        setIcon(this.counterIconEl, iconId);
    }

    public setText(text: string) {
        this.counterTextEl.setText(text);
    }

    public hasClass(className: string) {
        return this.counterEl.hasClass(className);
    }

    public addClass(className: string) {
        this.counterEl.addClass(className);
    }

    public removeClass(className: string) {
        this.counterEl.removeClass(className);
    }
}
