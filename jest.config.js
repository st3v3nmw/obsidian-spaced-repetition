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
    collectCoverageFrom: ["src/**"],
    coveragePathIgnorePatterns: [
        // node modules & build output
        "build/",
        "node_modules/",

        // GUI & Obsidian coupled code
        "src/app-core.ts",
        "src/sr-file.ts",
        "src/gui/",
        "src/icons/",
        "src/main.ts",
        "src/next-note-review-handler.ts",
        "src/plugin-data.ts",
        "src/settings.ts",
        "src/utils/render-markdown-wrapper.ts",

        // debugging utils
        "src/utils/time-test-util.ts",

        // don't include in results
        "src/declarations.d.ts",
        "src/lang/locale/",
    ],
    coverageDirectory: "coverage",
    collectCoverage: true,
    coverageProvider: "v8",
    coverageThreshold: {
        global: {
            // TODO: Bring coverage back up to 98%+
            statements: 92,
            branches: 88,
        },
    },
};
