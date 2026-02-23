import SRButtonComponent from "src/gui/sr-button";

export default class SRResponseButtonComponent extends SRButtonComponent {
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
    }
}
