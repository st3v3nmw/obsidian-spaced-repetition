import CounterComponent from "src/ui/obsidian-ui-components/content-container/card-container/toolbar/deck-info/counter-component";

export default class ProgressCounterComponent extends CounterComponent {
    constructor(
        parentEl: HTMLDivElement,
        iconId: string,
        progress: number = 0,
        total: number = 0,
        classNames: string[] = [],
    ) {
        super(parentEl, iconId, classNames);
        this.setProgress(progress, total);
    }

    public setProgress(progress: number, total: number) {
        this.setText(`${progress}/${total}`);
    }
}
