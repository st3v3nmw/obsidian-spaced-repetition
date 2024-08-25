import { YAML_FRONT_MATTER_REGEX } from "src/constants";
import {
    convertToStringOrEmpty,
    cyrb53,
    escapeRegexString,
    findLineIndexOfSearchStringIgnoringWs,
    formatDate,
    getKeysPreserveType,
    getTypedObjectEntries,
    isEqualOrSubPath,
    literalStringReplace,
    splitNoteIntoFrontmatterAndContent,
    splitTextIntoLineArray,
    stringTrimStart,
    ticksFromDate,
} from "src/utils/utils";

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
            getTypedObjectEntries({
                a: 1,
                b: "string",
                c: true,
                d: null,
                e: undefined,
            }),
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
        const originalStr: string = "Some stuff at the start $$";

        const searchStr: string = "start $$";

        const replacementStr: string = "start $$ and end";

        const expectedStr: string = "Some stuff at the start $$ and end";

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

describe("convertToStringOrEmpty", () => {
    test("undefined returns empty string", () => {
        expect(convertToStringOrEmpty(undefined)).toEqual("");
    });

    test("null returns empty string", () => {
        expect(convertToStringOrEmpty(null)).toEqual("");
    });

    test("empty string returns empty string", () => {
        expect(convertToStringOrEmpty("")).toEqual("");
    });

    test("string returned unchanged", () => {
        expect(convertToStringOrEmpty("Hello")).toEqual("Hello");
    });

    test("number is converted to string", () => {
        expect(convertToStringOrEmpty(5)).toEqual("5");
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

describe("Ticks from date", () => {
    test("2024 05 26", () => {
        const year = 2024;
        const month = 5;
        const day = 26;
        const ticks = 1719360000000;

        expect(ticksFromDate(year, month, day)).toBe(ticks);
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
    const textCR = "Line 1\rLine 2\rLine 3\rLine 4\rLine 5";
    const textLF = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
    const textCRLF = "Line 1\r\nLine 2\r\nLine 3\r\nLine 4\r\nLine 5";
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

describe("splitNoteIntoFrontmatterAndContent", () => {
    test("No frontmatter", () => {
        let text: string = `Hello
Goodbye`;
        let frontmatter: string;
        let content: string;
        [frontmatter, content] = splitNoteIntoFrontmatterAndContent(text);
        expect(frontmatter).toEqual("");
        expect(content).toEqual(text);

        text = `---
Goodbye`;
        [frontmatter, content] = splitNoteIntoFrontmatterAndContent(text);
        expect(frontmatter).toEqual("");
        expect(content).toEqual(text);
    });

    test("With frontmatter (and nothing else)", () => {
        const expected: string = `---
sr-due: 2024-01-17
sr-interval: 16
sr-ease: 278
tags:
  - flashcards/aws
  - flashcards/datascience
---`;
        const [frontmatter, content] = splitNoteIntoFrontmatterAndContent(expected);
        expect(frontmatter).toEqual(expected);
        const frontmatterBlankedOut: string = `






`;
        expect(content).toEqual(frontmatterBlankedOut);
    });

    test("With frontmatter (and content)", () => {
        const frontmatter: string = `---
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

        const [f, c] = splitNoteIntoFrontmatterAndContent(text);
        expect(f).toEqual(frontmatter);
        const frontmatterBlankedOut: string = `






`;
        const expectedContent: string = `${frontmatterBlankedOut}
${content}`;
        expect(c).toEqual(expectedContent);
    });

    test("With frontmatter and content (Horizontal line)", () => {
        const frontmatter: string = `---
sr-due: 2024-01-17
sr-interval: 16
sr-ease: 278
tags:
  - flashcards/aws
  - flashcards/datascience
---`;
        const frontmatterBlankedOut: string = `






`;
        const content: string = `#flashcards/science/chemistry


---
# Questions
---


Chemistry Question from file underelephant 4A::goodby

<!--SR:!2023-11-02,17,290-->

Chemistry Question from file underdog 4B::goodby

<!--SR:!2023-12-18,57,310-->

---

Chemistry Question from file underdog 4C::goodby

<!--SR:!2023-10-25,3,210-->

This single {{question}} turns into {{3 separate}} {{cards}}

<!--SR:!2023-10-20,1,241!2023-10-25,3,254!2023-10-23,1,221-->

---`;

        const text: string = `${frontmatter}
${content}`;
        const expectedContent: string = `${frontmatterBlankedOut}
${content}`;

        const [f, c] = splitNoteIntoFrontmatterAndContent(text);
        expect(f).toEqual(frontmatter);
        expect(c).toEqual(expectedContent);
    });

    test("With frontmatter and content (Horizontal line newLine)", () => {
        const frontmatter: string = `---
sr-due: 2024-01-17
sr-interval: 16
sr-ease: 278
tags:
  - flashcards/aws
  - flashcards/datascience
---`;
        const frontmatterBlankedOut: string = `






`;
        const content: string = `#flashcards/science/chemistry


---
# Questions
---


Chemistry Question from file underelephant 4A::goodby

<!--SR:!2023-11-02,17,290-->

Chemistry Question from file underdog 4B::goodby

<!--SR:!2023-12-18,57,310-->

---

Chemistry Question from file underdog 4C::goodby

<!--SR:!2023-10-25,3,210-->

This single {{question}} turns into {{3 separate}} {{cards}}

<!--SR:!2023-10-20,1,241!2023-10-25,3,254!2023-10-23,1,221-->

---
`;

        const text: string = `${frontmatter}
${content}`;
        const expectedContent: string = `${frontmatterBlankedOut}
${content}`;

        const [f, c] = splitNoteIntoFrontmatterAndContent(text);
        expect(f).toEqual(frontmatter);
        expect(c).toEqual(expectedContent);
    });

    test("With frontmatter and content (Horizontal line codeblock)", () => {
        const frontmatter: string = `---
sr-due: 2024-01-17
sr-interval: 16
sr-ease: 278
tags:
  - flashcards/aws
  - flashcards/datascience
---`;
        const frontmatterBlankedOut: string = `






`;
        const content: string = [
            "```",
            "---",
            "```",
            "#flashcards/science/chemistry",
            "# Questions",
            "  ",
            "",
            "Chemistry Question from file underelephant 4A::goodby",
            "",
            "<!--SR:!2023-11-02,17,290-->",
            "",
            "Chemistry Question from file underdog 4B::goodby",
            "",
            "<!--SR:!2023-12-18,57,310-->",
            "```",
            "---",
            "```",
            "",
            "Chemistry Question from file underdog 4C::goodby",
            "",
            "<!--SR:!2023-10-25,3,210-->",
            "",
            "This single {{question}} turns into {{3 separate}} {{cards}}",
            "",
            "<!--SR:!2023-10-20,1,241!2023-10-25,3,254!2023-10-23,1,221-->",
            "",
            "```",
            "---",
            "```",
        ].join("\n");

        const text: string = `${frontmatter}
${content}`;
        const expectedContent: string = `${frontmatterBlankedOut}
${content}`;

        const [f, c] = splitNoteIntoFrontmatterAndContent(text);
        expect(f).toEqual(frontmatter);
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

describe("isEqualOrSubPath", () => {
    const winSep = "\\";
    const linSep = "/";
    const root = "root";
    const sub_1 = "plugins";
    const sub_2 = "obsidian-spaced-repetition";
    const sub_3 = "data";
    const noMatch = "notRoot";
    const caseMatch = "Root";

    describe("Windows", () => {
        const sep = winSep;
        const rootPath = root + sep + sub_1;

        test("Upper and lower case letters", () => {
            expect(isEqualOrSubPath(caseMatch, root)).toBe(true);
            expect(isEqualOrSubPath(caseMatch.toUpperCase(), root)).toBe(true);
        });

        test("Seperator auto correction", () => {
            expect(isEqualOrSubPath(root + winSep + sub_1, rootPath)).toBe(true);
            expect(isEqualOrSubPath(root + winSep + sub_1 + winSep, rootPath)).toBe(true);

            expect(isEqualOrSubPath(root + linSep + sub_1, rootPath)).toBe(true);
            expect(isEqualOrSubPath(root + linSep + sub_1 + linSep, rootPath)).toBe(true);
        });

        test("Differnent path", () => {
            expect(isEqualOrSubPath(noMatch, rootPath)).toBe(false);
            expect(isEqualOrSubPath(noMatch + sep, rootPath)).toBe(false);
            expect(isEqualOrSubPath(noMatch + sep + sub_1, rootPath)).toBe(false);
            expect(isEqualOrSubPath(noMatch + sep + sub_1 + sep + sub_2, rootPath)).toBe(false);
        });

        test("Partially Match path", () => {
            expect(isEqualOrSubPath("roo", rootPath)).toBe(false);
            expect(isEqualOrSubPath("roo" + sep, rootPath)).toBe(false);
            expect(isEqualOrSubPath(root + sep + "plug", rootPath)).toBe(false);
            expect(isEqualOrSubPath(root + sep + "plug" + sep, rootPath)).toBe(false);
        });

        test("Same path", () => {
            expect(isEqualOrSubPath(rootPath, rootPath)).toBe(true);
        });

        test("Subpath", () => {
            expect(isEqualOrSubPath(root, rootPath)).toBe(false);
            expect(isEqualOrSubPath(root + sep, rootPath)).toBe(false);
            expect(isEqualOrSubPath(root + sep + sub_1, rootPath)).toBe(true);
            expect(isEqualOrSubPath(rootPath, rootPath + sep)).toBe(true);
            expect(isEqualOrSubPath(rootPath + sep, rootPath)).toBe(true);
            expect(isEqualOrSubPath(root + sep + sub_1 + sep, rootPath)).toBe(true);
            expect(isEqualOrSubPath(root + sep + sub_1 + sep + sub_2, rootPath)).toBe(true);
            expect(isEqualOrSubPath(root + sep + sub_1 + sep + sub_2 + sep, rootPath)).toBe(true);
            expect(isEqualOrSubPath(root + sep + sub_1 + sep + sub_2 + sep + sub_3, rootPath)).toBe(
                true,
            );
        });

        test("Multiple separators", () => {
            expect(isEqualOrSubPath(root + sep + sep, root)).toBe(true);
            expect(isEqualOrSubPath(root, root + sep + sep)).toBe(true);
            expect(isEqualOrSubPath(root, root + sep + sep + sub_1)).toBe(false);
            expect(isEqualOrSubPath(root + sep + sep + sub_1, root)).toBe(true);
            expect(isEqualOrSubPath(root + winSep + linSep + sub_1, root)).toBe(true);
        });
    });
    describe("Linux", () => {
        const sep = linSep;
        const rootPath = root + sep + sub_1;

        test("Upper and lower case letters", () => {
            expect(isEqualOrSubPath(caseMatch, root)).toBe(true);
            expect(isEqualOrSubPath(caseMatch.toUpperCase(), root)).toBe(true);
        });

        test("Seperator auto correction", () => {
            expect(isEqualOrSubPath(root + winSep + sub_1, rootPath)).toBe(true);
            expect(isEqualOrSubPath(root + winSep + sub_1 + winSep, rootPath)).toBe(true);

            expect(isEqualOrSubPath(root + linSep + sub_1, rootPath)).toBe(true);
            expect(isEqualOrSubPath(root + linSep + sub_1 + linSep, rootPath)).toBe(true);
        });

        test("Differnent path", () => {
            expect(isEqualOrSubPath(noMatch, rootPath)).toBe(false);
            expect(isEqualOrSubPath(noMatch + sep, rootPath)).toBe(false);
            expect(isEqualOrSubPath(noMatch + sep + sub_1, rootPath)).toBe(false);
            expect(isEqualOrSubPath(noMatch + sep + sub_1 + sep + sub_2, rootPath)).toBe(false);
        });

        test("Partially Match path", () => {
            expect(isEqualOrSubPath("roo", rootPath)).toBe(false);
            expect(isEqualOrSubPath("roo" + sep, rootPath)).toBe(false);
            expect(isEqualOrSubPath(root + sep + "plug", rootPath)).toBe(false);
            expect(isEqualOrSubPath(root + sep + "plug" + sep, rootPath)).toBe(false);
        });

        test("Same path", () => {
            expect(isEqualOrSubPath(rootPath, rootPath)).toBe(true);
        });

        test("Subpath", () => {
            expect(isEqualOrSubPath(root, rootPath)).toBe(false);
            expect(isEqualOrSubPath(root + sep, rootPath)).toBe(false);
            expect(isEqualOrSubPath(root + sep + sub_1, rootPath)).toBe(true);
            expect(isEqualOrSubPath(rootPath, rootPath + sep)).toBe(true);
            expect(isEqualOrSubPath(rootPath + sep, rootPath)).toBe(true);
            expect(isEqualOrSubPath(root + sep + sub_1 + sep, rootPath)).toBe(true);
            expect(isEqualOrSubPath(root + sep + sub_1 + sep + sub_2, rootPath)).toBe(true);
            expect(isEqualOrSubPath(root + sep + sub_1 + sep + sub_2 + sep, rootPath)).toBe(true);
            expect(isEqualOrSubPath(root + sep + sub_1 + sep + sub_2 + sep + sub_3, rootPath)).toBe(
                true,
            );
        });

        test("Multiple separators", () => {
            expect(isEqualOrSubPath(root + sep + sep, root)).toBe(true);
            expect(isEqualOrSubPath(root, root + sep + sep)).toBe(true);
            expect(isEqualOrSubPath(root, root + sep + sep + sub_1)).toBe(false);
            expect(isEqualOrSubPath(root + sep + sep + sub_1, root)).toBe(true);
            expect(isEqualOrSubPath(root + winSep + linSep + sub_1, root)).toBe(true);
        });
    });
    test("Examples", () => {
        expect(isEqualOrSubPath("/user/docs/letter.txt", "/user/docs")).toBe(true);
        expect(isEqualOrSubPath("/user/docs", "/user/docs")).toBe(true);
        expect(isEqualOrSubPath("/user/docs/letter.txt", "/user/projects")).toBe(false);
        expect(isEqualOrSubPath("/User/Docs", "/user/docs")).toBe(true);
        expect(isEqualOrSubPath("C:\\user\\docs", "C:/user/docs")).toBe(true);
    });
});
