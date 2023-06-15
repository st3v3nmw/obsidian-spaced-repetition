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

test("Test reviewing with default settings & 1 day interval", () => {
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

test("Test reviewing with default settings & 1 day delay", () => {
    const delay = MINUTES_PER_DAY; // two day delay
    const interval = 10;

    expect(
        schedule(ReviewResponse.Easy, interval, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, {})
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase + 20,
        interval: 1440,
    });

    expect(
        schedule(ReviewResponse.Good, interval, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, {})
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 10,
    });

    expect(
        schedule(ReviewResponse.Hard, interval, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, {})
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 5,
    });

    expect(
        schedule(ReviewResponse.Impossible, interval, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, {})
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 1,
    });
});

test("Test 'easy' load balancing at 5 days", () => {
    const interval = 5 * MINUTES_PER_DAY;
    const delay = 0;

    // Easy review
    const dueDates = {
        16: 1,
        18: 1,
        19: 1,
        20: 1
    };

    // 5 day review becomes 15 day review
    expect(
        schedule(ReviewResponse.Easy, interval, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, dueDates)
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase + 20,
        interval: 23832,
    });

    expect(dueDates).toEqual({
        16: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1
    });
});

test("Test 'good' load balancing at 5 days", () => {
    const interval = 5 * MINUTES_PER_DAY;
    const delay = 0;

    // Good review
    const dueDates = {
        9: 1,
        10: 2,
        11: 2,
        12: 2,
        14: 1,
        15: 2
    };

    // 5 day review becomes 13 day review
    expect(
        schedule(ReviewResponse.Good, interval, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, dueDates)
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 18000,
    });

    expect(dueDates).toEqual({
        9: 1,
        10: 2,
        11: 2,
        12: 2,
        13: 1,
        14: 1,
        15: 2
    });
});

test("Test 'hard' load balancing at 5 days", () => {
    const interval = 5 * MINUTES_PER_DAY;
    const delay = 0;

    // Hard review
    const dueDates = {
        1: 1,
        2: 1,
        3: 1,
        4: 1,
    };

    // 5 day review becomes same-day review
    expect(
        schedule(ReviewResponse.Hard, interval, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, dueDates)
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 3600,
    });

    expect(dueDates).toEqual({
        1: 1,
        2: 1,
        3: 2,
        4: 1,
    });
});

test("Test 'impossible' load balancing at 5 days", () => {
    const interval = 5 * MINUTES_PER_DAY;
    const delay = 0;

    // Good review
    const dueDates = {
        1: 1,
        2: 1,
        3: 2,
        4: 1,
    };

    // 5 day review becomes 10 day review
    expect(
        schedule(ReviewResponse.Impossible, interval, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, dueDates)
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 5,
    });

    expect(dueDates).toEqual({
        0: 1,
        1: 1,
        2: 1,
        3: 2,
        4: 1,
    });
});

test("Test 'easy' load balancing at 2 weeks", () => {
    const interval = 14 * MINUTES_PER_DAY;
    const delay = 0;

    const dueDates = {
        47: 1,
        48: 1,
        49: 2,
        50: 1,
        52: 1,
    };

    // 2 week review becomes same-day review
    expect(
        schedule(ReviewResponse.Easy, interval, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, dueDates)
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase + 20,
        interval: 73642,
    });

    expect(dueDates).toEqual({
        47: 1,
        48: 1,
        49: 2,
        50: 1,
        51: 1,
        52: 1,
    });
});

test("Test 'good' load balancing at 2 weeks", () => {
    const interval = 14 * MINUTES_PER_DAY;
    const delay = 0;

    const dueDates = {
        33: 1,
        34: 1,
        35: 1,
        36: 1,
        38: 1,
    };

    // 2 week review becomes same-day review
    expect(
        schedule(ReviewResponse.Good, interval, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, dueDates)
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 53280,
    });

    expect(dueDates).toEqual({
        33: 1,
        34: 1,
        35: 1,
        36: 1,
        37: 1,
        38: 1,
    });
});

test("Test 'hard' load balancing at 2 weeks", () => {
    const interval = 14 * MINUTES_PER_DAY;
    const delay = 0;

    const dueDates = {
        4: 1,
        5: 1,
        7: 1,
        8: 1,
        9: 1,
    };

    // 2 week review becomes 5-day 
    expect(
        schedule(ReviewResponse.Hard, interval, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, dueDates)
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 8640,
    });

    expect(dueDates).toEqual({
        4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
    });
});

test("Test 'impossible' load balancing at 2 weeks", () => {
    const interval = 14 * MINUTES_PER_DAY;
    const delay = 0;

    const dueDates = {
        1: 1,
        2: 1,
        3: 2,
        4: 1,
    };

    // 2 week review becomes same-day review
    expect(
        schedule(ReviewResponse.Impossible, interval, DEFAULT_SETTINGS.baseEase, delay, DEFAULT_SETTINGS, dueDates)
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase,
        interval: 5,
    });

    expect(dueDates).toEqual({
        0: 1,
        1: 1,
        2: 1,
        3: 2,
        4: 1,
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

test("Test new cards", () => {
    expect(textInterval(undefined, false)).toEqual("New");
});
