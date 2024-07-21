/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    verbose: true,
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['jest-expect-message'],
    moduleNameMapper: {
        'src/(.*)': '<rootDir>/src/$1',
    },
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node', 'mjs'],
    transform: {
        '^.+\\.(t|j)sx?$': ['ts-jest', { useESM: true }],
        '^.+\\.mjs$': 'babel-jest' // Ensure babel-jest is configured to handle .mjs files
    },
    transformIgnorePatterns: [
        '/node_modules/',
    ],
    extensionsToTreatAsEsm: ['.ts'], // Removed '.mjs' since it's automatically treated as ESM
    roots: ['<rootDir>/src/', '<rootDir>/tests/unit/'],
    collectCoverageFrom: [
        "src/**/lang/*.ts",
        "src/NoteEaseList.ts",
        "src/NoteFileLoader.ts",
        "src/NoteParser.ts",
        "src/NoteQuestionParser.ts",
        "src/TopicParser.ts",
        "src/parser.ts",
        "src/scheduling.ts",
        "utils.ts",
    ],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "src/lang/locale/",
        "src/constants",
        "src/icons",
        "src/declarations.d.ts",
        "build",
    ],
    coverageDirectory: "coverage",
    collectCoverage: true,
    coverageProvider: "v8",
    coverageThreshold: {
        global: {
            statements: 100,
            branches: 100,
        },
    },
};
