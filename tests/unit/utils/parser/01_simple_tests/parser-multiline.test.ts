import { CardType } from "src/card/questions/question";
import ParserOptions from "src/utils/parsers/data-structures/parser/parser-options";

import { parserOptions, parseT } from "tests/unit/helpers/unit-test-parser-helper";

// TODO: Add card fragment tests

const execMultiLineCardsTestWithSeparator = (
    separators: { separator: string; cardType: CardType }[],
    options: ParserOptions,
) => {
    console.log("EXPECTING THESE SEPARATORS: \n", separators);
    console.log("EXPECTING THE MAIN SEPARATOR TOBE: \n", separators[0]);

    console.log("OPTIONS ARE: ", options);
    // Simplest multiline cards
    expect(
        parseT(["Question", `${separators[0].separator}`, "Answer"].join("\n"), options),
    ).toEqual([
        [
            separators[0].cardType,
            ["Question", `${separators[0].separator}`, "Answer"].join("\n"),
            0,
            2,
        ],
    ]);

    // Simple malformed multiline cards

    expect(parseT([`${separators[0].separator}`, "Answer"].join("\n"), options)).toEqual([]);

    expect(parseT(["Question", `${separators[0].separator}`].join("\n"), options)).toEqual([]);

    // Simple multiline cards with schedule

    expect(
        parseT(
            ["Question", `${separators[0].separator}`, "Answer", "<!--SR:2022-08-11,4,270-->"].join(
                "\n",
            ),
            options,
        ),
    ).toEqual([
        [
            separators[0].cardType,
            ["Question", `${separators[0].separator}`, "Answer", "<!--SR:2022-08-11,4,270-->"].join(
                "\n",
            ),
            0,
            3,
        ],
    ]);

    expect(
        parseT(
            [
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            separators[0].cardType,
            ["Question", `${separators[0].separator}`, "Answer"].join("\n"),
            0,
            2,
        ],
    ]);

    expect(
        parseT(
            [
                "Question",
                `${separators[0].separator}`,
                "Answer<!--SR:2022-08-11,4,270-->",
                "",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            separators[0].cardType,
            ["Question", `${separators[0].separator}`, "Answer<!--SR:2022-08-11,4,270-->"].join(
                "\n",
            ),
            0,
            2,
        ],
    ]);

    // Big Multiline cards with schedule

    expect(
        parseT(
            [
                "",
                "Some text before",
                "",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            separators[0].cardType,
            [
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            3,
            7,
        ],
    ]);

    expect(
        parseT(
            [
                "",
                "Some text before",
                "",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
                "Text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            separators[0].cardType,
            [
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            3,
            9,
        ],
    ]);

    expect(
        parseT(
            [
                "",
                "Some text before",
                "",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
                "Text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            separators[0].cardType,
            ["Some text before", "Question", `${separators[0].separator}`, "Answer"].join("\n"),
            3,
            6,
        ],
    ]);

    // Big Multiline cards with schedule & tags

    expect(
        parseT(
            [
                "",
                "Some text before",
                "",
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
                "Text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            separators[0].cardType,
            [
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
            ].join("\n"),
            3,
            7,
        ],
    ]);

    // Punctuation tests

    expect(
        parseT(
            [
                "",
                "Some text before",
                "",
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question?",
                `${separators[0].separator}`,
                "Answer",
                "",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
                "Text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            separators[0].cardType,
            [
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question?",
                `${separators[0].separator}`,
                "Answer",
            ].join("\n"),
            3,
            7,
        ],
    ]);

    expect(
        parseT(
            [
                "",
                "Some text before",
                "",
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question??",
                `${separators[0].separator}`,
                "Answer",
                "",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
                "Text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            separators[0].cardType,
            [
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question??",
                `${separators[0].separator}`,
                "Answer",
            ].join("\n"),
            3,
            7,
        ],
    ]);

    expect(
        parseT(
            [
                "",
                "Some text before",
                "",
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question@",
                `${separators[0].separator}`,
                "Answer",
                "",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
                "Text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            separators[0].cardType,
            [
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question@",
                `${separators[0].separator}`,
                "Answer",
            ].join("\n"),
            3,
            7,
        ],
    ]);

    expect(
        parseT(
            [
                "",
                "Some text before",
                "",
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question@@",
                `${separators[0].separator}`,
                "Answer",
                "",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
                "Text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            separators[0].cardType,
            [
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question@@",
                `${separators[0].separator}`,
                "Answer",
            ].join("\n"),
            3,
            7,
        ],
    ]);

    expect(
        parseT(
            [
                "",
                "Some text before",
                "",
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question!",
                `${separators[0].separator}`,
                "Answer",
                "",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
                "Text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            separators[0].cardType,
            [
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question!",
                `${separators[0].separator}`,
                "Answer",
            ].join("\n"),
            3,
            7,
        ],
    ]);

    // Multiple multiline cards with schedule and tags

    expect(
        parseT(
            [
                "",
                "Some text before",
                "",
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
                "Text after",
                "",
                "",
                "Some text before",
                "",
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
                "Text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            separators[0].cardType,
            [
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            3,
            9,
        ],
        [
            separators[0].cardType,
            [
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            15,
            29,
        ],
    ]);

    expect(
        parseT(
            [
                "",
                "Some text before",
                "",
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
                "Text after",
                "",
                "",
                "Some text before",
                "",
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
                "Text after",
                "Text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            separators[0].cardType,
            [
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            3,
            9,
        ],
        [
            separators[0].cardType,
            [
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            10,
            24,
        ],
        [
            separators[0].cardType,
            [
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Some text before",
            ].join("\n"),
            30,
            44,
        ],
        [
            separators[0].cardType,
            [
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "#flashcards/tag-on-previous-line #flashcards/tag-on-previous-line/test",
                "Some text before",
            ].join("\n"),
            45,
            50,
        ],
        [
            separators[0].cardType,
            [
                "Question",
                `${separators[0].separator}`,
                "Answer",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "Text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            51,
            63,
        ],
    ]);
};

test("Test parsing of multi line basic cards", () => {
    // standard symbols
    const options: ParserOptions = {
        ...parserOptions,
        multilineCardSeparator: "?",
        multilineReversedCardSeparator: "??",
    };
    execMultiLineCardsTestWithSeparator(
        [
            { separator: options.multilineCardSeparator, cardType: CardType.MultiLineBasic },
            {
                separator: options.multilineReversedCardSeparator,
                cardType: CardType.MultiLineReversed,
            },
        ],
        options,
    );

    // empty string or whitespace character provided
    expect(
        parseT("Question\n?\nAnswer", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [],
            useAtomicClozes: false,
        }),
    ).toEqual([]);

    expect(
        parseT("Question\n?\nAnswer", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: " ",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [],
            useAtomicClozes: false,
        }),
    ).toEqual([]);
});

test("Test parsing of multi line basic cards with custom separators", () => {
    // Reversed separators
    let options: ParserOptions = {
        ...parserOptions,
        multilineCardSeparator: "??",
        multilineReversedCardSeparator: "?",
    };
    execMultiLineCardsTestWithSeparator(
        [
            { separator: options.multilineCardSeparator, cardType: CardType.MultiLineBasic },
            {
                separator: options.multilineReversedCardSeparator,
                cardType: CardType.MultiLineReversed,
            },
        ],
        options,
    );

    // Custom separators
    options = {
        ...parserOptions,
        multilineCardSeparator: "@",
        multilineReversedCardSeparator: "@@",
    };
    execMultiLineCardsTestWithSeparator(
        [
            { separator: options.multilineCardSeparator, cardType: CardType.MultiLineBasic },
            {
                separator: options.multilineReversedCardSeparator,
                cardType: CardType.MultiLineReversed,
            },
        ],
        options,
    );
});

test("Test parsing of multi line reversed cards", () => {
    // standard symbols
    const options: ParserOptions = {
        ...parserOptions,
        multilineCardSeparator: "?",
        multilineReversedCardSeparator: "??",
    };
    execMultiLineCardsTestWithSeparator(
        [
            {
                separator: options.multilineReversedCardSeparator,
                cardType: CardType.MultiLineReversed,
            },
            { separator: options.multilineCardSeparator, cardType: CardType.MultiLineBasic },
        ],
        options,
    );

    // empty string or whitespace character provided
    expect(
        parseT("Question\n??\nAnswer", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "",
            multilineCardEndMarker: "",
            clozePatterns: [],
            useAtomicClozes: false,
        }),
    ).toEqual([]);

    expect(
        parseT("Question\n??\nAnswer", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: " ",
            multilineCardEndMarker: "",
            clozePatterns: [],
            useAtomicClozes: false,
        }),
    ).toEqual([]);
});

test("Test parsing of multi line reversed cards with custom separators", () => {
    // Reversed separators
    let options = {
        ...parserOptions,
        multilineCardSeparator: "??",
        multilineReversedCardSeparator: "?",
    };
    execMultiLineCardsTestWithSeparator(
        [
            {
                separator: options.multilineReversedCardSeparator,
                cardType: CardType.MultiLineReversed,
            },
            { separator: options.multilineCardSeparator, cardType: CardType.MultiLineBasic },
        ],
        options,
    );

    options = {
        ...parserOptions,
        multilineCardSeparator: "@",
        multilineReversedCardSeparator: "@@",
    };
    execMultiLineCardsTestWithSeparator(
        [
            {
                separator: options.multilineReversedCardSeparator,
                cardType: CardType.MultiLineReversed,
            },
            { separator: options.multilineCardSeparator, cardType: CardType.MultiLineBasic },
        ],
        options,
    );
});
