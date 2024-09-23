import {
    convertToStringOrEmpty,
    cyrb53,
    escapeRegexString,
    findLineIndexOfSearchStringIgnoringWs,
    literalStringReplace,
    MultiLineTextFinder,
    splitNoteIntoFrontmatterAndContent,
    splitTextIntoLineArray,
    stringTrimStart,
} from "src/utils/strings";

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

const space: string = " ";
const text10: string = `Some Stuff 0 More Stuff
Some Stuff 1 More Stuff
Some Stuff 2 More Stuff
Some Stuff 3 More Stuff
Some Stuff 4 More Stuff
Some Stuff 5 More Stuff
Some Stuff 6 More Stuff
Some Stuff 7 More Stuff
Some Stuff 8 More Stuff
Some Stuff 9 More Stuff`;
const text20: string = `Some Stuff 0 More Stuff
Some Stuff 1 More Stuff
Some Stuff 2 More Stuff
Some Stuff 3 More Stuff
Some Stuff 4 More Stuff
Some Stuff 5 More Stuff
Some Stuff 6 More Stuff
Some Stuff 7 More Stuff
Some Stuff 8 More Stuff
Some Stuff 9 More Stuff
Some Stuff 10 More Stuff
Some Stuff 11 More Stuff
Some Stuff 12 More Stuff
Some Stuff 13 More Stuff
Some Stuff 14 More Stuff
Some Stuff 15 More Stuff
   Some Stuff 16 More Stuff
Some Stuff 17 More Stuff${space}${space}
Some Stuff 18 More Stuff
Some Stuff 19 More Stuff
Some Stuff 20 More Stuff
`;

describe("find", () => {
    describe("Single line search string - Match found", () => {
        test("Search string present as complete line within text (identical)", () => {
            const searchStr: string = "Some Stuff 14 More Stuff";

            checkFindResult(text20, searchStr, 14);
        });

        test("Search string present as complete line within text (search has pre/post additional spaces)", () => {
            let searchStr: string = "   Some Stuff 14 More Stuff";
            checkFindResult(text20, searchStr, 14);

            searchStr = "Some Stuff 14 More Stuff   ";
            checkFindResult(text20, searchStr, 14);

            searchStr = "   Some Stuff 14 More Stuff   ";
            checkFindResult(text20, searchStr, 14);
        });

        test("Search string present as complete line within text (source text has pre/post additional spaces)", () => {
            let searchStr: string = "Some Stuff 16 More Stuff";
            checkFindResult(text20, searchStr, 16);

            searchStr = "Some Stuff 17 More Stuff";
            checkFindResult(text20, searchStr, 17);
        });
    });

    describe("Multi line search string - Match found", () => {
        test("Search string present from line 1", () => {
            const searchStr: string = `Some Stuff 1 More Stuff
    Some Stuff 2 More Stuff
    Some Stuff 3 More Stuff`;

            checkFindResult(text20, searchStr, 1);
        });

        test("Search string present mid file", () => {
            const searchStr: string = `Some Stuff 9 More Stuff
    Some Stuff 10 More Stuff
    Some Stuff 11 More Stuff`;
            checkFindResult(text20, searchStr, 9);
        });

        test("Search string present at end of file", () => {
            const searchStr: string = `Some Stuff 19 More Stuff
    Some Stuff 20 More Stuff`;
            checkFindResult(text20, searchStr, 19);
        });
    });

    describe("Single line search string - No match found", () => {
        test("Search string is a match but only to part of the line", () => {
            const searchStr: string = "Stuff 14 More Stuff";

            checkFindResult(text20, searchStr, null);
        });
    });

    describe("Multi line search string - No match found", () => {
        test("Search string doesn't match any source line", () => {
            const searchStr: string = `Nothing here that matches
    Or hear `;
            checkFindResult(text20, searchStr, null);
        });

        test("Some, but not all of the search string lines matches the source", () => {
            const searchStr: string = `Some Stuff 9 More Stuff
    Some Stuff 10 More Stuff
    Some Stuff 11 More Stuff - this line doesn't match`;
            checkFindResult(text20, searchStr, null);
        });
    });
});

describe("findAndReplace", () => {
    test("Multi line search string present as exact match", () => {
        const searchStr: string = `Some Stuff 4 More Stuff
Some Stuff 5 More Stuff
Some Stuff 6 More Stuff`;

        const replacementStr: string = "Replacement line";

        const expectedResult: string = `Some Stuff 0 More Stuff
Some Stuff 1 More Stuff
Some Stuff 2 More Stuff
Some Stuff 3 More Stuff
Replacement line
Some Stuff 7 More Stuff
Some Stuff 8 More Stuff
Some Stuff 9 More Stuff`;
        checkFindAndReplaceResult(text10, searchStr, replacementStr, expectedResult);
    });

    test("Multi line search string has pre/post spaces", () => {
        const searchStr: string = `Some Stuff 4 More Stuff
${space}Some Stuff 5 More Stuff
Some Stuff 6 More Stuff${space}${space}`;

        const replacementStr: string = `Replacement line 1
Replacement line 2`;

        const expectedResult: string = `Some Stuff 0 More Stuff
Some Stuff 1 More Stuff
Some Stuff 2 More Stuff
Some Stuff 3 More Stuff
Replacement line 1
Replacement line 2
Some Stuff 7 More Stuff
Some Stuff 8 More Stuff
Some Stuff 9 More Stuff`;
        checkFindAndReplaceResult(text10, searchStr, replacementStr, expectedResult);
    });

    test("No match found", () => {
        const searchStr: string = `Some Stuff 4 More Stuff
Some Stuff 5 More Stuff
Some Stuff 7 More Stuff`;

        const replacementStr: string = `Replacement line 1
Replacement line 2`;

        const expectedResult: string = null;
        checkFindAndReplaceResult(text10, searchStr, replacementStr, expectedResult);
    });
});

function checkFindAndReplaceResult(
    text: string,
    searchStr: string,
    replacementStr: string,
    expectedResult: string,
) {
    const result: string = MultiLineTextFinder.findAndReplace(text, searchStr, replacementStr);
    expect(result).toEqual(expectedResult);
}

function checkFindResult(text: string, searchStr: string, expectedResult: number) {
    const textArray = splitTextIntoLineArray(text);
    const searchArray = splitTextIntoLineArray(searchStr);
    const result: number = MultiLineTextFinder.find(textArray, searchArray);
    expect(result).toEqual(expectedResult);
}
