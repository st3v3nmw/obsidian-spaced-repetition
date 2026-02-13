import { DISABLE_ERROR_HIDING_WORKAROUND } from "src/constants";

// This is a test to ensure that the error hiding workaround is enabled, so that we can catch the first inevitable error that occurs when loading the review sequencer data, but then letting all subsequent errors through.

const expectedValue = false;
test("Error hiding workaround is enabled", () => {
    expect(DISABLE_ERROR_HIDING_WORKAROUND).toEqual(expectedValue);
});
