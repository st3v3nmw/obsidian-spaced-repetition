import StringDetector from "src/utils/parsers/detectors/string-detector";

// Before we can start testing the parsing of cards, we need to test the detectors, which enable us to parse the cards

test("Test parsing of SR HTML comments", () => {
    expect(StringDetector.getSRHTMLComment("<!--SR:2021-08-11,4,270-->", 0)).toEqual({
        startIndex: 0,
        endIndex: 25,
        text: "<!--SR:2021-08-11,4,270-->",
        lineNumber: 0,
    });

    expect(StringDetector.getSRHTMLComment("<!--SR:2021-08-11,4,270-->", 1)).toEqual({
        startIndex: 0,
        endIndex: 25,
        text: "<!--SR:2021-08-11,4,270-->",
        lineNumber: 1,
    });

    expect(StringDetector.getSRHTMLComment("<!--SR:2021-08-11,4,270--", 1)).toEqual({
        startIndex: -1,
        endIndex: -1,
        text: "<!--SR:2021-08-11,4,270--",
        lineNumber: 1,
    });

    expect(StringDetector.getSRHTMLComment("--SR:2021-08-11,4,270-->", 1)).toEqual({
        startIndex: -1,
        endIndex: -1,
        text: "--SR:2021-08-11,4,270-->",
        lineNumber: 1,
    });

    expect(StringDetector.getSRHTMLComment("Some text before <!--SR:2021-08-11,4,270-->", 1)).toEqual({
        startIndex: 17,
        endIndex: 42,
        text: "<!--SR:2021-08-11,4,270-->",
        lineNumber: 1,
    });

    expect(StringDetector.getSRHTMLComment("Some text before <!--SR:2021-08-11,4,270--> Some text after", 1)).toEqual({
        startIndex: 17,
        endIndex: 42,
        text: "<!--SR:2021-08-11,4,270-->",
        lineNumber: 1,
    });

    expect(StringDetector.getSRHTMLComment("<!--SR:2021-08-11,4,270--> Some text after", 1)).toEqual({
        startIndex: 0,
        endIndex: 25,
        text: "<!--SR:2021-08-11,4,270-->",
        lineNumber: 1,
    });

    expect(StringDetector.getSRCommentsInLine("<!--Some text before <!--SR:2021-08-11,4,270--> Some text after", 1)).toEqual([{
        startIndex: 21,
        endIndex: 46,
        text: "<!--SR:2021-08-11,4,270-->",
        lineNumber: 1,
    }]);
});

test("Test parsing of HTML comments", () => {
    expect(StringDetector.getHTMLCommentsInLine("<!--Some text in comment-->", 0)).toEqual([
        {
            startIndex: 0,
            endIndex: 26,
            text: "<!--Some text in comment-->",
            lineNumber: 0,
        }
    ]);

    expect(StringDetector.getHTMLCommentsInLine("<!--Some text in comment-->", 1)).toEqual([
        {
            startIndex: 0,
            endIndex: 26,
            text: "<!--Some text in comment-->",
            lineNumber: 1,
        }
    ]);

    expect(StringDetector.getHTMLCommentsInLine("Some text before <!--Some text in comment-->", 1)).toEqual([
        {
            startIndex: 17,
            endIndex: 43,
            text: "<!--Some text in comment-->",
            lineNumber: 1,
        }
    ]);

    expect(StringDetector.getHTMLCommentsInLine("<!--Some text in comment--> Some text after", 1)).toEqual([
        {
            startIndex: 0,
            endIndex: 26,
            text: "<!--Some text in comment-->",
            lineNumber: 1,
        }
    ]);

    expect(StringDetector.getHTMLCommentsInLine("Some text before <!--Some text in comment--> Some text after", 1)).toEqual([
        {
            startIndex: 17,
            endIndex: 43,
            text: "<!--Some text in comment-->",
            lineNumber: 1,
        }
    ]);

    expect(StringDetector.getHTMLCommentsInLine("Some text before <!--Some text in comment Some text after", 1)).toEqual([
        {
            startIndex: 17,
            endIndex: -1,
            text: "<!--",
            lineNumber: 1,
        }
    ]);

    expect(StringDetector.getHTMLCommentsInLine("<!--Some text before <!--Some text in comment Some text after", 1)).toEqual([
        {
            startIndex: 0,
            endIndex: -1,
            text: "<!--",
            lineNumber: 1,
        },
        {
            startIndex: 21,
            endIndex: -1,
            text: "<!--",
            lineNumber: 1,
        }
    ]);

    expect(StringDetector.getHTMLCommentsInLine("-->Some text before Some text in comment--> Some text after", 1)).toEqual([
        {
            startIndex: -1,
            endIndex: 2,
            text: "-->",
            lineNumber: 1,
        },
        {
            startIndex: -1,
            endIndex: 42,
            text: "-->",
            lineNumber: 1,
        }
    ]);

    expect(StringDetector.getHTMLCommentsInLine("<!--Some text before <!--Some text in comment--> <!--Some text after-->-->", 4)).toEqual([
        {
            startIndex: 0,
            endIndex: 47,
            text: "<!--Some text before <!--Some text in comment-->",
            lineNumber: 4,
        },
        {
            startIndex: 49,
            endIndex: 70,
            text: "<!--Some text after-->",
            lineNumber: 4,
        },
        {
            startIndex: -1,
            endIndex: 73,
            text: "-->",
            lineNumber: 4,
        },
    ]);

    // Comments which test that the outer comment always wins with closing & how leftovers are handled
    expect(StringDetector.getHTMLCommentsInLine("<!--Some text before <!--Some text in comment+++ <!--Some text after-->-->", 4)).toEqual([
        {
            startIndex: 0,
            endIndex: 70,
            text: "<!--Some text before <!--Some text in comment+++ <!--Some text after-->",
            lineNumber: 4,
        },
        {
            startIndex: -1,
            endIndex: 73,
            text: "-->",
            lineNumber: 4,
        },
    ]);

    expect(StringDetector.getHTMLCommentsInLine("<!--Some text before <!--Some text in comment+++ <!--Some text after+++-->", 4)).toEqual([
        {
            startIndex: 0,
            endIndex: 73,
            text: "<!--Some text before <!--Some text in comment+++ <!--Some text after+++-->",
            lineNumber: 4,
        },
    ]);

    expect(StringDetector.getHTMLCommentsInLine("<!--Some text before <!--Some text in comment--> <!--Some text after++++++", 4)).toEqual([
        {
            startIndex: 0,
            endIndex: 47,
            text: "<!--Some text before <!--Some text in comment-->",
            lineNumber: 4,
        },
        {
            startIndex: 49,
            endIndex: -1,
            text: "<!--",
            lineNumber: 4,
        },
    ]);

    // Multiple HTML comments in a row with SR comments

    expect(StringDetector.getHTMLCommentsInLine("<!--Some text before <!--SR:e text in comment--> <!--Some text after-->-->", 4)).toEqual([
        {
            startIndex: 0,
            endIndex: 70,
            text: "<!--Some text before <!--SR:e text in comment--> <!--Some text after-->",
            lineNumber: 4,
        },
        {
            startIndex: -1,
            endIndex: 73,
            text: "-->",
            lineNumber: 4,
        },
    ]);

    expect(StringDetector.getHTMLCommentsInLine("<!--Some text before <!--Some text in comment--> <!--SR:e text after-->-->", 4)).toEqual([
        {
            startIndex: 0,
            endIndex: 47,
            text: "<!--Some text before <!--Some text in comment-->",
            lineNumber: 4,
        },
        {
            startIndex: -1,
            endIndex: 73,
            text: "-->",
            lineNumber: 4,
        },
    ]);

    expect(StringDetector.getHTMLCommentsInLine("Some text before Some text in comment Some text after", 1)).toEqual([]);

    expect(StringDetector.getHTMLCommentsInLine("Some text before <!--SR:2021-08-11,4,270--> Some text after", 1)).toEqual([]);

    expect(StringDetector.getHTMLCommentsInLine("<!--Some text before <!--SR:2021-08-11,4,270--> Some text after", 1)).toEqual([{
        startIndex: 0,
        endIndex: -1,
        text: "<!--",
        lineNumber: 1,
    }]);
});