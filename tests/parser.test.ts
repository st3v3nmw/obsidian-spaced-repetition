import { parse } from "src/parser";
import { CardType } from "src/scheduling";

const defaultArgs: [string, string, string, string, boolean, boolean, boolean] = [
    "::",
    ":::",
    "?",
    "??",
    true,
    true,
    true,
];

test("Test parsing of single line basic cards", () => {
    expect(parse("Question::Answer", ...defaultArgs)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer", 0],
    ]);
    expect(parse("Question::Answer\n<!--SR:!2021-08-11,4,270-->", ...defaultArgs)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer\n<!--SR:!2021-08-11,4,270-->", 0],
    ]);
    expect(parse("Question::Answer <!--SR:2021-08-11,4,270-->", ...defaultArgs)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer <!--SR:2021-08-11,4,270-->", 0],
    ]);
    expect(parse("Some text before\nQuestion ::Answer", ...defaultArgs)).toEqual([
        [CardType.SingleLineBasic, "Question ::Answer", 1],
    ]);
    expect(parse("#Title\n\nQ1::A1\nQ2:: A2", ...defaultArgs)).toEqual([
        [CardType.SingleLineBasic, "Q1::A1", 2],
        [CardType.SingleLineBasic, "Q2:: A2", 3],
    ]);
});

test("Test parsing of single line reversed cards", () => {
    expect(parse("Question:::Answer", ...defaultArgs)).toEqual([
        [CardType.SingleLineReversed, "Question:::Answer", 0],
    ]);
    expect(parse("Some text before\nQuestion :::Answer", ...defaultArgs)).toEqual([
        [CardType.SingleLineReversed, "Question :::Answer", 1],
    ]);
    expect(parse("#Title\n\nQ1:::A1\nQ2::: A2", ...defaultArgs)).toEqual([
        [CardType.SingleLineReversed, "Q1:::A1", 2],
        [CardType.SingleLineReversed, "Q2::: A2", 3],
    ]);
});

test("Test parsing of multi line basic cards", () => {
    expect(parse("Question\n?\nAnswer", ...defaultArgs)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer", 1],
    ]);
    expect(parse("Question\n?\nAnswer <!--SR:!2021-08-11,4,270-->", ...defaultArgs)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer <!--SR:!2021-08-11,4,270-->", 1],
    ]);
    expect(parse("Question\n?\nAnswer\n<!--SR:2021-08-11,4,270-->", ...defaultArgs)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer\n<!--SR:2021-08-11,4,270-->", 1],
    ]);
    expect(parse("Some text before\nQuestion\n?\nAnswer", ...defaultArgs)).toEqual([
        [CardType.MultiLineBasic, "Some text before\nQuestion\n?\nAnswer", 2],
    ]);
    expect(parse("Question\n?\nAnswer\nSome text after!", ...defaultArgs)).toEqual([
        [CardType.MultiLineBasic, "Question\n?\nAnswer\nSome text after!", 1],
    ]);
    expect(parse("#Title\n\nLine0\nQ1\n?\nA1\nAnswerExtra\n\nQ2\n?\nA2", ...defaultArgs)).toEqual([
        [CardType.MultiLineBasic, "Line0\nQ1\n?\nA1\nAnswerExtra", 4],
        [CardType.MultiLineBasic, "Q2\n?\nA2", 9],
    ]);
});

test("Test parsing of multi line reversed cards", () => {
    expect(parse("Question\n??\nAnswer", ...defaultArgs)).toEqual([
        [CardType.MultiLineReversed, "Question\n??\nAnswer", 1],
    ]);
    expect(parse("Some text before\nQuestion\n??\nAnswer", ...defaultArgs)).toEqual([
        [CardType.MultiLineReversed, "Some text before\nQuestion\n??\nAnswer", 2],
    ]);
    expect(parse("Question\n??\nAnswer\nSome text after!", ...defaultArgs)).toEqual([
        [CardType.MultiLineReversed, "Question\n??\nAnswer\nSome text after!", 1],
    ]);
    expect(parse("#Title\n\nLine0\nQ1\n??\nA1\nAnswerExtra\n\nQ2\n??\nA2", ...defaultArgs)).toEqual(
        [
            [CardType.MultiLineReversed, "Line0\nQ1\n??\nA1\nAnswerExtra", 4],
            [CardType.MultiLineReversed, "Q2\n??\nA2", 9],
        ]
    );
});

test("Test parsing of cloze cards", () => {
    // ==highlights==
    expect(parse("cloze ==deletion== test", ...defaultArgs)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test", 0],
    ]);
    expect(parse("cloze ==deletion== test\n<!--SR:2021-08-11,4,270-->", ...defaultArgs)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test\n<!--SR:2021-08-11,4,270-->", 0],
    ]);
    expect(parse("cloze ==deletion== test <!--SR:2021-08-11,4,270-->", ...defaultArgs)).toEqual([
        [CardType.Cloze, "cloze ==deletion== test <!--SR:2021-08-11,4,270-->", 0],
    ]);
    expect(parse("==this== is a ==deletion==\n", ...defaultArgs)).toEqual([
        [CardType.Cloze, "==this== is a ==deletion==", 0],
    ]);
    expect(
        parse(
            "some text before\n\na deletion on\nsuch ==wow==\n\n" +
                "many text\nsuch surprise ==wow== more ==text==\nsome text after\n\nHmm",
            ...defaultArgs
        )
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch ==wow==", 3],
        [CardType.Cloze, "many text\nsuch surprise ==wow== more ==text==\nsome text after", 6],
    ]);
    expect(parse("srdf ==", ...defaultArgs)).toEqual([]);
    expect(parse("lorem ipsum ==p\ndolor won==", ...defaultArgs)).toEqual([]);
    expect(parse("lorem ipsum ==dolor won=", ...defaultArgs)).toEqual([]);
    // ==highlights== turned off
    expect(parse("cloze ==deletion== test", "::", ":::", "?", "??", false, true, false)).toEqual(
        []
    );

    // **bolded**
    expect(parse("cloze **deletion** test", ...defaultArgs)).toEqual([
        [CardType.Cloze, "cloze **deletion** test", 0],
    ]);
    expect(parse("cloze **deletion** test\n<!--SR:2021-08-11,4,270-->", ...defaultArgs)).toEqual([
        [CardType.Cloze, "cloze **deletion** test\n<!--SR:2021-08-11,4,270-->", 0],
    ]);
    expect(parse("cloze **deletion** test <!--SR:2021-08-11,4,270-->", ...defaultArgs)).toEqual([
        [CardType.Cloze, "cloze **deletion** test <!--SR:2021-08-11,4,270-->", 0],
    ]);
    expect(parse("**this** is a **deletion**\n", ...defaultArgs)).toEqual([
        [CardType.Cloze, "**this** is a **deletion**", 0],
    ]);
    expect(
        parse(
            "some text before\n\na deletion on\nsuch **wow**\n\n" +
                "many text\nsuch surprise **wow** more **text**\nsome text after\n\nHmm",
            ...defaultArgs
        )
    ).toEqual([
        [CardType.Cloze, "a deletion on\nsuch **wow**", 3],
        [CardType.Cloze, "many text\nsuch surprise **wow** more **text**\nsome text after", 6],
    ]);
    expect(parse("srdf **", ...defaultArgs)).toEqual([]);
    expect(parse("lorem ipsum **p\ndolor won**", ...defaultArgs)).toEqual([]);
    expect(parse("lorem ipsum **dolor won*", ...defaultArgs)).toEqual([]);
    // **bolded** turned off
    expect(parse("cloze **deletion** test", "::", ":::", "?", "??", true, false, false)).toEqual(
        []
    );

    // both
    expect(parse("cloze **deletion** test ==another deletion==!", ...defaultArgs)).toEqual([
        [CardType.Cloze, "cloze **deletion** test ==another deletion==!", 0],
    ]);
});

test("Test parsing of a mix of card types", () => {
    expect(
        parse(
            "# Lorem Ipsum\n\nLorem ipsum dolor ==sit amet==, consectetur ==adipiscing== elit.\n" +
                "Duis magna arcu, eleifend rhoncus ==euismod non,==\nlaoreet vitae enim.\n\n" +
                "Fusce placerat::velit in pharetra gravida\n\n" +
                "Donec dapibus ullamcorper aliquam.\n??\nDonec dapibus ullamcorper aliquam.\n<!--SR:2021-08-11,4,270-->",
            ...defaultArgs
        )
    ).toEqual([
        [
            CardType.Cloze,
            "Lorem ipsum dolor ==sit amet==, consectetur ==adipiscing== elit.\n" +
                "Duis magna arcu, eleifend rhoncus ==euismod non,==\n" +
                "laoreet vitae enim.",
            2,
        ],
        [CardType.SingleLineBasic, "Fusce placerat::velit in pharetra gravida", 6],
        [
            CardType.MultiLineReversed,
            "Donec dapibus ullamcorper aliquam.\n??\nDonec dapibus ullamcorper aliquam.\n<!--SR:2021-08-11,4,270-->",
            9,
        ],
    ]);
});

test("Test codeblocks", () => {
    // no blank lines
    expect(
        parse(
            "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\nprint('Howdy?')\nlambda x: x[0]\n```",
            ...defaultArgs
        )
    ).toEqual([
        [
            CardType.MultiLineBasic,
            "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\nprint('Howdy?')\nlambda x: x[0]\n```",
            1,
        ],
    ]);

    // with blank lines
    expect(
        parse(
            "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\n\n\nprint('Howdy?')\n\nlambda x: x[0]\n```",
            ...defaultArgs
        )
    ).toEqual([
        [
            CardType.MultiLineBasic,
            "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\n\n\nprint('Howdy?')\n\nlambda x: x[0]\n```",
            1,
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
            ...defaultArgs
        )
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
            1,
        ],
    ]);
});

test("Test not parsing cards in HTML comments", () => {
    expect(
        parse("<!--\nQuestion\n?\nAnswer <!--SR:!2021-08-11,4,270-->\n-->", ...defaultArgs)
    ).toEqual([]);
    expect(
        parse(
            "<!--\nQuestion\n?\nAnswer <!--SR:!2021-08-11,4,270-->\n\n<!--cloze ==deletion== test-->-->",
            ...defaultArgs
        )
    ).toEqual([]);
    expect(parse("<!--cloze ==deletion== test-->", ...defaultArgs)).toEqual([]);
    expect(parse("<!--cloze **deletion** test-->", ...defaultArgs)).toEqual([]);
});
