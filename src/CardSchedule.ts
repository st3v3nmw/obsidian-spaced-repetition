import { Moment } from "moment";
import {
    LEGACY_SCHEDULING_EXTRACTOR,
    MULTI_SCHEDULING_EXTRACTOR,
    TICKS_PER_DAY,
} from "./constants";
import { INoteEaseList } from "./NoteEaseList";
import { osrSchedule } from "./algorithms/osr/NoteScheduling";
import { SRSettings } from "./settings";
import { formatDate_YYYY_MM_DD } from "./util/utils";
import { DateUtil, globalDateProvider } from "./util/DateProvider";
import { RepItemScheduleInfo } from "./algorithms/base/RepItemScheduleInfo";

/* export class CardScheduleInfo {

    constructor(dueDate: Moment, interval: number, ease: number, delayBeforeReviewTicks: number) {
        this.dueDate = dueDate;
        this.interval = interval;
        this.ease = ease;
        this.delayBeforeReviewTicks = delayBeforeReviewTicks;
    }

    get delayBeforeReviewDaysInt(): number {
        return Math.ceil(this.delayBeforeReviewTicks / TICKS_PER_DAY);
    }

    isDue(): boolean {
        return this.dueDate.isSameOrBefore(globalDateProvider.today);
    }

    isDummyScheduleForNewCard(): boolean {
        return this.formatDueDate() == CardScheduleInfo.dummyDueDateForNewCard;
    }

    static getDummyScheduleForNewCard(settings: SRSettings): CardScheduleInfo {
        return CardScheduleInfo.fromDueDateStr(
            CardScheduleInfo.dummyDueDateForNewCard,
            CardScheduleInfo.initialInterval,
            settings.baseEase,
            0,
        );
    }

    static fromDueDateStr(
        dueDateStr: string,
        interval: number,
        ease: number,
        delayBeforeReviewTicks: number,
    ) {
        const dueDateTicks: Moment = DateUtil.dateStrToMoment(dueDateStr);
        return new CardScheduleInfo(dueDateTicks, interval, ease, delayBeforeReviewTicks);
    }

    static fromDueDateMoment(
        dueDateTicks: Moment,
        interval: number,
        ease: number,
        delayBeforeReviewTicks: number,
    ) {
        return new CardScheduleInfo(dueDateTicks, interval, ease, delayBeforeReviewTicks);
    }

    static get initialInterval(): number {
        return 1.0;
    }

    formatDueDate(): string {
        return formatDate_YYYY_MM_DD(this.dueDate);
    }

    formatSchedule() {
        return `!${this.formatDueDate()},${this.interval},${this.ease}`;
    }
} */



/* export class NoteCardScheduleParser {
    static createCardScheduleInfoList(questionText: string): CardScheduleInfo[] {
        let scheduling: RegExpMatchArray[] = [...questionText.matchAll(MULTI_SCHEDULING_EXTRACTOR)];
        if (scheduling.length === 0)
            scheduling = [...questionText.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];

        const result: CardScheduleInfo[] = [];
        for (let i = 0; i < scheduling.length; i++) {
            const match: RegExpMatchArray = scheduling[i];
            const dueDateStr = match[1];
            const interval = parseInt(match[2]);
            const ease = parseInt(match[3]);
            const dueDate: Moment = DateUtil.dateStrToMoment(dueDateStr);
            const delayBeforeReviewTicks: number =
                dueDate.valueOf() - globalDateProvider.today.valueOf();

            const info: CardScheduleInfo = new CardScheduleInfo(
                dueDate,
                interval,
                ease,
                delayBeforeReviewTicks,
            );
            result.push(info);
        }
        return result;
    }

    static removeCardScheduleInfo(questionText: string): string {
        return questionText.replace(/<!--SR:.+-->/gm, "");
    }
} */
