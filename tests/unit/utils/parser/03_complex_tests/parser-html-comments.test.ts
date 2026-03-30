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
            "text after",
            "text after",
            "Question",
            "?",
            "Answer",
            "<!--SR:!2021-08-11,4,270-->",
        ].join("\n"), 10, 20],
    ]);

    expect(parseT([
        "---",
        "- tags: [flashcards]",
        "---",
        "",
        "<!--",
        "-->",
        "",
        "Question:::Answer on same line",
    ].join("\n"), parserOptions)).toEqual([
        [CardType.SingleLineReversed, "Question:::Answer on same line", 7, 7],
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
            "text after",
            "text after",
            " Text after same line",
            "Question",
            "?",
            "Answer",
            "<!--SR:!2021-08-11,4,270-->",
        ].join("\n"), 10, 20],
    ]);

    expect(parseT([
        "Text before",
        "<!--question",
        "?",
        "answer test <!--SR:!2021-08-11,4,270-->-->Question:::Answer on same line",
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
        "<!--Answer_test_1-->",
        "Answer --> Arrow Test",
        "<!--Answer_test_2 ",
        "Answer_test_3-->",
        "Answer",
        "Answer",
        "<!--SR:!2021-08-11,4,270-->",
    ].join("\n"), parserOptions)).toEqual([
        [CardType.SingleLineReversed, "Question:::Answer on same line", 3, 3],
        [CardType.SingleLineBasic, "a::b", 4, 4],
        [CardType.MultiLineBasic, [
            "text after",
            "text after",
            " Text after same line",
            "Question",
            "?",
            "Answer",
            "Answer --> Arrow Test",
            "Answer",
            "Answer",
            "<!--SR:!2021-08-11,4,270-->",
        ].join("\n"), 10, 26],
    ]);

    expect(parseT([
        "Text before",
        "<!--question",
        "?",
        "answer test <!--SR:!2021-08-11,4,270-->-->Question:::Answer on same line",
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
        "Cloze ==word== test",
        "Answer",
        "<!--Answer_test_1-->",
        "Answer --> Arrow Test",
        "<!--Answer_test_2 ",
        "Answer_test_3-->",
        "Answer",
        "Answer",
        "<!--SR:!2021-08-11,4,270-->",
    ].join("\n"), parserOptions)).toEqual([
        [CardType.SingleLineReversed, "Question:::Answer on same line", 3, 3],
        [CardType.SingleLineBasic, "a::b", 4, 4],
        [CardType.Cloze, [
            "text after",
            "text after",
            " Text after same line",
            "Question",
            "Cloze ==word== test",
            "Answer",
            "Answer --> Arrow Test",
            "Answer",
            "Answer",
            "<!--SR:!2021-08-11,4,270-->",
        ].join("\n"), 10, 26],
    ]);

    expect(parseT([
        "Minima <!--repudiandae aliquam et laborum natus ut excepturi enim.",
        "Voluptas ut--> est autem rem ==CLOZE== consequatur. Est ==CLOZE== fugit iure.",
        "",
        "Voluptatibus non quam aut enim. Eaque maxime omnis natus nulla et",
        "voluptatem <!--exercitationem-->. Magnam laborum ut natus sed aperiam",
        "sequi. <!--Aut et expedita ==CLOZE== eligendi--> perferendis perspiciatis",
        "repellendus. Ipsa sint magnam est impedit ARROW --> ==CLOZE== animi rerum at. Sit",
        "veniam et neque magni pariatur exercitationem.",
        "",
        "Fugiat error est repellat sint quia ad odit.Accusantium quasi id quidem.",
        "Iusto quaerat quia odit soluta.Eos doloribus consequatur quod",
        "asperiores et minima corporis impedit.",
        "",
        "Expedita eum iusto et delectus.Laudantium qui cupiditate quibusdam",
        "voluptatem omnis <!--QUESTION::ANSWER--> harum.Ipsa ab hic debitis.",
        "",
        "Quo dolores dolore qui.Eaque commodi aut sit sequi consequatur.",
        "Perspiciatis error eligendi quas.Eos delectus dolores vitae nulla omnis",
        "veniam.",
    ].join("\n"), parserOptions)).toEqual([
        [CardType.Cloze, [
            "Minima",
            " est autem rem ==CLOZE== consequatur. Est ==CLOZE== fugit iure.",
        ].join("\n"), 0, 1],
        [CardType.Cloze, [
            "Voluptatibus non quam aut enim. Eaque maxime omnis natus nulla et",
            "voluptatem . Magnam laborum ut natus sed aperiam",
            "sequi.  perferendis perspiciatis",
            "repellendus. Ipsa sint magnam est impedit ARROW --> ==CLOZE== animi rerum at. Sit",
            "veniam et neque magni pariatur exercitationem.",
        ].join("\n"), 3, 7],
    ]);

    expect(parseT([
        "Minima <!--repudiandae aliquam et laborum natus ut excepturi enim.",
        "Voluptas ut est autem rem ==CLOZE== consequatur. Est ==CLOZE== fugit iure.",
        "",
        "Voluptatibus non quam aut enim. Eaque maxime omnis natus nulla et",
        "voluptatem exercitationem. Magnam laborum ut natus sed aperiam",
        "sequi. Aut et expedita ==CLOZE== eligendi perferendis perspiciatis",
        "repellendus. Ipsa sint magnam est impedit ==CLOZE== animi rerum at. Sit",
        "veniam et neque magni pariatur exercitationem.",
        "",
        "Fugiat error est repellat sint quia ad odit.--> Accusantium quasi id quidem.",
        "Iusto quaerat QUESTION::ANSWER <!--soluta-->.Eos doloribus consequatur quod",
        "asperiores et minima corporis impedit.",
        "",
        "Fugiat error est repellat sint quia ad odit.Accusantium quasi id quidem.",
        "Iusto quaerat <!--quia--> odit soluta.Eos doloribus consequatur quod",
        "asperiores et minima corporis impedit?",
        "?",
        "Expedita eum iusto et delectus.Laudantium<!--SR:!2021-08-11,4,270--> qui cupiditate quibusdam",
        "voluptatem omnis <!--QUESTION::ANSWER--> harum.Ipsa ab hic debitis.",
        "",
        "Quo dolores dolore qui.Eaque commodi aut sit sequi consequatur.",
        "Perspiciatis error eligendi quas.Eos delectus dolores vitae nulla omnis",
        "veniam.",
    ].join("\n"), parserOptions)).toEqual([
        [CardType.SingleLineBasic, [
            "Iusto quaerat QUESTION::ANSWER .Eos doloribus consequatur quod",
        ].join("\n"), 10, 10],
        [CardType.MultiLineBasic, [
            "Fugiat error est repellat sint quia ad odit.Accusantium quasi id quidem.",
            "Iusto quaerat  odit soluta.Eos doloribus consequatur quod",
            "asperiores et minima corporis impedit?",
            "?",
            "Expedita eum iusto et delectus.Laudantium<!--SR:!2021-08-11,4,270--> qui cupiditate quibusdam",
        ].join("\n"), 13, 17],
    ]);
});
