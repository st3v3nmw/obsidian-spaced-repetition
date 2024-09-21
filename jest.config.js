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
        "src/icons/", // obsidian dependencies
        "src/gui/", // obsidian dependencies
        "src/sr-file.ts", // obsidian dependencies
        "src/declarations.d.ts",
        "src/main.ts", // obsidian dependencies
        "src/settings.ts", // obsidian dependencies
        "src/utils/render-markdown-wrapper.ts", // obsidian dependencies
    ],
    coverageDirectory: "coverage",
    collectCoverage: true,
    coverageProvider: "v8",
    coverageThreshold: {
        global: {
            // TODO: Bring coverage back up to 98%+
            statements: 93,
            branches: 88,
            lines: 93,
            functions: 89,
        },
    },
};
