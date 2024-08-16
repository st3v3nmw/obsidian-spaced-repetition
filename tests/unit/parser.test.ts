import { generate } from "peggy";
import { generateParser } from "src/generateParser";
import { parseEx, ParsedQuestionInfo } from "src/parser";
import { CardType } from "src/Question";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";

const defaultSettings = { ...DEFAULT_SETTINGS,
    singleLineCardSeparator: "::",
    singleLineReversedCardSeparator: ":::",
    multilineCardSeparator: "?",
    multilineReversedCardSeparator: "??",
    multilineCardEndMarker: "",
    convertHighlightsToClozes: true,
    convertBoldTextToClozes: true,
    convertCurlyBracketsToClozes: true,
};

/**
 * This function is a small wrapper around parseEx used for testing only.
 * Created when the actual parser changed from returning [CardType, string, number, number] to ParsedQuestionInfo.
 * It's purpose is to minimise changes to all the test cases here during the parser()->parserEx() change.
 */
function parse(
    text: string,
    settings: SRSettings,
): [CardType, string, number, number][] {
    // for testing purposes, generate parser each time, overwriting the default one
    const parser = generateParser(settings);
    const list: ParsedQuestionInfo[] = parseEx(text,parser);
    const result: [CardType, string, number, number][] = [];
    for (const item of list) {
        result.push([item.cardType, item.text, item.firstLineNum, item.lastLineNum]);
    }
    return result;
}

test("Test parsing of single line basic cards", () => {
    expect(parse("Question::Answer", defaultSettings)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer", 0, 0],
    ]);
    expect(parse("Question::Answer\n<!--SR:!2021-08-11,4,270-->", defaultSettings)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer\n<!--SR:!2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parse("Question::Answer <!--SR:2021-08-11,4,270-->", defaultSettings)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parse("Some text before\nQuestion ::Answer", defaultSettings)).toEqual([
        [CardType.SingleLineBasic, "Question ::Answer", 1, 1],
    ]);
    expect(parse("#Title\n\nQ1::A1\nQ2:: A2", defaultSettings)).toEqual([
        [CardType.SingleLineBasic, "Q1::A1", 2, 2],
        [CardType.SingleLineBasic, "Q2:: A2", 3, 3],
    ]);
    expect(parse("#flashcards/science Question ::Answer", defaultSettings)).toEqual([
        [CardType.SingleLineBasic, "#flashcards/science Question ::Answer", 0, 0],
    ]);
});

test("Test parsing of single line reversed cards", () => {
    expect(parse("Question:::Answer", defaultSettings)).toEqual([
        [CardType.SingleLineReversed, "Question:::Answer", 0, 0],
    ]);
    expect(parse("Some text before\nQuestion :::Answer", defaultSettings)).toEqual([
        [CardType.SingleLineReversed, "Question :::Answer", 1, 1],
    ]);
    expect(parse("#Title\n\nQ1:::A1\nQ2::: A2", defaultSettings)).toEqual([
        [CardType.SingleLineReversed, "Q1:::A1", 2, 2],
        [CardType.SingleLineReversed, "Q2::: A2", 3, 3],
    ]);
});

test("Test parsing of multi line basic cards", () => {
    expect(parse("Question\n?\nAnswer", defaultSettings)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer", 0, 2],
    ]);
    expect(parse("Question\n? \nAnswer", defaultSettings)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer", 0, 2],
    ]);
    expect(parse("Question\n?\nAnswer <!--SR:!2021-08-11,4,270-->", defaultSettings)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer <!--SR:!2021-08-11,4,270-->", 0, 2],
    ]);
    expect(parse("Question\n?\nAnswer\n<!--SR:2021-08-11,4,270-->", defaultSettings)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer\n<!--SR:2021-08-11,4,270-->", 0, 3],
    ]);
    expect(parse("Question line 1\nQuestion line 2\n?\nAnswer", defaultSettings)).toEqual([
        [CardType.MultiLineBasic, "Question line 1\nQuestion line 2\n?\nAnswer", 0, 3],
    ]);
    expect(parse("Question\n?\nAnswer line 1\nAnswer line 2", defaultSettings)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer line 1\nAnswer line 2", 0, 3],
    ]);
    expect(parse("#Title\n\nLine0\nQ1\n?\nA1\nAnswerExtra\n\nQ2\n?\nA2", defaultSettings)).toEqual([
        [
            CardType.MultiLineBasic,
            "Line0\nQ1\n?\nA1\nAnswerExtra",
            /* Line0 */ 2,
            /* AnswerExtra */ 6,
        ],
        [CardType.MultiLineBasic, "Q2\n?\nA2", 8, 10],
    ]);
    expect(parse("#flashcards/tag-on-previous-line\nQuestion\n?\nAnswer", defaultSettings)).toEqual([
        [CardType.MultiLineBasic, "#flashcards/tag-on-previous-line\nQuestion\n?\nAnswer", 0, 3],
    ]);
});

test("Test parsing of multi line reversed cards", () => {
    expect(parse("Question\n??\nAnswer", defaultSettings)).toEqual([
        [CardType.MultiLineReversed, "Question\n??\nAnswer", 0, 2],
    ]);
    expect(parse("Question line 1\nQuestion line 2\n??\nAnswer", defaultSettings)).toEqual([
        [CardType.MultiLineReversed, "Question line 1\nQuestion line 2\n??\nAnswer", 0, 3],
    ]);
    expect(parse("Question\n??\nAnswer line 1\nAnswer line 2", defaultSettings)).toEqual([
        [CardType.MultiLineReversed, "Question\n??\nAnswer line 1\nAnswer line 2", 0, 3],
    ]);
    expect(parse("#Title\n\nLine0\nQ1\n??\nA1\nAnswerExtra\n\nQ2\n??\nA2", defaultSettings)).toEqual(
        [
            [
                CardType.MultiLineReversed,
                "Line0\nQ1\n??\nA1\nAnswerExtra",
                /* Line0 */ 2,
                /* AnswerExtra */ 6,
            ],
            [CardType.MultiLineReversed, "Q2\n??\nA2", 8, 10],
        ],
    );
});

test("Test parsing of cloze cards", () => {
    // ==highlights==
    expect(parse("cloze ==deletion== test", defaultSettings)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test", 0, 0],
    ]);
    expect(parse("cloze ==deletion== test\n<!--SR:2021-08-11,4,270-->", defaultSettings)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parse("cloze ==deletion== test <!--SR:2021-08-11,4,270-->", defaultSettings)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parse("==this== is a ==deletion==\n", defaultSettings)).toEqual([
        [CardType.Cloze, "==this== is a ==deletion==", 0, 0],
    ]);
    expect(
        parse(
            "some text before\n\na deletion on\nsuch ==wow==\n\n" +
                "many text\nsuch surprise ==wow== more ==text==\nsome text after\n\nHmm",
            defaultSettings,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch ==wow==", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise ==wow== more ==text==\nsome text after", 5, 7],
    ]);
    expect(parse("srdf ==", defaultSettings)).toEqual([]);
    expect(parse("lorem ipsum ==p\ndolor won==", defaultSettings)).toEqual([]);
    expect(parse("lorem ipsum ==dolor won=", defaultSettings)).toEqual([]);
    // ==highlights== turned off
    expect(parse("cloze ==deletion== test", 
        { ...DEFAULT_SETTINGS,
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            convertHighlightsToClozes: false,
            convertBoldTextToClozes: true,
            convertCurlyBracketsToClozes: false,
        })).toEqual(
        [],
    );
    
    // **bolded**
    expect(parse("cloze **deletion** test", defaultSettings)).toEqual([
        [CardType.Cloze, "cloze **deletion** test", 0, 0],
    ]);
    expect(parse("cloze **deletion** test\n<!--SR:2021-08-11,4,270-->", defaultSettings)).toEqual([
        [CardType.Cloze, "cloze **deletion** test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parse("cloze **deletion** test <!--SR:2021-08-11,4,270-->", defaultSettings)).toEqual([
        [CardType.Cloze, "cloze **deletion** test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parse("**this** is a **deletion**\n", defaultSettings)).toEqual([
        [CardType.Cloze, "**this** is a **deletion**", 0, 0],
    ]);
    expect(
        parse(
            "some text before\n\na deletion on\nsuch **wow**\n\n" +
                "many text\nsuch surprise **wow** more **text**\nsome text after\n\nHmm",
            defaultSettings,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch **wow**", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise **wow** more **text**\nsome text after", 5, 7],
    ]);
    expect(parse("srdf **", defaultSettings)).toEqual([]);
    expect(parse("lorem ipsum **p\ndolor won**", defaultSettings)).toEqual([]);
    expect(parse("lorem ipsum **dolor won*", defaultSettings)).toEqual([]);
    // **bolded** turned off
    expect(parse("cloze **deletion** test", { ...DEFAULT_SETTINGS,
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            convertHighlightsToClozes: true,
            convertBoldTextToClozes: false,
            convertCurlyBracketsToClozes: false,
        })).toEqual(
        [],
    );

    // both
    expect(parse("cloze **deletion** test ==another deletion==!", defaultSettings)).toEqual([
        [CardType.Cloze, "cloze **deletion** test ==another deletion==!", 0, 0],
    ]);
});

test("Test parsing of a mix of card types", () => {
    expect(
        parse(
            "# Lorem Ipsum\n\nLorem ipsum dolor ==sit amet==, consectetur ==adipiscing== elit.\n" +
                "Duis magna arcu, eleifend rhoncus ==euismod non,==\nlaoreet vitae enim.\n\n" +
                "Fusce placerat::velit in pharetra gravida\n\n" +
                "Donec dapibus ullamcorper aliquam.\n??\nDonec dapibus ullamcorper aliquam.\n<!--SR:2021-08-11,4,270-->",
            defaultSettings,
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
            11 /* <!--SR:2021-08-11,4,270--> */,
        ],
    ]);
});

test("Test codeblocks", () => {
    // no blank lines
    expect(
        parse(
            "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\nprint('Howdy?')\nlambda x: x[0]\n```",
            defaultSettings,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\nprint('Howdy?')\nlambda x: x[0]\n```",
            0,
            6 /* ``` */,
        ],
    ]);

    // with blank lines
    expect(
        parse(
            "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\n\n\nprint('Howdy?')\n\nlambda x: x[0]\n```",
            defaultSettings,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\n\n\nprint('Howdy?')\n\nlambda x: x[0]\n```",
            0,
            9 /* ``` */,
        ],
    ]);

    // general Markdown syntax
    expect(
        parse(
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
            defaultSettings,
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
            12 /* ``` */,
        ],
    ]);
});

test("Test not parsing cards in HTML comments", () => {
    expect(
        parse("<!--\nQuestion\n?\nAnswer <!--SR:!2021-08-11,4,270-->\n-->", defaultSettings),
    ).toEqual([]);
    expect(
        parse(
            "<!--\nQuestion\n?\nAnswer <!--SR:!2021-08-11,4,270-->\n\n<!--cloze ==deletion== test-->-->",
            defaultSettings,
        ),
    ).toEqual([]);
    expect(parse("<!--cloze ==deletion== test-->", defaultSettings)).toEqual([]);
    expect(parse("<!--cloze **deletion** test-->", defaultSettings)).toEqual([]);
});
