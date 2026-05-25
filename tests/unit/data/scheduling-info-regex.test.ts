import { SR_COMMENT_AND_WHITESPACE_FINDER } from "src/data/constants";

describe("FLASHCARD_SCHEDULE_INFO", () => {
    test("SR comment without sibling cards", () => {
        const text: string = "<!--SR:!2023-09-02,4,270-->";
        expect(SR_COMMENT_AND_WHITESPACE_FINDER.test(text)).toEqual(true);
    });

    test("Multiple SR comments without sibling cards", () => {
        const text: string = "<!--SR:!2023-09-02,4,270-->Test<!--SR:!2023-09-02,4,270-->";
        expect(text.match(SR_COMMENT_AND_WHITESPACE_FINDER)).toEqual([
            "<!--SR:!2023-09-02,4,270-->",
            "<!--SR:!2023-09-02,4,270-->",
        ]);
    });

    test("SR comment with sibling cards", () => {
        const text: string =
            "<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->";
        expect(SR_COMMENT_AND_WHITESPACE_FINDER.test(text)).toEqual(true);
    });

    test("Multiple SR comments with sibling cards", () => {
        const text: string =
            "<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->Test<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->";
        expect(text.match(SR_COMMENT_AND_WHITESPACE_FINDER)).toEqual([
            "<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->",
            "<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->",
        ]);
    });

    test("SR comment with leading newline character", () => {
        const text: string = "\n<!--SR:!2023-09-02,4,270-->";
        expect(SR_COMMENT_AND_WHITESPACE_FINDER.test(text)).toEqual(true);
    });

    test("Remove SR comments from text", () => {
        const text: string =
            "<!--SR:!2023-09-02,4,270-->\n<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270--><!--SR:!2023-09-02,4,270-->\n <!--SR:!2023-09-02,4,270-->\n<!--SR:!2023-09-02,4,270-->Hello <!--SR:!2023-09-02,4,270--> World<!--SR:!2023-09-02,4,270-->!\n\n<!--SR:!2023-09-02,4,270--><!--SR:!2023-09-02,4,270--><!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->";
        expect(text.replace(SR_COMMENT_AND_WHITESPACE_FINDER, "")).toEqual("\nHello World!\n");
    });
});
