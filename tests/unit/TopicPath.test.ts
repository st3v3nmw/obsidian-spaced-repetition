import { TopicPath } from "src/topic-path";

describe("Constructor exception handling", () => {

    test("Constructor rejects null path", () => {
            
            const t = () => {
                let path: TopicPath = new TopicPath(null);
            };
            expect(t).toThrow();
    });

    test("Constructor rejects zero length array", () => {
            
        const t = () => {
            let path: TopicPath = new TopicPath([]);
        };
        expect(t).toThrow();
    });

    test("Constructor rejects path that includes '/'", () => {
            
        const t = () => {
            let path: TopicPath = new TopicPath(["Hello/Goodbye"]);
        };
        expect(t).toThrow();
    });
});


describe("shift", () => {

    test("shift() on multi-part path", () => {
        let path: TopicPath = new TopicPath(["Level1", "Level2", "Level3"])
        let result: string = path.shift();

        expect(result).toEqual("Level1");
        expect(path).toEqual(new TopicPath(["Level2", "Level3"]));
    });

    test("shift() on single-part path", () => {
        let path: TopicPath = new TopicPath(["Level1"])
        let result: string = path.shift();

        expect(result).toEqual("Level1");
        expect(path.hasPath).toEqual(false);
    });

    test("shift() on empty path", () => {
        let path: TopicPath = new TopicPath(["Level1"])
        let result: string = path.shift();

        const t = () => {
            path.shift();
        };
        expect(t).toThrow("can't shift an empty path");
    });
});


describe("getTopicPathFromCardText", () => {

    test("Card text doesn't include tag", () => {
        let cardText: string = "Card text doesn't include tag";
        let path: TopicPath = TopicPath.getTopicPathFromCardText(cardText);

        expect(path).toEqual(null);
    });

    test("Card text includes single level tag", () => {
        let cardText: string = "#flashcards Card text does include tag";
        let path: TopicPath = TopicPath.getTopicPathFromCardText(cardText);

        expect(path).toEqual(new TopicPath(["flashcards"]));
    });

    test("Card text includes multi level tag", () => {
        let cardText: string = "#flashcards/science/chemistry Card text does include tag";
        let path: TopicPath = TopicPath.getTopicPathFromCardText(cardText);

        expect(path).toEqual(new TopicPath(["flashcards", "science", "chemistry"]));
    });

    test("Card text includes 2 multi level tags", () => {
        let cardText: string = "#flashcards/science/chemistry Card text includes multiple tag #flashcards/test/chemistry";
        let path: TopicPath = TopicPath.getTopicPathFromCardText(cardText);

        expect(path).toEqual(new TopicPath(["flashcards", "science", "chemistry"]));
    });
});


describe("removeTopicPathFromCardText", () => {

    test("Card text doesn't include tag", () => {
        let cardText: string = "Card text doesn't include tag"; up
        let result: string = TopicPath.removeTopicPathFromCardText(cardText);

        expect(result).toEqual(cardText);
    });

    test("Card text includes single level tag", () => {
        let cardText: string = "#flashcards Card text does include tag";
        let result: string = TopicPath.removeTopicPathFromCardText(cardText);

        expect(result).toEqual("Card text does include tag");
    });

    test("Card text includes multi level tag", () => {
        let cardText: string = "#flashcards/science/chemistry Card text does include tag";
        let result: string = TopicPath.removeTopicPathFromCardText(cardText);

        expect(result).toEqual("Card text does include tag");
    });
});