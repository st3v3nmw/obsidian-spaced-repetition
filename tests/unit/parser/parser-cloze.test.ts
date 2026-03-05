import { CardType } from "src/card/questions/question";
import { ParserOptions } from "src/parser";

import { parserOptions, parseT } from "../helpers/unit-test-parser-helper";

const execSingleLineClozeCardsTestWithMarker = (leftMarker: string, rightMarker: string, options: ParserOptions = parserOptions) => {
    // Same tests apply for all markers

    // standard symbols
    expect(parseT(leftMarker + "deletion" + rightMarker + " test", parserOptions)).toEqual([
        [CardType.Cloze, leftMarker + "deletion" + rightMarker + " test", 0, 0],
    ]);

    expect(parseT(leftMarker + "deletion" + rightMarker + " test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, leftMarker + "deletion" + rightMarker + " test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT(leftMarker + "deletion" + rightMarker + " test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, leftMarker + "deletion" + rightMarker + " test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT(leftMarker + "this" + rightMarker + " is a " + leftMarker + "deletion" + rightMarker + "\n", parserOptions)).toEqual([
        [CardType.Cloze, leftMarker + "this" + rightMarker + " is a " + leftMarker + "deletion" + rightMarker, 0, 0],
    ]);

    expect(parseT(leftMarker + " srdf ", parserOptions)).toEqual([]);
    expect(parseT("srdf " + rightMarker, parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum " + leftMarker + "p\ndolor won" + rightMarker, parserOptions)).toEqual([]);
    if (rightMarker.length - 1 !== 0) {
        expect(parseT("lorem ipsum " + leftMarker + "dolor won" + rightMarker.substring(0, rightMarker.length - 1), parserOptions)).toEqual([]);
    }

    // pattern with hint and sequencer in footnotes
    expect(
        parseT("Brazilians speak " + leftMarker + "Portuguese" + rightMarker + " & Brazilians speak " + leftMarker + "Portuguese" + rightMarker + "^[language]", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [leftMarker + "answer" + rightMarker + "[^\\[hint\\]][\\[^123\\]]"],
        }),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak " + leftMarker + "Portuguese" + rightMarker + " & Brazilians speak " + leftMarker + "Portuguese" + rightMarker + "^[language]", 0, 0],
    ]);

    expect(
        parseT(
            "Brazilians speak " + leftMarker + "Portuguese" + rightMarker + " & Brazilians speak " + leftMarker + "Portuguese" + rightMarker + "^[language][^1]",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: [leftMarker + "answer" + rightMarker + "[^\\[hint\\]][\\[^123\\]]"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak " + leftMarker + "Portuguese" + rightMarker + " & Brazilians speak " + leftMarker + "Portuguese" + rightMarker + "^[language][^1]", 0, 0],
    ]);
    expect(
        parseT(
            "Brazilians speak " + leftMarker + "Portuguese" + rightMarker + " & Brazilians speak " + leftMarker + "Portuguese" + rightMarker + "^[language][^a]",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: [leftMarker + "answer" + rightMarker + "[^\\[hint\\]][\\[^123\\]]"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak " + leftMarker + "Portuguese" + rightMarker + " & Brazilians speak " + leftMarker + "Portuguese" + rightMarker + "^[language][^a]", 0, 0],
    ]);

    // MARKER highlights MARKER turned off
    expect(
        parseT("cloze " + leftMarker + "deletion" + rightMarker + " test", {
            ...options,
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
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak {{a::Portuguese}} & Brazilians speak {{a::Portuguese::language}}", 0, 0],
    ]);
});

test("Test parsing of multiline cloze cards", () => {
    // ==highlights==
    expect(parseT("cloze ==deletion== test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test", 0, 0],
    ]);
    expect(parseT("cloze ==deletion== test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parseT("cloze ==deletion== test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT("==this== is a ==deletion==\n", parserOptions)).toEqual([
        [CardType.Cloze, "==this== is a ==deletion==", 0, 0],
    ]);
    expect(
        parseT(
            "some text before\n\na deletion on\nsuch ==wow==\n\n" +
            "many text\nsuch surprise ==wow== more ==text==\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch ==wow==", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise ==wow== more ==text==\nsome text after", 5, 7],
    ]);
    expect(parseT("srdf ==", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum ==p\ndolor won==", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum ==dolor won=", parserOptions)).toEqual([]);

    // ==highlights== turned off
    expect(
        parseT("cloze ==deletion== test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["**[123;;]answer[;;hint]**", "{{[123;;]answer[;;hint]}}"],
        }),
    ).toEqual([]);

    // **bolded**
    expect(parseT("cloze **deletion** test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test", 0, 0],
    ]);
    expect(parseT("cloze **deletion** test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parseT("cloze **deletion** test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT("**this** is a **deletion**\n", parserOptions)).toEqual([
        [CardType.Cloze, "**this** is a **deletion**", 0, 0],
    ]);
    expect(
        parseT(
            "some text before\n\na deletion on\nsuch **wow**\n\n" +
            "many text\nsuch surprise **wow** more **text**\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch **wow**", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise **wow** more **text**\nsome text after", 5, 7],
    ]);
    expect(parseT("srdf **", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum **p\ndolor won**", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum **dolor won*", parserOptions)).toEqual([]);

    // **bolded** turned off
    expect(
        parseT("cloze **deletion** test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["==[123;;]answer[;;hint]==", "{{[123;;]answer[;;hint]}}"],
        }),
    ).toEqual([]);

    // {{curly}}
    expect(parseT("cloze {{deletion}} test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test", 0, 0],
    ]);
    expect(parseT("cloze {{deletion}} test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parseT("cloze {{deletion}} test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT("{{this}} is a {{deletion}}\n", parserOptions)).toEqual([
        [CardType.Cloze, "{{this}} is a {{deletion}}", 0, 0],
    ]);
    expect(
        parseT(
            "some text before\n\na deletion on\nsuch {{wow}}\n\n" +
            "many text\nsuch surprise {{wow}} more {{text}}\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch {{wow}}", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise {{wow}} more {{text}}\nsome text after", 5, 7],
    ]);
    expect(parseT("srdf {{", parserOptions)).toEqual([]);
    expect(parseT("srdf }}", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum {{p\ndolor won}}", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum {{dolor won}", parserOptions)).toEqual([]);

    // {{curly}} turned off
    expect(
        parseT("cloze {{deletion}} test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["==[123;;]answer[;;hint]==", "**[123;;]answer[;;hint]**"],
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
        }),
    ).toEqual([[CardType.Cloze, "Brazilians speak {{Portuguese::language}}", 0, 0]]);
    expect(
        parseT(
            "Brazilians speak {{1::Portuguese}}\n\nBrazilians speak {{1::Portuguese::language}}",
            {
                singleLineCardSeparator: "=",
                singleLineReversedCardSeparator: "==",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["{{[123::]answer[::hint]}}"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak {{1::Portuguese}}", 0, 0],
        [CardType.Cloze, "Brazilians speak {{1::Portuguese::language}}", 2, 2],
    ]);
    expect(
        parseT(
            "Brazilians speak {{a::Portuguese}}\n\nBrazilians speak {{a::Portuguese::language}}",
            {
                singleLineCardSeparator: "=",
                singleLineReversedCardSeparator: "==",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["{{[123::]answer[::hint]}}"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak {{a::Portuguese}}", 0, 0],
        [CardType.Cloze, "Brazilians speak {{a::Portuguese::language}}", 2, 2],
    ]);

    // Highlighted pattern with hint and sequencer in footnotes
    expect(
        parseT("Brazilians speak ==Portuguese==\n\nBrazilians speak ==Portuguese==^[language]", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["==answer==[^\\[hint\\]][\\[^123\\]]"],
        }),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak ==Portuguese==", 0, 0],
        [CardType.Cloze, "Brazilians speak ==Portuguese==^[language]", 2, 2],
    ]);
    expect(
        parseT(
            "Brazilians speak ==Portuguese==[^1]\n\nBrazilians speak ==Portuguese==^[language][^1]",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["==answer==[^\\[hint\\]][\\[^123\\]]"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak ==Portuguese==[^1]", 0, 0],
        [CardType.Cloze, "Brazilians speak ==Portuguese==^[language][^1]", 2, 2],
    ]);
    expect(
        parseT(
            "Brazilians speak ==Portuguese==[^a]\n\nBrazilians speak ==Portuguese==^[language][^a]",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["==answer==[^\\[hint\\]][\\[^123\\]]"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak ==Portuguese==[^a]", 0, 0],
        [CardType.Cloze, "Brazilians speak ==Portuguese==^[language][^a]", 2, 2],
    ]);

    // combo
    expect(parseT("cloze **deletion** test ==another deletion==!", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test ==another deletion==!", 0, 0],
    ]);
    expect(
        parseT(
            "Test 1\nTest 2\nThis is a cloze with ===secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.\n\n---\n\nTest 3\nTest 4\nThis is a cloze with ===super secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.\n\n---\n\nHere is some more text.",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "---",
                clozePatterns: ["==[123;;]answer[;;hint]=="],
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            "Test 1\nTest 2\nThis is a cloze with ===secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.",
            0,
            7,
        ],
        [
            CardType.Cloze,
            "Test 3\nTest 4\nThis is a cloze with ===super secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.",
            10,
            17,
        ],
    ]);

    // all disabled
    expect(
        parseT("cloze {{deletion}} test and **deletion** ==another deletion==!", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [],
        }),
    ).toEqual([]);
});

test("Test parsing of multiline cloze cards with custom end marker", () => {
    // ==highlights==
    expect(parseT("cloze ==deletion== test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test", 0, 0],
    ]);
    expect(parseT("cloze ==deletion== test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parseT("cloze ==deletion== test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT("==this== is a ==deletion==\n", parserOptions)).toEqual([
        [CardType.Cloze, "==this== is a ==deletion==", 0, 0],
    ]);
    expect(
        parseT(
            "some text before\n\na deletion on\nsuch ==wow==\n\n" +
            "many text\nsuch surprise ==wow== more ==text==\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch ==wow==", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise ==wow== more ==text==\nsome text after", 5, 7],
    ]);
    expect(parseT("srdf ==", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum ==p\ndolor won==", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum ==dolor won=", parserOptions)).toEqual([]);

    // ==highlights== turned off
    expect(
        parseT("cloze ==deletion== test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["**[123;;]answer[;;hint]**", "{{[123;;]answer[;;hint]}}"],
        }),
    ).toEqual([]);

    // **bolded**
    expect(parseT("cloze **deletion** test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test", 0, 0],
    ]);
    expect(parseT("cloze **deletion** test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parseT("cloze **deletion** test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT("**this** is a **deletion**\n", parserOptions)).toEqual([
        [CardType.Cloze, "**this** is a **deletion**", 0, 0],
    ]);
    expect(
        parseT(
            "some text before\n\na deletion on\nsuch **wow**\n\n" +
            "many text\nsuch surprise **wow** more **text**\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch **wow**", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise **wow** more **text**\nsome text after", 5, 7],
    ]);
    expect(parseT("srdf **", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum **p\ndolor won**", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum **dolor won*", parserOptions)).toEqual([]);

    // **bolded** turned off
    expect(
        parseT("cloze **deletion** test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["==[123;;]answer[;;hint]==", "{{[123;;]answer[;;hint]}}"],
        }),
    ).toEqual([]);

    // {{curly}}
    expect(parseT("cloze {{deletion}} test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test", 0, 0],
    ]);
    expect(parseT("cloze {{deletion}} test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parseT("cloze {{deletion}} test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT("{{this}} is a {{deletion}}\n", parserOptions)).toEqual([
        [CardType.Cloze, "{{this}} is a {{deletion}}", 0, 0],
    ]);
    expect(
        parseT(
            "some text before\n\na deletion on\nsuch {{wow}}\n\n" +
            "many text\nsuch surprise {{wow}} more {{text}}\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch {{wow}}", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise {{wow}} more {{text}}\nsome text after", 5, 7],
    ]);
    expect(parseT("srdf {{", parserOptions)).toEqual([]);
    expect(parseT("srdf }}", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum {{p\ndolor won}}", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum {{dolor won}", parserOptions)).toEqual([]);

    // {{curly}} turned off
    expect(
        parseT("cloze {{deletion}} test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["==[123;;]answer[;;hint]==", "**[123;;]answer[;;hint]**"],
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
        }),
    ).toEqual([[CardType.Cloze, "Brazilians speak {{Portuguese::language}}", 0, 0]]);
    expect(
        parseT(
            "Brazilians speak {{1::Portuguese}}\n\nBrazilians speak {{1::Portuguese::language}}",
            {
                singleLineCardSeparator: "=",
                singleLineReversedCardSeparator: "==",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["{{[123::]answer[::hint]}}"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak {{1::Portuguese}}", 0, 0],
        [CardType.Cloze, "Brazilians speak {{1::Portuguese::language}}", 2, 2],
    ]);
    expect(
        parseT(
            "Brazilians speak {{a::Portuguese}}\n\nBrazilians speak {{a::Portuguese::language}}",
            {
                singleLineCardSeparator: "=",
                singleLineReversedCardSeparator: "==",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["{{[123::]answer[::hint]}}"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak {{a::Portuguese}}", 0, 0],
        [CardType.Cloze, "Brazilians speak {{a::Portuguese::language}}", 2, 2],
    ]);

    // Highlighted pattern with hint and sequencer in footnotes
    expect(
        parseT("Brazilians speak ==Portuguese==\n\nBrazilians speak ==Portuguese==^[language]", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["==answer==[^\\[hint\\]][\\[^123\\]]"],
        }),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak ==Portuguese==", 0, 0],
        [CardType.Cloze, "Brazilians speak ==Portuguese==^[language]", 2, 2],
    ]);
    expect(
        parseT(
            "Brazilians speak ==Portuguese==[^1]\n\nBrazilians speak ==Portuguese==^[language][^1]",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["==answer==[^\\[hint\\]][\\[^123\\]]"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak ==Portuguese==[^1]", 0, 0],
        [CardType.Cloze, "Brazilians speak ==Portuguese==^[language][^1]", 2, 2],
    ]);
    expect(
        parseT(
            "Brazilians speak ==Portuguese==[^a]\n\nBrazilians speak ==Portuguese==^[language][^a]",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["==answer==[^\\[hint\\]][\\[^123\\]]"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak ==Portuguese==[^a]", 0, 0],
        [CardType.Cloze, "Brazilians speak ==Portuguese==^[language][^a]", 2, 2],
    ]);

    // combo
    expect(parseT("cloze **deletion** test ==another deletion==!", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test ==another deletion==!", 0, 0],
    ]);
    expect(
        parseT(
            "Test 1\nTest 2\nThis is a cloze with ===secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.\n\n---\n\nTest 3\nTest 4\nThis is a cloze with ===super secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.\n\n---\n\nHere is some more text.",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "---",
                clozePatterns: ["==[123;;]answer[;;hint]=="],
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            "Test 1\nTest 2\nThis is a cloze with ===secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.",
            0,
            7,
        ],
        [
            CardType.Cloze,
            "Test 3\nTest 4\nThis is a cloze with ===super secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.",
            10,
            17,
        ],
    ]);

    // all disabled
    expect(
        parseT("cloze {{deletion}} test and **deletion** ==another deletion==!", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [],
        }),
    ).toEqual([]);
});

test("Test parsing of complex cloze cards", () => {
    // ==highlights==
    expect(parseT("cloze ==deletion== test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test", 0, 0],
    ]);
    expect(parseT("cloze ==deletion== test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parseT("cloze ==deletion== test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT("==this== is a ==deletion==\n", parserOptions)).toEqual([
        [CardType.Cloze, "==this== is a ==deletion==", 0, 0],
    ]);
    expect(
        parseT(
            "some text before\n\na deletion on\nsuch ==wow==\n\n" +
            "many text\nsuch surprise ==wow== more ==text==\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch ==wow==", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise ==wow== more ==text==\nsome text after", 5, 7],
    ]);
    expect(parseT("srdf ==", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum ==p\ndolor won==", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum ==dolor won=", parserOptions)).toEqual([]);

    // ==highlights== turned off
    expect(
        parseT("cloze ==deletion== test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["**[123;;]answer[;;hint]**", "{{[123;;]answer[;;hint]}}"],
        }),
    ).toEqual([]);

    // **bolded**
    expect(parseT("cloze **deletion** test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test", 0, 0],
    ]);
    expect(parseT("cloze **deletion** test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parseT("cloze **deletion** test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT("**this** is a **deletion**\n", parserOptions)).toEqual([
        [CardType.Cloze, "**this** is a **deletion**", 0, 0],
    ]);
    expect(
        parseT(
            "some text before\n\na deletion on\nsuch **wow**\n\n" +
            "many text\nsuch surprise **wow** more **text**\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch **wow**", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise **wow** more **text**\nsome text after", 5, 7],
    ]);
    expect(parseT("srdf **", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum **p\ndolor won**", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum **dolor won*", parserOptions)).toEqual([]);

    // **bolded** turned off
    expect(
        parseT("cloze **deletion** test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["==[123;;]answer[;;hint]==", "{{[123;;]answer[;;hint]}}"],
        }),
    ).toEqual([]);

    // {{curly}}
    expect(parseT("cloze {{deletion}} test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test", 0, 0],
    ]);
    expect(parseT("cloze {{deletion}} test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parseT("cloze {{deletion}} test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parseT("{{this}} is a {{deletion}}\n", parserOptions)).toEqual([
        [CardType.Cloze, "{{this}} is a {{deletion}}", 0, 0],
    ]);
    expect(
        parseT(
            "some text before\n\na deletion on\nsuch {{wow}}\n\n" +
            "many text\nsuch surprise {{wow}} more {{text}}\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch {{wow}}", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise {{wow}} more {{text}}\nsome text after", 5, 7],
    ]);
    expect(parseT("srdf {{", parserOptions)).toEqual([]);
    expect(parseT("srdf }}", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum {{p\ndolor won}}", parserOptions)).toEqual([]);
    expect(parseT("lorem ipsum {{dolor won}", parserOptions)).toEqual([]);

    // {{curly}} turned off
    expect(
        parseT("cloze {{deletion}} test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["==[123;;]answer[;;hint]==", "**[123;;]answer[;;hint]**"],
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
        }),
    ).toEqual([[CardType.Cloze, "Brazilians speak {{Portuguese::language}}", 0, 0]]);
    expect(
        parseT(
            "Brazilians speak {{1::Portuguese}}\n\nBrazilians speak {{1::Portuguese::language}}",
            {
                singleLineCardSeparator: "=",
                singleLineReversedCardSeparator: "==",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["{{[123::]answer[::hint]}}"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak {{1::Portuguese}}", 0, 0],
        [CardType.Cloze, "Brazilians speak {{1::Portuguese::language}}", 2, 2],
    ]);
    expect(
        parseT(
            "Brazilians speak {{a::Portuguese}}\n\nBrazilians speak {{a::Portuguese::language}}",
            {
                singleLineCardSeparator: "=",
                singleLineReversedCardSeparator: "==",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["{{[123::]answer[::hint]}}"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak {{a::Portuguese}}", 0, 0],
        [CardType.Cloze, "Brazilians speak {{a::Portuguese::language}}", 2, 2],
    ]);

    // Highlighted pattern with hint and sequencer in footnotes
    expect(
        parseT("Brazilians speak ==Portuguese==\n\nBrazilians speak ==Portuguese==^[language]", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: ["==answer==[^\\[hint\\]][\\[^123\\]]"],
        }),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak ==Portuguese==", 0, 0],
        [CardType.Cloze, "Brazilians speak ==Portuguese==^[language]", 2, 2],
    ]);
    expect(
        parseT(
            "Brazilians speak ==Portuguese==[^1]\n\nBrazilians speak ==Portuguese==^[language][^1]",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["==answer==[^\\[hint\\]][\\[^123\\]]"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak ==Portuguese==[^1]", 0, 0],
        [CardType.Cloze, "Brazilians speak ==Portuguese==^[language][^1]", 2, 2],
    ]);
    expect(
        parseT(
            "Brazilians speak ==Portuguese==[^a]\n\nBrazilians speak ==Portuguese==^[language][^a]",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "",
                clozePatterns: ["==answer==[^\\[hint\\]][\\[^123\\]]"],
            },
        ),
    ).toEqual([
        [CardType.Cloze, "Brazilians speak ==Portuguese==[^a]", 0, 0],
        [CardType.Cloze, "Brazilians speak ==Portuguese==^[language][^a]", 2, 2],
    ]);

    // combo
    expect(parseT("cloze **deletion** test ==another deletion==!", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test ==another deletion==!", 0, 0],
    ]);
    expect(
        parseT(
            "Test 1\nTest 2\nThis is a cloze with ===secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.\n\n---\n\nTest 3\nTest 4\nThis is a cloze with ===super secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.\n\n---\n\nHere is some more text.",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "---",
                clozePatterns: ["==[123;;]answer[;;hint]=="],
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            "Test 1\nTest 2\nThis is a cloze with ===secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.",
            0,
            7,
        ],
        [
            CardType.Cloze,
            "Test 3\nTest 4\nThis is a cloze with ===super secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.",
            10,
            17,
        ],
    ]);

    // all disabled
    expect(
        parseT("cloze {{deletion}} test and **deletion** ==another deletion==!", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [],
        }),
    ).toEqual([]);
});
