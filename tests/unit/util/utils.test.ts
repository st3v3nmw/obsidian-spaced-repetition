import { YAML_FRONT_MATTER_REGEX } from "src/constants";
import { extractFrontmatter, literalStringReplace } from "src/util/utils";

describe("literalStringReplace", () => {
    test("Replacement string doesn't have any dollar signs", async () => {
        const actual: string = literalStringReplace(
            "Original string without dollar signs",
            "dollar",
            "pound",
        );
        expect(actual).toEqual("Original string without pound signs");
    });

    test("Replacement string has double dollar signs", async () => {
        const actual: string = literalStringReplace(
            "Original string without dollar signs",
            "dollar",
            "$",
        );
        expect(actual).toEqual("Original string without $ signs");
    });

    test("Original and search strings has double dollar signs at the end", async () => {
        const originalStr: string = `Some stuff at the start

Something
?
$$\\huge F_g=\\frac {G m_1 m_2}{d^2}$$`;

        const searchStr: string = `Something
?
$$\\huge F_g=\\frac {G m_1 m_2}{d^2}$$`;

        const replacementStr: string = `Something
?
$$\\huge F_g=\\frac {G m_1 m_2}{d^2}$$
<!--SR:!2023-09-10,4,270-->`;

        const expectedStr: string = `Some stuff at the start

Something
?
$$\\huge F_g=\\frac {G m_1 m_2}{d^2}$$
<!--SR:!2023-09-10,4,270-->`;

        const actual: string = literalStringReplace(originalStr, searchStr, replacementStr);
        expect(actual).toEqual(expectedStr);
    });

    test("Original and search strings has double dollar signs at the end", async () => {
        const originalStr: string = `Some stuff at the start $$`;

        const searchStr: string = `start $$`;

        const replacementStr: string = `start $$ and end`;

        const expectedStr: string = `Some stuff at the start $$ and end`;

        const actual: string = literalStringReplace(originalStr, searchStr, replacementStr);
        expect(actual).toEqual(expectedStr);
    });

    test("Search string not found", async () => {
        const originalStr: string = "A very boring string";

        const searchStr: string = "missing";

        const replacementStr: string = "replacement";

        const expectedStr: string = originalStr;

        const actual: string = literalStringReplace(originalStr, searchStr, replacementStr);
        expect(actual).toEqual(expectedStr);
    });
});

function createTestStr1(sep: string): string {
    return `---${sep}sr-due: 2024-08-10${sep}sr-interval: 273${sep}sr-ease: 309${sep}---`;
}

describe("YAML_FRONT_MATTER_REGEX", () => {
    test("New line is line feed", async () => {
        const sep: string = String.fromCharCode(10);
        const text: string = createTestStr1(sep);
        expect(YAML_FRONT_MATTER_REGEX.test(text)).toEqual(true);
    });

    test("New line is carriage return line feed", async () => {
        const sep: string = String.fromCharCode(13, 10);
        const text: string = createTestStr1(sep);
        expect(YAML_FRONT_MATTER_REGEX.test(text)).toEqual(true);
    });
});

describe("extractFrontmatter", () => {
    test("No frontmatter", () => {
        let text: string = `Hello
Goodbye`;
        let frontmatter: string;
        let content: string;
        [frontmatter, content] = extractFrontmatter(text);
        expect(frontmatter).toEqual("");
        expect(content).toEqual(text);

        text = `---
Goodbye`;
        [frontmatter, content] = extractFrontmatter(text);
        expect(frontmatter).toEqual("");
        expect(content).toEqual(text);
    });

    test("With frontmatter (and nothing else)", () => {
        let frontmatter: string = `---
sr-due: 2024-01-17
sr-interval: 16
sr-ease: 278
tags:
  - flashcards/aws
  - flashcards/datascience
---`;
        const text: string = frontmatter;
        let content: string;
        [frontmatter, content] = extractFrontmatter(text);
        expect(frontmatter).toEqual(text);
        expect(content).toEqual("");
    });

    test("With frontmatter (and content)", () => {
        let frontmatter: string = `---
sr-due: 2024-01-17
sr-interval: 16
sr-ease: 278
tags:
  - flashcards/aws
  - flashcards/datascience
---`;
        const content: string = `#flashcards/science/chemistry

# Questions

Chemistry Question from file underelephant 4A::goodby
<!--SR:!2023-11-02,17,290-->
Chemistry Question from file underdog 4B::goodby
<!--SR:!2023-12-18,57,310-->
Chemistry Question from file underdog 4C::goodby
<!--SR:!2023-10-25,3,210-->
This single {{question}} turns into {{3 separate}} {{cards}}
<!--SR:!2023-10-20,1,241!2023-10-25,3,254!2023-10-23,1,221-->

`;
        const text: string = `${frontmatter}
${content}`;

        const [f, c] = extractFrontmatter(text);
        expect(f).toEqual(frontmatter);
        expect(c).toEqual(content);
    });
});
