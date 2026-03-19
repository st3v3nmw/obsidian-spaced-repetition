import { CardType } from "src/card/questions/question";

import { parserOptions, parseT } from "../../../helpers/unit-test-parser-helper";

// TODO: Add card fragment tests

test("Test not parsing cards in HTML comments", () => {
    // Cards found inside comments
    expect(parseT(["<!--question::answer test-->"].join("\n"), parserOptions)).toEqual([]);
    expect(parseT(["<!--question:::answer test-->"].join("\n"), parserOptions)).toEqual([]);

    expect(parseT(["<!--cloze ==deletion== test-->"].join("\n"), parserOptions)).toEqual([]);
    expect(parseT(["<!--cloze **deletion** test-->"].join("\n"), parserOptions)).toEqual([]);
    expect(parseT(["<!--cloze {{curly}} test-->"].join("\n"), parserOptions)).toEqual([]);

    expect(parseT([
        "<!--",
        "Some text before",
        "cloze ==deletion== test",
        "Some text after",
        "-->",
    ].join("\n"), parserOptions)).toEqual([]);


    expect(parseT([
        "<!--question",
        "?",
        "answer test-->",
        "",
        "<!--",
        "question",
        "?",
        "answer",
        "-->",
    ].join("\n"), parserOptions)).toEqual([]);

    expect(parseT([
        "<!--question",
        "??",
        "answer test-->",
        "",
        "<!--",
        "question",
        "??",
        "answer",
        "-->",
    ].join("\n"), parserOptions)).toEqual([]);

    expect(parseT([
        "<!--question",
        "??",
        "answer test-->",
        "",
        "<!--",
        "question",
        "??",
        "answer",
        "-->",
    ].join("\n"), parserOptions)).toEqual([]);

    expect(parseT([
        "<!--",
        "question",
        "?",
        "answer <!--SR:!2021-08-11,4,270-->",
        "-->",
        "<!--",
        "question",
        "?",
        "answer",
        "<!--SR:!2021-08-11,4,270-->",
        "-->",
    ].join("\n"), parserOptions)).toEqual([]);

    expect(parseT([
        "<!--",
        "question",
        "?",
        "answer <!--SR:!2021-08-11,4,270-->",
        "question",
        "?",
        "answer",
        "<!--SR:!2021-08-11,4,270-->",
        "<!--cloze ==deletion== test-->",
        "-->",
    ].join("\n"), parserOptions)).toEqual([]);

    expect(parseT([
        "<!--question",
        "?",
        "answer test <!--SR:!2021-08-11,4,270-->-->",
        "",
        "<!--",
        "question",
        "?",
        "answer",
        "<!--SR:!2021-08-11,4,270-->-->",
    ].join("\n"), parserOptions)).toEqual([]);

    // Cards found outside comment

    expect(parseT([
        "Text before",
        "<!--question",
        "?",
        "answer test <!--SR:!2021-08-11,4,270-->-->",
        "a::b",
        "",
        "text after",
        "text after",
        "text after",
        "",
        "text after",
        "text after",
        "<!--",
        "question",
        "?",
        "answer",
        "<!--SR:!2021-08-11,4,270-->-->",
        "Question",
        "?",
        "Answer",
        "<!--SR:!2021-08-11,4,270-->",

    ].join("\n"), parserOptions)).toEqual([
        [CardType.SingleLineBasic, "a::b", 4, 4],
        [CardType.MultiLineBasic, [
            "Question",
            "?",
            "Answer",
            "<!--SR:!2021-08-11,4,270-->",
        ].join("\n"), 17, 20],
    ]);

    expect(parseT([
        "Text before",
        "<!--question",
        "?",
        "answer test <!--SR:!2021-08-11,4,270-->-->Question::Answer on same line",
        "a::b",
        "",
        "text after",
        "text after",
        "text after",
        "",
        "text after",
        "text after",
        "<!--",
        "question",
        "?",
        "answer",
        "<!--SR:!2021-08-11,4,270-->--> Text after same line",
        "Question",
        "?",
        "Answer",
        "<!--SR:!2021-08-11,4,270-->",

    ].join("\n"), parserOptions)).toEqual([
        [CardType.SingleLineBasic, "Question::Answer on same line", 3, 3],
        [CardType.SingleLineBasic, "a::b", 4, 4],
        [CardType.MultiLineBasic, [
            "Text after same line",
            "Question",
            "?",
            "Answer",
            "<!--SR:!2021-08-11,4,270-->",
        ].join("\n"), 16, 20],
    ]);
});
