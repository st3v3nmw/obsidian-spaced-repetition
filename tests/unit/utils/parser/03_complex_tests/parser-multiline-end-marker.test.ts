import { CardType } from "src/card/questions/question";

import { parserOptions, parseT } from "../../../helpers/unit-test-parser-helper";

// TODO: Add card fragment tests

test("Test that the standard multiline card recognition still works with multi line end marker enabled, but not used", () => {
    const parserOptionsWithEndMarker = {
        ...parserOptions,
        multilineCardEndMarker: "---",
    };

    expect(
        parseT(
            [
                "Text before card",
                "",
                "Question",
                "Question1",
                "?",
                "Answer",
                "Answer1",
                "",
                "Text after card",
                "Text before card",
                "",
                "Question",
                "Question2",
                "??",
                "Answer",
                "Answer2",
                "",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarker,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            ["Question", "Question1", "?", "Answer", "Answer1"].join("\n"),
            2,
            6,
        ],
        [
            CardType.MultiLineReversed,
            ["Question", "Question2", "?", "Answer", "Answer2"].join("\n"),
            11,
            15,
        ],
    ]);
});

test("Test that the standard cloze card recognition still works with multi line end marker enabled, but not used", () => {
    const parserOptionsWithEndMarker = {
        ...parserOptions,
        multilineCardEndMarker: "---",
    };

    expect(
        parseT(
            [
                "Text before card",
                "",
                "Question",
                "Question1",
                "==Cloze1==",
                "Answer",
                "Answer1",
                "",
                "Text after card",
                "Text before card",
                "",
                "Question",
                "Question2",
                "==Cloze2==",
                "Answer",
                "Answer2",
                "",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarker,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            ["Question", "Question1", "==Cloze1==", "Answer", "Answer1"].join("\n"),
            2,
            6,
        ],
        [
            CardType.Cloze,
            ["Question", "Question2", "==Cloze2==", "Answer", "Answer2"].join("\n"),
            11,
            15,
        ],
    ]);
});

test("Test parsing of multi line cards with end marker", () => {
    const parserOptionsWithEndMarker = {
        ...parserOptions,
        multilineCardEndMarker: "---",
    };

    expect(
        parseT(
            [
                "Text before card",
                "",
                "Question",
                "Question1",
                "?",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "Answer1",
                "---",
                "",
                "Text after card",
                "Text before card",
                "",
                "Question",
                "Question2",
                "??",
                "Answer",
                "Answer2",
                "---",
                "",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarker,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            [
                "Question",
                "Question1",
                "?",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "Answer1",
                "---",
            ].join("\n"),
            2,
            10,
        ],
        [
            CardType.MultiLineReversed,
            ["Question", "Question2", "??", "Answer", "Answer2", "---"].join("\n"),
            15,
            20,
        ],
    ]);

    expect(
        parseT(
            [
                "Text before card",
                "",
                "Question",
                "Question1",
                "?",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "---",
                "",
                "Text after card",
                "Text before card",
                "",
                "Question",
                "Question2",
                "??",
                "Answer",
                "Answer2",
                "",
                "---",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarker,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            [
                "Question",
                "Question1",
                "?",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "---",
            ].join("\n"),
            2,
            10,
        ],
        [
            CardType.MultiLineReversed,
            ["Question", "Question2", "??", "Answer", "Answer2", "", "---"].join("\n"),
            15,
            21,
        ],
    ]);

    expect(
        parseT(
            [
                "Text before card",
                "",
                "#flashcards/tag-on-previous-line",
                "Question1",
                "?",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "---",
                "",
                "Text after card",
                "Text before card",
                "",
                "Question",
                "Question2",
                "??",
                "Answer",
                "<!--SR:2021-08-11,4,270-->",
                "",
                "---",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarker,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            [
                "#flashcards/tag-on-previous-line",
                "Question1",
                "?",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "---",
            ].join("\n"),
            2,
            10,
        ],
        [
            CardType.MultiLineReversed,
            ["Question", "Question2", "??", "Answer", "<!--SR:2021-08-11,4,270-->", "", "---"].join(
                "\n",
            ),
            15,
            21,
        ],
    ]);

    expect(
        parseT(
            [
                "Text before card",
                "",
                "#flashcards/tag-on-previous-line",
                "Question1",
                "?",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "---",
                "---",
                "",
                "Text before card",
                "",
                "Question",
                "Question2",
                "??",
                "Answer",
                "<!--SR:2021-08-11,4,270-->",
                "",
                "---",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarker,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            [
                "#flashcards/tag-on-previous-line",
                "Question1",
                "?",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "---",
            ].join("\n"),
            2,
            10,
        ],
        [
            CardType.MultiLineReversed,
            ["Question", "Question2", "??", "Answer", "<!--SR:2021-08-11,4,270-->", "", "---"].join(
                "\n",
            ),
            15,
            21,
        ],
    ]);

    // custom symbols

    const parserOptionsWithEndMarkerAndCustomSymbols = {
        ...parserOptions,
        multilineCardEndMarker: "111",
        multilineCardSeparator: "@@",
        multilineReversedCardSeparator: "@@@",
    };

    expect(
        parseT(
            [
                "Text before card",
                "",
                "#flashcards/tag-on-previous-line",
                "Question1",
                "@@",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "111",
                "111",
                "",
                "Text before card",
                "",
                "Question",
                "Question2",
                "@@@",
                "Answer",
                "<!--SR:2021-08-11,4,270-->",
                "",
                "111",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarkerAndCustomSymbols,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            [
                "#flashcards/tag-on-previous-line",
                "Question1",
                "@@",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "111",
            ].join("\n"),
            2,
            10,
        ],
        [
            CardType.MultiLineReversed,
            [
                "Question",
                "Question2",
                "@@@",
                "Answer",
                "<!--SR:2021-08-11,4,270-->",
                "",
                "111",
            ].join("\n"),
            15,
            21,
        ],
    ]);

    expect(
        parseT(
            [
                "Text before card",
                "",
                "#flashcards/tag-on-previous-line",
                "Question1",
                "@@",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "111",
                "---",
                "",
                "Text before card",
                "",
                "Question",
                "Question2",
                "@@@",
                "Answer",
                "<!--SR:2021-08-11,4,270-->",
                "",
                "sadsadsa",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarkerAndCustomSymbols,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            [
                "#flashcards/tag-on-previous-line",
                "Question1",
                "@@",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "111",
            ].join("\n"),
            2,
            10,
        ],
        [
            CardType.MultiLineReversed,
            ["Question", "Question2", "@@@", "Answer", "<!--SR:2021-08-11,4,270-->"].join("\n"),
            15,
            19,
        ],
    ]);
});

test("Test parsing of multiline line cloze cards with end marker", () => {
    const parserOptionsWithEndMarker = {
        ...parserOptions,
        multilineCardEndMarker: "---",
    };

    expect(
        parseT(
            [
                "Text before card",
                "",
                "Question",
                "Question1",
                "==Cloze1==",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "Answer1",
                "---",
                "",
                "Text after card",
                "Text before card",
                "",
                "Question",
                "Question2",
                "==Cloze2==",
                "Answer",
                "Answer2",
                "---",
                "",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarker,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "Question",
                "Question1",
                "==Cloze1==",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "Answer1",
                "---",
            ].join("\n"),
            2,
            10,
        ],
        [
            CardType.Cloze,
            ["Question", "Question2", "==Cloze2==", "Answer", "Answer2", "---"].join("\n"),
            15,
            20,
        ],
    ]);

    expect(
        parseT(
            [
                "Text before card",
                "",
                "Question",
                "Question1",
                "==Cloze1==",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "---",
                "",
                "Text after card",
                "Text before card",
                "",
                "Question",
                "Question2",
                "==Cloze2==",
                "Answer",
                "Answer2",
                "",
                "---",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarker,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "Question",
                "Question1",
                "==Cloze1==",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "---",
            ].join("\n"),
            2,
            10,
        ],
        [
            CardType.Cloze,
            ["Question", "Question2", "==Cloze2==", "Answer", "Answer2", "", "---"].join("\n"),
            15,
            21,
        ],
    ]);

    expect(
        parseT(
            [
                "Text before card",
                "",
                "#flashcards/tag-on-previous-line",
                "Question1",
                "==Cloze1==",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "---",
                "",
                "Text after card",
                "Text before card",
                "",
                "Question",
                "Question2",
                "==Cloze2==",
                "Answer",
                "<!--SR:2021-08-11,4,270-->",
                "",
                "---",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarker,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "#flashcards/tag-on-previous-line",
                "Question1",
                "==Cloze1==",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "---",
            ].join("\n"),
            2,
            10,
        ],
        [
            CardType.Cloze,
            [
                "Question",
                "Question2",
                "==Cloze2==",
                "Answer",
                "<!--SR:2021-08-11,4,270-->",
                "",
                "---",
            ].join("\n"),
            15,
            21,
        ],
    ]);

    expect(
        parseT(
            [
                "Text before card",
                "",
                "#flashcards/tag-on-previous-line",
                "Question1",
                "==Cloze1==",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "---",
                "---",
                "",
                "Text before card",
                "",
                "Question",
                "Question2",
                "==Cloze2==",
                "Answer",
                "<!--SR:2021-08-11,4,270-->",
                "",
                "---",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarker,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "#flashcards/tag-on-previous-line",
                "Question1",
                "==Cloze1==",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "---",
            ].join("\n"),
            2,
            10,
        ],
        [
            CardType.Cloze,
            [
                "Question",
                "Question2",
                "==Cloze2==",
                "Answer",
                "<!--SR:2021-08-11,4,270-->",
                "",
                "---",
            ].join("\n"),
            15,
            21,
        ],
    ]);

    // custom symbols

    const parserOptionsWithEndMarkerAndCustomSymbols = {
        ...parserOptions,
        multilineCardEndMarker: "111",
        clozePatterns: ["@@[123;;]answer[;;hint]@@"],
    };

    expect(
        parseT(
            [
                "Text before card",
                "",
                "#flashcards/tag-on-previous-line",
                "Question1",
                "@@Cloze1@@",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "111",
                "111",
                "",
                "Text before card",
                "",
                "Question",
                "Question2",
                "@@Cloze2@@",
                "Answer",
                "<!--SR:2021-08-11,4,270-->",
                "",
                "111",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarkerAndCustomSymbols,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "#flashcards/tag-on-previous-line",
                "Question1",
                "@@Cloze1@@",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "111",
            ].join("\n"),
            2,
            10,
        ],
        [
            CardType.Cloze,
            [
                "Question",
                "Question2",
                "@@Cloze2@@",
                "Answer",
                "<!--SR:2021-08-11,4,270-->",
                "",
                "111",
            ].join("\n"),
            15,
            21,
        ],
    ]);

    expect(
        parseT(
            [
                "Text before card",
                "",
                "#flashcards/tag-on-previous-line",
                "Question1",
                "@@Cloze1@@",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "111",
                "---",
                "",
                "Text before card",
                "",
                "Question",
                "Question2",
                "@@Cloze2@@",
                "Answer",
                "<!--SR:2021-08-11,4,270-->",
                "",
                "sadsadsa",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarkerAndCustomSymbols,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            [
                "#flashcards/tag-on-previous-line",
                "Question1",
                "@@Cloze1@@",
                "Answer",
                "Answer1",
                "",
                "Answer1",
                "<!--SR:2021-08-11,4,270-->",
                "111",
            ].join("\n"),
            2,
            10,
        ],
        [
            CardType.Cloze,
            ["Question", "Question2", "@@Cloze2@@", "Answer", "<!--SR:2021-08-11,4,270-->"].join(
                "\n",
            ),
            15,
            19,
        ],
    ]);
});

test("Test that the standard multiline card recognition still works with multi line end marker enabled, but not used sometimes", () => {
    const parserOptionsWithEndMarker = {
        ...parserOptions,
        multilineCardEndMarker: "---",
    };

    expect(
        parseT(
            [
                "Text before card",
                "",
                "Question",
                "Question1",
                "?",
                "Answer",
                "Answer1",
                "",
                "Text after card",
                "Text before card",
                "",
                "Question",
                "Question2",
                "??",
                "Answer",
                "Answer2",
                "",
                "Text after card",
                "Text before card",
                "",
                "Question",
                "Question3",
                "??",
                "Answer",
                "Answer3",
                "",
                "Answer3",
                "---",
            ].join("\n"),
            parserOptionsWithEndMarker,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            ["Question", "Question1", "?", "Answer", "Answer1"].join("\n"),
            2,
            6,
        ],
        [
            CardType.MultiLineReversed,
            ["Question", "Question2", "?", "Answer", "Answer2"].join("\n"),
            11,
            15,
        ],
        [
            CardType.MultiLineReversed,
            ["Question", "Question3", "?", "Answer", "Answer3", "", "Answer3", "---"].join("\n"),
            20,
            27,
        ],
    ]);

    expect(
        parseT(
            [
                "Text before card",
                "",
                "Question",
                "Question1",
                "?",
                "Answer",
                "Answer1",
                "",
                "Text after card",
                "Text before card",
                "",
                "Question",
                "Question2",
                "??",
                "Answer",
                "Answer2",
                "",
                "Answer2",
                "---",
                "Text before card",
                "",
                "Question",
                "Question3",
                "??",
                "Answer",
                "Answer3",
                "",
                "Answer3",
            ].join("\n"),
            parserOptionsWithEndMarker,
        ),
    ).toEqual([
        [
            CardType.MultiLineBasic,
            ["Question", "Question1", "?", "Answer", "Answer1"].join("\n"),
            2,
            6,
        ],
        [
            CardType.MultiLineReversed,
            ["Question", "Question2", "?", "Answer", "Answer2", "", "Answer2", "---"].join("\n"),
            11,
            18,
        ],
        [
            CardType.MultiLineReversed,
            ["Question", "Question3", "?", "Answer", "Answer3"].join("\n"),
            21,
            25,
        ],
    ]);
});

test("Test that the standard cloze card recognition still works with multi line end marker enabled, but not used sometimes", () => {
    const parserOptionsWithEndMarker = {
        ...parserOptions,
        multilineCardEndMarker: "---",
    };

    expect(
        parseT(
            [
                "Text before card",
                "",
                "Question",
                "Question1",
                "==Cloze1==",
                "Answer",
                "Answer1",
                "",
                "Text after card",
                "Text before card",
                "",
                "Question",
                "Question2",
                "==Cloze2==",
                "Answer",
                "Answer2",
                "",
                "Text after card",
                "Text before card",
                "",
                "Question",
                "Question3",
                "==Cloze3==",
                "Answer",
                "Answer3",
                "",
                "Answer3",
                "---",
                "",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarker,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            ["Question", "Question1", "==Cloze1==", "Answer", "Answer1"].join("\n"),
            2,
            6,
        ],
        [
            CardType.Cloze,
            ["Question", "Question2", "==Cloze2==", "Answer", "Answer2"].join("\n"),
            11,
            15,
        ],
        [
            CardType.Cloze,
            ["Question", "Question3", "==Cloze3==", "Answer", "Answer3", "", "Answer3", "---"].join(
                "\n",
            ),
            20,
            27,
        ],
    ]);

    expect(
        parseT(
            [
                "Text before card",
                "",
                "Question",
                "Question1",
                "==Cloze1==",
                "Answer",
                "Answer1",
                "",
                "Text after card",
                "Text before card",
                "",
                "Question",
                "Question2",
                "==Cloze2==",
                "Answer",
                "Answer2",
                "",
                "Answer2",
                "---",
                "Text before card",
                "",
                "Question",
                "Question3",
                "==Cloze3==",
                "Answer",
                "Answer3",
                "",
                "Text after card",
                "",
                "Text after card",
            ].join("\n"),
            parserOptionsWithEndMarker,
        ),
    ).toEqual([
        [
            CardType.Cloze,
            ["Question", "Question1", "==Cloze1==", "Answer", "Answer1"].join("\n"),
            2,
            6,
        ],
        [
            CardType.Cloze,
            ["Question", "Question2", "==Cloze2==", "Answer", "Answer2", "", "Answer2", "---"].join(
                "\n",
            ),
            11,
            18,
        ],
        [
            CardType.Cloze,
            ["Question", "Question3", "==Cloze3==", "Answer", "Answer3"].join("\n"),
            20,
            25,
        ],
    ]);
});
