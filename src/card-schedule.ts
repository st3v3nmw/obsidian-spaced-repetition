import { LEGACY_SCHEDULING_EXTRACTOR, MULTI_SCHEDULING_EXTRACTOR } from "./constants";

export class CardScheduleInfo { 
    rawDate: string;
    interval: number;
    ease: number;

    constructor(rawDate: string, interval: number, ease: number) { 
        this.rawDate = rawDate;
        this.interval = interval;
        this.ease = ease;
    }

    dueUnix(): number { 
        return window 
            .moment(this.rawDate, ["YYYY-MM-DD", "DD-MM-YYYY"])
            .valueOf();
    }
}

export class NoteCardScheduleParser {

    static createCardScheduleInfoList(cardText: string): CardScheduleInfo[] {

        let scheduling: RegExpMatchArray[] = [...cardText.matchAll(MULTI_SCHEDULING_EXTRACTOR)];
        if (scheduling.length === 0)
            scheduling = [...cardText.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];
        
        let result: CardScheduleInfo[] = [];
        for (let i = 0; i < scheduling.length; i++) { 
            let match: RegExpMatchArray = scheduling[i];
            let rawDate = match[1];
            let interval = parseInt(match[2]);
            let ease = parseInt(match[3]);
            let info: CardScheduleInfo = new CardScheduleInfo(rawDate, interval, ease);
            result.push(info);
        }
        return result;
    }

}