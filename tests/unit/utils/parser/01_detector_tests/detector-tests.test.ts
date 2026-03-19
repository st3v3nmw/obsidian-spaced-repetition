import StringDetector from "src/utils/parsers/detectors/string-detector";

// Before we can start testing the parsing of cards, we need to test the detectors, which enable us to parse the cards

test("Test parsing of SR HTML comments", () => {
    expect(StringDetector.getSRHTMLComment("<!--SR:2021-08-11,4,270-->", 0)).toEqual({
        startIndex: 0,
        endIndex: 26,
        text: "<!--SR:2021-08-11,4,270-->",
        lineNumber: 0,
    });

    expect(StringDetector.getSRHTMLComment("<!--SR:2021-08-11,4,270-->", 1)).toEqual({
        startIndex: 0,
        endIndex: 26,
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
        endIndex: 43,
        text: "<!--SR:2021-08-11,4,270-->",
        lineNumber: 1,
    });

    expect(StringDetector.getSRHTMLComment("Some text before <!--SR:2021-08-11,4,270--> Some text after", 1)).toEqual({
        startIndex: 17,
        endIndex: 43,
        text: "<!--SR:2021-08-11,4,270-->",
        lineNumber: 1,
    });

    expect(StringDetector.getSRHTMLComment("<!--SR:2021-08-11,4,270--> Some text after", 1)).toEqual({
        startIndex: 0,
        endIndex: 26,
        text: "<!--SR:2021-08-11,4,270-->",
        lineNumber: 1,
    });
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
});