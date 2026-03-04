import { CardType } from "src/card/questions/question";

import { parserOptions, parseT } from "../helpers/unit-test-parser-helper";

test("Test parsing of cloze cards", () => {
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
