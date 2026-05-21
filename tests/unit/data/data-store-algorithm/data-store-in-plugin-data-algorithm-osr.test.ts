import { FolderDataStoreAlgorithmOsr } from "src/data/data-store/folder-data-store/folder-data-store-algorithm-osr";

describe("DataStoreInPluginDataAlgorithmOsr", () => {
    test("questionFormatScheduleAsHtmlComment returns empty string", () => {
        const algorithm = new FolderDataStoreAlgorithmOsr();
        expect(algorithm.questionFormatScheduleAsHtmlComment(null)).toBe("");
    });
});
