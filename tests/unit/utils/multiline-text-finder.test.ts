import { MultiLineTextFinder } from "src/utils/multiline-text-finder";
import { splitTextIntoLineArray } from "src/utils/utils";

const space: string = " ";
const text10: string = `Some Stuff 0 More Stuff
Some Stuff 1 More Stuff
Some Stuff 2 More Stuff
Some Stuff 3 More Stuff
Some Stuff 4 More Stuff
Some Stuff 5 More Stuff
Some Stuff 6 More Stuff
Some Stuff 7 More Stuff
Some Stuff 8 More Stuff
Some Stuff 9 More Stuff`;
const text20: string = `Some Stuff 0 More Stuff
Some Stuff 1 More Stuff
Some Stuff 2 More Stuff
Some Stuff 3 More Stuff
Some Stuff 4 More Stuff
Some Stuff 5 More Stuff
Some Stuff 6 More Stuff
Some Stuff 7 More Stuff
Some Stuff 8 More Stuff
Some Stuff 9 More Stuff
Some Stuff 10 More Stuff
Some Stuff 11 More Stuff
Some Stuff 12 More Stuff
Some Stuff 13 More Stuff
Some Stuff 14 More Stuff
Some Stuff 15 More Stuff
   Some Stuff 16 More Stuff
Some Stuff 17 More Stuff${space}${space}
Some Stuff 18 More Stuff
Some Stuff 19 More Stuff
Some Stuff 20 More Stuff
`;

describe("find", () => {
    describe("Single line search string - Match found", () => {
        test("Search string present as complete line within text (identical)", () => {
            const searchStr: string = "Some Stuff 14 More Stuff";

            checkFindResult(text20, searchStr, 14);
        });

        test("Search string present as complete line within text (search has pre/post additional spaces)", () => {
            let searchStr: string = "   Some Stuff 14 More Stuff";
            checkFindResult(text20, searchStr, 14);

            searchStr = "Some Stuff 14 More Stuff   ";
            checkFindResult(text20, searchStr, 14);

            searchStr = "   Some Stuff 14 More Stuff   ";
            checkFindResult(text20, searchStr, 14);
        });

        test("Search string present as complete line within text (source text has pre/post additional spaces)", () => {
            let searchStr: string = "Some Stuff 16 More Stuff";
            checkFindResult(text20, searchStr, 16);

            searchStr = "Some Stuff 17 More Stuff";
            checkFindResult(text20, searchStr, 17);
        });
    });

    describe("Multi line search string - Match found", () => {
        test("Search string present from line 1", () => {
            const searchStr: string = `Some Stuff 1 More Stuff
    Some Stuff 2 More Stuff
    Some Stuff 3 More Stuff`;

            checkFindResult(text20, searchStr, 1);
        });

        test("Search string present mid file", () => {
            const searchStr: string = `Some Stuff 9 More Stuff
    Some Stuff 10 More Stuff
    Some Stuff 11 More Stuff`;
            checkFindResult(text20, searchStr, 9);
        });

        test("Search string present at end of file", () => {
            const searchStr: string = `Some Stuff 19 More Stuff
    Some Stuff 20 More Stuff`;
            checkFindResult(text20, searchStr, 19);
        });
    });

    describe("Single line search string - No match found", () => {
        test("Search string is a match but only to part of the line", () => {
            const searchStr: string = "Stuff 14 More Stuff";

            checkFindResult(text20, searchStr, null);
        });
    });

    describe("Multi line search string - No match found", () => {
        test("Search string doesn't match any source line", () => {
            const searchStr: string = `Nothing here that matches
    Or hear `;
            checkFindResult(text20, searchStr, null);
        });

        test("Some, but not all of the search string lines matches the source", () => {
            const searchStr: string = `Some Stuff 9 More Stuff
    Some Stuff 10 More Stuff
    Some Stuff 11 More Stuff - this line doesn't match`;
            checkFindResult(text20, searchStr, null);
        });
    });
});

describe("findAndReplace", () => {
    test("Multi line search string present as exact match", () => {
        const searchStr: string = `Some Stuff 4 More Stuff
Some Stuff 5 More Stuff
Some Stuff 6 More Stuff`;

        const replacementStr: string = "Replacement line";

        const expectedResult: string = `Some Stuff 0 More Stuff
Some Stuff 1 More Stuff
Some Stuff 2 More Stuff
Some Stuff 3 More Stuff
Replacement line
Some Stuff 7 More Stuff
Some Stuff 8 More Stuff
Some Stuff 9 More Stuff`;
        checkFindAndReplaceResult(text10, searchStr, replacementStr, expectedResult);
    });

    test("Multi line search string has pre/post spaces", () => {
        const searchStr: string = `Some Stuff 4 More Stuff
${space}Some Stuff 5 More Stuff
Some Stuff 6 More Stuff${space}${space}`;

        const replacementStr: string = `Replacement line 1
Replacement line 2`;

        const expectedResult: string = `Some Stuff 0 More Stuff
Some Stuff 1 More Stuff
Some Stuff 2 More Stuff
Some Stuff 3 More Stuff
Replacement line 1
Replacement line 2
Some Stuff 7 More Stuff
Some Stuff 8 More Stuff
Some Stuff 9 More Stuff`;
        checkFindAndReplaceResult(text10, searchStr, replacementStr, expectedResult);
    });

    test("No match found", () => {
        const searchStr: string = `Some Stuff 4 More Stuff
Some Stuff 5 More Stuff
Some Stuff 7 More Stuff`;

        const replacementStr: string = `Replacement line 1
Replacement line 2`;

        const expectedResult: string = null;
        checkFindAndReplaceResult(text10, searchStr, replacementStr, expectedResult);
    });
});

function checkFindAndReplaceResult(
    text: string,
    searchStr: string,
    replacementStr: string,
    expectedResult: string,
) {
    const result: string = MultiLineTextFinder.findAndReplace(text, searchStr, replacementStr);
    expect(result).toEqual(expectedResult);
}

function checkFindResult(text: string, searchStr: string, expectedResult: number) {
    const textArray = splitTextIntoLineArray(text);
    const searchArray = splitTextIntoLineArray(searchStr);
    const result: number = MultiLineTextFinder.find(textArray, searchArray);
    expect(result).toEqual(expectedResult);
}
