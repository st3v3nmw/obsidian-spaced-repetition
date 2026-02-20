import { ButtonComponent, IconName } from "obsidian";

export default class SRButtonComponent extends ButtonComponent {
    constructor(container: HTMLElement, props?: { classNames?: string[], icon?: IconName, tooltip?: string, text?: string, onClick?: () => void }) {
        super(container);
        this.setClass("sr-button");
        if (props) {
            if (props.classNames) this.buttonEl.addClasses(props.classNames);
            if (props.icon) this.setIcon(props.icon);
            if (props.tooltip) this.setTooltip(props.tooltip);
            if (props.tooltip) this.buttonEl.setAttribute("aria-label", props.tooltip);
            if (props.text) this.setButtonText(props.text);
            if (props.onClick) this.onClick(props.onClick);
        }
    }
}