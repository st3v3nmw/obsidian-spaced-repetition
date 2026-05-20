import { ISrsAlgorithm } from "src/algorithms/base/isrs-algorithm";
import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { osrSchedule } from "src/algorithms/osr/note-scheduling";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { DueDateHistogram } from "src/due-date-histogram";
import { SRSettings } from "src/settings";
import { globalDateProvider } from "src/utils/dates";

export class SrsAlgorithmOsr implements ISrsAlgorithm {
    private settings: SRSettings;

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    static get initialInterval(): number {
        return 1.0;
    }

    cardGetResetSchedule(): RepItemScheduleInfo {
        const interval = SrsAlgorithmOsr.initialInterval;
        const ease = this.settings.baseEase;
        const dueDate = globalDateProvider.today;
        return new RepItemScheduleInfoOsr(dueDate, interval, ease);
    }

    cardGetNewSchedule(
        response: ReviewResponse,
        _notePath: string,
        dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const initialEase: number = this.settings.baseEase;
        const delayBeforeReview = 0;

        const schedObj: Record<string, number> = osrSchedule(
            response,
            SrsAlgorithmOsr.initialInterval,
            initialEase,
            delayBeforeReview,
            this.settings,
            dueDateFlashcardHistogram,
        );

        const interval = schedObj.interval;
        const ease = schedObj.ease;
        const dueDate = globalDateProvider.today.add(interval, "d");
        return new RepItemScheduleInfoOsr(dueDate, interval, ease, delayBeforeReview);
    }

    cardCalcUpdatedSchedule(
        response: ReviewResponse,
        cardSchedule: RepItemScheduleInfo,
        dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const cardScheduleOsr: RepItemScheduleInfoOsr = cardSchedule as RepItemScheduleInfoOsr;
        const schedObj: Record<string, number> = osrSchedule(
            response,
            cardScheduleOsr.interval,
            cardSchedule.latestEase,
            cardSchedule.delayedBeforeReviewTicks,
            this.settings,
            dueDateFlashcardHistogram,
        );
        const interval = schedObj.interval;
        const ease = schedObj.ease;
        const dueDate = globalDateProvider.today.add(interval, "d");
        const delayBeforeReview = 0;
        return new RepItemScheduleInfoOsr(dueDate, interval, ease, delayBeforeReview);
    }
}
