import { Question, QuestionText } from "src/question";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { TextDirection } from "src/utils/text-direction";

const settings_cardCommentOnSameLine: SRSettings = { ...DEFAULT_SETTINGS };
settings_cardCommentOnSameLine.cardCommentOnSameLine = true;

describe("Question", () => {
    describe("getHtmlCommentSeparator", () => {
        test("Ends with a code block", async () => {
            const text: string =
                "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\nprint('Howdy?')\nlambda x: x[0]\n```";

            const question: Question = new Question({
                questionText: new QuestionText(text, null, text, TextDirection.Ltr, null),
            });

            expect(question.getHtmlCommentSeparator(DEFAULT_SETTINGS)).toEqual("\n");
            expect(question.getHtmlCommentSeparator(settings_cardCommentOnSameLine)).toEqual("\n");
        });

        test("Doesn't end with a code block", async () => {
            const text: string = "Q1::A1";

            const question: Question = new Question({
                questionText: new QuestionText(text, null, text, TextDirection.Ltr, null),
            });

            expect(question.getHtmlCommentSeparator(DEFAULT_SETTINGS)).toEqual("\n");
            expect(question.getHtmlCommentSeparator(settings_cardCommentOnSameLine)).toEqual(" ");
        });
    });
});
