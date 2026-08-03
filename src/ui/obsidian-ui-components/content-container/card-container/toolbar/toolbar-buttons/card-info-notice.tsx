import { Notice } from "obsidian";
import { State } from "ts-fsrs";

import { IBaseLocale } from "src/lang/base-locale";
import { t } from "src/lang/helpers";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { formatScheduleInterval } from "src/scheduling/algorithms/schedule-display";

const FSRS_STATE_TEXT: Record<State, keyof IBaseLocale> = {
    [State.New]: "FSRS_STATE_NEW",
    [State.Learning]: "FSRS_STATE_LEARNING",
    [State.Review]: "FSRS_STATE_REVIEW",
    [State.Relearning]: "FSRS_STATE_RELEARNING",
};

function formatFsrsState(state: State): string {
    // Schedules parsed from a hand-edited comment can hold an out of range state
    const translationKey: keyof IBaseLocale | undefined = FSRS_STATE_TEXT[state];
    return translationKey ? t(translationKey) : String(state);
}

export default class CardInfoNotice extends Notice {
    public constructor(schedule: RepItemScheduleInfo, notePath: string) {
        // FSRS tracks stability & difficulty instead of SM-2 ease. Showing the mapped ease
        // instead invites reading the raw comment's stability as a difficulty out of range.
        const algorithmLines: string[] =
            schedule instanceof RepItemScheduleInfoFsrs
                ? [
                      t("CURRENT_STABILITY_HELP_TEXT") + schedule.stability.toFixed(2),
                      t("CURRENT_DIFFICULTY_HELP_TEXT") + schedule.difficulty.toFixed(2),
                      t("CURRENT_STATE_HELP_TEXT") + formatFsrsState(schedule.state),
                  ]
                : [t("CURRENT_EASE_HELP_TEXT") + (schedule?.latestEase ?? t("NEW"))];

        super(
            [
                ...algorithmLines,
                t("CURRENT_INTERVAL_HELP_TEXT") + formatScheduleInterval(schedule, false),
                t("CARD_GENERATED_FROM", { notePath: notePath }),
            ].join("\n"),
        );
    }
}
