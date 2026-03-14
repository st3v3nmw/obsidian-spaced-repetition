import { CardType } from "src/card/questions/question";

import { parserOptions, parseT } from "../helpers/unit-test-parser-helper";
// TODO: Add card fragment tests
// TODO: Expand this test

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
        parseT(
            "Question::Answer\n\n```\nCodeblockq::CodeblockA\n```\n\n`Inlineq::InlineA`\n",
            parserOptions,
        ),
    ).toEqual([[CardType.SingleLineBasic, "Question::Answer", 0, 0]]);
});
