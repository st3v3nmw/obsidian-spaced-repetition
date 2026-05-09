import { Moment } from "moment";

import { SRAlgorithmType } from "src/algorithms/base/isr-algorithm";
import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { PREFERRED_DATE_FORMAT } from "src/data/constants";
import { SRSettings } from "src/data/settings";
import { DateUtil, formatDate, globalDateProvider } from "src/utils/dates";

export class RepItemScheduleInfoOsr extends RepItemScheduleInfo {
    // A question can have multiple cards. The schedule info for all sibling cards are formatted together
    // in a single <!--SR: --> comment, such as:
    // <!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->
    //
    // However, not all sibling cards may have been reviewed. Therefore we need a method of indicating that a particular card
    // has not been reviewed, and should be considered "new"
    // This is done by using this magic value for the date
    public static dummyDueDateForNewCard: string = "2000-01-01";

    constructor(
        dueDate: Moment,
        interval: number,
        latestEase: number,
        delayedBeforeReviewTicks: number | null = null,
    ) {
        super(
            SRAlgorithmType.SM_2_OSR,
            dueDate,
            interval,
            latestEase,
            dueDate && delayedBeforeReviewTicks === null
                ? globalDateProvider.today.valueOf() - dueDate.valueOf()
                : delayedBeforeReviewTicks || 0,
        );
    }

    static get initialInterval(): number {
        return 1.0;
    }

    /**
     * Formats the scheduling information for the repetition item as a string for HTML comments.
     *
     * @returns {string} - The formatted scheduling information for the repetition item as a string for HTML comments.
     */
    formatScheduleAsSRHtmlComment(): string {
        // We always want the correct schedule format, so we use the dummy due date if there is no schedule for a card
        const dateStr: string = this.dueDate
            ? this.formatDueDate()
            : RepItemScheduleInfoOsr.dummyDueDateForNewCard;
        return `!${dateStr},${this.interval},${this.latestEase}`;
    }

    /**
     * Gets a new schedule with the default values.
     *
     * @param {SRSettings} settings - The settings object.
     * @returns {RepItemScheduleInfoOsr} - A new schedule with the default values.
     */
    static getNewSchedule(settings: SRSettings): RepItemScheduleInfoOsr {
        return RepItemScheduleInfoOsr.fromDueDateStr(
            RepItemScheduleInfoOsr.dummyDueDateForNewCard,
            RepItemScheduleInfoOsr.initialInterval,
            settings.baseEase,
        );
    }

    /**
     * Creates a RepItemScheduleInfoOsr object from a due date string, interval, ease, and delayed before review ticks.
     *
     * @param {string} dueDateStr - The due date string.
     * @param {number} interval - The interval.
     * @param {number} ease - The ease.
     * @param {number | null} [delayedBeforeReviewTicks=null] - The delayed before review ticks.
     * @returns {RepItemScheduleInfoOsr} - The RepItemScheduleInfoOsr object.
     */
    static fromDueDateStr(
        dueDateStr: string,
        interval: number,
        ease: number,
        delayedBeforeReviewTicks: number | null = null,
    ) {
        const dueDate: Moment = DateUtil.dateStrToMoment(dueDateStr);
        return new RepItemScheduleInfoOsr(dueDate, interval, ease, delayedBeforeReviewTicks);
    }

    /**
     * Formats the scheduling information for the repetition item as a JSON string.
     *
     * @returns {string} - The formatted scheduling information.
     */
    formatScheduleAsJsonString(): string {
        return JSON.stringify({
            dueDate: formatDate(this.dueDateAsUnix, PREFERRED_DATE_FORMAT),
            interval: this.interval,
            ease: this.latestEase,
            delayedBeforeReviewTicks: this.delayedBeforeReviewTicks,
        });
    }
}
