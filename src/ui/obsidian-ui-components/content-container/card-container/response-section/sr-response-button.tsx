import SRButtonComponent from "src/ui/sr-button";

export default class SRResponseButtonComponent extends SRButtonComponent {
    private smallText: HTMLSpanElement;
    private largeText: HTMLSpanElement;

    constructor(
        container: HTMLElement,
        props: {
            classNames?: string[];
            icon?: string;
            tooltip?: string;
            text?: string;
            onClick: () => void;
        },
    ) {
        super(container, {
            classNames: ["sr-response-button", ...(props.classNames ?? [])],
            icon: props.icon,
            tooltip: props.tooltip,
            text: props.text,
            onClick: () => {
                props.onClick();
            },
        });

        this.buttonEl.setText("");

        this.smallText = this.buttonEl.createSpan();
        this.smallText.addClass("sr-small-text");

        this.largeText = this.buttonEl.createSpan();
        this.largeText.addClass("sr-large-text");

        if (props.text) {
            this.smallText.setText(props.text);
            this.largeText.setText(props.text);
        }
    }

    public setSmallText(text: string) {
        this.smallText.setText(text);
    }

    public setLargeText(text: string) {
        this.largeText.setText(text);
    }
}
