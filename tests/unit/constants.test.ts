import {
    SCHEDULING_INFO_DUE_REGEX,
    SCHEDULING_INFO_EASE_REGEX,
    SCHEDULING_INFO_INTERVAL_REGEX,
    YAML_FRONT_MATTER_REGEX,
} from "src/constants";

describe("YAML_FRONT_MATTER_REGEX", () => {
    function createTestStr1(sep: string): string {
        return `---${sep}sr-due: 2024-08-10${sep}sr-interval: 273${sep}sr-ease: 309${sep}---`;
    }

    test("New line is line feed", async () => {
        const sep: string = String.fromCharCode(10);
        const text: string = createTestStr1(sep);
        expect(YAML_FRONT_MATTER_REGEX.test(text)).toEqual(true);
    });

    test("New line is carriage return line feed", async () => {
        const sep: string = String.fromCharCode(13, 10);
        const text: string = createTestStr1(sep);
        expect(YAML_FRONT_MATTER_REGEX.test(text)).toEqual(true);
    });
});

describe("SCHEDULING_INFO__REGEX", () => {
    const info = "---\nsr-due: 2024-08-10\nsr-interval: 273\nsr-ease: 309\n---";

    test("Extract due date", async () => {
        expect(SCHEDULING_INFO_DUE_REGEX.exec(info)[2]).toEqual("2024-08-10");
    });

    test("Extract ease", async () => {
        expect(SCHEDULING_INFO_EASE_REGEX.exec(info)[2]).toEqual("309");
    });

    test("Extract interval", async () => {
        expect(SCHEDULING_INFO_INTERVAL_REGEX.exec(info)[2]).toEqual("273");
    });
});
