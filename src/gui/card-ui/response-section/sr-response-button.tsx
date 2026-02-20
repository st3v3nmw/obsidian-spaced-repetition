import SRButton from "src/gui/sr-button";

export default class SRResponseButton extends SRButton {
    constructor(container: HTMLElement, props: { className?: string, icon?: string, tooltip?: string, text?: string, onClick: () => void }) {
        super(container, {
            className: ["sr-response-button", props.className].join(" "),
            icon: props.icon,
            tooltip: props.tooltip,
            text: props.text,
            onClick: () => {
                props.onClick();
            },
        });
    }
}