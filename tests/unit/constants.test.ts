import { YAML_FRONT_MATTER_REGEX } from "src/constants";

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
