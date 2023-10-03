import { CardType } from "src/Question";
import { CardFrontBack, CardFrontBackUtil, QuestionType_ClozeUtil } from "src/QuestionType";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";

test("CardType.SingleLineBasic", () => {
    expect(CardFrontBackUtil.expand(CardType.SingleLineBasic, "A::B", DEFAULT_SETTINGS)).toEqual([
        new CardFrontBack("A", "B"),
    ]);
});

test("CardType.SingleLineReversed", () => {
    expect(
        CardFrontBackUtil.expand(CardType.SingleLineReversed, "A:::B", DEFAULT_SETTINGS),
    ).toEqual([new CardFrontBack("A", "B"), new CardFrontBack("B", "A")]);
});

describe("CardType.MultiLineBasic", () => {
    test("Basic", () => {
        expect(
            CardFrontBackUtil.expand(
                CardType.MultiLineBasic,
                "A1\nA2\n?\nB1\nB2",
                DEFAULT_SETTINGS,
            ),
        ).toEqual([new CardFrontBack("A1\nA2", "B1\nB2")]);
    });
});

test("CardType.MultiLineReversed", () => {
    expect(
        CardFrontBackUtil.expand(
            CardType.MultiLineReversed,
            "A1\nA2\n??\nB1\nB2",
            DEFAULT_SETTINGS,
        ),
    ).toEqual([new CardFrontBack("A1\nA2", "B1\nB2"), new CardFrontBack("B1\nB2", "A1\nA2")]);
});

test("CardType.Cloze", () => {
    let frontHtml = QuestionType_ClozeUtil.renderClozeFront();

    expect(
        CardFrontBackUtil.expand(
            CardType.Cloze,
            "This is a very ==interesting== test",
            DEFAULT_SETTINGS,
        ),
    ).toEqual([
        new CardFrontBack(
            "This is a very " + frontHtml + " test",
            "This is a very " + QuestionType_ClozeUtil.renderClozeBack("interesting") + " test",
        ),
    ]);

    let settings2: SRSettings = DEFAULT_SETTINGS;
    settings2.convertBoldTextToClozes = true;
    settings2.convertHighlightsToClozes = true;
    settings2.convertCurlyBracketsToClozes = true;

    expect(
        CardFrontBackUtil.expand(CardType.Cloze, "This is a very **interesting** test", settings2),
    ).toEqual([
        new CardFrontBack(
            "This is a very " + frontHtml + " test",
            "This is a very " + QuestionType_ClozeUtil.renderClozeBack("interesting") + " test",
        ),
    ]);

    expect(
        CardFrontBackUtil.expand(CardType.Cloze, "This is a very {{interesting}} test", settings2),
    ).toEqual([
        new CardFrontBack(
            "This is a very " + frontHtml + " test",
            "This is a very " + QuestionType_ClozeUtil.renderClozeBack("interesting") + " test",
        ),
    ]);

    expect(
        CardFrontBackUtil.expand(
            CardType.Cloze,
            "This is a really very {{interesting}} and ==fascinating== and **great** test",
            settings2,
        ),
    ).toEqual([
        new CardFrontBack(
            "This is a really very <span style='color:#2196f3'>[...]</span> and fascinating and great test",
            "This is a really very <span style='color:#2196f3'>interesting</span> and fascinating and great test",
        ),
        new CardFrontBack(
            "This is a really very interesting and <span style='color:#2196f3'>[...]</span> and great test",
            "This is a really very interesting and <span style='color:#2196f3'>fascinating</span> and great test",
        ),
        new CardFrontBack(
            "This is a really very interesting and fascinating and <span style='color:#2196f3'>[...]</span> test",
            "This is a really very interesting and fascinating and <span style='color:#2196f3'>great</span> test",
        ),
    ]);
});
