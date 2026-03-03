import { FLASHCARD_SCHEDULE_INFO } from "src/constants";

describe("FLASHCARD_SCHEDULE_INFO", () => {
    test("SR comment without sibling cards", async () => {
        const text: string = "<!--SR:!2023-09-02,4,270-->";
        expect(FLASHCARD_SCHEDULE_INFO.test(text)).toEqual(true);
    });

    test("Multiple SR comments without sibling cards", async () => {
        const text: string = "<!--SR:!2023-09-02,4,270-->Test<!--SR:!2023-09-02,4,270-->";
        expect(text.match(FLASHCARD_SCHEDULE_INFO)).toEqual([
            "<!--SR:!2023-09-02,4,270-->",
            "<!--SR:!2023-09-02,4,270-->",
        ]);
    });

    test("SR comment with sibling cards", async () => {
        const text: string =
            "<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->";
        expect(FLASHCARD_SCHEDULE_INFO.test(text)).toEqual(true);
    });

    test("Multiple SR comments with sibling cards", async () => {
        const text: string =
            "<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->Test<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->";
        expect(text.match(FLASHCARD_SCHEDULE_INFO)).toEqual([
            "<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->",
            "<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->",
        ]);
    });

    test("Remove SR comments from text", async () => {
        const text: string =
            "<!--SR:!2023-09-02,4,270-->\n<!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270--><!--SR:!2023-09-02,4,270-->\n <!--SR:!2023-09-02,4,270-->\n<!--SR:!2023-09-02,4,270-->Hello <!--SR:!2023-09-02,4,270--> World<!--SR:!2023-09-02,4,270-->!\n\n<!--SR:!2023-09-02,4,270--><!--SR:!2023-09-02,4,270--><!--SR:!2023-09-02,4,270!2023-09-02,5,270!2023-09-02,6,270!2023-09-02,7,270-->";
        expect(text.replace(FLASHCARD_SCHEDULE_INFO, "")).toEqual("\nHello World!\n");
    });
});
