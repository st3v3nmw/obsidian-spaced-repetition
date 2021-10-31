/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    moduleNameMapper: {
        "src/(.*)": "<rootDir>/src/$1",
    },
    roots: ["<rootDir>/src/", "<rootDir>/tests/"]
};
