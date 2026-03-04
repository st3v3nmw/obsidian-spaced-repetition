import moment from "moment";

import { formatDate, globalDateProvider, IDayBoundary } from "src/utils/dates";

describe("Format date", () => {
    test("Different input overloads", () => {
        expect(formatDate(new Date(2023, 0, 1))).toBe("2023-01-01");
        expect(formatDate(2023, 1, 1)).toBe("2023-01-01");
        expect(formatDate(1672531200000)).toBe("2023-01-01");
    });

    test("handles a leap year date", () => {
        expect(formatDate(2020, 2, 29)).toBe("2020-02-29");
    });
});

describe("LiveDateProvider", () => {
    test("now", () => {
        expect(globalDateProvider.now.year()).toBe(moment().year());
        expect(globalDateProvider.now.month()).toBe(moment().month());
        expect(globalDateProvider.now.week()).toBe(moment().week());
        expect(globalDateProvider.now.date()).toBe(moment().date());
    });

    test("today & dateBoundary", () => {
        expect(globalDateProvider.today.year()).toBe(moment().year());
        expect(globalDateProvider.today.month()).toBe(moment().month());
        expect(globalDateProvider.today.week()).toBe(moment().week());
        expect(globalDateProvider.today.date()).toBe(moment().date());
        expect(globalDateProvider.getDayBoundary()).toBe(null);

        let dayBoundary: IDayBoundary = { hour: 0, minute: 0, second: 0 };
        globalDateProvider.setDayBoundary(dayBoundary);
        expect(globalDateProvider.getDayBoundary()).toEqual(dayBoundary);

        expect(globalDateProvider.today.year()).toBe(moment().year());
        expect(globalDateProvider.today.month()).toBe(moment().month());
        expect(globalDateProvider.today.week()).toBe(moment().week());
        expect(globalDateProvider.today.date()).toBe(moment().date());

        dayBoundary = { hour: 23, minute: 0, second: 0 };
        globalDateProvider.setDayBoundary(dayBoundary);

        expect(globalDateProvider.getDayBoundary()).toEqual(dayBoundary);
        expect(globalDateProvider.today.year()).toBe(moment().year());
        expect(globalDateProvider.today.month()).toBe(moment().month());
        expect(globalDateProvider.today.week()).toBe(moment().week());
    });
});
