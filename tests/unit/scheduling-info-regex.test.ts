import {
    FLASHCARD_SCHEDULE_INFO,
    NOTE_SCHEDULE_INFO_BLOCK,
    NOTE_SCHEDULE_INFO_TEXT,
} from "src/constants";

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

describe("NOTE_SCHEDULE_INFO_TEXT", () => {
    test("SR property comments inside property block", async () => {
        const text: string = "---\nsr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269\n---";
        expect(NOTE_SCHEDULE_INFO_TEXT.test(text)).toEqual(true);
    });

    test("SR property comments not inside property block", async () => {
        const text: string = "sr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269";
        expect(text.match(NOTE_SCHEDULE_INFO_TEXT)).toEqual([
            "sr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269",
        ]);
    });

    test("SR property comments not inside property block with ending newline character", async () => {
        const text: string = "sr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269\n";
        expect(text.match(NOTE_SCHEDULE_INFO_TEXT)).toEqual([
            "sr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269\n",
        ]);
    });

    test("Remove SR property comments from text with extra properties", async () => {
        const text: string =
            "---\nCheckbox: true\ntags:\n  - review\nsr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269\n---\n\n---\nCheckbox: true\nsr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269\ntags:\n  - review\n---\n\n---\nsr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269\nCheckbox: true\ntags:\n  - review\n---";
        expect(text.replace(NOTE_SCHEDULE_INFO_TEXT, "")).toEqual(
            "---\nCheckbox: true\ntags:\n  - review\n---\n\n---\nCheckbox: true\ntags:\n  - review\n---\n\n---\nCheckbox: true\ntags:\n  - review\n---",
        );
    });
});

describe("NOTE_SCHEDULE_INFO_BLOCK", () => {
    test("SR property block", async () => {
        const text: string = "---\nsr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269\n---";
        expect(NOTE_SCHEDULE_INFO_BLOCK.test(text)).toEqual(true);
    });

    test("SR property block with ending newline character", async () => {
        const text: string = "---\nsr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269\n---\n";
        expect(text.match(NOTE_SCHEDULE_INFO_BLOCK)).toEqual([
            "---\nsr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269\n---\n",
        ]);
    });

    test("Remove SR property blocks from text", async () => {
        const text: string =
            "---\nsr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269\n---\nHello ---\nsr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269\n--- World---\nsr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269\n---\n!\n---\nsr-due: 2024-07-01\nsr-interval: 3\nsr-ease: 269\n---";
        expect(text.replace(NOTE_SCHEDULE_INFO_BLOCK, "")).toEqual("Hello World!\n");
    });
});
