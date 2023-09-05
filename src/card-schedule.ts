import moment from "moment";
import { LEGACY_SCHEDULING_EXTRACTOR, MULTI_SCHEDULING_EXTRACTOR, PREFERRED_DATE_FORMAT } from "./constants";

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

    static fromDueDateStr(dueDateStr: string, interval: number, ease: number, delayBeforeReview: number) { 
        let dueDate: Date = moment(dueDateStr, [PREFERRED_DATE_FORMAT, "DD-MM-YYYY"]).toDate();
        return new CardScheduleInfo(dueDate, interval, ease, delayBeforeReview);
    }

    static fromDueDateTicks(dueDateTicks: number, interval: number, ease: number, delayBeforeReview: number) { 
        let dueDate: Date = new Date(dueDateTicks);
        return new CardScheduleInfo(dueDate, interval, ease, delayBeforeReview);
    }

    static get initialInterval(): number {
        return 1.0;
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
            let rawDate = match[1];
            let interval = parseInt(match[2]);
            let ease = parseInt(match[3]);
            let info: CardScheduleInfo = CardScheduleInfo.fromDueDateStr(rawDate, interval, ease);
            result.push(info);
        }
        return result;
    }

    static removeCardScheduleInfo(questionText: string): string {
        return questionText.replace(/<!--SR:.+-->/gm, "");
    }
}