/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
export const preset = "ts-jest";
export const testEnvironment = "jsdom";
export const moduleNameMapper = {
    "src/(.*)": "<rootDir>/src/$1",
};
export const moduleFileExtensions = ["js", "jsx", "ts", "tsx", "json", "node", "d.ts"];
export const roots = ["<rootDir>/src/", "<rootDir>/tests/"];
