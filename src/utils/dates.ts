import moment, { Moment } from "moment";

import { ALLOWED_DATE_FORMATS, PREFERRED_DATE_FORMAT } from "src/constants";

/**
 * Format as "YYYY-MM-DD"
 * https://bobbyhadz.com/blog/typescript-date-format
 *
 * @param ticks
 * @returns
 * @deprecated use formatDate() instead
 */
export function formatDateYYYYMMDD(ticks: Moment): string {
    return ticks.format(PREFERRED_DATE_FORMAT);
}

/**
 * Converts the ticks to a date formatted string.
 * Allowed format
 * YYYY = Year
 * MM = Month
 * DD = Day
 *
 * @param year The Year
 * @param month The month 1-12
 * @param day The Day 1-31
 * @param format Format string
 * @returns The date as string
 */
export function formatDate(year: number, month: number, day: number, format?: string): string;

/**
 * Converts the ticks to a date formatted string.
 * Allowed format
 * YYYY = Year
 * MM = Month
 * DD = Day
 *
 * @param date A date object
 * @param format Format string
 * @returns The date as string
 */
export function formatDate(date: Date, format?: string): string;

/**
 * Converts the ticks to a date formatted string.
 * Allowed format
 * YYYY = Year
 * MM = Month
 * DD = Day
 *
 * @param ticks The ticks in milliseconds
 * @param format Format string
 * @returns The date as string
 */
export function formatDate(ticks: number, format?: string): string;

export function formatDate(
    arg1: unknown,
    arg2?: unknown,
    arg3?: unknown,
    format: string = PREFERRED_DATE_FORMAT,
): string {
    let _date: Date;
    if (typeof arg1 === "number" && typeof arg2 === "number" && typeof arg3 === "number") {
        _date = new Date(arg1, arg2 - 1, arg3);
    } else if (typeof arg1 === "number") {
        _date = new Date(arg1);
    } else if (typeof arg1 === typeof new Date()) {
        _date = arg1 as Date;
    }

    let result: string = format;

    result = result.replaceAll(/YYYY/g, _date.getFullYear().toString().padStart(4, "0"));
    result = result.replaceAll(/MM/g, (_date.getMonth() + 1).toString().padStart(2, "0"));
    result = result.replaceAll(/DD/g, _date.getDate().toString().padStart(2, "0"));

    return result;
}

export interface IDateProvider {
    get now(): Moment;
    get today(): Moment;
}

export class LiveDateProvider implements IDateProvider {
    get now(): Moment {
        return moment();
    }

    get today(): Moment {
        return moment().startOf("day");
    }
}

export class StaticDateProvider implements IDateProvider {
    private moment: Moment;

    constructor(moment: Moment) {
        this.moment = moment;
    }

    get now(): Moment {
        return this.moment.clone();
    }

    get today(): Moment {
        return this.moment.clone().startOf("day");
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

const originDate: string = "2023-09-06";

export function setupStaticDateProvider(dateStr: string) {
    globalDateProvider = StaticDateProvider.fromDateStr(dateStr);
}

function getOriginDateAsMoment(): Moment {
    return DateUtil.dateStrToMoment(originDate);
}

export function setupStaticDateProviderOriginDatePlusDays(days: number) {
    const simulatedDate: Moment = getOriginDateAsMoment().add(days, "d");
    globalDateProvider = new StaticDateProvider(simulatedDate);
}

export function setupStaticDateProvider20230906() {
    setupStaticDateProvider(originDate);
}
