import { Moment } from "moment";

import { PREFERRED_DATE_FORMAT, TICKS_PER_DAY } from "src/data/constants";
import { SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { formatDate, globalDateProvider } from "src/utils/dates";

/**
 * Represents scheduling information for a repetition item.
 *
 * @class RepItemScheduleInfo
 * @property {SRAlgorithmType} algorithmType - The type of scheduling algorithm used for this scheduling information.
 * @property {Moment} dueDate - The due date for the repetition item.
 * @property {number} latestEase - The latest ease for the repetition item.
 * @property {number} interval - The interval for the repetition item.
 * @property {number} delayedBeforeReviewTicks - The number of ticks before the due date that the repetition item is due.
 */
export abstract class RepItemScheduleInfo {
    public readonly algorithmType: SRAlgorithmType;
    public dueDate: Moment;
    public latestEase: number;
    public interval: number;
    public delayedBeforeReviewTicks: number;

    constructor(
        algorithmType: SRAlgorithmType,
        dueDate: Moment,
        interval: number,
        latestEase: number,
        delayedBeforeReviewTicks: number,
    ) {
        this.dueDate = dueDate;
        this.interval = interval;
        this.latestEase = latestEase;
        this.delayedBeforeReviewTicks = delayedBeforeReviewTicks;
        this.algorithmType = algorithmType;
    }

    get dueDateAsUnix(): number {
        return this.dueDate.valueOf();
    }

    /**
     * Checks if the repetition item is due.
     *
     * @returns {boolean} - True if the repetition item is due, false otherwise.
     */
    isDue(): boolean {
        return this.dueDate && this.dueDate.isSameOrBefore(globalDateProvider.now);
    }

    /**
     * Formats the due date for the repetition item as a string.
     *
     * @returns {string} - The formatted due date.
     */
    formatDueDate(): string {
        return formatDate(this.dueDateAsUnix, PREFERRED_DATE_FORMAT);
    }

    /**
     * Formats the delayed before review ticks for the repetition item.
     *
     * @returns {number} - The formatted delayed before review ticks.
     */
    delayedBeforeReviewDaysInt(): number {
        return Math.max(0, Math.floor(this.delayedBeforeReviewTicks / TICKS_PER_DAY));
    }

    /**
     * Formats the scheduling information for the repetition item as a SRHTML comments.
     *
     * @returns {string} - The formatted scheduling information.
     */
    abstract formatScheduleAsSRHtmlComment(): string;

    /**
     * Formats the scheduling information for the repetition item as a JSON string.
     *
     * @returns {string} - The formatted scheduling information.
     */
    abstract formatScheduleAsJsonString(): string;
}
