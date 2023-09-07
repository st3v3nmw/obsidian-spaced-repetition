import { IQuestionContextFinder, NoteQuestionParser, NullImpl_IQuestionContextFinder } from "src/NoteQuestionParser";
import { Deck } from "src/deck";
import { DEFAULT_SETTINGS } from "src/settings";

let questionContextFinder: IQuestionContextFinder = new NullImpl_IQuestionContextFinder();
let parser: NoteQuestionParser = new NoteQuestionParser(DEFAULT_SETTINGS, questionContextFinder);
let refDate: Date = new Date(2023, 8, 6);

describe("Single level deck", () => {
    test("Simple sequence, new cards only", () => {
        let actual: Deck = new Deck("Great Name", null);

        expect(actual.deckName).toEqual("Great Name");
    });
});