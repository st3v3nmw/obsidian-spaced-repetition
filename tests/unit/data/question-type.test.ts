import { extractProgressiveHints } from "src/data/data-structures/card/questions/progressive-hints";
import { CardType } from "src/data/data-structures/card/questions/question";
import {
    CardFrontBack,
    CardFrontBackUtil,
    QuestionTypeClozeFormatter,
} from "src/data/data-structures/card/questions/question-type";
import { DEFAULT_SETTINGS, SRSettings } from "src/data/settings";

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
    const clozeFormatter = new QuestionTypeClozeFormatter();

    expect(
        CardFrontBackUtil.expand(
            CardType.Cloze,
            "This is a very ==interesting== test",
            DEFAULT_SETTINGS,
        ),
    ).toEqual([
        new CardFrontBack(
            "This is a very " + clozeFormatter.asking() + " test",
            "This is a very " + clozeFormatter.showingAnswer("interesting") + " test",
        ),
    ]);

    const settings2: SRSettings = DEFAULT_SETTINGS;
    settings2.clozePatterns = [
        "==[123;;]answer[;;hint]==",
        "**[123;;]answer[;;hint]**",
        "{{[123;;]answer[;;hint]}}",
    ];

    expect(
        CardFrontBackUtil.expand(CardType.Cloze, "This is a very **interesting** test", settings2),
    ).toEqual([
        new CardFrontBack(
            "This is a very " + clozeFormatter.asking() + " test",
            "This is a very " + clozeFormatter.showingAnswer("interesting") + " test",
        ),
    ]);

    expect(
        CardFrontBackUtil.expand(CardType.Cloze, "This is a very {{interesting}} test", settings2),
    ).toEqual([
        new CardFrontBack(
            "This is a very " + clozeFormatter.asking() + " test",
            "This is a very " + clozeFormatter.showingAnswer("interesting") + " test",
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
            "This is a really very interesting and <span style='color:#2196f3'>[...]</span> and great test",
            "This is a really very interesting and <span style='color:#2196f3'>fascinating</span> and great test",
        ),
        new CardFrontBack(
            "This is a really very interesting and fascinating and <span style='color:#2196f3'>[...]</span> test",
            "This is a really very interesting and fascinating and <span style='color:#2196f3'>great</span> test",
        ),
        new CardFrontBack(
            "This is a really very <span style='color:#2196f3'>[...]</span> and fascinating and great test",
            "This is a really very <span style='color:#2196f3'>interesting</span> and fascinating and great test",
        ),
    ]);
});

describe("Progressive cloze hints", () => {
    test("creates cumulative hint fronts without adding cards", () => {
        const text = [
            "Question",
            "Hint 1: ==h1;;two features==",
            "Hint 2: ==h2;;type;;second-level hint== and ==h2;;mode;;...==",
            "Answer: ==1;;type== is ==1;;STRUCT== and mode is ==1;;REPEATED==",
        ].join("\n");

        const cards = CardFrontBackUtil.expand(CardType.Cloze, text, DEFAULT_SETTINGS);
        expect(cards).toHaveLength(1);
        expect(cards[0].hintFronts).toHaveLength(2);

        expect(cards[0].front).toContain("[Level 1 hint]");
        expect(cards[0].front).toContain("color:var(--color-orange, #f59e0b)");
        expect(cards[0].front).toContain("[second-level hint]");
        expect(cards[0].front).toContain("[...]");
        expect(cards[0].front).not.toContain("two features");

        expect(cards[0].hintFronts[0]).toContain("two features");
        expect(cards[0].hintFronts[0]).toContain("[second-level hint]");
        expect(cards[0].hintFronts[0]).not.toContain(">type<");

        expect(cards[0].hintFronts[1]).toContain("two features");
        expect(cards[0].hintFronts[1]).toContain(">type<");
        expect(cards[0].hintFronts[1]).toContain(">mode<");
        expect(cards[0].hintFronts[1]).toContain("color:var(--color-orange, #f59e0b)");
        expect(cards[0].hintFronts[1]).toContain("[...]</span> is");

        expect(cards[0].back).toContain(">two features<");
        expect(cards[0].back).toContain(">type<");
        expect(cards[0].back).toContain(">STRUCT<");
        expect(cards[0].back).toContain(">REPEATED<");
    });

    test("reveals sparse levels in sorted order and same-level hints together", () => {
        const cards = CardFrontBackUtil.expand(
            CardType.Cloze,
            "==h3;;third A== ==h1;;first== ==h3;;third B== Answer: ==answer==",
            DEFAULT_SETTINGS,
        );

        expect(cards).toHaveLength(1);
        expect(cards[0].hintFronts).toHaveLength(2);
        expect(cards[0].hintFronts[0]).toContain(">first<");
        expect(cards[0].hintFronts[0]).not.toContain(">third A<");
        expect(cards[0].hintFronts[1]).toContain(">third A<");
        expect(cards[0].hintFronts[1]).toContain(">third B<");
    });

    test("shares progressive hints across multiple answer cards", () => {
        const cards = CardFrontBackUtil.expand(
            CardType.Cloze,
            "==h1;;shared hint== ==1;;first answer== ==2;;second answer==",
            DEFAULT_SETTINGS,
        );

        expect(cards).toHaveLength(2);
        for (const card of cards) {
            expect(card.hintFronts).toHaveLength(1);
            expect(card.front).toContain("[Level 1 hint]");
            expect(card.hintFronts[0]).toContain(">shared hint<");
        }
    });

    test("leaves malformed progressive hint syntax unchanged", () => {
        const text = "==h0;;zero== ==H1;;uppercase== ==h1;;;;empty== ==answer==";
        const extracted = extractProgressiveHints(text);

        expect(extracted.hints).toEqual([]);
        expect(extracted.levels).toEqual([]);
        expect(extracted.text).toEqual(text);
    });
});
