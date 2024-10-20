import { parse, ParsedQuestionInfo, setDebugParser } from "src/parser";
import { ParserOptions } from "src/parser";
import { CardType } from "src/question";

const parserOptions: ParserOptions = {
    singleLineCardSeparator: "::",
    singleLineReversedCardSeparator: ":::",
    multilineCardSeparator: "?",
    multilineReversedCardSeparator: "??",
    multilineCardEndMarker: "",
    clozePatterns: [
        "==[123;;]answer[;;hint]==",
        "**[123;;]answer[;;hint]**",
        "{{[123;;]answer[;;hint]}}",
    ],
};

/**
 * This function is a small wrapper around parse used for testing only.
 *  It generates a parser each time, overwriting the default one.
 * Created when the actual parser changed from returning [CardType, string, number, number] to ParsedQuestionInfo.
 * It's purpose is to minimise changes to all the test cases here during the parser()->parserEx() change.
 */
function parseT(text: string, options: ParserOptions): [CardType, string, number, number][] {
    const list: ParsedQuestionInfo[] = parse(text, options);
    const result: [CardType, string, number, number][] = [];
    for (const item of list) {
        result.push([item.cardType, item.text, item.firstLineNum, item.lastLineNum]);
    }
    return result;
}

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

test("Test parsing of a mix of card types", () => {
    expect(
        parseT(
            "# Lorem Ipsum\n\nLorem ipsum dolor ==sit amet==, consectetur ==adipiscing== elit.\n" +
                "Duis magna arcu, eleifend rhoncus ==euismod non,==\nlaoreet vitae enim.\n\n" +
                "Fusce placerat::velit in pharetra gravida\n\n" +
                "Donec dapibus ullamcorper aliquam.\n??\nDonec dapibus ullamcorper aliquam.\n<!--SR:2021-08-11,4,270-->",
            parserOptions,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            "Lorem ipsum dolor ==sit amet==, consectetur ==adipiscing== elit.\n" +
                "Duis magna arcu, eleifend rhoncus ==euismod non,==\n" +
                "laoreet vitae enim.",
            2,
            4,
        ],
        [CardType.SingleLineBasic, "Fusce placerat::velit in pharetra gravida", 6, 6],
        [
            CardType.MultiLineReversed,
            "Donec dapibus ullamcorper aliquam.\n??\nDonec dapibus ullamcorper aliquam.\n<!--SR:2021-08-11,4,270-->",
            8,
            11,
        ],
    ]);
});

test("Test parsing cards with codeblocks", () => {
    // `inline`
    expect(
        parseT(
            "my inline question containing `some inline code` in it::and this is answer possibly containing `inline` code.",
            parserOptions,
        ),
    ).toEqual([
        [
            CardType.SingleLineBasic,
            "my inline question containing `some inline code` in it::and this is answer possibly containing `inline` code.",
            0,
            0,
        ],
    ]);
    expect(parseT("this has some ==`inline`== code", parserOptions)).toEqual([
        [CardType.Cloze, "this has some ==`inline`== code", 0, 0],
    ]);

    // ```block```, no blank lines
    expect(
        parseT(
            "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\nprint('Howdy?')\nlambda x: x[0]\n```",
            parserOptions,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\nprint('Howdy?')\nlambda x: x[0]\n```",
            0,
            6,
        ],
    ]);

    // ```block```, with blank lines
    expect(
        parseT(
            "How do you ... Python?\n?\n" +
                "```python\nprint('Hello World!')\n\n\nprint('Howdy?')\n\nlambda x: x[0]\n```",
            parserOptions,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            "How do you ... Python?\n?\n" +
                "```python\nprint('Hello World!')\n\n\nprint('Howdy?')\n\nlambda x: x[0]\n```",
            0,
            9,
        ],
    ]);

    // nested markdown
    expect(
        parseT(
            "Nested Markdown?\n?\n" +
                "````ad-note\n\n" +
                "```git\n" +
                "+ print('hello')\n" +
                "- print('world')\n" +
                "```\n\n" +
                "~~~python\n" +
                "print('hello world')\n" +
                "~~~\n" +
                "````",
            parserOptions,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            "Nested Markdown?\n?\n" +
                "````ad-note\n\n" +
                "```git\n" +
                "+ print('hello')\n" +
                "- print('world')\n" +
                "```\n\n" +
                "~~~python\n" +
                "print('hello world')\n" +
                "~~~\n" +
                "````",
            0,
            12,
        ],
    ]);
});

test("Test not parsing cards in HTML comments", () => {
    expect(parseT("<!--question::answer test-->", parserOptions)).toEqual([]);
    expect(parseT("<!--question:::answer test-->", parserOptions)).toEqual([]);
    expect(
        parseT("<!--\nQuestion\n?\nAnswer <!--SR:!2021-08-11,4,270-->\n-->", parserOptions),
    ).toEqual([]);
    expect(
        parseT(
            "<!--\nQuestion\n?\nAnswer <!--SR:!2021-08-11,4,270-->\n\n<!--cloze ==deletion== test-->-->",
            parserOptions,
        ),
    ).toEqual([]);
    expect(parseT("<!--cloze ==deletion== test-->", parserOptions)).toEqual([]);
    expect(parseT("<!--cloze **deletion** test-->", parserOptions)).toEqual([]);
    expect(parseT("<!--cloze {{curly}} test-->", parserOptions)).toEqual([]);
    expect(parseT("something something\n<!--cloze {{curly}} test-->", parserOptions)).toEqual([]);

    // cards found outside comment
    expect(
        parseT("something something\n\n<!--cloze {{curly}} test-->\n\na::b", parserOptions),
    ).toEqual([[CardType.SingleLineBasic, "a::b", 4, 4]]);
});

test("Test not parsing 'cards' in codeblocks", () => {
    // block
    expect(parseT("```\nCodeblockq::CodeblockA\n```", parserOptions)).toEqual([]);
    expect(parseT("```\nCodeblockq:::CodeblockA\n```", parserOptions)).toEqual([]);
    expect(
        parseT("# Title\n\n```markdown\nsome ==highlighted text==!\n```\n\nmore!", parserOptions),
    ).toEqual([]);
    expect(
        parseT("# Title\n```markdown\nsome **bolded text**!\n```\n\nmore!", parserOptions),
    ).toEqual([]);
    expect(parseT("# Title\n\n```\nfoo = {{'a': 2}}\n```\n\nmore!", parserOptions)).toEqual([]);

    // inline
    expect(parseT("`Inlineq::InlineA`", parserOptions)).toEqual([]);
    expect(
        parseT("# Title\n`if (a & b) {}`\nmore!", {
            singleLineCardSeparator: "&",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            clozePatterns: [
                "==[123;;]answer[;;hint]==",
                "**[123;;]answer[;;hint]**",
                "{{[123;;]answer[;;hint]}}",
            ],
        }),
    ).toEqual([]);

    // combo
    expect(
        parseT(
            "Question::Answer\n\n```\nCodeblockq::CodeblockA\n```\n\n`Inlineq::InlineA`\n",
            parserOptions,
        ),
    ).toEqual([[CardType.SingleLineBasic, "Question::Answer", 0, 0]]);
});

describe("Parser debug messages", () => {
    test("Messages disabled", () => {
        // replace console error log with an empty mock function
        const logSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});
        setDebugParser(false);

        parse("", parserOptions);
        expect(logSpy).toHaveBeenCalledTimes(0);

        // restore original console error log
        logSpy.mockRestore();
    });

    test("Messages enabled", () => {
        // replace console error log with an empty mock function
        const logSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});
        setDebugParser(true);

        parse("", parserOptions);
        expect(logSpy).toHaveBeenCalled();

        // restore original console error log
        logSpy.mockRestore();
    });
});
