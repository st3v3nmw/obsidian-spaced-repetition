import { Notice } from "obsidian";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { formatScheduleInterval } from "src/algorithms/schedule-display";
import { t } from "src/lang/helpers";

export default class CardInfoNotice extends Notice {
    public constructor(schedule: RepItemScheduleInfo, notePath: string) {
        const currentEaseStr = t("CURRENT_EASE_HELP_TEXT") + (schedule?.latestEase ?? t("NEW"));
        const currentIntervalStr = t("CURRENT_INTERVAL_HELP_TEXT") + formatScheduleInterval(schedule, false);
        const generatedFromStr = t("CARD_GENERATED_FROM", {
            notePath: notePath,
        });

        super(currentEaseStr + "\n" + currentIntervalStr + "\n" + generatedFromStr);
    }
}
