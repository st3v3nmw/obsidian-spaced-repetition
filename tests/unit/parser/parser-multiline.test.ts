import { CardType } from "src/card/questions/question";

import { parserOptions, parseT } from "../helpers/unit-test-parser-helper";

test("Test parsing of multi line basic cards", () => {
    // standard symbols
    expect(parseT("Question\n?\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer", 0, 2],
    ]);
    expect(parseT("Question\n? \nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer", 0, 2],
    ]);
    expect(parseT("Question\n?\nAnswer <!--SR:!2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer <!--SR:!2021-08-11,4,270-->", 0, 2],
    ]);
    expect(parseT("Question\n?\nAnswer\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer\n<!--SR:2021-08-11,4,270-->", 0, 3],
    ]);
    expect(parseT("Question line 1\nQuestion line 2\n?\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question line 1\nQuestion line 2\n?\nAnswer", 0, 3],
    ]);
    expect(parseT("Question\n?\nAnswer line 1\nAnswer line 2", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer line 1\nAnswer line 2", 0, 3],
    ]);
    expect(parseT("#Title\n\nLine0\nQ1\n?\nA1\nAnswerExtra\n\nQ2\n?\nA2", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Line0\nQ1\n?\nA1\nAnswerExtra", 2, 6],
        [CardType.MultiLineBasic, "Q2\n?\nA2", 8, 10],
    ]);
    expect(parseT("#flashcards/tag-on-previous-line\nQuestion\n?\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "#flashcards/tag-on-previous-line\nQuestion\n?\nAnswer", 0, 3],
    ]);
    expect(
        parseT("Question\n?\nAnswer line 1\nAnswer line 2\n\n---", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: ["**[123;;]answer[;;hint]**"],
        }),
    ).toEqual([[CardType.MultiLineBasic, "Question\n?\nAnswer line 1\nAnswer line 2", 0, 4]]);
    expect(
        parseT(
            "Question 1\n?\nAnswer line 1\nAnswer line 2\n\n---\nQuestion 2\n?\nAnswer line 1\nAnswer line 2\n---\n",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "---",
                clozePatterns: ["**[123;;]answer[;;hint]**"],
            },
        ),
    ).toEqual([
        [CardType.MultiLineBasic, "Question 1\n?\nAnswer line 1\nAnswer line 2", 0, 4],
        [CardType.MultiLineBasic, "Question 2\n?\nAnswer line 1\nAnswer line 2", 6, 9],
    ]);
    expect(
        parseT(
            "Question 1\n?\nAnswer line 1\nAnswer line 2\n\n---\nQuestion with empty line after question mark\n?\n\nAnswer line 1\nAnswer line 2\n---\n",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "---",
                clozePatterns: ["**[123;;]answer[;;hint]**"],
            },
        ),
    ).toEqual([
        [CardType.MultiLineBasic, "Question 1\n?\nAnswer line 1\nAnswer line 2", 0, 4],
        [
            CardType.MultiLineBasic,
            "Question with empty line after question mark\n?\n\nAnswer line 1\nAnswer line 2",
            6,
            10,
        ],
    ]);

    // custom symbols
    expect(
        parseT("Question\n@@\nAnswer\n\nsfdg", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "@@",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [],
        }),
    ).toEqual([[CardType.MultiLineBasic, "Question\n@@\nAnswer", 0, 2]]);

    // empty string or whitespace character provided
    expect(
        parseT("Question\n?\nAnswer", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([]);
});

test("Test parsing of multi line reversed cards", () => {
    // standard symbols
    expect(parseT("Question\n??\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineReversed, "Question\n??\nAnswer", 0, 2],
    ]);
    expect(parseT("Question line 1\nQuestion line 2\n??\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineReversed, "Question line 1\nQuestion line 2\n??\nAnswer", 0, 3],
    ]);
    expect(parseT("Question\n??\nAnswer line 1\nAnswer line 2", parserOptions)).toEqual([
        [CardType.MultiLineReversed, "Question\n??\nAnswer line 1\nAnswer line 2", 0, 3],
    ]);
    expect(parseT("#Title\n\nLine0\nQ1\n??\nA1\nAnswerExtra\n\nQ2\n??\nA2", parserOptions)).toEqual(
        [
            [CardType.MultiLineReversed, "Line0\nQ1\n??\nA1\nAnswerExtra", 2, 6],
            [CardType.MultiLineReversed, "Q2\n??\nA2", 8, 10],
        ],
    );
    expect(
        parseT("Question\n??\nAnswer line 1\nAnswer line 2\n\n---", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [
                "==[123;;]answer[;;hint]==",
                "**[123;;]answer[;;hint]**",
                "{{[123;;]answer[;;hint]}}",
            ],
        }),
    ).toEqual([[CardType.MultiLineReversed, "Question\n??\nAnswer line 1\nAnswer line 2", 0, 4]]);
    expect(
        parseT(
            "Question 1\n?\nAnswer line 1\nAnswer line 2\n\n---\nQuestion 2\n??\nAnswer line 1\nAnswer line 2\n---\n",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "---",
                clozePatterns: [
                    "==[123;;]answer[;;hint]==",
                    "**[123;;]answer[;;hint]**",
                    "{{[123;;]answer[;;hint]}}",
                ],
            },
        ),
    ).toEqual([
        [CardType.MultiLineBasic, "Question 1\n?\nAnswer line 1\nAnswer line 2", 0, 4],
        [CardType.MultiLineReversed, "Question 2\n??\nAnswer line 1\nAnswer line 2", 6, 9],
    ]);

    // custom symbols
    expect(
        parseT("Question\n@@@\nAnswer\n---", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "@@",
            multilineReversedCardSeparator: "@@@",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([[CardType.MultiLineReversed, "Question\n@@@\nAnswer", 0, 2]]);
    expect(
        parseT(
            `line 1


line 2

Question 1?
??
Answer to question 1
????
line 3

line 4

Question 2?
??
Answer to question 2
????
Line 5
`,
            {
                singleLineCardSeparator: ":::",
                singleLineReversedCardSeparator: "::::",
                multilineCardSeparator: "??",
                multilineReversedCardSeparator: "???",
                multilineCardEndMarker: "????",
                clozePatterns: [],
            },
        ),
    ).toEqual([
        [CardType.MultiLineBasic, "Question 1?\n??\nAnswer to question 1", 5, 7],
        [CardType.MultiLineBasic, "Question 2?\n??\nAnswer to question 2", 13, 15],
    ]);

    // empty string or whitespace character provided
    expect(
        parseT("Question\n??\nAnswer", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "\t",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([]);
});
