process.env.TZ = "UTC";

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
        "src/data/core.ts",
        "src/data/data-structures/file/",
        "src/ui/",
        "src/icons/",
        "src/main.ts",
        "src/data/data-manager.ts",
        "src/data/data-stores/data-store-migrator.ts",
        "src/note/next-note-review-handler.ts",
        "src/data/plugin-data.ts",
        "src/utils/renderers.ts",

        // debugging utils
        "src/utils/debug.ts",

        // don't include in results
        "src/declarations.d.ts",
        "src/lang/",
    ],
    coverageDirectory: "coverage",
    collectCoverage: true,
    coverageProvider: "v8",
    coverageThreshold: {
        global: {
            // TODO: Bring coverage back up to 98%+
            // TODO: Figure out why coverage on the GitHub runner
            // is lower than the local coverage
            statements: 92,
            branches: 88,
        },
    },
};
