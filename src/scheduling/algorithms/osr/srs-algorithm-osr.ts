import { SRSettings } from "src/data/settings";
import { ISRAlgorithm, SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { osrSchedule } from "src/scheduling/algorithms/osr/note-scheduling";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { DueDateHistogram } from "src/scheduling/due-date-histogram";
import { globalDateProvider } from "src/utils/dates";

/**
 * Represents a scheduling algorithm that uses the OSR algorithm.
 *
 * @class SrsAlgorithmOsr
 * @extends {ISRAlgorithm}
 * @property {SRAlgorithmType} algorithmType - The type of scheduling algorithm.
 * @property {SRSettings} settings - The settings object.
 */
export class SRAlgorithmOsr implements ISRAlgorithm {
    public readonly algorithmType: SRAlgorithmType = SRAlgorithmType.SM_2_OSR;
    private settings: SRSettings;

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    static get initialInterval(): number {
        return 1.0;
    }

    /**
     * Gets the reset schedule for a card.
     *
     * @returns {RepItemScheduleInfo} - The reset schedule for a card.
     */
    cardGetResetSchedule(): RepItemScheduleInfo {
        const interval = SRAlgorithmOsr.initialInterval;
        const ease = this.settings.baseEase;
        const dueDate = globalDateProvider.today;
        return new RepItemScheduleInfoOsr(dueDate, interval, ease);
    }

    /**
     * Gets the new schedule for a card.
     *
     * @param {ReviewResponse} response - The review response.
     * @param {string} notePath - The note path.
     * @param {DueDateHistogram} dueDateFlashcardHistogram - The due date flashcard histogram.
     * @returns {RepItemScheduleInfo} - The new schedule for a card.
     */
    cardGetNewSchedule(
        response: ReviewResponse,
        _notePath: string,
        dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const initialEase: number = this.settings.baseEase;
        const delayBeforeReview = 0;

        const schedObj: Record<string, number> = osrSchedule(
            response,
            SRAlgorithmOsr.initialInterval,
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

    /**
     * Calculates the updated schedule for a card.
     *
     * @param {ReviewResponse} response - The review response.
     * @param {RepItemScheduleInfo} cardSchedule - The card schedule.
     * @param {DueDateHistogram} dueDateFlashcardHistogram - The due date flashcard histogram.
     * @returns {RepItemScheduleInfo} - The updated schedule for a card.
     */
    cardCalcUpdatedSchedule(
        response: ReviewResponse,
        cardSchedule: RepItemScheduleInfo,
        dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const cardScheduleOsr: RepItemScheduleInfoOsr = cardSchedule;
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
