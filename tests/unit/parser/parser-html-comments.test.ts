import { CardType } from "src/card/questions/question";

import { parserOptions, parseT } from "../helpers/unit-test-parser-helper";

// TODO: Add card fragment tests
// TODO: Expand this test
test("Test not parsing cards in HTML comments", () => {
    expect(parseT("<!--question::answer test-->", parserOptions)).toEqual([]);
    expect(parseT("<!--question:::answer test-->", parserOptions)).toEqual([]);
    expect(
        parseT("<!--\nQuestion\n?\nAnswer <!--SR:!2021-08-11,4,270-->\n-->", parserOptions),
    ).toEqual([]);
    expect(
        parseT(
            "<!--\nQuestion\n?\nAnswer <!--SR:!2021-08-11,4,270-->\n\n<!--cloze ==deletion== test-->-->",
            parserOptions,
        ),
    ).toEqual([]);
    expect(parseT("<!--cloze ==deletion== test-->", parserOptions)).toEqual([]);
    expect(parseT("<!--cloze **deletion** test-->", parserOptions)).toEqual([]);
    expect(parseT("<!--cloze {{curly}} test-->", parserOptions)).toEqual([]);
    expect(parseT("something something\n<!--cloze {{curly}} test-->", parserOptions)).toEqual([]);

    // cards found outside comment
    expect(
        parseT("something something\n\n<!--cloze {{curly}} test-->\n\na::b", parserOptions),
    ).toEqual([[CardType.SingleLineBasic, "a::b", 4, 4]]);
});
