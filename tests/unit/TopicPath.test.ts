import { ISRFile } from "src/SRFile";
import { TopicPath, TopicPathList } from "src/TopicPath";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { UnitTestSRFile } from "./helpers/UnitTestSRFile";

describe("Constructor exception handling", () => {
    test("Constructor rejects null path", () => {
        const t = () => {
            let path: TopicPath = new TopicPath(null);
        };
        expect(t).toThrow();
    });

    test("Constructor allows zero length array", () => {
        let path: TopicPath = new TopicPath([]);
        expect(path.hasPath).toEqual(false);
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
        let path: TopicPath = new TopicPath(["Level1", "Level2", "Level3"]);
        let result: string = path.shift();

        expect(result).toEqual("Level1");
        expect(path).toEqual(new TopicPath(["Level2", "Level3"]));
    });

    test("shift() on single-part path", () => {
        let path: TopicPath = new TopicPath(["Level1"]);
        let result: string = path.shift();

        expect(result).toEqual("Level1");
        expect(path.hasPath).toEqual(false);
    });

    test("shift() on empty path", () => {
        let path: TopicPath = new TopicPath(["Level1"]);
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

        cardText = "#flashcards/examination Q2::A2";
        path = TopicPath.getTopicPathFromCardText(cardText);

        expect(path).toEqual(new TopicPath(["flashcards", "examination"]));
    });

    test("Card text includes 2 multi level tags", () => {
        let cardText: string =
            "#flashcards/science/chemistry Card text includes multiple tag #flashcards/test/chemistry";
        let path: TopicPath = TopicPath.getTopicPathFromCardText(cardText);

        expect(path).toEqual(new TopicPath(["flashcards", "science", "chemistry"]));
    });
});

describe("getTopicPathFromTag", () => {
    test("Null string", () => {
        const t = () => {
            TopicPath.getTopicPathFromTag(null);
        };
        expect(t).toThrow();
    });

    test("Empty string", () => {
        const t = () => {
            TopicPath.getTopicPathFromTag("");
        };
        expect(t).toThrow();
    });

    test("String that doesn't start with a #", () => {
        const t = () => {
            TopicPath.getTopicPathFromTag("Invalid tag");
        };
        expect(t).toThrow();
    });

    test("String that is only the #", () => {
        const t = () => {
            TopicPath.getTopicPathFromTag("#");
        };
        expect(t).toThrow();
    });

    test("Single level tag", () => {
        let result: TopicPath = TopicPath.getTopicPathFromTag("#flashcard");

        expect(result.path).toEqual(["flashcard"]);
    });

    test("Multi level tag", () => {
        let result: TopicPath = TopicPath.getTopicPathFromTag("#flashcard/science/physics");

        expect(result.path).toEqual(["flashcard", "science", "physics"]);
    });

    test("Tag with trailing slash", () => {
        let result: TopicPath = TopicPath.getTopicPathFromTag("#flashcard/science/physics/");

        expect(result.path).toEqual(["flashcard", "science", "physics"]);
    });

    test("Tag with multiple adjacent slashes", () => {
        let result: TopicPath = TopicPath.getTopicPathFromTag("#flashcard///science//physics");

        expect(result.path).toEqual(["flashcard", "science", "physics"]);
    });
});

describe("isSameOrAncestorOf", () => {
    test("a, b are both empty", () => {
        let a: TopicPath = TopicPath.emptyPath;
        let b: TopicPath = TopicPath.emptyPath;
        expect(a.isSameOrAncestorOf(b)).toEqual(true);
    });

    test("a is empty, b has path", () => {
        let a: TopicPath = TopicPath.emptyPath;
        let b: TopicPath = new TopicPath(["flashcard"]);
        expect(a.isSameOrAncestorOf(b)).toEqual(false);
    });

    test("a has path, b is empty", () => {
        let a: TopicPath = new TopicPath(["flashcard"]);
        let b: TopicPath = TopicPath.emptyPath;
        expect(a.isSameOrAncestorOf(b)).toEqual(false);
    });

    describe("a, b both have paths", () => {
        test("a same as b", () => {
            let a: TopicPath = new TopicPath(["flashcard"]);
            let b: TopicPath = new TopicPath(["flashcard"]);
            expect(a.isSameOrAncestorOf(b)).toEqual(true);

            a = new TopicPath(["flashcard", "science"]);
            b = new TopicPath(["flashcard", "science"]);
            expect(a.isSameOrAncestorOf(b)).toEqual(true);
        });

        test("a is ancestor of b", () => {
            let a: TopicPath = new TopicPath(["flashcard"]);
            let b: TopicPath = new TopicPath(["flashcard", "science"]);
            expect(a.isSameOrAncestorOf(b)).toEqual(true);

            a = new TopicPath(["flashcard"]);
            b = new TopicPath(["flashcard", "science", "physics"]);
            expect(a.isSameOrAncestorOf(b)).toEqual(true);
        });

        test("a is different to b", () => {
            let a: TopicPath = new TopicPath(["flashcard", "math"]);
            let b: TopicPath = new TopicPath(["flashcard", "science"]);
            expect(a.isSameOrAncestorOf(b)).toEqual(false);

            a = new TopicPath(["flashcard", "science", "physics"]);
            b = new TopicPath(["flashcard", "science", "chemistry"]);
            expect(a.isSameOrAncestorOf(b)).toEqual(false);
        });
    });
});

describe("clone", () => {
    test("clone of empty", () => {
        let a: TopicPath = TopicPath.emptyPath;
        let b: TopicPath = a.clone();
        expect(b.isEmptyPath).toEqual(true);
    });

    test("clone of path", () => {
        let a: TopicPath = new TopicPath(["flashcard"]);
        let b: TopicPath = a.clone();
        expect(b.path).toEqual(["flashcard"]);

        a = new TopicPath(["flashcard", "science"]);
        b = a.clone();
        expect(b.path).toEqual(["flashcard", "science"]);
    });
});

describe("formatTag", () => {
    test("Simple test", () => {
        let topicPath: TopicPath = new TopicPath(["flashcards", "science"]);

        expect(topicPath.formatAsTag()).toEqual("#flashcards/science");
    });

    test("Empty path", () => {
        const t = () => {
            let str: string = TopicPath.emptyPath.formatAsTag();
        };
        expect(t).toThrow();
    });
});

describe("isValidTag", () => {
    test("Invalid tags", () => {
        expect(TopicPath.isValidTag(null)).toEqual(false);
        expect(TopicPath.isValidTag("")).toEqual(false);
        expect(TopicPath.isValidTag("!Flashcards")).toEqual(false);
        expect(TopicPath.isValidTag("#")).toEqual(false);
    });

    test("Valid tags", () => {
        expect(TopicPath.isValidTag("#flashcards")).toEqual(true);
    });
});
