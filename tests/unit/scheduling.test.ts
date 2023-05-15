import { MINUTES_PER_DAY } from "src/constants";
import { schedule, ReviewResponse, textInterval } from "src/scheduling";
import { DEFAULT_SETTINGS } from "src/settings";

// TODO: Test with more than 1 day in interval
test("Test reviewing with default settings", () => {
    expect(
        schedule(ReviewResponse.Easy, 1, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, {})
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase + 20,
        interval: 1440,
    });

    expect(
        schedule(ReviewResponse.Good, 1, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, {})
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 10,
    });

    expect(
        schedule(ReviewResponse.Hard, 1, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, {})
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 5,
    });

    expect(
        schedule(ReviewResponse.Impossible, 1, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, {})
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 1,
    });
});

test("Test reviewing with default settings & delay", () => {
    const delay = 2 * 24 * 3600 * 1000; // two day delay
    expect(
        schedule(ReviewResponse.Easy, 10, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, {})
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase + 20,
        interval: 1440,
    });

    expect(
        schedule(ReviewResponse.Good, 10, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, {})
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 10,
    });

    expect(
        schedule(ReviewResponse.Hard, 10, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, {})
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 5,
    });

    expect(
        schedule(ReviewResponse.Impossible, 10, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, {})
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 1,
    });
});

test("Test load balancing at 1 day", () => {
    const interval = MINUTES_PER_DAY;
    
    // Easy review
    // 1 day review becomes 4 day review
    expect(schedule(ReviewResponse.Easy, interval, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, {})).toEqual({
        ease: DEFAULT_SETTINGS.baseEase + 20,
        interval: 5054,
    });
    
    // Good review
    // 1 day review becomes 3 day review
    expect(schedule(ReviewResponse.Good, interval, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, {})).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 3600
    });

    // Hard review
    // 1 day review becomes 1 day review
    expect(schedule(ReviewResponse.Hard, interval, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, {})).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 1440,
    });

    // Impossible review
    // 1 day review becomes 5m review
    expect(schedule(ReviewResponse.Impossible, interval, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, {})).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 5
    });
});

// test("Test load balancing at 2 weeks", () => {
//     const interval = 14 * MINUTES_PER_DAY;
//     // Easy review
//     let dueDates = {
//         2: 5,
//         59: 8,
//     };

//     // 1 day review becomes 4 day review
//     let schedObj = schedule(ReviewResponse.Easy, interval, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, dueDates);
//     expect(schedObj["ease"]).toEqual(DEFAULT_SETTINGS.baseEase + 20);
//     expect(schedObj["interval"]).toEqual(70762);
//     expect(dueDates).toEqual({
//         2: 5,
//         59: 8,
//     });

//     // Good review
//     dueDates = {
//         2: 5,
//         59: 8,
//     };

//     // 1 day review becomes 3 day review
//     schedObj = schedule(ReviewResponse.Good, interval, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, dueDates);
//     expect(schedObj["ease"]).toEqual(DEFAULT_SETTINGS.baseEase);
//     expect(schedObj["interval"]).toEqual(3600);
//     expect(dueDates).toEqual({
//         2: 5,
//         3: 1,
//         59: 8,
//     });
    
//     // Hard review
//     dueDates = {
//         2: 5,
//         59: 8,
//     };

//     // 1 day review becomes 10m review
//     schedObj = schedule(ReviewResponse.Hard, interval, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, dueDates);
//     expect(schedObj["ease"]).toEqual(DEFAULT_SETTINGS.baseEase);
//     expect(schedObj["interval"]).toEqual(10);
//     expect(dueDates).toEqual({
//         0: 1,
//         2: 5,
//         59: 8,
//     });

//     // Impossible review
//     dueDates = {
//         2: 5,
//         59: 8,
//     };

//     // 1 day review becomes 10m review
//     schedObj = schedule(ReviewResponse.Impossible, interval, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, dueDates);
//     expect(schedObj["ease"]).toEqual(DEFAULT_SETTINGS.baseEase);
//     expect(schedObj["interval"]).toEqual(5);
//     expect(dueDates).toEqual({
//         0: 1,
//         2: 5,
//         59: 8,
//     });
// });

test("Test textInterval - desktop", () => {
    expect(textInterval(1, false)).toEqual("1 minute(s)");
    expect(textInterval(1 * MINUTES_PER_DAY, false)).toEqual("1 day(s)");
    expect(textInterval(41 * MINUTES_PER_DAY, false)).toEqual("1.3 month(s)");
    expect(textInterval(366 * MINUTES_PER_DAY, false)).toEqual("1 year(s)");
    expect(textInterval(1000 * MINUTES_PER_DAY, false)).toEqual("2.7 year(s)");
});

test("Test textInterval - mobile", () => {
    expect(textInterval(1, true)).toEqual("1m");
    expect(textInterval(1 * MINUTES_PER_DAY, true)).toEqual("1d");
    expect(textInterval(41 * MINUTES_PER_DAY, true)).toEqual("1.3mo");
    expect(textInterval(366 * MINUTES_PER_DAY, true)).toEqual("1y");
    expect(textInterval(1000 * MINUTES_PER_DAY, true)).toEqual("2.7y");
});

test("Test new cards", () => {
    expect(textInterval(undefined, false)).toEqual("New");
});
