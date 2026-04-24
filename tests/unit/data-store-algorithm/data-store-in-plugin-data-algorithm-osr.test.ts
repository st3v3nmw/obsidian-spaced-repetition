import { DataStoreInPluginDataAlgorithmOsr } from "src/data-store-algorithm/data-store-in-plugin-data-algorithm-osr";

describe("DataStoreInPluginDataAlgorithmOsr", () => {
    test("questionFormatScheduleAsHtmlComment returns empty string", () => {
        const algorithm = new DataStoreInPluginDataAlgorithmOsr();
        expect(algorithm.questionFormatScheduleAsHtmlComment(null)).toBe("");
    });
});
