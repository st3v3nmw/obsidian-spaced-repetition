import { CardType } from "src/card/questions/question";
import { ParserOptions } from "src/parser/parser-data-structure";

import { parserOptions, parseT } from "../../helpers/unit-test-parser-helper";

// TODO: Add card fragment tests

const execSingleLineClozeCardsTestWithMarker = (
    leftMarker: string,
    rightMarker: string,
    options: ParserOptions = parserOptions,
) => {
    // Same tests apply for all markers
    // Atomic clozes shouldn't matter here, because they just transform multiline clozes to single line clozes

    // standard clozes
    expect(parseT([`${leftMarker}deletion${rightMarker} test`].join("\n"), options)).toEqual([
        [CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 0, 0],
    ]);

    // With schedule info
    expect(
        parseT(
            [`${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`].join("\n"),
            0,
            0,
        ],
    ]);

    expect(
        parseT(
            [`${leftMarker}deletion${rightMarker} test`, "<!--SR:2022-08-11,4,270-->"].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion${rightMarker} test`, "<!--SR:2022-08-11,4,270-->"].join("\n"),
            0,
            1,
        ],
    ]);

    expect(
        parseT(
            [
                `${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`,
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`].join("\n"),
            0,
            0,
        ],
    ]);

    // With text before
    expect(
        parseT(
            [
                "some text before",
                "",
                "some text before",
                "some text before",
                "some text before",
                "some text before",
                "",
                `${leftMarker}deletion${rightMarker} test`,
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion${rightMarker} test`, "<!--SR:2022-08-11,4,270-->"].join("\n"),
            7,
            8,
        ],
    ]);

    // With text after
    expect(
        parseT(
            [
                `${leftMarker}deletion${rightMarker} test`,
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "some text after",
                "",
                "some text after",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion${rightMarker} test`, "<!--SR:2022-08-11,4,270-->"].join("\n"),
            0,
            1,
        ],
    ]);

    expect(
        parseT(
            [
                `${leftMarker}deletion${rightMarker} test`,
                "<!--SR:2022-08-11,4,270-->",
                "",
                "some text after",
                "",
                "some text after",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion${rightMarker} test`, "<!--SR:2022-08-11,4,270-->"].join("\n"),
            0,
            1,
        ],
    ]);

    expect(
        parseT(
            [
                `${leftMarker}deletion${rightMarker} test`,
                "",
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
                "some text after",
            ].join("\n"),
            options,
        ),
    ).toEqual([[CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 0, 0]]);

    expect(
        parseT(
            [
                `${leftMarker}deletion${rightMarker} test`,
                "",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "",
                "some text after",
            ].join("\n"),
            options,
        ),
    ).toEqual([[CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 0, 0]]);

    // Both text before and after

    expect(
        parseT(
            [
                "some text before",
                "some text before",
                "some text before",
                "some text before",
                "",
                "some text before",
                "",
                `${leftMarker}deletion${rightMarker} test`,
                "<!--SR:2022-08-11,4,270-->",
                "",
                "some text after",
                "",
                "some text after",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion${rightMarker} test`, "<!--SR:2022-08-11,4,270-->"].join("\n"),
            7,
            8,
        ],
    ]);

    // Multiple clozes in one line

    expect(
        parseT(
            [
                "some text before",
                "some text before",
                "some text before",
                "some text before",
                "",
                "some text before",
                "",
                "some text before",
                "some text before",
                "some text before",
                "some text before",
                "",
                "some text before",
                "",
                `${leftMarker}deletion${rightMarker} test  & ${leftMarker}deletion2${rightMarker} test2`,
                "<!--SR:2022-08-11,4,270-->",
                "",
                "some text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                `${leftMarker}deletion${rightMarker} test  & ${leftMarker}deletion2${rightMarker} test2`,
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            14,
            15,
        ],
    ]);

    // Multiple clozes in one line or in multiple lines with sometimes bad scheduling info

    expect(
        parseT(
            [
                "some text before",
                "some text before",
                "some text before",
                "some text before",
                "",
                "some text before",
                "",
                `${leftMarker}deletion${rightMarker}`,
                "<!--SR:2022-08-11,4,270-->",
                "",
                "some text after",
                "",
                "some text after",
                "some text before",
                "some text before",
                "some text before",
                "some text before",
                "",
                "some text before",
                "",
                `${leftMarker}deletion${rightMarker} test  & ${leftMarker}deletion2${rightMarker} test2`,
                "<!--SR:2022-08-11,4,270-->",
                "",
                "some text after",
                "",
                "some text after",
                "some text before",
                "some text before",
                "some text before",
                "some text before",
                "",
                "some text before",
                "",
                `${leftMarker}deletion${rightMarker} test`,
                "",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "",
                "some text after",
                "",
                "some text after",
                "some text before",
                "some text before",
                "some text before",
                "some text before",
                "",
                "some text before",
                "",
                `${leftMarker}deletion${rightMarker} test  & ${leftMarker}deletion2${rightMarker} test2`,
                "",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "",
                "some text after",
                "",
                "some text after",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion${rightMarker}`, "<!--SR:2022-08-11,4,270-->"].join("\n"),
            7,
            8,
        ],
        [
            CardType.Cloze,
            [
                `${leftMarker}deletion${rightMarker} test  & ${leftMarker}deletion2${rightMarker} test2`,
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            20,
            21,
        ],
        [CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 33, 33],
        [
            CardType.Cloze,
            [
                `${leftMarker}deletion${rightMarker} test  & ${leftMarker}deletion2${rightMarker} test2`,
            ].join("\n"),
            48,
            48,
        ],
    ]);

    // Wrong formatting tests
    expect(parseT(leftMarker + " srdf ", options)).toEqual([]);

    expect(parseT("srdf " + rightMarker, options)).toEqual([]);

    expect(parseT("lorem ipsum " + leftMarker + "p\ndolor won" + rightMarker, options)).toEqual([]);

    if (rightMarker.length - 1 !== 0) {
        expect(
            parseT(
                "lorem ipsum " +
                leftMarker +
                "dolor won" +
                rightMarker.substring(0, rightMarker.length - 1),
                options,
            ),
        ).toEqual([]);
    }

    // pattern with hint and sequencer in footnotes
    expect(
        parseT(
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language]`,
            ].join("\n"),
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: [`${leftMarker}answer${rightMarker}[^\\[hint\\]][\\[^123\\]]`],
                useAtomicClozes: false,
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language]`,
            ].join("\n"),
            0,
            0,
        ],
    ]);

    expect(
        parseT(
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`,
            ].join("\n"),
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: [`${leftMarker}answer${rightMarker}[^\\[hint\\]][\\[^123\\]]`],
                useAtomicClozes: false,
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`,
            ].join("\n"),
            0,
            0,
        ],
    ]);

    expect(
        parseT(
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`,
            ].join("\n"),
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: [`${leftMarker}answer${rightMarker}[^\\[hint\\]][\\[^123\\]]`],
                useAtomicClozes: false,
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`,
            ].join("\n"),
            0,
            0,
        ],
    ]);

    // MARKER highlights MARKER turned off
    expect(
        parseT("cloze " + `${leftMarker}deletion${rightMarker} test`, {
            ...options,
            useAtomicClozes: false,
            clozePatterns: [
                "==[123;;]answer[;;hint]==",
                "**[123;;]answer[;;hint]**",
                "{{[123;;]answer[;;hint]}}",
            ].filter((pattern) => !pattern.includes(leftMarker) && pattern.includes(rightMarker)),
        }),
    ).toEqual([]);
};

const execMultiLineClozeCardsTest = (
    leftMarker: string,
    rightMarker: string,
    options: ParserOptions = parserOptions,
) => {
    // Atomic clozes matter here, because they just transform multiline clozes to single line clozes

    // Simplest multiline clozes
    expect(
        parseT(
            ["", "some text before", `${leftMarker}deletion${rightMarker} test`, ""].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            ["some text before", `${leftMarker}deletion${rightMarker} test`].join("\n"),
            1,
            2,
        ],
    ]);

    expect(
        parseT(
            ["", `${leftMarker}deletion${rightMarker} test`, "some text after", ""].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion${rightMarker} test`, "some text after"].join("\n"),
            1,
            2,
        ],
    ]);

    expect(
        parseT(
            [
                "",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
            ].join("\n"),
            1,
            3,
        ],
    ]);

    // Multiline cloze with schedule
    expect(
        parseT(
            [
                "",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            1,
            4,
        ],
    ]);

    expect(
        parseT(
            [
                "",
                "some text before",
                `test ${leftMarker}deletion${rightMarker}`,
                "some text after <!--SR:2022-08-11,4,270-->",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "some text before",
                `test ${leftMarker}deletion${rightMarker}`,
                "some text after <!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            1,
            3,
        ],
    ]);

    expect(
        parseT(
            [
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker}`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker}`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            1,
            6,
        ],
    ]);

    expect(
        parseT(
            [
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "",
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
            ].join("\n"),
            1,
            5,
        ],
    ]);

    expect(
        parseT(
            [
                "",
                "some text before",
                "",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "",
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
            ].join("\n"),
            3,
            6,
        ],
    ]);

    // Multiline cloze with schedule and 2 clozes on the same line

    expect(
        parseT(
            [
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            1,
            6,
        ],
    ]);

    // Multiple multiline clozes with schedule and 2 clozes on the same line mixed with text
    expect(
        parseT(
            [
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "some text after",
                "",
                "",
                "",
                "",
                "",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "some text after",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            1,
            6,
        ],
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            10,
            15,
        ],
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "some text after",
            ].join("\n"),
            17,
            22,
        ],
        [
            CardType.Cloze,
            [
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "some text after",
            ].join("\n"),
            28,
            31,
        ],
    ]);

    expect(
        parseT(
            [
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "some text after",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "some text after",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            1,
            6,
        ],
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            10,
            15,
        ],
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "some text after",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "some text after",
            ].join("\n"),
            17,
            27,
        ],
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            29,
            34,
        ],
    ]);

    // Multiple multiline clozes with schedule and 2 clozes on the same line mixed with text and mixed with rouge sr comments

    expect(
        parseT(
            [
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "some text after",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "some text after",
                "some text before",
                `some text before ${leftMarker}deletion${rightMarker} test some text before ${leftMarker}deletion${rightMarker} test some text before`,
                "some text after",
                "some text after",
                "some text after",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            1,
            6,
        ],
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            10,
            15,
        ],
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "some text after",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "some text after",
                "some text before",
                `some text before ${leftMarker}deletion${rightMarker} test some text before ${leftMarker}deletion${rightMarker} test some text before`,
                "some text after",
                "some text after",
                "some text after",
            ].join("\n"),
            17,
            32,
        ],
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            34,
            39,
        ],
    ]);

    // Two multiline clozes right after each other
    expect(
        parseT(
            [
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            1,
            6,
        ],
        [
            CardType.Cloze,
            [
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            7,
            12,
        ],
    ]);

    // Wrong formatting tests
    expect(
        parseT(
            [
                `${leftMarker}deletion test`,
                "<!--SR:2021-08-11,4,270-->",
                "",
                `${leftMarker}deletion2${rightMarker} test`,
                "<!--SR:2021-08-11,4,270-->",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion2${rightMarker} test`, "<!--SR:2021-08-11,4,270-->"].join("\n"),
            3,
            4,
        ],
    ]);

    expect(
        parseT(
            [
                `deletion test${rightMarker}`,
                "<!--SR:2021-08-11,4,270-->",
                "",
                `deletion test${rightMarker}`,
                "",
                `${leftMarker}deletion2${rightMarker} test`,
                "<!--SR:2021-08-11,4,270-->",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion2${rightMarker} test`, "<!--SR:2021-08-11,4,270-->"].join("\n"),
            5,
            6,
        ],
    ]);

    expect(
        parseT(
            ["", `${leftMarker}deletion`, ` test${rightMarker}`, "Some text after", ""].join("\n"),
            options,
        ),
    ).toEqual([]);

    if (rightMarker.length - 1 !== 0) {
        expect(
            parseT(
                [
                    "",
                    "Some text before",
                    `lorem ipsum ${leftMarker}dolor won${rightMarker.substring(0, rightMarker.length - 1)}`,
                    "Some text after",
                    "<!--SR:2021-08-11,4,270-->",
                    "",
                ].join("\n"),
                options,
            ),
        ).toEqual([]);
    }

    // pattern with hint and sequencer in footnotes
    expect(
        parseT(
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language]`,
                "Some text after",
                "<!--SR:2021-08-11,4,270-->",
            ].join("\n"),
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: [`${leftMarker}answer${rightMarker}[^\\[hint\\]][\\[^123\\]]`],
                useAtomicClozes: false,
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language]`,
                "Some text after",
                "<!--SR:2021-08-11,4,270-->",
            ].join("\n"),
            0,
            2,
        ],
    ]);

    expect(
        parseT(
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`,
                "Some text after",
            ].join("\n"),
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: [`${leftMarker}answer${rightMarker}[^\\[hint\\]][\\[^123\\]]`],
                useAtomicClozes: false,
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`,
                "Some text after",
            ].join("\n"),
            0,
            1,
        ],
    ]);

    expect(
        parseT(
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^a]`,
                "Some text after",
                "<!--SR:2021-08-11,4,270-->",
            ].join("\n"),
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: [`${leftMarker}answer${rightMarker}[^\\[hint\\]][\\[^123\\]]`],
                useAtomicClozes: false,
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^a]`,
                "Some text after",
                "<!--SR:2021-08-11,4,270-->",
            ].join("\n"),
            0,
            2,
        ],
    ]);
};

const execMultiLineClozeCardsWithAtomicClozesTest = (
    leftMarker: string,
    rightMarker: string,
    options: ParserOptions = parserOptions,
) => {
    // Atomic clozes matter here, because they just transform multiline clozes to single line clozes

    // Simplest multiline clozes
    expect(
        parseT(
            ["", "some text before", `${leftMarker}deletion${rightMarker} test`, ""].join("\n"),
            options,
        ),
    ).toEqual([[CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 2, 2]]);

    expect(
        parseT(
            ["", `${leftMarker}deletion${rightMarker} test`, "some text after", ""].join("\n"),
            options,
        ),
    ).toEqual([[CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 1, 1]]);

    expect(
        parseT(
            [
                "",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([[CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 2, 2]]);

    // Multiline cloze with schedule
    expect(
        parseT(
            [
                "",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([[CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 2, 2]]);

    expect(
        parseT(
            [
                "",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion${rightMarker} test`, "<!--SR:2022-08-11,4,270-->"].join("\n"),
            2,
            3,
        ],
    ]);

    expect(
        parseT(
            [
                "",
                "some text before",
                `test ${leftMarker}deletion${rightMarker}`,
                "some text after <!--SR:2022-08-11,4,270-->",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([[CardType.Cloze, [`test ${leftMarker}deletion${rightMarker}`].join("\n"), 2, 2]]);

    expect(
        parseT(
            [
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker}`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([[CardType.Cloze, [`${leftMarker}deletion${rightMarker}`].join("\n"), 3, 3]]);

    expect(
        parseT(
            [
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "",
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([[CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 3, 3]]);

    expect(
        parseT(
            [
                "",
                "some text before",
                "",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "",
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([[CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 4, 4]]);

    // Multiline cloze with schedule and 2 clozes on the same line

    expect(
        parseT(
            [
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
            ].join("\n"),
            3,
            3,
        ],
    ]);

    // Multiple multiline clozes with schedule and 2 clozes on the same line mixed with text
    expect(
        parseT(
            [
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "some text after",
                "",
                "",
                "",
                "",
                "",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "some text after",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 3, 3],
        [
            CardType.Cloze,
            [
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
            ].join("\n"),
            12,
            12,
        ],
        [
            CardType.Cloze,
            [
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
            ].join("\n"),
            19,
            19,
        ],
        [CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 28, 28],
    ]);

    expect(
        parseT(
            [
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "some text after",
                "some text after",
                "",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                `${leftMarker}deletion${rightMarker} test`,
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "some text after",
                "some text before",
                "some text after",
                "some text after",
                "some text after",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "some text after",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion${rightMarker} test`, "<!--SR:2022-08-11,4,270-->"].join("\n"),
            3,
            4,
        ],
        [
            CardType.Cloze,
            [
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
            ].join("\n"),
            12,
            12,
        ],
        [
            CardType.Cloze,
            [
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
            ].join("\n"),
            19,
            19,
        ],
        [
            CardType.Cloze,
            [`${leftMarker}deletion${rightMarker} test`, "<!--SR:2022-08-11,4,270-->"].join("\n"),
            20,
            21,
        ],
        [
            CardType.Cloze,
            [
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
            ].join("\n"),
            31,
            31,
        ],
    ]);

    // Multiple multiline clozes with schedule and 2 clozes on the same line mixed with text and mixed with rouge sr comments

    expect(
        parseT(
            [
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "some text after",
                "",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "<!--SR:2022-08-11,4,270-->",
                `${leftMarker}deletion${rightMarker} test`,
                `some text before ${leftMarker}deletion${rightMarker} test some text before ${leftMarker}deletion${rightMarker} test some text before`,
                "some text after",
                "some text after",
                "some text after",
                "some text before",
                "some text after",
                "some text after",
                "some text after",
                "some text before",
                "some text after",
                "some text after",
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "some text after",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 3, 3],
        [
            CardType.Cloze,
            [
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
            ].join("\n"),
            12,
            12,
        ],
        [
            CardType.Cloze,
            [
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            19,
            20,
        ],
        [CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 21, 21],
        [
            CardType.Cloze,
            [
                `some text before ${leftMarker}deletion${rightMarker} test some text before ${leftMarker}deletion${rightMarker} test some text before`,
            ].join("\n"),
            22,
            22,
        ],
        [
            CardType.Cloze,
            [
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
            ].join("\n"),
            36,
            36,
        ],
    ]);

    // Two multiline clozes right after each other
    expect(
        parseT(
            [
                "",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
                "some text before",
                "some text before",
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
                "some text after",
                "some text after",
                "<!--SR:2022-08-11,4,270-->",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [CardType.Cloze, [`${leftMarker}deletion${rightMarker} test`].join("\n"), 3, 3],
        [
            CardType.Cloze,
            [
                `${leftMarker}deletion${rightMarker} test & ${leftMarker}deletion2${rightMarker} test2`,
            ].join("\n"),
            9,
            9,
        ],
    ]);

    // Wrong formatting tests
    expect(
        parseT(
            [
                `${leftMarker}deletion test`,
                "<!--SR:2021-08-11,4,270-->",
                "",
                `${leftMarker}deletion2${rightMarker} test`,
                "<!--SR:2021-08-11,4,270-->",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion2${rightMarker} test`, "<!--SR:2021-08-11,4,270-->"].join("\n"),
            3,
            4,
        ],
    ]);

    expect(
        parseT(
            [
                `deletion test${rightMarker}`,
                "<!--SR:2021-08-11,4,270-->",
                "",
                `deletion test${rightMarker}`,
                "",
                `${leftMarker}deletion2${rightMarker} test`,
                "<!--SR:2021-08-11,4,270-->",
            ].join("\n"),
            options,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [`${leftMarker}deletion2${rightMarker} test`, "<!--SR:2021-08-11,4,270-->"].join("\n"),
            5,
            6,
        ],
    ]);

    expect(
        parseT(
            ["", `${leftMarker}deletion`, ` test${rightMarker}`, "Some text after", ""].join("\n"),
            options,
        ),
    ).toEqual([]);

    if (rightMarker.length - 1 !== 0) {
        expect(
            parseT(
                [
                    "",
                    "Some text before",
                    `lorem ipsum ${leftMarker}dolor won${rightMarker.substring(0, rightMarker.length - 1)}`,
                    "Some text after",
                    "<!--SR:2021-08-11,4,270-->",
                    "",
                ].join("\n"),
                options,
            ),
        ).toEqual([]);
    }

    // pattern with hint and sequencer in footnotes
    expect(
        parseT(
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language]`,
                "Some text after",
                "<!--SR:2021-08-11,4,270-->",
            ].join("\n"),
            {
                ...options,
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: [`${leftMarker}answer${rightMarker}[^\\[hint\\]][\\[^123\\]]`],
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language]`,
            ].join("\n"),
            0,
            0,
        ],
    ]);

    expect(
        parseT(
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`,
                "Some text after",
            ].join("\n"),
            {
                ...options,
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: [`${leftMarker}answer${rightMarker}[^\\[hint\\]][\\[^123\\]]`],
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`,
            ].join("\n"),
            0,
            0,
        ],
    ]);

    expect(
        parseT(
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^a]`,
                "Some text after",
                "<!--SR:2021-08-11,4,270-->",
            ].join("\n"),
            {
                ...options,
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: [`${leftMarker}answer${rightMarker}[^\\[hint\\]][\\[^123\\]]`],
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^a]`,
            ].join("\n"),
            0,
            0,
        ],
    ]);
};

test("Test parsing of single line cloze cards", () => {
    // ==highlights==
    execSingleLineClozeCardsTestWithMarker("==", "==");

    // **bolded**
    execSingleLineClozeCardsTestWithMarker("**", "**");

    // {{curly}}
    execSingleLineClozeCardsTestWithMarker("{{", "}}");

    // all disabled
    expect(
        parseT("cloze {{deletion}} test and **deletion** ==another deletion==!", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [],
            useAtomicClozes: false,
        }),
    ).toEqual([]);

    // custom cloze formats
    // Anki-like pattern
    //  Notice that the single line separators have to be different
    expect(
        parseT("Brazilians speak {{Portuguese::language}}", {
            singleLineCardSeparator: "=",
            singleLineReversedCardSeparator: "==",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["{{[123::]answer[::hint]}}"],
            useAtomicClozes: false,
        }),
    ).toEqual([[CardType.Cloze, "Brazilians speak {{Portuguese::language}}", 0, 0]]);
    expect(
        parseT(
            "Brazilians speak {{a::Portuguese}} & Brazilians speak {{a::Portuguese::language}}",
            {
                singleLineCardSeparator: "=",
                singleLineReversedCardSeparator: "==",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["{{[123::]answer[::hint]}}"],
                useAtomicClozes: false,
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            "Brazilians speak {{a::Portuguese}} & Brazilians speak {{a::Portuguese::language}}",
            0,
            0,
        ],
    ]);
});

test("Test parsing of multiline cloze cards", () => {
    execMultiLineClozeCardsTest("==", "==");
    execMultiLineClozeCardsTest("**", "**");
    execMultiLineClozeCardsTest("{{", "}}");
});

test("Test parsing of multiline cloze cards with atomic clozes enabled", () => {
    execMultiLineClozeCardsWithAtomicClozesTest("==", "==", {
        ...parserOptions,
        useAtomicClozes: true,
    });
    execMultiLineClozeCardsWithAtomicClozesTest("**", "**", {
        ...parserOptions,
        useAtomicClozes: true,
    });
    execMultiLineClozeCardsWithAtomicClozesTest("{{", "}}", {
        ...parserOptions,
        useAtomicClozes: true,
    });
});
