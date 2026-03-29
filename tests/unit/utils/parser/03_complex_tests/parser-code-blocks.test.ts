import { CardType } from "src/card/questions/question";

import { parserOptions, parseT } from "../../../helpers/unit-test-parser-helper";

// TODO: Add card fragment tests
// TODO: Expand this test

test("Test parsing inline cards with codeblocks", () => {
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
});

test("Test parsing multiline cards with codeblocks", () => {
    // ```block```, no blank lines
    expect(
        parseT([
            "How do you ... Python?",
            "?",
            "```",
            "print('Hello World!')",
            "print('Howdy?')",
            "lambda x: x[0]",
            "```",
        ].join("\n"), parserOptions),
    ).toEqual([
        [
            CardType.MultiLineBasic, [
                "How do you ... Python?",
                "?",
                "```",
                "print('Hello World!')",
                "print('Howdy?')",
                "lambda x: x[0]",
                "```",
            ].join("\n"),
            0,
            6,
        ],
    ]);

    // ```block```, with blank lines
    expect(
        parseT([
            "How do you ... Python?",
            "?",
            "```",
            "",
            "def fn():",
            "   print('Hello World!')",
            "   print('Howdy?')",
            "",
            "fn()",
            "",
            "lambda x: x[0]",
            "",
            "```",
        ].join("\n"), parserOptions),
    ).toEqual([
        [
            CardType.MultiLineBasic, [
                "How do you ... Python?",
                "?",
                "```",
                "",
                "def fn():",
                "   print('Hello World!')",
                "   print('Howdy?')",
                "",
                "fn()",
                "",
                "lambda x: x[0]",
                "",
                "```",
            ].join("\n"),
            0,
            12,
        ],
    ]);

    // nested markdown
    expect(
        parseT(
            [
                "Nested Markdown?",
                "?",
                "````ad-note",
                "",
                "```git",
                "+ print('hello')",
                "- print('world')",
                "```",
                "",
                "~~~python",
                "print('hello world')",
                "~~~",
                "````",
            ].join("\n"),
            parserOptions,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            [
                "Nested Markdown?",
                "?",
                "````ad-note",
                "",
                "```git",
                "+ print('hello')",
                "- print('world')",
                "```",
                "",
                "~~~python",
                "print('hello world')",
                "~~~",
                "````",
            ].join("\n"),
            0,
            12,
        ],
    ]);
});

test("Test parsing cloze cards with codeblocks", () => {
    // Single line cloze
    expect(
        parseT([
            "How do you ==...== Python: ==`print('Hello World!')`==",
        ].join("\n"), parserOptions),
    ).toEqual([
        [
            CardType.Cloze, [
                "How do you ==...== Python: ==`print('Hello World!')`==",
            ].join("\n"),
            0,
            0,
        ],
    ]);

    // multi line cloze

    expect(
        parseT([
            "How do you ==...== Python?",
            "==`print('Hello World!')`==",
        ].join("\n"), parserOptions),
    ).toEqual([
        [
            CardType.Cloze, [
                "How do you ==...== Python?",
                "==`print('Hello World!')`==",
            ].join("\n"),
            0,
            1,
        ],
    ]);

    // TODO: Implement some day, that cloze content can be multiline -> Deviates from anki syntax, so offer a hint about that
    expect(
        parseT([
            "How do you ==...== Python?",
            "```",
            "def fn():",
            "   print('Hello World!')",
            "   print('Howdy?')",
            "fn()",
            "lambda x: x[0]",
            "```",
        ].join("\n"), parserOptions),
    ).toEqual([
        [
            CardType.Cloze, [
                "How do you ==...== Python?",
                "```",
                "def fn():",
                "   print('Hello World!')",
                "   print('Howdy?')",
                "fn()",
                "lambda x: x[0]",
                "```",
            ].join("\n"),
            0,
            7,
        ],
    ]);

    // multi line cloze with blank lines
    expect(
        parseT([
            "How do you ... ==Python==?",
            "```",
            "",
            "def fn():",
            "   print('Hello World!')",
            "   print('Howdy?')",
            "",
            "fn()",
            "",
            "lambda x: x[0]",
            "",
            "```",
            "",
            "text after codeblock",
        ].join("\n"), parserOptions),
    ).toEqual([
        [
            CardType.Cloze, [
                "How do you ... ==Python==?",
                "```",
                "",
                "def fn():",
                "   print('Hello World!')",
                "   print('Howdy?')",
                "",
                "fn()",
                "",
                "lambda x: x[0]",
                "",
                "```",
            ].join("\n"),
            0,
            12,
        ],
    ]);

    expect(
        parseT([
            "How do you ==...== Python?",
            "```",
            "",
            "def fn():",
            "   ==print('Hello World!')==",
            "   print('Howdy?')",
            "",
            "fn()",
            "",
            "lambda x: x[0]",
            "",
            "```",
            "text after codeblock",
            "",
        ].join("\n"), parserOptions),
    ).toEqual([
        [
            CardType.Cloze, [
                "How do you ==...== Python?",
                "```",
                "",
                "def fn():",
                "   print('Hello World!')",
                "   print('Howdy?')",
                "",
                "fn()",
                "",
                "lambda x: x[0]",
                "",
                "```",
                "text after codeblock",
            ].join("\n"),
            0,
            13,
        ],
    ]);

    // nested markdown
    expect(
        parseT(
            [
                "Nested ==Markdown==?",
                "````ad-note",
                "",
                "```git",
                "+ print('hello')",
                "- print('world')",
                "```",
                "",
                "~~~python",
                "print('hello world')",
                "~~~",
                "````",
            ].join("\n"),
            parserOptions,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "Nested ==Markdown==?",
                "````ad-note",
                "",
                "```git",
                "+ print('hello')",
                "- print('world')",
                "```",
                "",
                "~~~python",
                "print('hello world')",
                "~~~",
                "````",
            ].join("\n"),
            0,
            11,
        ],
    ]);
});

test("Test not parsing 'cards' in codeblocks", () => {
    // inline
    expect(parseT(
        [
            "`Codeblockq::CodeblockA`"
        ].join("\n"),
        parserOptions)).toEqual([]);

    expect(parseT(
        [
            "`Codeblockq:::CodeblockA`"
        ].join("\n"),
        parserOptions)).toEqual([]);

    expect(parseT(
        [
            "Text before codeblock",
            "`Codeblockq ==CodeblockA==`",
            "text after codeblock"
        ].join("\n"),
        parserOptions)).toEqual([]);

    expect(parseT(
        [
            "Text before codeblock",
            "```markdown",
            "Text in markdown block ==highlighted text==!",
            "```",
            "text after codeblock"
        ].join("\n"),
        parserOptions)).toEqual([]);

    expect(parseT(
        [
            "Text before codeblock",
            "```markdown",
            "Text in markdown block **bold text**!",
            "```",
            "text after codeblock"
        ].join("\n"),
        parserOptions)).toEqual([]);

    expect(parseT(
        [
            "Text before codeblock",
            "```",
            "foo = {{'a': 2}}",
            "```",
            "text after codeblock"
        ].join("\n"),
        parserOptions)).toEqual([]);

    // 2nd cloze will just be parsed as text
    expect(
        parseT([
            "How do you ==...== Python?",
            "`==print('Hello World!')==``",
        ].join("\n"), parserOptions),
    ).toEqual([
        [
            CardType.Cloze, [
                "How do you ==...== Python?",
                "`==print('Hello World!')==`",
            ].join("\n"),
            0,
            1,
        ],
    ]);

    expect(
        parseT([
            "How do you ==...== Python?",
            "`==print('Hello World!')==``",
        ].join("\n"), parserOptions),
    ).toEqual([
        [
            CardType.Cloze, [
                "How do you ==...== Python?",
                "```",
                "==print('Hello World!')==",
                "```",
            ].join("\n"),
            0,
            3,
        ],
    ]);

    // inline
    expect(
        parseT([
            "# Title",
            "`if (a & b) {}`",
            "more!",
        ].join("\n"),
            {
                singleLineCardSeparator: "&",
                singleLineReversedCardSeparator: ":::",
                multilineCardSeparator: "?",
                multilineReversedCardSeparator: "??",
                useAtomicClozes: false,
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
        parseT([
            "Question::Answer",
            "",
            "```",
            "Codeblockq::CodeblockA",
            "```",
            "",
            "`Inlineq::InlineA`",
        ].join("\n"), parserOptions),
    ).toEqual([[CardType.SingleLineBasic, "Question::Answer", 0, 0]]);
});
