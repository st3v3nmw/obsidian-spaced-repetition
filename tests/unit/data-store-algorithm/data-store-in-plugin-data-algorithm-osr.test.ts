import { DataStoreInExternalNoteAlgorithmOsr } from "src/data/data-store-algorithm/store-in-external-note/data-store-in-external-note-algorithm-osr";

describe("DataStoreInPluginDataAlgorithmOsr", () => {
    test("questionFormatScheduleAsHtmlComment returns empty string", () => {
        const algorithm = new DataStoreInExternalNoteAlgorithmOsr();
        expect(algorithm.questionFormatScheduleAsHtmlComment(null)).toBe("");
    });
});
