import moment from "moment";
import { Moment } from "moment";
import { ALLOWED_DATE_FORMATS } from "src/constants";

export interface IDateProvider {
    get today(): Moment;
}

export class LiveDateProvider implements IDateProvider {
    get today(): Moment {
        return moment().startOf("day");
    }
}

export class StaticDateProvider implements IDateProvider {
    private moment: Moment;

    constructor(moment: Moment) {
        this.moment = moment;
    }

    get today(): Moment {
        return this.moment.clone();
    }

    static fromDateStr(str: string): StaticDateProvider {
        return new StaticDateProvider(DateUtil.dateStrToMoment(str));
    }
}

export class DateUtil {
    static dateStrToMoment(str: string): Moment {
        return moment(str, ALLOWED_DATE_FORMATS);
    }
}

export let globalDateProvider: IDateProvider = new LiveDateProvider();

export function setupStaticDateProvider_20230906() {
    globalDateProvider = StaticDateProvider.fromDateStr("2023-09-06");
}
