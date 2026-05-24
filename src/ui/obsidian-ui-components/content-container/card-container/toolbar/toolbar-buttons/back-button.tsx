import { t } from "src/lang/helpers";
import SRButtonComponent from "src/ui/sr-button";

export default class BackButtonComponent extends SRButtonComponent {
    public constructor(
        container: HTMLElement,
        backToDeck: () => Promise<void>,
        classNames?: string[],
    ) {
        super(container, {
            classNames: ["sr-back-button", ...(classNames ?? [])],
            icon: "arrow-left",
            tooltip: t("BACK"),
            onClick: async () => {
                await backToDeck();
            },
        });
    }
}
