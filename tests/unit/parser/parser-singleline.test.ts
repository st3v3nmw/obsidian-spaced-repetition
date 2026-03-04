import { CardType } from "src/card/questions/question";

import { parserOptions, parseT } from "../helpers/unit-test-parser-helper";

const execInlineCardsTestWithSeparator = (separator: string) => {
    // Same tests apply for both single line basic and singleline reversed cards

    // standard symbols
    expect(parseT(["Question" + separator + "Answer"].join("\n"), parserOptions)).toEqual([
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["Question" + separator + "Answer"].join("\n"), 0, 0],
    ]);

    expect(parseT(["Question" + separator + "Answer <!--SR:2021-08-11,4,270-->"].join("\n"), parserOptions)).toEqual([
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["Question" + separator + "Answer <!--SR:2021-08-11,4,270-->"].join("\n"), 0, 0],
    ]);

    expect(parseT(["Question" + separator + "Answer", "<!--SR:!2021-08-11,4,270-->"].join("\n"), parserOptions)).toEqual([
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["Question" + separator + "Answer", "<!--SR:!2021-08-11,4,270-->"].join("\n"), 0, 1],
    ]);

    expect(parseT(["Some text before", "Question " + separator + "Answer"].join("\n"), parserOptions)).toEqual([
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["Question " + separator + "Answer"].join("\n"), 1, 1],
    ]);
    expect(parseT(["Some text before", "Question " + separator + "Answer <!--SR:2021-08-11,4,270-->"].join("\n"), parserOptions)).toEqual([
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["Question " + separator + "Answer <!--SR:2021-08-11,4,270-->"].join("\n"), 1, 1],
    ]);
    expect(parseT(["Some text before", "Question " + separator + "Answer", "<!--SR:2021-08-11,4,270-->"].join("\n"), parserOptions)).toEqual([
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["Question " + separator + "Answer", "<!--SR:2021-08-11,4,270-->"].join("\n"), 1, 2],
    ]);

    expect(parseT(["Question " + separator + "Answer", "Some text after"].join("\n"), parserOptions)).toEqual([
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["Question " + separator + "Answer"].join("\n"), 0, 0],
    ]);
    expect(parseT(["Question " + separator + "Answer <!--SR:2021-08-11,4,270-->", "Some text after"].join("\n"), parserOptions)).toEqual([
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["Question " + separator + "Answer <!--SR:2021-08-11,4,270-->"].join("\n"), 0, 0],
    ]);
    expect(parseT(["Question " + separator + "Answer", " <!--SR:2021-08-11,4,270-->", "Some text after"].join("\n"), parserOptions)).toEqual([
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["Question " + separator + "Answer", " <!--SR:2021-08-11,4,270-->"].join("\n"), 0, 1],
    ]);

    expect(parseT(["Some text before", "Question " + separator + "Answer", "Some text after"].join("\n"), parserOptions)).toEqual([
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["Question " + separator + "Answer"].join("\n"), 1, 1],
    ]);
    expect(parseT(["Some text before", "Question " + separator + "Answer <!--SR:2021-08-11,4,270-->", "Some text after"].join("\n"), parserOptions)).toEqual([
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["Question " + separator + "Answer <!--SR:2021-08-11,4,270-->"].join("\n"), 1, 1],
    ]);
    expect(parseT(["Some text before", "Question " + separator + "Answer", " <!--SR:2021-08-11,4,270-->", "Some text after"].join("\n"), parserOptions)).toEqual([
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["Question " + separator + "Answer", " <!--SR:2021-08-11,4,270-->"].join("\n"), 1, 2],
    ]);

    expect(parseT(["#Title", "Q1" + separator + "A1", "Q2" + separator + " A2"].join("\n"), parserOptions)).toEqual([
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["Q1" + separator + "A1"].join("\n"), 2, 2],
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["Q2" + separator + " A2"].join("\n"), 3, 3],
    ]);

    expect(parseT(["#flashcards/science Question " + separator + "Answer"].join("\n"), parserOptions)).toEqual([
        [separator === "::" ? CardType.SingleLineBasic : CardType.SingleLineReversed, ["#flashcards/science Question " + separator + "Answer"].join("\n"), 0, 0],
    ]);
};

test("Test parsing of single line basic cards", () => {
    execInlineCardsTestWithSeparator("::");

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
    execInlineCardsTestWithSeparator(":::");

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
