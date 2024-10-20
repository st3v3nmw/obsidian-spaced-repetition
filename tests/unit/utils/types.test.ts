import path from "path";

import { getKeysPreserveType, getTypedObjectEntries, mapRecord } from "src/utils/types";

describe("getTypedObjectEntries", () => {
    test("should handle basic object", () => {
        expect(getTypedObjectEntries({ name: "Alice", age: 30, isStudent: false })).toEqual([
            ["name", "Alice"],
            ["age", 30],
            ["isStudent", false],
        ]);
    });

    test("should handle empty object", () => {
        expect(getTypedObjectEntries({})).toEqual([]);
    });

    test("should handle object with different value types", () => {
        expect(
            getTypedObjectEntries({
                a: 1,
                b: "string",
                c: true,
                d: null,
                e: undefined,
            }),
        ).toEqual([
            ["a", 1],
            ["b", "string"],
            ["c", true],
            ["d", null],
            ["e", undefined],
        ]);
    });

    test("should handle object with nested objects", () => {
        expect(getTypedObjectEntries({ obj: { nestedKey: "nestedValue" } })).toEqual([
            ["obj", { nestedKey: "nestedValue" }],
        ]);
    });

    test("should handle object with array values", () => {
        expect(getTypedObjectEntries({ arr: [1, 2, 3] })).toEqual([["arr", [1, 2, 3]]]);
    });

    test("should handle object with function values", () => {
        const output = getTypedObjectEntries({ func: () => "result" });
        expect(output.length).toBe(1);
        expect(output[0][0]).toBe("func");
        expect(typeof output[0][1]).toBe("function");
        expect(output[0][1]()).toBe("result");
    });
});

describe("getKeysPreserveType", () => {
    test("should return keys of a basic object", () => {
        expect(getKeysPreserveType({ name: "Alice", age: 30, isStudent: false })).toEqual([
            "name",
            "age",
            "isStudent",
        ]);
    });

    test("should return an empty array for an empty object", () => {
        expect(getKeysPreserveType({})).toEqual([]);
    });

    test("should return keys of an object with different value types", () => {
        expect(getKeysPreserveType({ a: 1, b: "string", c: true })).toEqual(["a", "b", "c"]);
    });

    test("should return keys of an object with a function value", () => {
        expect(getKeysPreserveType({ func: () => "result" })).toEqual(["func"]);
    });
});

describe("mapRecord should transform the keys & values", () => {
    expect(
        mapRecord({ "a/b/topic.md": 254.556 }, (key: string, value: number): [string, number] => [
            path.parse(key).name,
            Math.round(value),
        ]),
    ).toEqual({ topic: 255 });
});
