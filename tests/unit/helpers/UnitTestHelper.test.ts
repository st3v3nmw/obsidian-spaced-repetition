import { TagCache } from "obsidian";
import { unitTest_GetAllTagsFromTextEx } from "./UnitTestHelper";

describe("unitTest_GetAllTagsFromTextEx", () => {
    describe("Without frontmatter", () => {
        test("Tags on multiple lines", () => {
            // The next line is numbered as line 0, therefore #review is line 2
            const text: string = `

#review

----
#flashcards/science/chemistry

# Questions

Chemistry Question from file underelephant 4A::goodby
<!--SR:!2023-11-02,17,290-->
Chemistry Question from file underdog 4B::goodby
<!--SR:!2023-12-18,57,310-->
Chemistry Question from file underdog 4C::goodby
<!--SR:!2023-10-25,3,210-->
This single {{question}} turns into {{3 separate}} {{cards}}
<!--SR:!2023-10-20,1,241!2023-10-25,3,254!2023-10-23,1,221-->

#flashcards/science/misc

    `;
            const actual: TagCache[] = unitTest_GetAllTagsFromTextEx(text);
            const expected: TagCache[] = [
                createTagCacheObj("#review", 2),
                createTagCacheObj("#flashcards/science/chemistry", 5),
                createTagCacheObj("#flashcards/science/misc", 18),
            ];
            expect(actual).toEqual(expected);
        });

        test("Multiple tags on same line", () => {
            // The next line is numbered as line 0, therefore #review is line 2
            const text: string = `

#flashcards/science/chemistry #flashcards/science/misc



    `;
            const actual: TagCache[] = unitTest_GetAllTagsFromTextEx(text);
            const expected: TagCache[] = [
                createTagCacheObj("#flashcards/science/chemistry", 2),
                createTagCacheObj("#flashcards/science/misc", 2),
            ];
            expect(actual).toEqual(expected);
        });
    });
});

function createTagCacheObj(tag: string, line: number): any {
    return {
        tag: tag,
        position: {
            start: { line: line, col: null, offset: null },
            end: { line: line, col: null, offset: null },
        },
    };
}
