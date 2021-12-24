import { schedule, ReviewResponse } from "src/scheduling";
import { DEFAULT_SETTINGS } from "src/settings";

test("Test easy reviewing with defaults", () => {
    expect(
        schedule(ReviewResponse.Easy, 1.0, DEFAULT_SETTINGS.baseEase, 0, DEFAULT_SETTINGS, {})
    ).toEqual({
        ease: DEFAULT_SETTINGS.baseEase + 20,
        interval: 4,
    });
});
