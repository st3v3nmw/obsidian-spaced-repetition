import { ParsedQuestionInfo, parseEx, setDebugParser } from "src/parser";
import { ParserOptions } from "src/parser";
import { CardType } from "src/question";

const parserOptions: ParserOptions = {
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
 *  It generates a parser each time, overwriting the default one.
 * Created when the actual parser changed from returning [CardType, string, number, number] to ParsedQuestionInfo.
 * It's purpose is to minimise changes to all the test cases here during the parser()->parserEx() change.
 */
function parse(text: string, options: ParserOptions): [CardType, string, number, number][] {
    const list: ParsedQuestionInfo[] = parseEx(text, options);
    const result: [CardType, string, number, number][] = [];
    for (const item of list) {
        result.push([item.cardType, item.text, item.firstLineNum, item.lastLineNum]);
    }
    return result;
}

test("Test parsing of single line basic cards", () => {
    // standard symbols
    expect(parse("Question::Answer", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer", 0, 0],
    ]);
    expect(parse("Question::Answer\n<!--SR:!2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer\n<!--SR:!2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parse("Question::Answer <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parse("Some text before\nQuestion ::Answer", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Question ::Answer", 1, 1],
    ]);
    expect(parse("#Title\n\nQ1::A1\nQ2:: A2", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Q1::A1", 2, 2],
        [CardType.SingleLineBasic, "Q2:: A2", 3, 3],
    ]);
    expect(parse("#flashcards/science Question ::Answer", parserOptions)).toEqual([
        [CardType.SingleLineBasic, "#flashcards/science Question ::Answer", 0, 0],
    ]);

    // custom symbols
    expect(
        parse("Question&&Answer", {
            singleLineCardSeparator: "&&",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            convertHighlightsToClozes: false,
            convertBoldTextToClozes: false,
            convertCurlyBracketsToClozes: false,
        }),
    ).toEqual([[CardType.SingleLineBasic, "Question&&Answer", 0, 0]]);
    expect(
        parse("Question=Answer", {
            singleLineCardSeparator: "=",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            convertHighlightsToClozes: false,
            convertBoldTextToClozes: false,
            convertCurlyBracketsToClozes: false,
        }),
    ).toEqual([[CardType.SingleLineBasic, "Question=Answer", 0, 0]]);
});

test("Test parsing of single line reversed cards", () => {
    // standard symbols
    expect(parse("Question:::Answer", parserOptions)).toEqual([
        [CardType.SingleLineReversed, "Question:::Answer", 0, 0],
    ]);
    expect(parse("Some text before\nQuestion :::Answer", parserOptions)).toEqual([
        [CardType.SingleLineReversed, "Question :::Answer", 1, 1],
    ]);
    expect(parse("#Title\n\nQ1:::A1\nQ2::: A2", parserOptions)).toEqual([
        [CardType.SingleLineReversed, "Q1:::A1", 2, 2],
        [CardType.SingleLineReversed, "Q2::: A2", 3, 3],
    ]);

    // custom symbols
    expect(
        parse("Question&&&Answer", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: "&&&",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            convertHighlightsToClozes: false,
            convertBoldTextToClozes: false,
            convertCurlyBracketsToClozes: false,
        }),
    ).toEqual([[CardType.SingleLineReversed, "Question&&&Answer", 0, 0]]);
});

test("Test parsing of multi line basic cards", () => {
    // standard symbols
    expect(parse("Question\n?\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer", 0, 2],
    ]);
    expect(parse("Question\n? \nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer", 0, 2],
    ]);
    expect(parse("Question\n?\nAnswer <!--SR:!2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer <!--SR:!2021-08-11,4,270-->", 0, 2],
    ]);
    expect(parse("Question\n?\nAnswer\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer\n<!--SR:2021-08-11,4,270-->", 0, 3],
    ]);
    expect(parse("Question line 1\nQuestion line 2\n?\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question line 1\nQuestion line 2\n?\nAnswer", 0, 3],
    ]);
    expect(parse("Question\n?\nAnswer line 1\nAnswer line 2", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer line 1\nAnswer line 2", 0, 3],
    ]);
    expect(parse("#Title\n\nLine0\nQ1\n?\nA1\nAnswerExtra\n\nQ2\n?\nA2", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "Line0\nQ1\n?\nA1\nAnswerExtra", 2, 6],
        [CardType.MultiLineBasic, "Q2\n?\nA2", 8, 10],
    ]);
    expect(parse("#flashcards/tag-on-previous-line\nQuestion\n?\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineBasic, "#flashcards/tag-on-previous-line\nQuestion\n?\nAnswer", 0, 3],
    ]);
    expect(
        parse("Question\n?\nAnswer line 1\nAnswer line 2\n\n---", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            convertHighlightsToClozes: false,
            convertBoldTextToClozes: true,
            convertCurlyBracketsToClozes: false,
        }),
    ).toEqual([[CardType.MultiLineBasic, "Question\n?\nAnswer line 1\nAnswer line 2", 0, 4]]);
    expect(
        parse(
            "Question 1\n?\nAnswer line 1\nAnswer line 2\n\n---\nQuestion 2\n?\nAnswer line 1\nAnswer line 2\n---\n",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "---",
                convertHighlightsToClozes: false,
                convertBoldTextToClozes: true,
                convertCurlyBracketsToClozes: false,
            },
        ),
    ).toEqual([
        [CardType.MultiLineBasic, "Question 1\n?\nAnswer line 1\nAnswer line 2", 0, 4],
        [CardType.MultiLineBasic, "Question 2\n?\nAnswer line 1\nAnswer line 2", 6, 9],
    ]);
    expect(
        parse(
            "Question 1\n?\nAnswer line 1\nAnswer line 2\n\n---\nQuestion with empty line after question mark\n?\n\nAnswer line 1\nAnswer line 2\n---\n",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "---",
                convertHighlightsToClozes: false,
                convertBoldTextToClozes: true,
                convertCurlyBracketsToClozes: false,
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
        parse("Question\n@@\nAnswer\n\nsfdg", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "@@",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            convertHighlightsToClozes: false,
            convertBoldTextToClozes: false,
            convertCurlyBracketsToClozes: false,
        }),
    ).toEqual([[CardType.MultiLineBasic, "Question\n@@\nAnswer", 0, 2]]);
});

test("Test parsing of multi line reversed cards", () => {
    // standard symbols
    expect(parse("Question\n??\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineReversed, "Question\n??\nAnswer", 0, 2],
    ]);
    expect(parse("Question line 1\nQuestion line 2\n??\nAnswer", parserOptions)).toEqual([
        [CardType.MultiLineReversed, "Question line 1\nQuestion line 2\n??\nAnswer", 0, 3],
    ]);
    expect(parse("Question\n??\nAnswer line 1\nAnswer line 2", parserOptions)).toEqual([
        [CardType.MultiLineReversed, "Question\n??\nAnswer line 1\nAnswer line 2", 0, 3],
    ]);
    expect(parse("#Title\n\nLine0\nQ1\n??\nA1\nAnswerExtra\n\nQ2\n??\nA2", parserOptions)).toEqual([
        [CardType.MultiLineReversed, "Line0\nQ1\n??\nA1\nAnswerExtra", 2, 6],
        [CardType.MultiLineReversed, "Q2\n??\nA2", 8, 10],
    ]);
    expect(
        parse("Question\n??\nAnswer line 1\nAnswer line 2\n\n---", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "---",
            convertHighlightsToClozes: true,
            convertBoldTextToClozes: true,
            convertCurlyBracketsToClozes: true,
        }),
    ).toEqual([[CardType.MultiLineReversed, "Question\n??\nAnswer line 1\nAnswer line 2", 0, 4]]);
    expect(
        parse(
            "Question 1\n?\nAnswer line 1\nAnswer line 2\n\n---\nQuestion 2\n??\nAnswer line 1\nAnswer line 2\n---\n",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "---",
                convertHighlightsToClozes: true,
                convertBoldTextToClozes: true,
                convertCurlyBracketsToClozes: true,
            },
        ),
    ).toEqual([
        [CardType.MultiLineBasic, "Question 1\n?\nAnswer line 1\nAnswer line 2", 0, 4],
        [CardType.MultiLineReversed, "Question 2\n??\nAnswer line 1\nAnswer line 2", 6, 9],
    ]);

    // custom symbols
    expect(
        parse("Question\n@@@\nAnswer\n---", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "@@",
            multilineReversedCardSeparator: "@@@",
            multilineCardEndMarker: "---",
            convertHighlightsToClozes: false,
            convertBoldTextToClozes: false,
            convertCurlyBracketsToClozes: false,
        }),
    ).toEqual([[CardType.MultiLineReversed, "Question\n@@@\nAnswer", 0, 2]]);
});

test("Test parsing of cloze cards", () => {
    // ==highlights==
    expect(parse("cloze ==deletion== test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test", 0, 0],
    ]);
    expect(parse("cloze ==deletion== test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parse("cloze ==deletion== test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parse("==this== is a ==deletion==\n", parserOptions)).toEqual([
        [CardType.Cloze, "==this== is a ==deletion==", 0, 0],
    ]);
    expect(
        parse(
            "some text before\n\na deletion on\nsuch ==wow==\n\n" +
                "many text\nsuch surprise ==wow== more ==text==\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch ==wow==", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise ==wow== more ==text==\nsome text after", 5, 7],
    ]);
    expect(parse("srdf ==", parserOptions)).toEqual([]);
    expect(parse("lorem ipsum ==p\ndolor won==", parserOptions)).toEqual([]);
    expect(parse("lorem ipsum ==dolor won=", parserOptions)).toEqual([]);

    // ==highlights== turned off
    expect(
        parse("cloze ==deletion== test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            convertHighlightsToClozes: false,
            convertBoldTextToClozes: true,
            convertCurlyBracketsToClozes: true,
        }),
    ).toEqual([]);

    // **bolded**
    expect(parse("cloze **deletion** test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test", 0, 0],
    ]);
    expect(parse("cloze **deletion** test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parse("cloze **deletion** test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parse("**this** is a **deletion**\n", parserOptions)).toEqual([
        [CardType.Cloze, "**this** is a **deletion**", 0, 0],
    ]);
    expect(
        parse(
            "some text before\n\na deletion on\nsuch **wow**\n\n" +
                "many text\nsuch surprise **wow** more **text**\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch **wow**", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise **wow** more **text**\nsome text after", 5, 7],
    ]);
    expect(parse("srdf **", parserOptions)).toEqual([]);
    expect(parse("lorem ipsum **p\ndolor won**", parserOptions)).toEqual([]);
    expect(parse("lorem ipsum **dolor won*", parserOptions)).toEqual([]);

    // **bolded** turned off
    expect(
        parse("cloze **deletion** test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            convertHighlightsToClozes: true,
            convertBoldTextToClozes: false,
            convertCurlyBracketsToClozes: true,
        }),
    ).toEqual([]);

    // {{curly}}
    expect(parse("cloze {{deletion}} test", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test", 0, 0],
    ]);
    expect(parse("cloze {{deletion}} test\n<!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test\n<!--SR:2021-08-11,4,270-->", 0, 1],
    ]);
    expect(parse("cloze {{deletion}} test <!--SR:2021-08-11,4,270-->", parserOptions)).toEqual([
        [CardType.Cloze, "cloze {{deletion}} test <!--SR:2021-08-11,4,270-->", 0, 0],
    ]);
    expect(parse("{{this}} is a {{deletion}}\n", parserOptions)).toEqual([
        [CardType.Cloze, "{{this}} is a {{deletion}}", 0, 0],
    ]);
    expect(
        parse(
            "some text before\n\na deletion on\nsuch {{wow}}\n\n" +
                "many text\nsuch surprise {{wow}} more {{text}}\nsome text after\n\nHmm",
            parserOptions,
        ),
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch {{wow}}", 2, 3],
        [CardType.Cloze, "many text\nsuch surprise {{wow}} more {{text}}\nsome text after", 5, 7],
    ]);
    expect(parse("srdf {{", parserOptions)).toEqual([]);
    expect(parse("srdf }}", parserOptions)).toEqual([]);
    expect(parse("lorem ipsum {{p\ndolor won}}", parserOptions)).toEqual([]);
    expect(parse("lorem ipsum {{dolor won}", parserOptions)).toEqual([]);

    // {{curly}} turned off
    expect(
        parse("cloze {{deletion}} test", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            convertHighlightsToClozes: true,
            convertBoldTextToClozes: true,
            convertCurlyBracketsToClozes: false,
        }),
    ).toEqual([]);

    // combo
    expect(parse("cloze **deletion** test ==another deletion==!", parserOptions)).toEqual([
        [CardType.Cloze, "cloze **deletion** test ==another deletion==!", 0, 0],
    ]);
    expect(
        parse(
            "Test 1\nTest 2\nThis is a close with ===secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.\n\n---\n\nTest 3\nTest 4\nThis is a close with ===super secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.\n\n---\n\nHere is some more text.",
            {
                singleLineCardSeparator: "::",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                multilineCardEndMarker: "---",
                convertHighlightsToClozes: true,
                convertBoldTextToClozes: false,
                convertCurlyBracketsToClozes: false,
            },
        ),
    ).toEqual([
        [
            CardType.Cloze,
            "Test 1\nTest 2\nThis is a close with ===secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.",
            0,
            7,
        ],
        [
            CardType.Cloze,
            "Test 3\nTest 4\nThis is a close with ===super secret=== text.\nWith this extra lines\n\nAnd more here.\nAnd even more.",
            10,
            17,
        ],
    ]);

    // all disabled
    expect(
        parse("cloze {{deletion}} test and **deletion** ==another deletion==!", {
            singleLineCardSeparator: "::",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            convertHighlightsToClozes: false,
            convertBoldTextToClozes: false,
            convertCurlyBracketsToClozes: false,
        }),
    ).toEqual([]);
});

test("Test parsing of a mix of card types", () => {
    expect(
        parse(
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
        parse(
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

    // ```block```, no blank lines
    expect(
        parse(
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
        parse(
            "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\n\n\nprint('Howdy?')\n\nlambda x: x[0]\n```",
            parserOptions,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\n\n\nprint('Howdy?')\n\nlambda x: x[0]\n```",
            0,
            9,
        ],
    ]);

    // nested markdown
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
    expect(parse("<!--question::answer test-->", parserOptions)).toEqual([]);
    expect(parse("<!--question:::answer test-->", parserOptions)).toEqual([]);
    expect(
        parse("<!--\nQuestion\n?\nAnswer <!--SR:!2021-08-11,4,270-->\n-->", parserOptions),
    ).toEqual([]);
    expect(
        parse(
            "<!--\nQuestion\n?\nAnswer <!--SR:!2021-08-11,4,270-->\n\n<!--cloze ==deletion== test-->-->",
            parserOptions,
        ),
    ).toEqual([]);
    expect(parse("<!--cloze ==deletion== test-->", parserOptions)).toEqual([]);
    expect(parse("<!--cloze **deletion** test-->", parserOptions)).toEqual([]);
    expect(parse("<!--cloze {{curly}} test-->", parserOptions)).toEqual([]);
});

test("Test not parsing 'cards' in codeblocks", () => {
    // block
    expect(parse("```\nCodeblockq::CodeblockA\n```", parserOptions)).toEqual([]);
    expect(parse("```\nCodeblockq:::CodeblockA\n```", parserOptions)).toEqual([]);
    expect(
        parse("# Title\n\n```markdown\nsome ==highlighted text==!\n```\n\nmore!", parserOptions),
    ).toEqual([]);
    expect(
        parse("# Title\n```markdown\nsome **bolded text**!\n```\n\nmore!", parserOptions),
    ).toEqual([]);
    expect(parse("# Title\n\n```\nfoo = {{'a': 2}}\n```\n\nmore!", parserOptions)).toEqual([]);

    // inline
    expect(parse("`Inlineq::InlineA`", parserOptions)).toEqual([]);
    expect(
        parse("# Title\n`if (a & b) {}`\nmore!", {
            singleLineCardSeparator: "&",
            singleLineReversedCardSeparator: ":::",
            multilineCardSeparator: "?",
            multilineReversedCardSeparator: "??",
            multilineCardEndMarker: "",
            convertHighlightsToClozes: true,
            convertBoldTextToClozes: true,
            convertCurlyBracketsToClozes: true,
        }),
    ).toEqual([]);
    expect(parse("# Title\n`if a == b && c == d {}`\nmore!", parserOptions)).toEqual([]);
    expect(parse("# Title\n\n`z = a ** b + 5 ** 7`\n\nmore!", parserOptions)).toEqual([]);
    expect(parse("# Title\n`foo = {{'a': 2}}`\n\nmore!", parserOptions)).toEqual([]);

    // combo
    expect(
        parse(
            "Question::Answer\n\n```\nCodeblockq::CodeblockA\n```\n\n`Inlineq::InlineA`\n",
            parserOptions,
        ),
    ).toEqual([[CardType.SingleLineBasic, "Question::Answer", 0, 0]]);
});

test("Unexpected Error case", () => {
    // replace console error log with an empty mock function
    const errorSpy = jest.spyOn(global.console, "error").mockImplementation(() => {});

    expect(parseEx("", null)).toStrictEqual([]);

    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls[0][0]).toMatch(/^Unexpected error:.*/);

    // clear the mock
    errorSpy.mockClear();

    expect(parseEx("", parserOptions)).toStrictEqual([]);
    expect(errorSpy).toHaveBeenCalledTimes(0);

    // restore original console error log
    errorSpy.mockRestore();
});

describe("Parser debug messages", () => {
    test("Messages disabled", () => {
        // replace console error log with an empty mock function
        const logSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});
        setDebugParser(false);

        parseEx("", parserOptions);
        expect(logSpy).toHaveBeenCalledTimes(0);

        // restore original console error log
        logSpy.mockRestore();
    });

    test("Messages enabled", () => {
        // replace console error log with an empty mock function
        const logSpy = jest.spyOn(global.console, "log").mockImplementation(() => {});
        setDebugParser(true);

        parseEx("", parserOptions);
        expect(logSpy).toHaveBeenCalled();

        // restore original console error log
        logSpy.mockRestore();
    });
});
