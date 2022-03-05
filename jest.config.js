/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    moduleNameMapper: {
        "src/(.*)": "<rootDir>/src/$1",
    },
    collectCoverageFrom: ["src/**/*.ts*"],
    moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node", "d.ts"],
    roots: ["<rootDir>/src/", "<rootDir>/tests/"],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "src/lang/locale/",
        "src/constants",
        "src/icons",
    ],
    coverageDirectory: "coverage",
};
