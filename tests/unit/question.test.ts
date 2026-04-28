import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { Card } from "src/card/card";
import { Question, QuestionText } from "src/card/questions/question";
import { DataStoreAlgorithm } from "src/data-store-algorithm/data-store-algorithm";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { TextDirection } from "src/utils/strings";

const settingsCardCommentOnSameLine: SRSettings = { ...DEFAULT_SETTINGS };
settingsCardCommentOnSameLine.cardCommentOnSameLine = true;

describe("Question", () => {
    afterEach(() => {
        DataStoreAlgorithm.instance = undefined;
    });

    describe("getHtmlCommentSeparator", () => {
        test("Ends with a code block", async () => {
            const text: string =
                "How do you ... Python?\n?\n" +
                "```\nprint('Hello World!')\nprint('Howdy?')\nlambda x: x[0]\n```";

            const question: Question = new Question({
                questionText: new QuestionText(text, null, text, TextDirection.Ltr, null),
            });

            expect(question.getHtmlCommentSeparator(DEFAULT_SETTINGS)).toEqual("\n");
            expect(question.getHtmlCommentSeparator(settingsCardCommentOnSameLine)).toEqual("\n");
        });

        test("Doesn't end with a code block", async () => {
            const text: string = "Q1::A1";

            const question: Question = new Question({
                questionText: new QuestionText(text, null, text, TextDirection.Ltr, null),
            });

            expect(question.getHtmlCommentSeparator(DEFAULT_SETTINGS)).toEqual("\n");
            expect(question.getHtmlCommentSeparator(settingsCardCommentOnSameLine)).toEqual(" ");
        });
    });

    describe("formatForNote", () => {
        test("puts schedule and block id on the same line when enabled", () => {
            const questionText = new QuestionText(
                "Q1::A1 ^abc123",
                null,
                "Q1::A1",
                TextDirection.Ltr,
                "^abc123",
            );
            const question = new Question({
                questionText,
                cards: [
                    new Card({
                        scheduleInfo: RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 1, 250),
                    }),
                ],
            });

            DataStoreAlgorithm.instance = {
                questionFormatScheduleAsHtmlComment: jest.fn(() => "<!--SR:!2023-09-06,1,250-->"),
            } as never;

            expect(question.formatForNote(settingsCardCommentOnSameLine)).toBe(
                "Q1::A1 <!--SR:!2023-09-06,1,250--> ^abc123",
            );
        });

        test("puts block id before schedule when comments are on next line", () => {
            const questionText = new QuestionText(
                "Q1::A1 ^abc123",
                null,
                "Q1::A1",
                TextDirection.Ltr,
                "^abc123",
            );
            const question = new Question({
                questionText,
                cards: [
                    new Card({
                        scheduleInfo: RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 1, 250),
                    }),
                ],
            });

            DataStoreAlgorithm.instance = {
                questionFormatScheduleAsHtmlComment: jest.fn(() => "<!--SR:!2023-09-06,1,250-->"),
            } as never;

            expect(question.formatForNote(DEFAULT_SETTINGS)).toBe(
                "Q1::A1 ^abc123\n<!--SR:!2023-09-06,1,250-->",
            );
        });

        test("keeps only the block id when there is no schedule html", () => {
            const questionText = new QuestionText(
                "Q1::A1 ^abc123",
                null,
                "Q1::A1",
                TextDirection.Ltr,
                "^abc123",
            );
            const question = new Question({
                questionText,
                cards: [
                    new Card({
                        scheduleInfo: RepItemScheduleInfoOsr.fromDueDateStr("2023-09-06", 1, 250),
                    }),
                ],
            });

            DataStoreAlgorithm.instance = {
                questionFormatScheduleAsHtmlComment: jest.fn(() => ""),
            } as never;

            expect(question.formatForNote(DEFAULT_SETTINGS)).toBe("Q1::A1 ^abc123");
        });
    });
});
