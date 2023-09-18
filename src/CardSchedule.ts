import moment, { Duration, Moment } from "moment";
import { ALLOWED_DATE_FORMATS, LEGACY_SCHEDULING_EXTRACTOR, MULTI_SCHEDULING_EXTRACTOR, PREFERRED_DATE_FORMAT, TICKS_PER_DAY } from "./constants";
import { INoteEaseList } from "./NoteEaseList";
import { ReviewResponse, schedule } from "./scheduling";
import { SRSettings } from "./settings";
import { formatDate_YYYY_MM_DD } from "./util/utils";
import { DateUtil, globalDateProvider } from "./util/DateProvider";

export class CardScheduleInfo { 
    dueDateTicks: Moment;
    interval: number;
    ease: number;
    delayBeforeReviewTicks: number;

    constructor(dueDateTicks: Moment, interval: number, ease: number, delayBeforeReview: number) { 
        this.dueDateTicks = dueDateTicks;
        this.interval = interval;
        this.ease = ease;
        this.delayBeforeReviewTicks = delayBeforeReview;
    }

    get delayBeforeReviewDays(): number {
        return this.delayBeforeReviewTicks / TICKS_PER_DAY;
    }

    isDue(): boolean {
        return this.dueDateTicks.isSameOrBefore(globalDateProvider.today);
    }

    static fromDueDateStr(dueDateStr: string, interval: number, ease: number, delayBeforeReview: number) { 
        let dueDateTicks: Moment = DateUtil.dateStrToMoment(dueDateStr);
        return new CardScheduleInfo(dueDateTicks, interval, ease, delayBeforeReview);
    }

    static fromDueDateTicks(dueDateTicks: Moment, interval: number, ease: number, delayBeforeReview: number) { 
        return new CardScheduleInfo(dueDateTicks, interval, ease, delayBeforeReview);
    }

    static get initialInterval(): number {
        return 1.0;
    }

    formatDueDate(): string {
        return formatDate_YYYY_MM_DD(this.dueDateTicks);
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
        let interval = CardScheduleInfo.initialInterval;
        let ease = this.settings.baseEase;
        let dueDateTicks = globalDateProvider.today.add(interval, "d");
        let delayBeforeReview = 0;
        return CardScheduleInfo.fromDueDateTicks(dueDateTicks, interval, ease, delayBeforeReview);
    }

    getNewCardSchedule(response: ReviewResponse, notePath: string): CardScheduleInfo {
        let initial_ease: number = this.noteEaseList.getEaseByPath(notePath);
        let delayBeforeReview = 0;

        let schedObj: Record<string, number> = schedule(
            response,
            CardScheduleInfo.initialInterval,
            initial_ease,
            delayBeforeReview, 
            this.settings,
            this.dueDatesFlashcards,
        );

        let interval = schedObj.interval;
        let ease = schedObj.ease;
        let dueDateTicks = globalDateProvider.today.add(interval, "d");
        return CardScheduleInfo.fromDueDateTicks(dueDateTicks, interval, ease, delayBeforeReview);
    }

    calcUpdatedSchedule(response: ReviewResponse, cardSchedule: CardScheduleInfo): CardScheduleInfo {

        let schedObj: Record<string, number> = schedule(
                response,
                cardSchedule.interval,
                cardSchedule.ease,
                cardSchedule.delayBeforeReviewTicks,
                this.settings,
                this.dueDatesFlashcards,
            );
        let interval = schedObj.interval;
        let ease = schedObj.ease;
        let dueDateTicks = globalDateProvider.today.add(interval, "d");
        let delayBeforeReview: 0;
        return CardScheduleInfo.fromDueDateTicks(dueDateTicks, interval, ease, delayBeforeReview);
    }
}

export class NoteCardScheduleParser {

    static createCardScheduleInfoList(questionText: string): CardScheduleInfo[] {

        let scheduling: RegExpMatchArray[] = [...questionText.matchAll(MULTI_SCHEDULING_EXTRACTOR)];
        if (scheduling.length === 0)
            scheduling = [...questionText.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];
        
        let result: CardScheduleInfo[] = [];
        for (let i = 0; i < scheduling.length; i++) { 
            let match: RegExpMatchArray = scheduling[i];
            let dueDateStr = match[1];
            let interval = parseInt(match[2]);
            let ease = parseInt(match[3]);
            let dueDate: Moment = DateUtil.dateStrToMoment(dueDateStr);
            let delayBeforeReview: number = globalDateProvider.today.valueOf() - dueDate.valueOf();

            let info: CardScheduleInfo = new CardScheduleInfo(dueDate, interval, ease, delayBeforeReview);
            result.push(info);
        }
        return result;
    }

    static removeCardScheduleInfo(questionText: string): string {
        return questionText.replace(/<!--SR:.+-->/gm, "");
    }
}