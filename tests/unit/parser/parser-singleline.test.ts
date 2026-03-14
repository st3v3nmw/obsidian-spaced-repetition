import { CardType } from "src/card/questions/question";

import { parserOptions, parseT } from "../helpers/unit-test-parser-helper";

// TODO: Add card fragment tests

const execInlineCardsTestWithSeparator = (separator: string, separatorCardType: CardType) => {
    // Same tests apply for both single line basic and singleline reversed cards

    // standard symbols
    expect(parseT([`Question${separator}Answer`].join("\n"))).toEqual([
        [separatorCardType, [`Question${separator}Answer`].join("\n"), 0, 0],
    ]);

    expect(parseT([`Question ${separator} Answer <!--SR:2021-08-11,4,270-->`].join("\n"))).toEqual([
        [
            separatorCardType,
            [`Question ${separator} Answer <!--SR:2021-08-11,4,270-->`].join("\n"),
            0,
            0,
        ],
    ]);

    expect(
        parseT([`Question${separator}Answer`, "<!--SR:!2021-08-11,4,270-->"].join("\n")),
    ).toEqual([
        [
            separatorCardType,
            [`Question${separator}Answer`, "<!--SR:!2021-08-11,4,270-->"].join("\n"),
            0,
            1,
        ],
    ]);

    expect(parseT(["Some text before", `Question${separator}Answer`].join("\n"))).toEqual([
        [separatorCardType, [`Question${separator}Answer`].join("\n"), 1, 1],
    ]);

    expect(
        parseT(
            ["Some text before", `Question ${separator} Answer <!--SR:2021-08-11,4,270-->`].join(
                "\n",
            ),
        ),
    ).toEqual([
        [
            separatorCardType,
            [`Question ${separator} Answer <!--SR:2021-08-11,4,270-->`].join("\n"),
            1,
            1,
        ],
    ]);

    expect(
        parseT(
            ["Some text before", `Question${separator}Answer`, "<!--SR:2021-08-11,4,270-->"].join(
                "\n",
            ),
        ),
    ).toEqual([
        [
            separatorCardType,
            [`Question${separator}Answer`, "<!--SR:2021-08-11,4,270-->"].join("\n"),
            1,
            2,
        ],
    ]);

    expect(parseT([`Question${separator}Answer`, "Some text after"].join("\n"))).toEqual([
        [separatorCardType, [`Question${separator}Answer`].join("\n"), 0, 0],
    ]);

    expect(
        parseT(
            [`Question${separator}Answer <!--SR:2021-08-11,4,270-->`, "Some text after"].join("\n"),
        ),
    ).toEqual([
        [
            separatorCardType,
            [`Question${separator}Answer <!--SR:2021-08-11,4,270-->`].join("\n"),
            0,
            0,
        ],
    ]);

    expect(
        parseT(
            [`Question${separator}Answer`, " <!--SR:2021-08-11,4,270-->", "Some text after"].join(
                "\n",
            ),
        ),
    ).toEqual([
        [
            separatorCardType,
            [`Question${separator}Answer`, " <!--SR:2021-08-11,4,270-->"].join("\n"),
            0,
            1,
        ],
    ]);

    expect(
        parseT(["Some text before", `Question${separator}Answer`, "Some text after"].join("\n")),
    ).toEqual([[separatorCardType, [`Question${separator}Answer`].join("\n"), 1, 1]]);

    expect(
        parseT(
            [
                "Some text before",
                `Question${separator}Answer <!--SR:2021-08-11,4,270-->`,
                "Some text after",
            ].join("\n"),
        ),
    ).toEqual([
        [
            separatorCardType,
            [`Question${separator}Answer <!--SR:2021-08-11,4,270-->`].join("\n"),
            1,
            1,
        ],
    ]);

    expect(
        parseT(
            [
                "Some text before",
                `Question${separator}Answer`,
                " <!--SR:2021-08-11,4,270-->",
                "Some text after",
            ].join("\n"),
        ),
    ).toEqual([
        [
            separatorCardType,
            [`Question${separator}Answer`, " <!--SR:2021-08-11,4,270-->"].join("\n"),
            1,
            2,
        ],
    ]);

    expect(
        parseT(
            ["#Title", `Question1${separator}Answer1`, `Question2${separator}Answer2`].join("\n"),
        ),
    ).toEqual([
        [separatorCardType, [`Question1${separator}Answer1`].join("\n"), 1, 1],
        [separatorCardType, [`Question2${separator}Answer2`].join("\n"), 2, 2],
    ]);

    expect(
        parseT(
            [
                "#Title",
                `Question1${separator}Answer1`,
                "<!--SR:2021-08-11,4,270-->",
                `Question2${separator}Answer2`,
                "<!--SR:2021-08-11,4,270-->",
            ].join("\n"),
        ),
    ).toEqual([
        [
            separatorCardType,
            [`Question1${separator}Answer1`, "<!--SR:2021-08-11,4,270-->"].join("\n"),
            1,
            2,
        ],
        [
            separatorCardType,
            [`Question2${separator}Answer2`, "<!--SR:2021-08-11,4,270-->"].join("\n"),
            3,
            4,
        ],
    ]);
    // Rouge sr comments
    expect(
        parseT(
            [
                "#Title",
                "<!--SR:2021-08-11,4,270-->",
                `Question1${separator}Answer1`,
                "<!--SR:2021-08-11,4,270-->",
                "<!--SR:2023-08-11,4,270-->",
                `Question2${separator}Answer2`,
                "<!--SR:2021-08-11,4,270-->",
            ].join("\n"),
        ),
    ).toEqual([
        [
            separatorCardType,
            [`Question1${separator}Answer1`, "<!--SR:2021-08-11,4,270-->"].join("\n"),
            2,
            3,
        ],
        [
            separatorCardType,
            [`Question2${separator}Answer2`, "<!--SR:2021-08-11,4,270-->"].join("\n"),
            5,
            6,
        ],
    ]);

    expect(parseT([`#flashcards/science Question1${separator}Answer1`].join("\n"))).toEqual([
        [separatorCardType, [`#flashcards/science Question1${separator}Answer1`].join("\n"), 0, 0],
    ]);

    expect(
        parseT(["#flashcards/science", `Question${separator}Answer`].join("\n"), parserOptions),
    ).toEqual([[separatorCardType, [`Question${separator}Answer`].join("\n"), 1, 1]]);

    expect(
        parseT(
            ["#flashcards/science #flashcards/math", `Question${separator}Answer`].join("\n"),
            parserOptions,
        ),
    ).toEqual([[separatorCardType, [`Question${separator}Answer`].join("\n"), 1, 1]]);

    expect(
        parseT(
            ["#flashcards/science", "#flashcards/math", `Question${separator}Answer`].join("\n"),
            parserOptions,
        ),
    ).toEqual([[separatorCardType, [`Question${separator}Answer`].join("\n"), 2, 2]]);

    // Rouge sr comments
    expect(
        parseT(
            [
                "#flashcards/science",
                "<!--SR:2021-08-11,4,270-->",
                "#flashcards/math",
                `Question${separator}Answer`,
            ].join("\n"),
            parserOptions,
        ),
    ).toEqual([[separatorCardType, [`Question${separator}Answer`].join("\n"), 3, 3]]);

    expect(
        parseT(
            [
                "#flashcards/science",
                "<!--SR:2021-08-11,4,270-->",
                "#flashcards/math",
                `Question${separator}Answer <!--SR:2021-08-11,4,270-->`,
            ].join("\n"),
            parserOptions,
        ),
    ).toEqual([
        [
            separatorCardType,
            [`Question${separator}Answer <!--SR:2021-08-11,4,270-->`].join("\n"),
            3,
            3,
        ],
    ]);

    expect(
        parseT(
            [
                "#flashcards/science",
                "<!--SR:2021-08-11,4,270-->",
                "#flashcards/math",
                `Question${separator}Answer`,
                "<!--SR:2021-08-11,4,270-->",
            ].join("\n"),
            parserOptions,
        ),
    ).toEqual([
        [
            separatorCardType,
            [`Question${separator}Answer`, "<!--SR:2021-08-11,4,270-->"].join("\n"),
            3,
            4,
        ],
    ]);
};

test("Test parsing of single line basic cards", () => {
    execInlineCardsTestWithSeparator("::", CardType.SingleLineBasic);

    // custom symbols
    expect(
        parseT("Question=Answer", {
            singleLineCardSeparator: "=",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            clozePatterns: [],
            useAtomicClozes: false,
        }),
    ).toEqual([[CardType.SingleLineBasic, "Question=Answer", 0, 0]]);

    expect(
        parseT("Question&&Answer", {
            singleLineCardSeparator: "&&",
            singleLineReversedCardSeparator: "&&&",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            useAtomicClozes: false,
            clozePatterns: [],
        }),
    ).toEqual([[CardType.SingleLineBasic, "Question&&Answer", 0, 0]]);

    expect(
        parseT("Question:::Answer", {
            singleLineCardSeparator: ":::",
            singleLineReversedCardSeparator: "::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            useAtomicClozes: false,
            clozePatterns: [],
        }),
    ).toEqual([[CardType.SingleLineBasic, "Question:::Answer", 0, 0]]);

    expect(
        parseT(["Qn 1?:>Answer.", "", "", "Qn 2?<:>Answer.", ""].join("\n"), {
            singleLineCardSeparator: ":>",
            singleLineReversedCardSeparator: "<:>",
            multilineCardSeparator: ";>",
            multilineReversedCardSeparator: "<;>",
            multilineCardEndMarker: "---",
            useAtomicClozes: false,
            clozePatterns: [],
        }),
    ).toEqual([
        [CardType.SingleLineBasic, "Qn 1?:>Answer.", 0, 0],
        [CardType.SingleLineReversed, "Qn 2?<:>Answer.", 3, 3],
    ]);

    // empty string or whitespace character provided
    expect(
        parseT("Question::Answer", {
            singleLineCardSeparator: "",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            useAtomicClozes: false,
            clozePatterns: [],
        }),
    ).toEqual([]);
});

test("Test parsing of single line reversed cards", () => {
    // standard symbols
    execInlineCardsTestWithSeparator(":::", CardType.SingleLineReversed);

    // custom symbols
    expect(
        parseT("Question==Answer", {
            singleLineCardSeparator: "=",
            singleLineReversedCardSeparator: "==",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            useAtomicClozes: false,
            clozePatterns: [],
        }),
    ).toEqual([[CardType.SingleLineReversed, "Question==Answer", 0, 0]]);

    expect(
        parseT("Question&&&Answer", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: "&&&",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            useAtomicClozes: false,
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
            useAtomicClozes: false,
            clozePatterns: [],
        }),
    ).toEqual([[CardType.SingleLineReversed, "Question::Answer", 0, 0]]);

    expect(
        parseT(["Qn 1?:>Answer.", "", "", "Qn 2?<:>Answer.", ""].join("\n"), {
            singleLineCardSeparator: ":>",
            singleLineReversedCardSeparator: "<:>",
            multilineCardSeparator: ";>",
            multilineReversedCardSeparator: "<;>",
            multilineCardEndMarker: "---",
            useAtomicClozes: false,
            clozePatterns: [],
        }),
    ).toEqual([
        [CardType.SingleLineBasic, "Qn 1?:>Answer.", 0, 0],
        [CardType.SingleLineReversed, "Qn 2?<:>Answer.", 3, 3],
    ]);

    // empty string or whitespace character provided
    expect(
        parseT("Question:::Answer", {
            singleLineCardSeparator: ">",
            singleLineReversedCardSeparator: "  ",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            useAtomicClozes: false,
            clozePatterns: [],
        }),
    ).toEqual([]);
});
