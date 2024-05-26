/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    verbose: true,
    preset: "ts-jest",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["jest-expect-message"],
    moduleNameMapper: {
        "src/(.*)": "<rootDir>/src/$1",
    },
    moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node", "d.ts"],
    roots: ["<rootDir>/src/", "<rootDir>/tests/unit/"],
    collectCoverageFrom: ["./src/**"],
    coveragePathIgnorePatterns: [
        "src/icons",
        "src/gui",
        "src/ReviewDeck.ts",
        "src/SRFile.ts",
        "src/declarations.d.ts",
        "src/main.ts",
        "src/settings.ts",
        "src/util/RenderMarkdownWrapper.ts",
        "src/util/TimeTestUtil.ts",
    ],
    coverageDirectory: "coverage",
    collectCoverage: true,
    coverageProvider: "v8",
    coverageThreshold: {
        global: {
            lines: 90,
            statements: 90,
            branches: 90,
            functions: 90,
        },
    },
};
