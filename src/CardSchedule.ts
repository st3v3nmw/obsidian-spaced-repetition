import moment from "moment";
import { LEGACY_SCHEDULING_EXTRACTOR, MULTI_SCHEDULING_EXTRACTOR, PREFERRED_DATE_FORMAT, TICKS_PER_DAY } from "./constants";
import { INoteEaseList } from "./NoteEaseList";
import { ReviewResponse, schedule } from "./scheduling";
import { SRSettings } from "./settings";
import { formatDate_YYYY_MM_DD } from "./util/utils";
import { globalDateProvider } from "./util/DateProvider";

export class CardScheduleInfo { 
    dueDate: Date;
    interval: number;
    ease: number;
    delayBeforeReview: number;

    constructor(dueDate: Date, interval: number, ease: number, delayBeforeReview: number) { 
        this.dueDate = dueDate;
        this.interval = interval;
        this.ease = ease;
        this.delayBeforeReview = delayBeforeReview;
    }

    isDue(): boolean {
        return (this.dueDate.valueOf() < globalDateProvider.today.valueOf());
    }

    // static get emptySchedule(): CardScheduleInfo

    static parseDueDateStr(dueDateStr: string): Date {
        return moment(dueDateStr, [PREFERRED_DATE_FORMAT, "DD-MM-YYYY"]).toDate();
    }

    static fromDueDateStr(dueDateStr: string, interval: number, ease: number, delayBeforeReview: number) { 
        let dueDate: Date = this.parseDueDateStr(dueDateStr);
        return new CardScheduleInfo(dueDate, interval, ease, delayBeforeReview);
    }

    static fromDueDateTicks(dueDateTicks: number, interval: number, ease: number, delayBeforeReview: number) { 
        let dueDate: Date = new Date(dueDateTicks);
        return new CardScheduleInfo(dueDate, interval, ease, delayBeforeReview);
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

    getResetCardSchedule(): CardScheduleInfo {
        let interval = CardScheduleInfo.initialInterval;
        let ease = this.settings.baseEase;
        let dueDateTicks = Date.now() + interval * TICKS_PER_DAY;
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
        let dueDateTicks = Date.now() + interval * TICKS_PER_DAY;
        return CardScheduleInfo.fromDueDateTicks(dueDateTicks, interval, ease, delayBeforeReview);
    }

    calcUpdatedSchedule(response: ReviewResponse, cardSchedule: CardScheduleInfo): CardScheduleInfo {

        let schedObj: Record<string, number> = schedule(
                response,
                cardSchedule.interval,
                cardSchedule.ease,
                cardSchedule.delayBeforeReview,
                this.settings,
                this.dueDatesFlashcards,
            );
        let interval = schedObj.interval;
        let ease = schedObj.ease;
        let dueDateTicks = Date.now() + interval * TICKS_PER_DAY;
        let delayBeforeReview: number = 0;
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
            let dueDate: Date = CardScheduleInfo.parseDueDateStr(dueDateStr);
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