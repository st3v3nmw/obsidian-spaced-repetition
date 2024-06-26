import { Moment } from "moment";
import { RepItemScheduleInfo } from "../base/RepItemScheduleInfo";
import { SRSettings } from "src/settings";
import { DateUtil, globalDateProvider } from "src/util/DateProvider";

export class RepItemScheduleInfo_Osr extends RepItemScheduleInfo {
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
        super();
        this.dueDate = dueDate;
        this.interval = Math.round(interval);
        this.latestEase = latestEase;
        this.delayedBeforeReviewTicks = delayedBeforeReviewTicks;
        if (dueDate && delayedBeforeReviewTicks == null) {
            this.delayedBeforeReviewTicks = globalDateProvider.today.valueOf() - dueDate.valueOf();
        }
    }

    formatCardScheduleForHtmlComment(): string {
        // We always want the correct schedule format, so we use the dummy due date if there is no schedule for a card
        const dateStr: string = this.dueDate
            ? this.formatDueDate()
            : RepItemScheduleInfo_Osr.dummyDueDateForNewCard;
        return `!${dateStr},${this.interval},${this.latestEase}`;
    }

    static get initialInterval(): number {
        return 1.0;
    }

    static getDummyScheduleForNewCard(settings: SRSettings): RepItemScheduleInfo_Osr {
        return RepItemScheduleInfo_Osr.fromDueDateStr(
            RepItemScheduleInfo_Osr.dummyDueDateForNewCard,
            RepItemScheduleInfo_Osr.initialInterval,
            settings.baseEase,
        );
    }

    static fromDueDateStr(
        dueDateStr: string,
        interval: number,
        ease: number,
        delayedBeforeReviewTicks: number | null = null,
    ) {
        const dueDate: Moment = DateUtil.dateStrToMoment(dueDateStr);
        return new RepItemScheduleInfo_Osr(dueDate, interval, ease, delayedBeforeReviewTicks);
    }
}
