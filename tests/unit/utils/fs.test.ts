import { pathMatchesPattern } from "src/utils/fs";

describe("pathMatchesPattern", () => {
    test("Paths that match", () => {
        expect(pathMatchesPattern("Computing/AWS/DynamoDB/Streams.md", "Computing/AWS")).toBe(true);
        expect(pathMatchesPattern("Computing/AWS/DynamoDB/Streams.md", "Computing/AWS/")).toBe(
            true,
        );
        expect(
            pathMatchesPattern("Computing/GCP/DynamoDB/Streams.md", "Computing/*/DynamoDB/*"),
        ).toBe(true);
        expect(pathMatchesPattern("Computing/AWS/DynamoDB/Streams.md", "Computing/**")).toBe(true);
        expect(
            pathMatchesPattern("Computing/AWS/DynamoDB/Streams.md", "Computing/AWS/DynamoDB/*"),
        ).toBe(true);

        expect(pathMatchesPattern("Computing/AWS/foo.excalidraw.md", "**/*.excalidraw.md")).toBe(
            true,
        );
        expect(
            pathMatchesPattern(
                "Computing/Drawing 2024-09-22 15.12.39.excalidraw.md",
                "*/*.excalidraw.md",
            ),
        ).toBe(true);
    });

    test("Paths that don't match", () => {
        expect(pathMatchesPattern("Math/Singular Matrix.md", "Computing/AWS")).toBe(false);
        expect(pathMatchesPattern("AWS/DynamoDB/Streams.md", "Computing/*/DynamoDB/")).toBe(false);

        expect(pathMatchesPattern("Computing/AWS/DynamoDB/Streams.md", "**/*.excalidraw.md")).toBe(
            false,
        );
    });
});
