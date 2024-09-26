import { Moment } from "moment";

import { TICKS_PER_DAY } from "src/constants";
import { formatDateYYYYMMDD, globalDateProvider } from "src/utils/dates";

export abstract class RepItemScheduleInfo {
    dueDate: Moment;
    latestEase: number;
    interval: number;
    delayedBeforeReviewTicks: number;

    get dueDateAsUnix(): number {
        return this.dueDate.valueOf();
    }

    isDue(): boolean {
        return this.dueDate && this.dueDate.isSameOrBefore(globalDateProvider.today);
    }

    formatDueDate(): string {
        return formatDateYYYYMMDD(this.dueDate);
    }

    delayedBeforeReviewDaysInt(): number {
        return Math.max(0, Math.floor(this.delayedBeforeReviewTicks / TICKS_PER_DAY));
    }

    abstract formatCardScheduleForHtmlComment(): string;
}
