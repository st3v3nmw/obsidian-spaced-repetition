import { CardParser } from "src/utils/parsers/card-parser";

import { parserOptions } from "../../../helpers/unit-test-parser-helper";

describe("Parser debug messages", () => {
    test("Messages disabled", () => {
        // replace console error log with an empty mock function
        const logSpy = jest.spyOn(global.console, "log").mockImplementation(() => { });
        CardParser.setDebugParser(false);

        CardParser.parse("", "", parserOptions);
        expect(logSpy).toHaveBeenCalledTimes(0);

        // restore original console error log
        logSpy.mockRestore();
    });

    test("Messages enabled", () => {
        // replace console error log with an empty mock function
        const logSpy = jest.spyOn(global.console, "log").mockImplementation(() => { });
        CardParser.setDebugParser(true);

        CardParser.parse("", "", parserOptions);
        expect(logSpy).toHaveBeenCalled();

        // restore original console error log
        logSpy.mockRestore();
    });
});
