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
        interval: 1,
    });
});

test("Test load balancing, small interval (load balancing disabled)", () => {
    const dueDates = {
        0: 1,
        1: 1,
        2: 1,
        3: 4,
    };
    expect(
        schedule(ReviewResponse.Good, 1, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, dueDates)
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 10,
    });
    expect(dueDates).toEqual({
        0: 2,
        1: 1,
        2: 1,
        3: 4,
    });
});

test("Test load balancing", () => {
    // interval < 7
    let dueDates: Record<number, number> = {
        5: 2,
    };
    expect(
        schedule(ReviewResponse.Good, 1, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, dueDates)
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 10,
    });
    expect(dueDates).toEqual({
        0: 1,
        5: 2,
    });

    // 7 <= interval < 30
    dueDates = {
        25: 2,
    };
    expect(
        schedule(ReviewResponse.Good, 10, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, dueDates)
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 10,
    });
    expect(dueDates).toEqual({
        0: 1,
        25: 2,
    });

    // interval >= 30
    dueDates = {
        2: 5,
        59: 8,
        60: 9,
        61: 3,
        62: 5,
        63: 4,
        64: 4,
        65: 8,
        66: 2,
        67: 10,
    };
    expect(
        schedule(ReviewResponse.Good, 25, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, dueDates)
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 10,
    });
    expect(dueDates).toEqual({
        0: 1,
        2: 5,
        59: 8,
        60: 9,
        61: 3,
        62: 5,
        63: 4,
        64: 4,
        65: 8,
        66: 2,
        67: 10,
    });
});

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