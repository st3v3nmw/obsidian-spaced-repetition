import { DataStoreAlgorithm } from "src/data/data-store/base/data-store-algorithm";
import { Card } from "src/data/data-structures/card/card";
import { Question, QuestionText } from "src/data/data-structures/card/questions/question";
import { DEFAULT_SETTINGS, SRSettings } from "src/data/settings";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
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

            expect(question.getHtmlCommentSeparator(DEFAULT_SETTINGS, false)).toEqual("\n");
            expect(question.getHtmlCommentSeparator(settingsCardCommentOnSameLine, false)).toEqual(
                "\n",
            );
        });

        test("Doesn't end with a code block", async () => {
            const text: string = "Q1::A1";

            const question: Question = new Question({
                questionText: new QuestionText(text, null, text, TextDirection.Ltr, null),
            });

            expect(question.getHtmlCommentSeparator(DEFAULT_SETTINGS, false)).toEqual("\n");
            expect(question.getHtmlCommentSeparator(settingsCardCommentOnSameLine, false)).toEqual(
                " ",
            );
        });
    });

    describe("formatForNote", () => {
        test("puts schedule in a metadata callout when enabled", async () => {
            const questionText = new QuestionText("Q1::A1", null, "Q1::A1", TextDirection.Ltr, "");
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
            };

            expect(
                question.formatForNote({
                    ...settingsCardCommentOnSameLine,
                    useCalloutsForSchedulingComments: true,
                }),
            ).toBe("Q1::A1\n> [!sr|card-metadata] \n>  <!--SR:!2023-09-06,1,250-->");
        });

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
            };

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
            };

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
            };

            expect(question.formatForNote(DEFAULT_SETTINGS)).toBe("Q1::A1 ^abc123");
        });
    });
});
