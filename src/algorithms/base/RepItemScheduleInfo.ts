import { Moment } from "moment";
import { globalDateProvider } from "src/util/DateProvider";
import { formatDate_YYYY_MM_DD } from "src/util/utils";

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
        return formatDate_YYYY_MM_DD(this.dueDate);
    }

    abstract formatCardScheduleForHtmlComment(): string;
}
