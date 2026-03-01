import { DEBUG_MODE_ENABLED } from "src/constants";

const expectedValue = false;
test("Debug mode should be disabled", () => {
    expect(DEBUG_MODE_ENABLED).toEqual(expectedValue);
});
