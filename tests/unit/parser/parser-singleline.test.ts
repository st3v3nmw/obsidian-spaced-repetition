import { CardType } from "src/card/questions/question";

import { parserOptions, parseT } from "tests/unit/helpers/unit-test-parser-helper";

test("Test parsing of single line basic cards", () => {
    // standard symbols
    expect(parseT("Question::Answer", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer", 0, 0],
    ]);
    expect(parseT("Question::Answer\n<!--SR:!2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer\n<!--SR:!2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parseT("Question::Answer <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT("Some text before\nQuestion ::Answer", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Question ::Answer", 1, 1],
    ]);
    expect(parseT("#Title\n\nQ1::A1\nQ2:: A2", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Q1::A1", 2, 2],
        [CardType.SingleLineBasic, "Q2:: A2", 3, 3],
    ]);
    expect(parseT("#flashcards/science Question ::Answer", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "#flashcards/science Question ::Answer", 0, 0],
    ]);

    // custom symbols
    expect(
        parseT("Question&&Answer", {
            singleLineCardSeparator: "&&",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([[CardType.SingleLineBasic, "Question&&Answer", 0, 0]]);
    expect(
        parseT("Question=Answer", {
            singleLineCardSeparator: "=",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([[CardType.SingleLineBasic, "Question=Answer", 0, 0]]);

    // empty string or whitespace character provided
    expect(
        parseT("Question::Answer", {
            singleLineCardSeparator: "",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([]);
});

test("Test parsing of single line reversed cards", () => {
    // standard symbols
    expect(parseT("Question:::Answer", parserOptions)).toEqual([
        [CardType.SingleLineReversed, "Question:::Answer", 0, 0],
    ]);
    expect(parseT("Some text before\nQuestion :::Answer", parserOptions)).toEqual([
        [CardType.SingleLineReversed, "Question :::Answer", 1, 1],
    ]);
    expect(parseT("#Title\n\nQ1:::A1\nQ2::: A2", parserOptions)).toEqual([
        [CardType.SingleLineReversed, "Q1:::A1", 2, 2],
        [CardType.SingleLineReversed, "Q2::: A2", 3, 3],
    ]);

    // custom symbols
    expect(
        parseT("Question&&&Answer", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: "&&&",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([[CardType.SingleLineReversed, "Question&&&Answer", 0, 0]]);
    expect(
        parseT("Question::Answer", {
            singleLineCardSeparator: ":::",
            singleLineReversedCardSeparator: "::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([[CardType.SingleLineReversed, "Question::Answer", 0, 0]]);
    expect(
        parseT("Qn 1?:>Answer.\n\nQn 2?<:>Answer.\n", {
            singleLineCardSeparator: ":>",
            singleLineReversedCardSeparator: "<:>",
            multilineCardSeparator: ";>",
            multilineReversedCardSeparator: "<;>",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([
        [CardType.SingleLineBasic, "Qn 1?:>Answer.", 0, 0],
        [CardType.SingleLineReversed, "Qn 2?<:>Answer.", 2, 2],
    ]);

    // empty string or whitespace character provided
    expect(
        parseT("Question:::Answer", {
            singleLineCardSeparator: ">",
            singleLineReversedCardSeparator: "  ",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
        }),
    ).toEqual([]);
});
