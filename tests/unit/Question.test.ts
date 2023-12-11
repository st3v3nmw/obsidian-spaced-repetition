import { TopicPath } from "src/TopicPath";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { Question, QuestionText } from "src/Question";

let settings_cardCommentOnSameLine: SRSettings = { ...DEFAULT_SETTINGS };
settings_cardCommentOnSameLine.cardCommentOnSameLine = true;

describe("Question", () => {
    describe("getHtmlCommentSeparator", () => {
        test("Ends with a code block", async () => {
            let text: string =
                "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\nprint('Howdy?')\nlambda x: x[0]\n```";

            let question: Question = new Question({
                questionText: new QuestionText(text, null, text),
            });

            expect(question.getHtmlCommentSeparator(DEFAULT_SETTINGS)).toEqual("\n");
            expect(question.getHtmlCommentSeparator(settings_cardCommentOnSameLine)).toEqual("\n");
        });

        test("Doesn't end with a code block", async () => {
            let text: string = "Q1::A1";

            let question: Question = new Question({
                questionText: new QuestionText(text, null, text),
            });

            expect(question.getHtmlCommentSeparator(DEFAULT_SETTINGS)).toEqual("\n");
            expect(question.getHtmlCommentSeparator(settings_cardCommentOnSameLine)).toEqual(" ");
        });
    });
});
