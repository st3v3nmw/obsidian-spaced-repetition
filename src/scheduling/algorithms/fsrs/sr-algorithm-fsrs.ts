import { CardInput, createEmptyCard, FSRS, fsrs, State } from "ts-fsrs";

import { SRSettings } from "src/data/settings";
import { ISRAlgorithm, SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import {
    buildFsrsParameters,
    reviewResponseToFsrsGrade,
    sm2ScheduleToFsrsCard,
} from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { DueDateHistogram } from "src/scheduling/due-date-histogram";
import { globalDateProvider } from "src/utils/dates";

/**
 * Represents a scheduling algorithm that uses the FSRS algorithm.
 *
 * @class SrsAlgorithmFsrs
 * @extends {ISRAlgorithm}
 * @property {SRAlgorithmType} algorithmType - The type of scheduling algorithm.
 * @property {FSRS} scheduler - The FSRS scheduler.
 */
export class SrsAlgorithmFsrs implements ISRAlgorithm {
    public readonly algorithmType: SRAlgorithmType = SRAlgorithmType.FSRS;
    private scheduler: FSRS;

    constructor(settings: SRSettings) {
        this.scheduler = fsrs(buildFsrsParameters(settings));
    }

    cardGetResetSchedule(): RepItemScheduleInfo {
        const now = globalDateProvider.now.toDate();
        const emptyCard = createEmptyCard(now);
        emptyCard.state = State.New;
        emptyCard["scheduled_days"] = 0;
        emptyCard["learning_steps"] = 0;
        emptyCard.due = now;
        emptyCard["last_review"] = undefined;
        return RepItemScheduleInfoFsrs.fromFsrsCard(emptyCard);
    }

    cardGetNewSchedule(
        response: ReviewResponse,
        _notePath: string,
        _dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const now = globalDateProvider.now.toDate();
        const recordLog = this.scheduler.next(
            createEmptyCard(now),
            now,
            reviewResponseToFsrsGrade(response),
        );
        return RepItemScheduleInfoFsrs.fromFsrsCard(recordLog.card);
    }

    cardCalcUpdatedSchedule(
        response: ReviewResponse,
        schedule: RepItemScheduleInfo,
        _dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const now = globalDateProvider.now;
        const card: CardInput =
            schedule instanceof RepItemScheduleInfoFsrs
                ? schedule.toFsrsCardInput(now)
                : sm2ScheduleToFsrsCard(schedule, now);

        const recordLog = this.scheduler.next(
            card,
            now.toDate(),
            reviewResponseToFsrsGrade(response),
        );
        return RepItemScheduleInfoFsrs.fromFsrsCard(recordLog.card);
    }
}
