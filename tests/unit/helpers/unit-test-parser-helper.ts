import { CardType } from "src/card/questions/question";
import { QuestionParser } from "src/parser/parser";
import { ParsedQuestionInfo, ParserOptions } from "src/parser/parser-data-structure";

export const parserOptions: ParserOptions = {
    singleLineCardSeparator: "::",
    singleLineReversedCardSeparator: ":::",
    multilineCardSeparator: "?",
    multilineReversedCardSeparator: "??",
    multilineCardEndMarker: "",
    clozePatterns: [
        "==[123;;]answer[;;hint]==",
        "**[123;;]answer[;;hint]**",
        "{{[123;;]answer[;;hint]}}",
    ],
    useAtomicClozes: false,
};

/**
 * This function is a small wrapper around parse used for testing only.
 *  It generates a parser each time, overwriting the default one.
 * Created when the actual parser changed from returning [CardType, string, number, number] to ParsedQuestionInfo.
 * It's purpose is to minimise changes to all the test cases here during the parser()->parserEx() change.
 */
export function parseT(text: string, options: ParserOptions = parserOptions, path: string = "test.md"): [CardType, string, number, number][] {
    const list: ParsedQuestionInfo[] = QuestionParser.parse(path, text, options);
    const result: [CardType, string, number, number][] = [];
    for (const item of list) {
        result.push([item.cardType, item.text, item.firstLineNum, item.lastLineNum]);
    }
    return result;
}