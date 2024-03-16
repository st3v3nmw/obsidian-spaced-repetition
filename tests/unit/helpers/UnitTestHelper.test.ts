import { TagCache } from "obsidian";
import { unitTest_GetAllTagsFromTextEx, unitTest_ParseForOutgoingLinks } from "./UnitTestHelper";
import { UnitTestOsrCore } from "./UnitTestOsrCore";
import { DEFAULT_SETTINGS } from "src/settings";
import { UnitTestLinkInfoFinder } from "./UnitTestLinkInfoFinder";

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

describe("unitTest_ParseForOutgoingLinks", () => {
    test("No outgoing links", () => {
        const text: string = `
The triboelectric effect describes electric charge transfer between two objects when they contact or slide against each other. 

It can occur with different materials, such as:
- the sole of a shoe on a carpet
- balloon rubbing against sweater

(also known as triboelectricity, triboelectric charging, triboelectrification, or tribocharging)
`;
        const links: string[] = unitTest_ParseForOutgoingLinks(text);
        expect(links.length).toEqual(0);
    });

    test("Multiple outgoing links on different lines", () => {
        const text: string = `
The triboelectric effect describes electric charge [[transfer between]] two objects when they contact or slide against each other. 

It can occur with different materials, such as:
- the sole of a shoe on a carpet
- balloon rubbing against sweater

(also known as triboelectricity, triboelectric charging, [[triboelectrification]], or tribocharging)
`;
        const links: string[] = unitTest_ParseForOutgoingLinks(text);
        const expected: string[] = ["transfer between", "triboelectrification" ];
        expect(links).toEqual(expected);
    });

    test("Multiple outgoing links on the one line", () => {
        const text: string = `
The triboelectric effect describes electric charge [[triboelectrification]], or [[tribocharging]])
`;
        const links: string[] = unitTest_ParseForOutgoingLinks(text);
        const expected: string[] = ["triboelectrification", "tribocharging" ];
        expect(links).toEqual(expected);
    });
});

describe("UnitTestLinkInfoFinder", () => {
    test("No outgoing links", async () => {
        const osrCore: UnitTestOsrCore = new UnitTestOsrCore(DEFAULT_SETTINGS);
        await osrCore.loadVault("notes3");
        const linkInfoFinder: UnitTestLinkInfoFinder = new UnitTestLinkInfoFinder();
        linkInfoFinder.init(osrCore.getFileMap());

        // One link from D to A
        expect(linkInfoFinder.getResolvedLinks("A.md")).toEqual({
           "D": 1
        });

        // One link from A to B; two links from D to B
        expect(linkInfoFinder.getResolvedLinks("B.md")).toEqual({
            "A": 1, 
            "D": 2
        });
        expect(linkInfoFinder.getResolvedLinks("C.md")).toEqual({
            "A": 1, 
        });
        expect(linkInfoFinder.getResolvedLinks("D.md")).toEqual({
            "A": 1, 
            "C": 1, 
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
