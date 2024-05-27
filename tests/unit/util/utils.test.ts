import moment from "moment";
import { YAML_FRONT_MATTER_REGEX } from "src/constants";
import {
    cyrb53,
    escapeRegexString,
    extractFrontmatter,
    findLineIndexOfSearchStringIgnoringWs,
    formatDate,
    formatDate_YYYY_MM_DD,
    getKeysPreserveType,
    getTypedObjectEntries,
    literalStringReplace,
    parseDateToTicks,
    parseObsidianFrontmatterTag,
    splitTextIntoLineArray,
    stringTrimStart,
    ticksFromDate,
} from "src/util/utils";

describe("getTypedObjectEntries", () => {
    test("should handle basic object", () => {
        expect(getTypedObjectEntries({ name: "Alice", age: 30, isStudent: false })).toEqual([
            ["name", "Alice"],
            ["age", 30],
            ["isStudent", false],
        ]);
    });

    test("should handle empty object", () => {
        expect(getTypedObjectEntries({})).toEqual([]);
    });

    test("should handle object with different value types", () => {
        expect(
            getTypedObjectEntries({ a: 1, b: "string", c: true, d: null, e: undefined }),
        ).toEqual([
            ["a", 1],
            ["b", "string"],
            ["c", true],
            ["d", null],
            ["e", undefined],
        ]);
    });

    test("should handle object with nested objects", () => {
        expect(getTypedObjectEntries({ obj: { nestedKey: "nestedValue" } })).toEqual([
            ["obj", { nestedKey: "nestedValue" }],
        ]);
    });

    test("should handle object with array values", () => {
        expect(getTypedObjectEntries({ arr: [1, 2, 3] })).toEqual([["arr", [1, 2, 3]]]);
    });

    test("should handle object with function values", () => {
        const output = getTypedObjectEntries({ func: () => "result" });
        expect(output.length).toBe(1);
        expect(output[0][0]).toBe("func");
        expect(typeof output[0][1]).toBe("function");
        expect(output[0][1]()).toBe("result");
    });
});

describe("getKeysPreserveType", () => {
    test("should return keys of a basic object", () => {
        expect(getKeysPreserveType({ name: "Alice", age: 30, isStudent: false })).toEqual([
            "name",
            "age",
            "isStudent",
        ]);
    });

    test("should return an empty array for an empty object", () => {
        expect(getKeysPreserveType({})).toEqual([]);
    });

    test("should return keys of an object with different value types", () => {
        expect(getKeysPreserveType({ a: 1, b: "string", c: true })).toEqual(["a", "b", "c"]);
    });

    test("should return keys of an object with a function value", () => {
        expect(getKeysPreserveType({ func: () => "result" })).toEqual(["func"]);
    });
});

describe("escapeRegexString", () => {
    test("should escape special regex characters", () => {
        const input = ".*+?^${}()|[]\\";
        const expected = "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\";
        expect(escapeRegexString(input)).toBe(expected);
    });

    test("should handle a string without special characters", () => {
        const input = "abc123";
        const expected = "abc123";
        expect(escapeRegexString(input)).toBe(expected);
    });

    test("should handle an empty string", () => {
        const input = "";
        const expected = "";
        expect(escapeRegexString(input)).toBe(expected);
    });

    test("should handle a mixed string with special and normal characters", () => {
        const input = "Hello.*+?^${}()|[]\\World";
        const expected = "Hello\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\World";
        expect(escapeRegexString(input)).toBe(expected);
    });
});

describe("literalStringReplace", () => {
    test("Replacement string doesn't have any dollar signs", async () => {
        const actual: string = literalStringReplace(
            "Original string without dollar signs",
            "dollar",
            "pound",
        );
        expect(actual).toEqual("Original string without pound signs");
    });

    test("Replacement string has double dollar signs", async () => {
        const actual: string = literalStringReplace(
            "Original string without dollar signs",
            "dollar",
            "$",
        );
        expect(actual).toEqual("Original string without $ signs");
    });

    test("Original and search strings has double dollar signs at the end", async () => {
        const originalStr: string = `Some stuff at the start

Something
?
$$\\huge F_g=\\frac {G m_1 m_2}{d^2}$$`;

        const searchStr: string = `Something
?
$$\\huge F_g=\\frac {G m_1 m_2}{d^2}$$`;

        const replacementStr: string = `Something
?
$$\\huge F_g=\\frac {G m_1 m_2}{d^2}$$
<!--SR:!2023-09-10,4,270-->`;

        const expectedStr: string = `Some stuff at the start

Something
?
$$\\huge F_g=\\frac {G m_1 m_2}{d^2}$$
<!--SR:!2023-09-10,4,270-->`;

        const actual: string = literalStringReplace(originalStr, searchStr, replacementStr);
        expect(actual).toEqual(expectedStr);
    });

    test("Original and search strings has double dollar signs at the end", async () => {
        const originalStr: string = `Some stuff at the start $$`;

        const searchStr: string = `start $$`;

        const replacementStr: string = `start $$ and end`;

        const expectedStr: string = `Some stuff at the start $$ and end`;

        const actual: string = literalStringReplace(originalStr, searchStr, replacementStr);
        expect(actual).toEqual(expectedStr);
    });

    test("Search string not found", async () => {
        const originalStr: string = "A very boring string";

        const searchStr: string = "missing";

        const replacementStr: string = "replacement";

        const expectedStr: string = originalStr;

        const actual: string = literalStringReplace(originalStr, searchStr, replacementStr);
        expect(actual).toEqual(expectedStr);
    });
});

describe("cyrb53", () => {
    test("should generate hash for a simple string without seed", () => {
        const input = "hello";
        const expectedHash = "106f3a63cd7226";
        expect(cyrb53(input)).toBe(expectedHash);
    });

    test("should generate hash for a simple string with seed", () => {
        const input = "hello";
        const seed = 123;
        const expectedHash = "6677dacb8051";
        expect(cyrb53(input, seed)).toBe(expectedHash);
    });

    test("should generate hash for an empty string without seed", () => {
        const input = "";
        const expectedHash = "bdcb81aee8d83";
        expect(cyrb53(input)).toBe(expectedHash);
    });

    test("should generate hash for an empty string with seed", () => {
        const input = "";
        const seed = 987;
        const expectedHash = "aba1aab9aab71";
        expect(cyrb53(input, seed)).toBe(expectedHash);
    });

    test("should generate hash for a string with special characters without seed", () => {
        const input = "!@#$%^&*()";
        const expectedHash = "d86f2f9eb5a3a";
        expect(cyrb53(input)).toBe(expectedHash);
    });

    test("should generate hash for a string with special characters with seed", () => {
        const input = "!@#$%^&*()";
        const seed = 555;
        const expectedHash = "1484280e499f6c";
        expect(cyrb53(input, seed)).toBe(expectedHash);
    });
});

describe("Parse date to ticks", () => {
    test("Test with normal year", () => {
        // January 1, 2023
        expect(parseDateToTicks(2023, 1, 1, true)).toBe(1672531200000);
    });
    test("Test with a leap year", () => {
        // February 29, 2020 (leap year)
        expect(parseDateToTicks(2020, 2, 29, true)).toBe(1582934400000);
    });
});

describe("Format date", () => {
    test("Different input overloads", () => {
        expect(formatDate(new Date(2023, 0, 1))).toBe("2023-01-01");
        expect(formatDate(2023, 1, 1)).toBe("2023-01-01");
        expect(formatDate(1672531200000)).toBe("2023-01-01");
    });

    test("handles a leap year date", () => {
        expect(formatDate(2020, 2, 29)).toBe("2020-02-29");
    });
});

describe("Split Text to array of lines", () => {
    const textCR = `Line 1\rLine 2\rLine 3\rLine 4\rLine 5`;
    const textLF = `Line 1\nLine 2\nLine 3\nLine 4\nLine 5`;
    const textCRLF = `Line 1\r\nLine 2\r\nLine 3\r\nLine 4\r\nLine 5`;
    const lines = ["Line 1", "Line 2", "Line 3", "Line 4", "Line 5"];

    test("Line Feed", () => {
        expect(splitTextIntoLineArray(textLF)).toStrictEqual(lines);
    });

    test("Carriage Return", () => {
        expect(splitTextIntoLineArray(textCR)).toStrictEqual(lines);
    });

    test("Carriage Return + Line Feed", () => {
        expect(splitTextIntoLineArray(textCRLF)).toStrictEqual(lines);
    });
});

describe("stringTrimStart", () => {
    test("Empty string", () => {
        expect(stringTrimStart("")).toEqual(["", ""]);
        expect(stringTrimStart(undefined)).toEqual(["", ""]);
    });
    test("No white spaces", () => {
        expect(stringTrimStart("any text here")).toEqual(["", "any text here"]);
    });
    test("Only white spaces", () => {
        expect(stringTrimStart(" ")).toEqual([" ", ""]);
        expect(stringTrimStart("   ")).toEqual(["   ", ""]);
    });
    test("Leading white spaces", () => {
        expect(stringTrimStart(" any text here")).toEqual([" ", "any text here"]);
        expect(stringTrimStart("  any text here")).toEqual(["  ", "any text here"]);
    });
    test("Trailing white spaces", () => {
        expect(stringTrimStart("any text here ")).toEqual(["", "any text here "]);
        expect(stringTrimStart("any text here  ")).toEqual(["", "any text here  "]);
    });
    test("Leading tabs", () => {
        expect(stringTrimStart("\tany text here")).toEqual(["\t", "any text here"]);
        expect(stringTrimStart("\t\tany text here")).toEqual(["\t\t", "any text here"]);
    });
    test("Trailing tabs", () => {
        expect(stringTrimStart("any text here\t")).toEqual(["", "any text here\t"]);
        expect(stringTrimStart("any text here\t\t")).toEqual(["", "any text here\t\t"]);
    });
    test("Mixed leading whitespace (spaces and tabs)", () => {
        expect(stringTrimStart(" \tany text here")).toEqual([" \t", "any text here"]);
        expect(stringTrimStart("\t any text here")).toEqual(["\t ", "any text here"]);
        expect(stringTrimStart(" \t any text here")).toEqual([" \t ", "any text here"]);
    });
    test("Mixed trailing whitespace (spaces and tabs)", () => {
        expect(stringTrimStart("any text here \t")).toEqual(["", "any text here \t"]);
        expect(stringTrimStart("any text here\t ")).toEqual(["", "any text here\t "]);
        expect(stringTrimStart("any text here \t ")).toEqual(["", "any text here \t "]);
    });
    test("Newlines and leading spaces", () => {
        expect(stringTrimStart("\nany text here")).toEqual(["\n", "any text here"]);
        expect(stringTrimStart("\n any text here")).toEqual(["\n ", "any text here"]);
        expect(stringTrimStart(" \nany text here")).toEqual([" \n", "any text here"]);
        expect(stringTrimStart(" \n any text here")).toEqual([" \n ", "any text here"]);
    });
});

describe("extractFrontmatter", () => {
    test("No frontmatter", () => {
        let text: string = `Hello
Goodbye`;
        let frontmatter: string;
        let content: string;
        [frontmatter, content] = extractFrontmatter(text);
        expect(frontmatter).toEqual("");
        expect(content).toEqual(text);

        text = `---
Goodbye`;
        [frontmatter, content] = extractFrontmatter(text);
        expect(frontmatter).toEqual("");
        expect(content).toEqual(text);
    });

    test("With frontmatter (and nothing else)", () => {
        let frontmatter: string = `---
sr-due: 2024-01-17
sr-interval: 16
sr-ease: 278
tags:
  - flashcards/aws
  - flashcards/datascience
---`;
        const text: string = frontmatter;
        let content: string;
        [frontmatter, content] = extractFrontmatter(text);
        expect(frontmatter).toEqual(text);
        const frontmatterBlankedOut: string = `






`;
        expect(content).toEqual(frontmatterBlankedOut);
    });

    test("With frontmatter (and content)", () => {
        let frontmatter: string = `---
sr-due: 2024-01-17
sr-interval: 16
sr-ease: 278
tags:
  - flashcards/aws
  - flashcards/datascience
---`;
        const content: string = `#flashcards/science/chemistry

# Questions

Chemistry Question from file underelephant 4A::goodby
<!--SR:!2023-11-02,17,290-->
Chemistry Question from file underdog 4B::goodby
<!--SR:!2023-12-18,57,310-->
Chemistry Question from file underdog 4C::goodby
<!--SR:!2023-10-25,3,210-->
This single {{question}} turns into {{3 separate}} {{cards}}
<!--SR:!2023-10-20,1,241!2023-10-25,3,254!2023-10-23,1,221-->

`;
        const text: string = `${frontmatter}
${content}`;

        const [f, c] = extractFrontmatter(text);
        expect(f).toEqual(frontmatter);
        const frontmatterBlankedOut: string = `






`;
        const expectedContent: string = `${frontmatterBlankedOut}
${content}`;
        expect(c).toEqual(expectedContent);
    });
});

describe("findLineIndexOfSearchStringIgnoringWs", () => {
    const space: string = " ";
    test("Search string not present", () => {
        const lines: string[] = [
            "A very boring multi-line question.",
            "(With this extra info, not so boring after all)",
            "?",
            "A very boring multi-line answer.",
            "(With this extra info, not so boring after all)",
        ];
        expect(findLineIndexOfSearchStringIgnoringWs(lines, "??")).toEqual(-1);
    });

    test("Search string present, but only on a line with other text", () => {
        const lines: string[] = [
            "What do you think of this multi-line question?",
            "??",
            "A very boring multi-line answer.",
            "(With this extra info, not so boring after all)",
        ];
        expect(findLineIndexOfSearchStringIgnoringWs(lines, "?")).toEqual(-1);
    });

    test("Search string found at start of text (exactly)", () => {
        const lines: string[] = [
            "?",
            "A very boring multi-line answer.",
            "(With this extra info, not so boring after all)",
        ];
        expect(findLineIndexOfSearchStringIgnoringWs(lines, "?")).toEqual(0);
    });

    test("Search line found at start of text (text has whitespace)", () => {
        const lines: string[] = [
            `${space}?${space}`,
            "A very boring multi-line answer.",
            "(With this extra info, not so boring after all)",
        ];
        expect(findLineIndexOfSearchStringIgnoringWs(lines, "?")).toEqual(0);
    });

    test("Search line found in middle line of text (exactly)", () => {
        const lines: string[] = [
            "What do you think of this multi-line question?",
            "(With this extra info, not so boring after all)",
            "??",
            "A very boring multi-line answer.",
            "(With this extra info, not so boring after all)",
        ];
        expect(findLineIndexOfSearchStringIgnoringWs(lines, "??")).toEqual(2);
    });

    test("Search line found in middle line of text (text has whitespace)", () => {
        const lines: string[] = [
            "What do you think of this multi-line question?",
            "(With this extra info, not so boring after all)",
            `${space}??`,
            "A very boring multi-line answer.",
            "(With this extra info, not so boring after all)",
        ];

        expect(findLineIndexOfSearchStringIgnoringWs(lines, "??")).toEqual(2);
    });
});

describe("Parse Obsidian Frontmatter Tag", () => {
    test("No tag", () => {
        expect(parseObsidianFrontmatterTag("")).toEqual([]);
        expect(parseObsidianFrontmatterTag(undefined)).toEqual([]);
    });
    test("Singel tag without #", () => {
        expect(parseObsidianFrontmatterTag("flashcards")).toEqual(["#flashcards"]);
        expect(parseObsidianFrontmatterTag("flashcards/philosophy/philosophers")).toEqual([
            "#flashcards/philosophy/philosophers",
        ]);
    });
    test("Singel tag with #", () => {
        expect(parseObsidianFrontmatterTag("#flashcards")).toEqual(["#flashcards"]);
        expect(parseObsidianFrontmatterTag("#flashcards/philosophy/philosophers")).toEqual([
            "#flashcards/philosophy/philosophers",
        ]);
    });
    test("Multiple tags without #", () => {
        expect(parseObsidianFrontmatterTag("flashcardsX,flashcardsX")).toEqual([
            "#flashcardsX",
            "#flashcardsX",
        ]);
        expect(parseObsidianFrontmatterTag("flashcardsX,flashcardsX/toes")).toEqual([
            "#flashcardsX",
            "#flashcardsX/toes",
        ]);
        expect(
            parseObsidianFrontmatterTag("flashcardsX/philosophy/philosophers,flashcardsX/toes"),
        ).toEqual(["#flashcardsX/philosophy/philosophers", "#flashcardsX/toes"]);
    });
    test("Multiple tags with #", () => {
        expect(parseObsidianFrontmatterTag("#flashcardsX,#flashcardsX")).toEqual([
            "#flashcardsX",
            "#flashcardsX",
        ]);
        expect(parseObsidianFrontmatterTag("#flashcardsX,#flashcardsX/toes")).toEqual([
            "#flashcardsX",
            "#flashcardsX/toes",
        ]);
        expect(
            parseObsidianFrontmatterTag("#flashcardsX/philosophy/philosophers,#flashcardsX/toes"),
        ).toEqual(["#flashcardsX/philosophy/philosophers", "#flashcardsX/toes"]);
    });
    test("Multiple tags with and without #", () => {
        expect(parseObsidianFrontmatterTag("#flashcardsX,flashcardsX")).toEqual([
            "#flashcardsX",
            "#flashcardsX",
        ]);
        expect(parseObsidianFrontmatterTag("#flashcardsX,flashcardsX/toes")).toEqual([
            "#flashcardsX",
            "#flashcardsX/toes",
        ]);
        expect(
            parseObsidianFrontmatterTag("#flashcardsX/philosophy/philosophers,flashcardsX/toes"),
        ).toEqual(["#flashcardsX/philosophy/philosophers", "#flashcardsX/toes"]);
    });
});

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
