import { DEBUG_MODE_ENABLED } from "src/data/constants";

const expectedValue = false;
test("Debug mode should be disabled", () => {
    expect(DEBUG_MODE_ENABLED).toEqual(expectedValue);
});
