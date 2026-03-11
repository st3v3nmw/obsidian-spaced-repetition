import { CardType } from "src/card/questions/question";
import { ParserOptions } from "src/parser/parser-data-structure";

import { parserOptions, parseT } from "../helpers/unit-test-parser-helper";

const execSingleLineClozeCardsTestWithMarker = (leftMarker: string, rightMarker: string, options: ParserOptions = parserOptions) => {
    // Same tests apply for all markers

    const optionsWithAtomicClozes: ParserOptions = {
        ...options,
        useAtomicClozes: true,
    };

    const optionsWithNoAtomicClozes: ParserOptions = {
        ...options,
    };

    // standard clozes
    expect(parseT([
        `${leftMarker}deletion${rightMarker} test`
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
    ].join("\n"), 0, 0],
    ]);

    expect(parseT([
        `${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`,
    ].join("\n"), 0, 0],
    ]);

    expect(parseT([
        "some text before",
        `${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`,
        "<!--SR:2022-08-11,4,270-->"
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`,
    ].join("\n"), 1, 1],
    ]);

    expect(parseT([
        "some text before",
        `${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`,
        "<!--SR:2022-08-11,4,270-->"
    ].join("\n"), optionsWithAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`,
    ].join("\n"), 1, 1],
    ]);

    expect(parseT([
        `${leftMarker}deletion${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), 0, 1],
    ]);

    expect(parseT([
        "Text before",
        `${leftMarker}deletion${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), 1, 2],
    ]);

    expect(parseT([
        "Text before",
        `${leftMarker}deletion${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        `${leftMarker}deletion2${rightMarker} test2`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        `${leftMarker}deletion3${rightMarker} test3`,
        "",
        "<!--SR:2021-08-11,4,270-->",
        "",
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->",
    ].join("\n"), 1, 2],
    [CardType.Cloze, [
        `${leftMarker}deletion2${rightMarker} test2`,
        "<!--SR:2021-08-11,4,270-->",
    ].join("\n"), 4, 5],
    [CardType.Cloze, [
        `${leftMarker}deletion3${rightMarker} test3`,
    ].join("\n"), 7, 7],
    ]);

    expect(parseT([
        "Text before",
        `${leftMarker}deletion${rightMarker} test`,
        "Text after",
        `${leftMarker}deletion2${rightMarker} test2`,
        "Text after2",
        "<!--SR:2021-08-11,4,270-->",
        "",
        `${leftMarker}deletion3${rightMarker} test3 ------> ${leftMarker}deletion4${rightMarker} test4`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
    ].join("\n"), 1, 1],
    [CardType.Cloze, [
        `${leftMarker}deletion2${rightMarker} test2`,
    ].join("\n"), 3, 3],
    [CardType.Cloze, [
        `${leftMarker}deletion3${rightMarker} test3 ------> ${leftMarker}deletion4${rightMarker} test4`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), 7, 8],
    ]);

    expect(parseT([
        `${leftMarker}deletion${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), 0, 1],
    ]);

    expect(parseT([
        "Text before",
        `${leftMarker}deletion${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->",
        "Text after",
    ].join("\n"), optionsWithAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), 1, 3],
    ]);

    expect(parseT([
        "Text before",
        `${leftMarker}deletion${rightMarker} test`,
        "Text after",
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
    ].join("\n"), 1, 1],
    ]);


    expect(parseT([
        "Text before",
        `${leftMarker}deletion${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        `${leftMarker}deletion2${rightMarker} test2`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        `${leftMarker}deletion3${rightMarker} test3`,
        "",
        "<!--SR:2021-08-11,4,270-->",
        "",
    ].join("\n"), optionsWithAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->",
    ].join("\n"), 1, 2],
    [CardType.Cloze, [
        `${leftMarker}deletion2${rightMarker} test2`,
        "<!--SR:2021-08-11,4,270-->",
    ].join("\n"), 4, 5],
    [CardType.Cloze, [
        `${leftMarker}deletion3${rightMarker} test3`,
    ].join("\n"), 7, 7],
    ]);

    expect(parseT([
        "Text before",
        `${leftMarker}deletion${rightMarker} test`,
        "Text after",
        `${leftMarker}deletion2${rightMarker} test2`,
        "Text after2",
        "<!--SR:2021-08-11,4,270-->",
        "",
        `${leftMarker}deletion3${rightMarker} test3`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
    ].join("\n"), 1, 1],
    [CardType.Cloze, [
        `${leftMarker}deletion2${rightMarker} test2`,
    ].join("\n"), 3, 3],
    [CardType.Cloze, [
        `${leftMarker}deletion3${rightMarker} test3`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), 7, 8],
    ]);

    expect(parseT([
        "Text before",
        `${leftMarker}deletion${rightMarker} test`,
        "Text after",
        `${leftMarker}deletion2${rightMarker} test2`,
        "Text after2",
        "<!--SR:2021-08-11,4,270-->",
        "",
        `${leftMarker}deletion3${rightMarker} test3 ------> ${leftMarker}deletion4${rightMarker} test4`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
    ].join("\n"), 1, 1],
    [CardType.Cloze, [
        `${leftMarker}deletion2${rightMarker} test2`,
    ].join("\n"), 3, 3],
    [CardType.Cloze, [
        `${leftMarker}deletion3${rightMarker} test3 ------> ${leftMarker}deletion4${rightMarker} test4`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), 7, 8],
    ]);

    // Wrong formatting tests
    expect(parseT(leftMarker + " srdf ", optionsWithNoAtomicClozes)).toEqual([]);

    expect(parseT("srdf " + rightMarker, optionsWithNoAtomicClozes)).toEqual([]);

    expect(parseT("lorem ipsum " + leftMarker + "p\ndolor won" + rightMarker, optionsWithNoAtomicClozes)).toEqual([]);

    if (rightMarker.length - 1 !== 0) {
        expect(parseT("lorem ipsum " + leftMarker + "dolor won" + rightMarker.substring(0, rightMarker.length - 1), optionsWithNoAtomicClozes)).toEqual([]);
    }

    expect(parseT(leftMarker + " srdf ", optionsWithAtomicClozes)).toEqual([]);

    expect(parseT("srdf " + rightMarker, optionsWithAtomicClozes)).toEqual([]);

    expect(parseT("lorem ipsum " + leftMarker + "p\ndolor won" + rightMarker, optionsWithAtomicClozes)).toEqual([]);

    if (rightMarker.length - 1 !== 0) {
        expect(parseT("lorem ipsum " + leftMarker + "dolor won" + rightMarker.substring(0, rightMarker.length - 1), optionsWithAtomicClozes)).toEqual([]);
    }

    // pattern with hint and sequencer in footnotes
    expect(parseT([
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

        }),
    ).toEqual([[CardType.Cloze, [
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language]`
    ].join("\n"), 0, 0],
    ]);

    expect(parseT([
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
    )).toEqual([[CardType.Cloze, [
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`
    ].join("\n"), 0, 0],
    ]);

    expect(parseT([
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
        [CardType.Cloze, [
            `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`
        ].join("\n"), 0, 0],
    ]);

    // Atomic clozes & hints

    expect(parseT([
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language]`,
    ].join("\n"),
        {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [`${leftMarker}answer${rightMarker}[^\\[hint\\]][\\[^123\\]]`],
            useAtomicClozes: true,

        }),
    ).toEqual([[CardType.Cloze, [
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language]`
    ].join("\n"), 0, 0],
    ]);

    expect(parseT([
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`,
    ].join("\n"),
        {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [`${leftMarker}answer${rightMarker}[^\\[hint\\]][\\[^123\\]]`],
            useAtomicClozes: true,
        },
    )).toEqual([[CardType.Cloze, [
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`
    ].join("\n"), 0, 0],
    ]);

    expect(parseT([
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`,
    ].join("\n"),
        {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [`${leftMarker}answer${rightMarker}[^\\[hint\\]][\\[^123\\]]`],
            useAtomicClozes: true,
        },
    ),
    ).toEqual([
        [CardType.Cloze, [
            `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`
        ].join("\n"), 0, 0],
    ]);

    // MARKER highlights MARKER turned off
    expect(
        parseT("cloze " + `${leftMarker}deletion${rightMarker} test`, {
            ...options,
            useAtomicClozes: false,
            clozePatterns: ["==[123;;]answer[;;hint]==", "**[123;;]answer[;;hint]**", "{{[123;;]answer[;;hint]}}"].filter((pattern) => !pattern.includes(leftMarker) && pattern.includes(rightMarker)),
        }),
    ).toEqual([]);

    expect(
        parseT("cloze " + `${leftMarker}deletion${rightMarker} test`, {
            ...options,
            useAtomicClozes: true,
            clozePatterns: ["==[123;;]answer[;;hint]==", "**[123;;]answer[;;hint]**", "{{[123;;]answer[;;hint]}}"].filter((pattern) => !pattern.includes(leftMarker) && pattern.includes(rightMarker)),
        }),
    ).toEqual([]);
};

const execMultiLineClozeCardsTest = (leftMarker: string, rightMarker: string, options: ParserOptions = parserOptions) => {
    const optionsWithAtomicClozes: ParserOptions = {
        ...options,
        useAtomicClozes: true,
    };

    const optionsWithNoAtomicClozes: ParserOptions = {
        ...options,
    };

    // standard clozes
    expect(parseT([
        "some text before",
        `${leftMarker}deletion${rightMarker} test`,
        "some text after",
        "",
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
        "some text after",
    ].join("\n"), 1, 2],
    ]);

    expect(parseT([
        "some text before",
        `${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`,
        "Some text after",
        "<!--SR:2022-08-11,4,270-->"
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`,
    ].join("\n"), 1, 1],
    ]);

    expect(parseT([
        "",
        "Text before",
        `${leftMarker}deletion1${rightMarker} test1`,
        "Some text in the middle",
        `${leftMarker}deletion2${rightMarker} test2`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        "text after",
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion1${rightMarker} test1`,
        "Some text in the middle",
        `${leftMarker}deletion2${rightMarker} test2`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), 2, 5],
    ]);

    expect(parseT([
        "",
        "Text before",
        "Text before",
        "",
        "<!--SR:2025-08-11,4,270-->",
        "Text before",
        `${leftMarker}deletion1${rightMarker} test1`,
        "Some text in the middle",
        `${leftMarker}deletion2${rightMarker} test2 & ${leftMarker}deletion3${rightMarker} test3`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        "text after",
        "<!--SR:2023-08-11,4,270-->",
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion1${rightMarker} test1`,
        "Some text in the middle",
        `${leftMarker}deletion2${rightMarker} test2 & ${leftMarker}deletion3${rightMarker} test3`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), 6, 9],
    ]);

    expect(parseT([
        "",
        "Text before",
        "Text before",
        "",
        "<!--SR:2025-08-11,4,270-->",
        "Text before",
        `${leftMarker}deletion1${rightMarker} test1`,
        "Some text in the middle",
        `${leftMarker}deletion2${rightMarker} test2 & ${leftMarker}deletion3${rightMarker} test3`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        "text after",
        "",
        "<!--SR:2023-08-11,4,270-->",
        "",
        "",
        "Random text",
        "",
        "",
        `${leftMarker}deletion1${rightMarker} test1`,
        "Some text in the middle",
        `${leftMarker}deletion2${rightMarker} test2 & ${leftMarker}deletion3${rightMarker} test3`,
        "Some text after",
        "Some text after",
        "Some text after",
        "Some text after",
        "Some text after",
        "<!--SR:2021-08-11,4,270-->",
        "Random text",
        "",
        "",
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion1${rightMarker} test1`,
        "Some text in the middle",
        `${leftMarker}deletion2${rightMarker} test2 & ${leftMarker}deletion3${rightMarker} test3`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), 6, 9],
    [CardType.Cloze, [
        `${leftMarker}deletion1${rightMarker} test1`,
        "Some text in the middle",
        `${leftMarker}deletion2${rightMarker} test2 & ${leftMarker}deletion3${rightMarker} test3`,
        "Some text after",
        "Some text after",
        "Some text after",
        "Some text after",
        "Some text after",
        "<!--SR:2021-08-11,4,270-->",
    ].join("\n"), 19, 27],
    ]);

    // Atomic clozes resets everything

    expect(parseT([
        "some text before",
        `${leftMarker}deletion${rightMarker} test`,
        "some text after",
        "",
    ].join("\n"), optionsWithAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
    ].join("\n"), 1, 1],
    ]);

    expect(parseT([
        "some text before",
        `${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`,
        "Some text after",
        "<!--SR:2022-08-11,4,270-->"
    ].join("\n"), optionsWithAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`,
    ].join("\n"), 1, 1],
    ]);

    expect(parseT([
        "",
        "Text before",
        `${leftMarker}deletion1${rightMarker} test1`,
        "Some text in the middle",
        `${leftMarker}deletion2${rightMarker} test2`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        "text after",
    ].join("\n"), optionsWithAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion1${rightMarker} test1`,
    ].join("\n"), 2, 2],
    [CardType.Cloze, [
        `${leftMarker}deletion2${rightMarker} test2`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), 4, 5],
    ]);

    expect(parseT([
        "",
        "Text before",
        "Text before",
        "",
        "<!--SR:2025-08-11,4,270-->",
        "Text before",
        `${leftMarker}deletion1${rightMarker} test1`,
        "Some text in the middle",
        `${leftMarker}deletion2${rightMarker} test2 & ${leftMarker}deletion3${rightMarker} test3`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        "text after",
        "<!--SR:2023-08-11,4,270-->",
    ].join("\n"), optionsWithAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion1${rightMarker} test1`,
    ].join("\n"), 6, 6],
    [CardType.Cloze, [
        `${leftMarker}deletion2${rightMarker} test2 & ${leftMarker}deletion3${rightMarker} test3`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), 8, 9],
    ]);

    expect(parseT([
        "",
        "Text before",
        "Text before",
        "",
        "<!--SR:2025-08-11,4,270-->",
        "Text before",
        `${leftMarker}deletion1${rightMarker} test1`,
        "Some text in the middle",
        `${leftMarker}deletion2${rightMarker} test2 & ${leftMarker}deletion3${rightMarker} test3`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        "text after",
        "",
        "<!--SR:2023-08-11,4,270-->",
        "",
        "",
        "Random text",
        "",
        "",
        `${leftMarker}deletion1${rightMarker} test1`,
        "Some text in the middle",
        `${leftMarker}deletion2${rightMarker} test2 & ${leftMarker}deletion3${rightMarker} test3`,
        "Some text after",
        "Some text after",
        "Some text after",
        "Some text after",
        "Some text after",
        "<!--SR:2021-08-11,4,270-->",
        "Random text",
        "",
        "",
    ].join("\n"), optionsWithAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion1${rightMarker} test1`,
    ].join("\n"), 6, 6],
    [CardType.Cloze, [
        `${leftMarker}deletion2${rightMarker} test2 & ${leftMarker}deletion3${rightMarker} test3`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), 8, 9],
    [CardType.Cloze, [
        `${leftMarker}deletion1${rightMarker} test1`,
    ].join("\n"), 19, 19],
    [CardType.Cloze, [
        `${leftMarker}deletion2${rightMarker} test2 & ${leftMarker}deletion3${rightMarker} test3`,
    ].join("\n"), 21, 21],
    ]);

    // Wrong formatting tests
    expect(parseT([
        `${leftMarker}deletion test`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        `${leftMarker}deletion2${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([
        [CardType.Cloze, [
            `${leftMarker}deletion2${rightMarker} test`,
            "<!--SR:2021-08-11,4,270-->"
        ].join("\n"), 3, 4],
    ]);

    expect(parseT([
        `deletion test${rightMarker}`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        `deletion test${rightMarker}`,
        "",
        `${leftMarker}deletion2${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([
        [CardType.Cloze, [
            `${leftMarker}deletion2${rightMarker} test`,
            "<!--SR:2021-08-11,4,270-->"
        ].join("\n"), 5, 6],
    ]);

    expect(parseT([
        "",
        `${leftMarker}deletion`,
        ` test${rightMarker}`,
        "Some text after",
        "",
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([
    ]);

    if (rightMarker.length - 1 !== 0) {
        expect(parseT([
            `lorem ipsum ${leftMarker}dolor won${rightMarker.substring(0, rightMarker.length - 1)}`,
            "<!--SR:2021-08-11,4,270-->",
            "",
        ].join("\n"), optionsWithNoAtomicClozes)).toEqual([]);
    }

    expect(parseT([
        `${leftMarker}deletion test`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        `${leftMarker}deletion2${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithAtomicClozes)).toEqual([
        [CardType.Cloze, [
            `${leftMarker}deletion2${rightMarker} test`,
            "<!--SR:2021-08-11,4,270-->"
        ].join("\n"), 3, 4],
    ]);

    expect(parseT([
        `deletion test${rightMarker}`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        `deletion test${rightMarker}`,
        "",
        `${leftMarker}deletion2${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithAtomicClozes)).toEqual([
        [CardType.Cloze, [
            `${leftMarker}deletion2${rightMarker} test`,
            "<!--SR:2021-08-11,4,270-->"
        ].join("\n"), 5, 6],
    ]);

    expect(parseT([
        "",
        `${leftMarker}deletion`,
        ` test${rightMarker}`,
        "Some text after",
        "",
    ].join("\n"), optionsWithAtomicClozes)).toEqual([
    ]);

    if (rightMarker.length - 1 !== 0) {
        expect(parseT([
            `lorem ipsum ${leftMarker}dolor won${rightMarker.substring(0, rightMarker.length - 1)}`,
            "<!--SR:2021-08-11,4,270-->",
            "",
        ].join("\n"), optionsWithAtomicClozes)).toEqual([]);
    }

    // pattern with hint and sequencer in footnotes
    expect(parseT([
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

        }),
    ).toEqual([[CardType.Cloze, [
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language]`,
        "Some text after",
        "<!--SR:2021-08-11,4,270-->",
    ].join("\n"), 0, 2],
    ]);

    expect(parseT([
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
    )).toEqual([[CardType.Cloze, [
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`,
        "Some text after",
    ].join("\n"), 0, 1],
    ]);

    expect(parseT([
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
        [CardType.Cloze, [
            `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^a]`,
            "Some text after",
            "<!--SR:2021-08-11,4,270-->",
        ].join("\n"), 0, 2],
    ]);

    // Atomic clozes & hints

    expect(parseT([
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
            useAtomicClozes: true,

        }),
    ).toEqual([[CardType.Cloze, [
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language]`,
    ].join("\n"), 0, 0],
    ]);

    expect(parseT([
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
            useAtomicClozes: true,
        },
    )).toEqual([[CardType.Cloze, [
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`,
    ].join("\n"), 0, 0],
    ]);

    expect(parseT([
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^a]`,
    ].join("\n"),
        {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [`${leftMarker}answer${rightMarker}[^\\[hint\\]][\\[^123\\]]`],
            useAtomicClozes: true,
        },
    ),
    ).toEqual([
        [CardType.Cloze, [
            `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^a]`,
        ].join("\n"), 0, 0],
    ]);

    // MARKER highlights MARKER turned off
    expect(
        parseT([
            `cloze ${leftMarker}deletion${rightMarker} test`,
            "<!--SR:2021-08-11,4,270-->",
            "",
        ].join("\n"), {
            ...options,
            useAtomicClozes: false,
            clozePatterns: ["==[123;;]answer[;;hint]==", "**[123;;]answer[;;hint]**", "{{[123;;]answer[;;hint]}}"].filter((pattern) => !pattern.includes(leftMarker) && pattern.includes(rightMarker)),
        }),
    ).toEqual([]);

    expect(
        parseT([
            `cloze ${leftMarker}deletion${rightMarker} test`,
            "<!--SR:2021-08-11,4,270-->",
            "",
        ].join("\n"), {
            ...options,
            useAtomicClozes: true,
            clozePatterns: ["==[123;;]answer[;;hint]==", "**[123;;]answer[;;hint]**", "{{[123;;]answer[;;hint]}}"].filter((pattern) => !pattern.includes(leftMarker) && pattern.includes(rightMarker)),
        }),
    ).toEqual([]);
};

const execClozeCardsWithEndMarkerTest = (leftMarker: string, rightMarker: string, options: ParserOptions = parserOptions) => {
    const optionsWithAtomicClozes: ParserOptions = {
        ...options,
        multilineCardEndMarker: "+++",
        useAtomicClozes: true,
    };

    const optionsWithNoAtomicClozes: ParserOptions = {
        ...options,
        multilineCardEndMarker: "+++",
    };

    // standard clozes
    expect(parseT([
        "some text before",
        `${leftMarker}deletion${rightMarker} test`,
        "some text after",
        "",
        "+++"
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
        "some text after",
        "",
        "+++"
    ].join("\n"), 1, 4],
    ]);

    expect(parseT([
        "some text before",
        `${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`,
        "+++",
        "Some text after",
        "<!--SR:2022-08-11,4,270-->",
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test <!--SR:2021-08-11,4,270-->`,
        "+++",
    ].join("\n"), 1, 2],
    ]);

    expect(parseT([
        "some text before",
        `${leftMarker}deletion${rightMarker} test`,
        "Some text after",
        "+++",
        "<!--SR:2022-08-11,4,270-->",
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
        "Some text after",
        "+++",
    ].join("\n"), 1, 3],
    ]);

    expect(parseT([
        "some text before",
        `${leftMarker}deletion${rightMarker} test`,
        "Some text after",
        "",
        "+++",
        "<!--SR:2022-08-11,4,270-->",
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
        "Some text after",
        "",
        "+++",
    ].join("\n"), 1, 4],
    ]);

    expect(parseT([
        "some text before",
        `${leftMarker}deletion${rightMarker} test`,
        "Some text after",
        "",
        "Some text after",
        "+++",
        "<!--SR:2022-08-11,4,270-->",
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([[CardType.Cloze, [
        `${leftMarker}deletion${rightMarker} test`,
        "Some text after",
        "",
        "Some text after",
        "+++",
    ].join("\n"), 1, 5],
    ]);

    // Cases where end marker isnt used
    // TODO: Fix this test

    // Cases where end marker is partially used
    // TODO: Fix this test

    // Cases where end marker is used and where sr comment placement leads to edge cases
    // TODO: Fix this test

    // Cases where end marker is empty
    // TODO: Fix this test

    // Wrong formatting tests with end marker
    // TODO: Fix this test
    expect(parseT([
        `${leftMarker}deletion test`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        `${leftMarker}deletion2${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([
        [CardType.Cloze, [
            `${leftMarker}deletion2${rightMarker} test`,
            "<!--SR:2021-08-11,4,270-->"
        ].join("\n"), 3, 4],
    ]);

    expect(parseT([
        `deletion test${rightMarker}`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        `deletion test${rightMarker}`,
        "",
        `${leftMarker}deletion2${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([
        [CardType.Cloze, [
            `${leftMarker}deletion2${rightMarker} test`,
            "<!--SR:2021-08-11,4,270-->"
        ].join("\n"), 5, 6],
    ]);

    expect(parseT([
        "",
        `${leftMarker}deletion`,
        ` test${rightMarker}`,
        "Some text after",
        "",
    ].join("\n"), optionsWithNoAtomicClozes)).toEqual([
    ]);

    if (rightMarker.length - 1 !== 0) {
        expect(parseT([
            `lorem ipsum ${leftMarker}dolor won${rightMarker.substring(0, rightMarker.length - 1)}`,
            "<!--SR:2021-08-11,4,270-->",
            "",
        ].join("\n"), optionsWithNoAtomicClozes)).toEqual([]);
    }

    expect(parseT([
        `${leftMarker}deletion test`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        `${leftMarker}deletion2${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithAtomicClozes)).toEqual([
        [CardType.Cloze, [
            `${leftMarker}deletion2${rightMarker} test`,
            "<!--SR:2021-08-11,4,270-->"
        ].join("\n"), 3, 4],
    ]);

    expect(parseT([
        `deletion test${rightMarker}`,
        "<!--SR:2021-08-11,4,270-->",
        "",
        `deletion test${rightMarker}`,
        "",
        `${leftMarker}deletion2${rightMarker} test`,
        "<!--SR:2021-08-11,4,270-->"
    ].join("\n"), optionsWithAtomicClozes)).toEqual([
        [CardType.Cloze, [
            `${leftMarker}deletion2${rightMarker} test`,
            "<!--SR:2021-08-11,4,270-->"
        ].join("\n"), 5, 6],
    ]);

    expect(parseT([
        "",
        `${leftMarker}deletion`,
        ` test${rightMarker}`,
        "Some text after",
        "",
    ].join("\n"), optionsWithAtomicClozes)).toEqual([
    ]);

    if (rightMarker.length - 1 !== 0) {
        expect(parseT([
            `lorem ipsum ${leftMarker}dolor won${rightMarker.substring(0, rightMarker.length - 1)}`,
            "<!--SR:2021-08-11,4,270-->",
            "",
        ].join("\n"), optionsWithAtomicClozes)).toEqual([]);
    }

    // pattern with hint and sequencer in footnotes with end marker
    // TODO: Fix this test
    expect(parseT([
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

        }),
    ).toEqual([[CardType.Cloze, [
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language]`,
        "Some text after",
        "<!--SR:2021-08-11,4,270-->",
    ].join("\n"), 0, 2],
    ]);

    expect(parseT([
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
    )).toEqual([[CardType.Cloze, [
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`,
        "Some text after",
    ].join("\n"), 0, 1],
    ]);

    expect(parseT([
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
        [CardType.Cloze, [
            `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^a]`,
            "Some text after",
            "<!--SR:2021-08-11,4,270-->",
        ].join("\n"), 0, 2],
    ]);

    // Atomic clozes & hints with end marker
    // TODO: Fix this test

    expect(parseT([
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
            useAtomicClozes: true,

        }),
    ).toEqual([[CardType.Cloze, [
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language]`,
    ].join("\n"), 0, 0],
    ]);

    expect(parseT([
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
            useAtomicClozes: true,
        },
    )).toEqual([[CardType.Cloze, [
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^1]`,
    ].join("\n"), 0, 0],
    ]);

    expect(parseT([
        `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^a]`,
    ].join("\n"),
        {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [`${leftMarker}answer${rightMarker}[^\\[hint\\]][\\[^123\\]]`],
            useAtomicClozes: true,
        },
    ),
    ).toEqual([
        [CardType.Cloze, [
            `Brazilians speak ${leftMarker}Portuguese${rightMarker} & Brazilians speak ${leftMarker}Portuguese${rightMarker}^[language][^a]`,
        ].join("\n"), 0, 0],
    ]);

    // MARKER highlights MARKER turned off with end marker
    // TODO: Fix this test
    expect(
        parseT([
            `cloze ${leftMarker}deletion${rightMarker} test`,
            "<!--SR:2021-08-11,4,270-->",
            "",
        ].join("\n"), {
            ...options,
            useAtomicClozes: false,
            clozePatterns: ["==[123;;]answer[;;hint]==", "**[123;;]answer[;;hint]**", "{{[123;;]answer[;;hint]}}"].filter((pattern) => !pattern.includes(leftMarker) && pattern.includes(rightMarker)),
        }),
    ).toEqual([]);

    expect(
        parseT([
            `cloze ${leftMarker}deletion${rightMarker} test`,
            "<!--SR:2021-08-11,4,270-->",
            "",
        ].join("\n"), {
            ...options,
            useAtomicClozes: true,
            clozePatterns: ["==[123;;]answer[;;hint]==", "**[123;;]answer[;;hint]**", "{{[123;;]answer[;;hint]}}"].filter((pattern) => !pattern.includes(leftMarker) && pattern.includes(rightMarker)),
        }),
    ).toEqual([]);
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
        [CardType.Cloze, "Brazilians speak {{a::Portuguese}} & Brazilians speak {{a::Portuguese::language}}", 0, 0],
    ]);
});

test("Test parsing of multiline cloze cards", () => {
    execMultiLineClozeCardsTest("==", "==");
    execMultiLineClozeCardsTest("**", "**");
    execMultiLineClozeCardsTest("{{", "}}");
});

test("Test parsing of single line cloze cards with custom end marker", () => {

});

test("Test parsing of cloze cards with custom end marker", () => {
    execClozeCardsWithEndMarkerTest("==", "==");
    execClozeCardsWithEndMarkerTest("**", "**");
    execClozeCardsWithEndMarkerTest("{{", "}}");
});