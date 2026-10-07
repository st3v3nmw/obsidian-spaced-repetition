import {
    containsMathCloze,
    restoreMathClozes,
    tokenizeMathClozes,
} from "src/data/data-structures/card/questions/math-cloze";
import { CardType } from "src/data/data-structures/card/questions/question";
import {
    CardFrontBack,
    CardFrontBackUtil,
} from "src/data/data-structures/card/questions/question-type";
import { DEFAULT_SETTINGS } from "src/data/settings";

// Goes through the public expand() path to also cover the QuestionTypeCloze wiring.
const expand = (text: string) => CardFrontBackUtil.expand(CardType.Cloze, text, DEFAULT_SETTINGS);

describe("containsMathCloze", () => {
    test.each([
        ["$\\cloze{a}{b}$", true],
        ["$\\cloze {a}{b}$", true],
        ["plain {{a}} text", false],
        ["$\\cloze[2]{a}{b}$", true],
        ["$\\clozenot{a}{b}$", false], // command boundary: \clozenot is not \cloze
        ["no math here", false],
    ])("%s -> %s", (text, expected) => {
        expect(containsMathCloze(text)).toBe(expected);
    });
});

describe("expanding \\cloze macros", () => {
    test("inline cloze with hint", () => {
        expect(expand("$f(x) = \\cloze{g(x)}{inner function}$")).toEqual([
            new CardFrontBack(
                "$f(x) = {\\color{#2196f3}{[\\text{inner function}]}}$",
                "$f(x) = {\\color{#2196f3}{g(x)}}$",
            ),
        ]);
    });

    test("empty hint falls back to ellipsis placeholder", () => {
        expect(expand("$$\\cloze{c^2}{} = a^2 + b^2$$")).toEqual([
            new CardFrontBack(
                "$${\\color{#2196f3}{[\\ldots]}} = a^2 + b^2$$",
                "$${\\color{#2196f3}{c^2}} = a^2 + b^2$$",
            ),
        ]);
    });

    test("multiple clozes become sibling cards; non-targets show their answer", () => {
        expect(expand("$$\\cloze{a^2}{} + \\cloze{b^2}{} = c^2$$")).toEqual([
            new CardFrontBack(
                "$${\\color{#2196f3}{[\\ldots]}} + b^2 = c^2$$",
                "$${\\color{#2196f3}{a^2}} + b^2 = c^2$$",
            ),
            new CardFrontBack(
                "$$a^2 + {\\color{#2196f3}{[\\ldots]}} = c^2$$",
                "$$a^2 + {\\color{#2196f3}{b^2}} = c^2$$",
            ),
        ]);
    });

    test("nested braces (e^{x^{2}})", () => {
        expect(expand("$$\\cloze{e^{x^{2}}}{} = 1$$")).toEqual([
            new CardFrontBack(
                "$${\\color{#2196f3}{[\\ldots]}} = 1$$",
                "$${\\color{#2196f3}{e^{x^{2}}}} = 1$$",
            ),
        ]);
    });

    test("sqrt as last \\frac argument (adjacent inner braces)", () => {
        expect(expand("$x = \\cloze{\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}}{}$")).toEqual([
            new CardFrontBack(
                "$x = {\\color{#2196f3}{[\\ldots]}}$",
                "$x = {\\color{#2196f3}{\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}}}$",
            ),
        ]);
    });

    test("escaped braces in the answer (set notation)", () => {
        expect(expand("$S = \\cloze{\\{x : x > 0\\}}{a set}$")).toEqual([
            new CardFrontBack(
                "$S = {\\color{#2196f3}{[\\text{a set}]}}$",
                "$S = {\\color{#2196f3}{\\{x : x > 0\\}}}$",
            ),
        ]);
    });

    test("a \\cloze without an answer group is left alone", () => {
        expect(expand("$\\cloze x$")).toEqual([]);
    });

    test("\\clozeXYZ (command continues with letters) is not a cloze", () => {
        // \clozenot is a different macro; the letter boundary rejects it.
        expect(expand("$\\clozenot{a}{b}$")).toEqual([]);
    });

    test("an unclosed brace group produces no card", () => {
        // Second arg opens but never closes -> readBraceGroup returns null.
        expect(expand("$\\cloze{a}{b$")).toEqual([]);
    });
});

describe("tokenizeMathClozes / restoreMathClozes", () => {
    test.each([
        ["$x = \\cloze{a}{h}$", "$x = a$"],
        ["$\\cloze{a}{} + \\cloze[2]{b}{}$", "$a + b$"],
        ["$\\cloze[hsa]{\\frac{1}{2}}{half}$", "$\\frac{1}{2}$"],
        ["no macro here", "no macro here"],
        ["$\\cloze{a}$", "$a$"], // the hint is optional
        ["$\\cloze x$", "$\\cloze x$"], // malformed: left untouched
        // A command right before or inside the cloze must not run into the letters next to it
        ["$x\\le\\cloze{c_0}{}$", "$x\\le c_0$"],
        ["$\\cloze{\\alpha}{}x$", "$\\alpha x$"],
        ["$\\le\\cloze{\\alpha}{}x$", "$\\le\\alpha x$"], // a backslash already ends \le
        ["$\\le\\cloze{2}{}$", "$\\le2$"], // a digit cannot extend a command: no space needed
        ["$\\cloze{\\alpha}{}^2$", "$\\alpha^2$"],
        ["$\\cloze{\\alpha}{}\\cloze{x}{}$", "$\\alpha x$"], // two restored clozes side by side
    ])("restoring the tokens of %s gives %s", (text, expected) => {
        const { text: tokenized, clozes } = tokenizeMathClozes(text);
        expect(restoreMathClozes(tokenized, clozes)).toBe(expected);
    });
});

describe("a block mixing \\cloze with clozecraft deletions", () => {
    // Regression: the math path used to return early, so `==...==` / `{{...}}` deletions sharing a
    // block with a \cloze macro produced no cards at all.
    test("yields one card per deletion, from both syntaxes", () => {
        expect(expand("$E = \\cloze{mc^2}{}$ was published in ==1905==")).toHaveLength(2);
    });

    test("the math card shows the text deletion as its plain answer", () => {
        const [mathCard] = expand("$E = \\cloze{mc^2}{}$ was published in ==1905==");
        expect(mathCard.front).toBe("$E = {\\color{#2196f3}{[\\ldots]}}$ was published in 1905");
        expect(mathCard.back).toBe("$E = {\\color{#2196f3}{mc^2}}$ was published in 1905");
    });

    test("the text card shows the \\cloze as its plain answer", () => {
        const [, textCard] = expand("$E = \\cloze{mc^2}{}$ was published in ==1905==");
        expect(textCard.front).toBe(
            "$E = mc^2$ was published in <span style='color:#2196f3'>[...]</span>",
        );
        expect(textCard.back).toBe(
            "$E = mc^2$ was published in <span style='color:#2196f3'>1905</span>",
        );
    });

    test("several of each syntax in one block", () => {
        expect(expand("$\\cloze{a}{} + \\cloze{b}{}$ with ==c== and ==d==")).toHaveLength(4);
    });

    test("a block with only clozecraft deletions is untouched by the math path", () => {
        expect(expand("published in ==1905== by ==Einstein==")).toHaveLength(2);
    });
});

describe("the cloze color stays on its deletion", () => {
    // Regression: MathJax's \color is a switch, so `\color{c}{2} + 3` also colored `+ 3`.
    test("reviewing the middle deletion colors only that deletion", () => {
        const cards = expand("$6=\\cloze{1}{?} + \\cloze{2}{?} + \\cloze{3}{?}$");
        expect(cards).toHaveLength(3);
        expect(cards[1].front).toBe("$6=1 + {\\color{#2196f3}{[\\text{?}]}} + 3$");
        expect(cards[1].back).toBe("$6=1 + {\\color{#2196f3}{2}} + 3$");
    });
});

describe("sequence numbers: \\cloze[n]{answer}{hint}", () => {
    test("deletions with the same number are asked on the same card", () => {
        const cards = expand("$\\cloze[1]{a}{} + \\cloze[2]{b}{} = \\cloze[1]{c}{}$");
        expect(cards).toEqual([
            new CardFrontBack(
                "${\\color{#2196f3}{[\\ldots]}} + b = {\\color{#2196f3}{[\\ldots]}}$",
                "${\\color{#2196f3}{a}} + b = {\\color{#2196f3}{c}}$",
            ),
            new CardFrontBack(
                "$a + {\\color{#2196f3}{[\\ldots]}} = c$",
                "$a + {\\color{#2196f3}{b}} = c$",
            ),
        ]);
    });

    test("cards follow the sequence numbers, not the order in the text", () => {
        const cards = expand("$\\cloze[2]{a}{} + \\cloze[1]{b}{}$");
        expect(cards[0].front).toBe("$a + {\\color{#2196f3}{[\\ldots]}}$");
        expect(cards[1].front).toBe("${\\color{#2196f3}{[\\ldots]}} + b$");
    });

    test("numbered math and text deletions share their cards", () => {
        const cards = expand("$\\cloze[1]{E}{} = mc^2$ was published in ==1;;1905==");
        expect(cards).toHaveLength(1);
        expect(cards[0].front).toBe(
            "${\\color{#2196f3}{[\\ldots]}} = mc^2$ was published in <span style='color:#2196f3'>[...]</span>",
        );
    });

    test("an unnumbered \\cloze in a numbered note is shown plainly, as for text clozes", () => {
        const cards = expand("$\\cloze{a}{} + \\cloze[1]{b}{}$");
        expect(cards).toEqual([
            new CardFrontBack("$a + {\\color{#2196f3}{[\\ldots]}}$", "$a + {\\color{#2196f3}{b}}$"),
        ]);
    });
});

describe("generalized overlapping: \\cloze[ahs...]{answer}{hint}", () => {
    test("a/h/s ask, hide or show the deletion on each card", () => {
        const cards = expand("$\\cloze[as]{x}{} = \\cloze[ha]{y}{why}$");
        expect(cards).toEqual([
            new CardFrontBack(
                "${\\color{#2196f3}{[\\ldots]}} = {\\color{gray}{[\\text{why}]}}$",
                "${\\color{#2196f3}{x}} = {\\color{gray}{[\\text{why}]}}$",
            ),
            new CardFrontBack(
                "$x = {\\color{#2196f3}{[\\text{why}]}}$",
                "$x = {\\color{#2196f3}{y}}$",
            ),
        ]);
    });

    test("text deletions hidden by an overlapping string keep their own formatting", () => {
        const cards = expand("$\\cloze[ah]{x}{}$ and ==ha;;y==");
        expect(cards[0].front).toBe(
            "${\\color{#2196f3}{[\\ldots]}}$ and <span style='color:var(--code-comment)'>[...]</span>",
        );
    });
});

describe("malformed optional arguments", () => {
    test.each([
        ["$\\cloze[x]{a}{b}$"], // neither a number nor a/h/s
        ["$\\cloze[]{a}{b}$"], // empty
        ["$\\cloze[1{a}{b}$"], // unclosed
    ])("%s is not a cloze", (text) => {
        expect(expand(text)).toEqual([]);
    });
});

describe("cloze inputs setting", () => {
    test("math clozes still render as LaTeX when text clozes become input boxes", () => {
        const settings = { ...DEFAULT_SETTINGS, convertClozePatternsToInputs: true };
        const [mathCard, textCard] = CardFrontBackUtil.expand(
            CardType.Cloze,
            "$\\cloze{a}{}$ and ==b==",
            settings,
        );
        expect(mathCard.front).toBe("${\\color{#2196f3}{[\\ldots]}}$ and b");
        expect(textCard.front).toContain("cloze-input");
    });
});

describe("the documentation example", () => {
    test("both squares on card 1, the expansion on card 2", () => {
        const cards = expand(
            "$$\n\\cloze[1]{(a+b)^2}{} = \\cloze[2]{a^2 + 2ab + b^2}{} \\quad \\text{and} \\quad \\cloze[1]{(a-b)^2}{} = a^2 - 2ab + b^2\n$$",
        );
        expect(cards.map((c) => c.front)).toEqual([
            "$$\n{\\color{#2196f3}{[\\ldots]}} = a^2 + 2ab + b^2 \\quad \\text{and} \\quad {\\color{#2196f3}{[\\ldots]}} = a^2 - 2ab + b^2\n$$",
            "$$\n(a+b)^2 = {\\color{#2196f3}{[\\ldots]}} \\quad \\text{and} \\quad (a-b)^2 = a^2 - 2ab + b^2\n$$",
        ]);
    });
});

describe("braces inside math belong to LaTeX", () => {
    const vaultExpand = (text: string) =>
        CardFrontBackUtil.expand(CardType.Cloze, text, {
            ...DEFAULT_SETTINGS,
            clozePatterns: ["{{[123;;]answer[;;hint]}}"],
        });

    test("{{...}} inside math is not a cloze and stays intact on the card", () => {
        const cards = vaultExpand("$\\frac{{a}}{b}$ and {{c}}");
        expect(cards).toHaveLength(1);
        expect(cards[0].front).toContain("$\\frac{{a}}{b}$");
        expect(cards[0].back).toContain("$\\frac{{a}}{b}$");
    });

    test("{{...}} inside display math alone makes no card", () => {
        expect(vaultExpand("$$\n{{n} \\choose {k}}\n$$")).toEqual([]);
    });

    test("a cloze whose answer contains math keeps the math", () => {
        const [card] = vaultExpand("The norm is {{$\\|x\\|$}}.");
        expect(card.back).toContain("$\\|x\\|$");
    });

    test("math clozes and text clozes in one block, with LaTeX braces untouched", () => {
        const cards = vaultExpand("$\\cloze{x^{{2}}}{} = y$ and {{z}}");
        expect(cards).toHaveLength(2);
        expect(cards[0].front).toBe("${\\color{#2196f3}{[\\ldots]}} = y$ and z");
        expect(cards[1].front).toContain("$x^{{2}} = y$");
    });
});

describe("the hint argument is optional", () => {
    test("\\cloze{answer} without a hint", () => {
        expect(expand("$\\cloze{a} + b$")).toEqual([
            new CardFrontBack("${\\color{#2196f3}{[\\ldots]}} + b$", "${\\color{#2196f3}{a}} + b$"),
        ]);
    });

    test("with a sequence number and no hint", () => {
        const cards = expand("$\\cloze[2]{a} + \\cloze[1]{b}$");
        expect(cards.map((c) => c.front)).toEqual([
            "$a + {\\color{#2196f3}{[\\ldots]}}$",
            "${\\color{#2196f3}{[\\ldots]}} + b$",
        ]);
    });

    test("a brace group right after the answer is the hint, also after spaces", () => {
        const [card] = expand("$\\cloze{a} {why} + b$");
        expect(card.front).toBe("${\\color{#2196f3}{[\\text{why}]}} + b$");
    });

    test("anything else after the answer is part of the formula", () => {
        const [card] = expand("$\\cloze{a}^2 + \\cloze{b}_{i}$");
        expect(card.front).toBe("${\\color{#2196f3}{[\\ldots]}}^2 + b_{i}$");
    });
});

describe("a restored \\cloze next to a command", () => {
    test("the sibling card keeps \\le and the answer apart", () => {
        const cards = expand("$|S| \\le\\cloze{c_0}{}(\\varrho + 1)\\cloze{\\sqrt{T}}{}$");
        expect(cards).toHaveLength(2);
        expect(cards[1].front).toBe("$|S| \\le c_0(\\varrho + 1){\\color{#2196f3}{[\\ldots]}}$");
    });
});
