import { Moment } from "moment";
import {
    LEGACY_SCHEDULING_EXTRACTOR,
    MULTI_SCHEDULING_EXTRACTOR,
    TICKS_PER_DAY,
} from "./constants";
import { INoteEaseList } from "./NoteEaseList";
import { ReviewResponse, schedule } from "./scheduling";
import { SRSettings } from "./settings";
import { formatDate_YYYY_MM_DD } from "./util/utils";
import { DateUtil, globalDateProvider } from "./util/DateProvider";

export class CardScheduleInfo {
    dueDate: Moment;
    interval: number;
    ease: number;
    delayBeforeReviewTicks: number;

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

    static getDummySchedule(settings: SRSettings): CardScheduleInfo {
        return CardScheduleInfo.fromDueDateStr(
            "2000-01-01",
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
}

export interface ICardScheduleCalculator {
    getResetCardSchedule(): CardScheduleInfo;
    getNewCardSchedule(response: ReviewResponse, notePath: string): CardScheduleInfo;
    calcUpdatedSchedule(response: ReviewResponse, schedule: CardScheduleInfo): CardScheduleInfo;
}

export class CardScheduleCalculator {
    settings: SRSettings;
    noteEaseList: INoteEaseList;
    dueDatesFlashcards: Record<number, number> = {}; // Record<# of days in future, due count>

    constructor(settings: SRSettings, noteEaseList: INoteEaseList) {
        this.settings = settings;
        this.noteEaseList = noteEaseList;
    }

    getResetCardSchedule(): CardScheduleInfo {
        const interval = CardScheduleInfo.initialInterval;
        const ease = this.settings.baseEase;
        const dueDate = globalDateProvider.today.add(interval, "d");
        const delayBeforeReview = 0;
        return CardScheduleInfo.fromDueDateMoment(dueDate, interval, ease, delayBeforeReview);
    }

    getNewCardSchedule(response: ReviewResponse, notePath: string): CardScheduleInfo {
        const initial_ease: number = this.noteEaseList.getEaseByPath(notePath);
        const delayBeforeReview = 0;

        const schedObj: Record<string, number> = schedule(
            response,
            CardScheduleInfo.initialInterval,
            initial_ease,
            delayBeforeReview,
            this.settings,
            this.dueDatesFlashcards,
        );

        const interval = schedObj.interval;
        const ease = schedObj.ease;
        const dueDate = globalDateProvider.today.add(interval, "d");
        return CardScheduleInfo.fromDueDateMoment(dueDate, interval, ease, delayBeforeReview);
    }

    calcUpdatedSchedule(
        response: ReviewResponse,
        cardSchedule: CardScheduleInfo,
    ): CardScheduleInfo {
        const schedObj: Record<string, number> = schedule(
            response,
            cardSchedule.interval,
            cardSchedule.ease,
            cardSchedule.delayBeforeReviewTicks,
            this.settings,
            this.dueDatesFlashcards,
        );
        const interval = schedObj.interval;
        const ease = schedObj.ease;
        const dueDate = globalDateProvider.today.add(interval, "d");
        const delayBeforeReview = 0;
        return CardScheduleInfo.fromDueDateMoment(dueDate, interval, ease, delayBeforeReview);
    }
}

export class NoteCardScheduleParser {
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
}
