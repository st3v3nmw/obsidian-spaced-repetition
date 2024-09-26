import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { Card } from "src/card";
import { TICKS_PER_DAY } from "src/constants";
import { frontmatterTagPseudoLineNum, ISRFile } from "src/file";
import { NoteQuestionParser } from "src/note-question-parser";
import { CardType, Question } from "src/question";
import { DEFAULT_SETTINGS, SRSettings } from "src/settings";
import { TopicPath, TopicPathList } from "src/topic-path";
import { setupStaticDateProvider20230906 } from "src/utils/dates";
import { TextDirection } from "src/utils/strings";

import { UnitTestSRFile } from "./helpers/unit-test-file";
import { unitTestSetupStandardDataStoreAlgorithm } from "./helpers/unit-test-setup";
import { createTestNoteQuestionParser } from "./sample-items";

const parserWithDefaultSettings: NoteQuestionParser =
    createTestNoteQuestionParser(DEFAULT_SETTINGS);
const settingsConvertFoldersToDecks: SRSettings = { ...DEFAULT_SETTINGS };
settingsConvertFoldersToDecks.convertFoldersToDecks = true;
const parserConvertFoldersToDecks: NoteQuestionParser = createTestNoteQuestionParser(
    settingsConvertFoldersToDecks,
);

beforeAll(() => {
    setupStaticDateProvider20230906();
    unitTestSetupStandardDataStoreAlgorithm(DEFAULT_SETTINGS);
});

describe("No flashcard questions", () => {
    test("No questions in the text", async () => {
        const noteText: string = "An interesting note, but no questions";
        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        expect(
            await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            ),
        ).toEqual([]);
    });

    test("A question in the text, but no flashcard tag", async () => {
        const noteText: string = "A::B";
        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        expect(
            await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            ),
        ).toEqual([]);
    });
});

describe("Single question in the text (without block identifier)", () => {
    test("SingleLineBasic: No schedule info", async () => {
        const noteText: string = `#flashcards
A::B
`;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const card1 = {
            cardIdx: 0,
            scheduleInfo: null as RepItemScheduleInfo,
        };
        const expected = [
            {
                questionType: CardType.SingleLineBasic,
                topicPathList: TopicPathList.fromPsv("#flashcards", 0),
                questionText: {
                    original: "A::B",
                    actualQuestion: "A::B",
                },

                hasEditLaterTag: false,
                cards: [card1],
                hasChanged: false,
            },
        ];
        expect(
            await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            ),
        ).toMatchObject(expected);
    });

    test("SingleLineBasic: With schedule info", async () => {
        const noteText: string = `#flashcards/test
A::B
<!--SR:!2023-09-03,1,230-->
    `;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const delayDays = 3 - 6;
        const scheduleInfo = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-03", 1, 230);
        scheduleInfo.delayedBeforeReviewTicks = delayDays * TICKS_PER_DAY;
        const card1 = {
            cardIdx: 0,
            scheduleInfo,
        };
        const expected = [
            {
                questionType: CardType.SingleLineBasic,
                topicPathList: TopicPathList.fromPsv("#flashcards/test", 0),
                questionText: {
                    original: `A::B
<!--SR:!2023-09-03,1,230-->`,
                    actualQuestion: "A::B",
                    textHash: "1c6b0b01215dc4",
                },
                lineNo: 1,
                hasEditLaterTag: false,
                cards: [card1],
                hasChanged: false,
            },
        ];
        expect(
            await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            ),
        ).toMatchObject(expected);
    });

    test("SingleLineBasic: Multiple topics", async () => {
        const noteText: string = `#flashcards/science #flashcards/poetry
A::B
    `;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const expected = [
            {
                questionType: CardType.SingleLineBasic,
                topicPathList: TopicPathList.fromPsv("#flashcards/science|#flashcards/poetry", 0),
                questionText: {
                    original: "A::B",
                    actualQuestion: "A::B",
                },
            },
        ];
        expect(
            await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            ),
        ).toMatchObject(expected);
    });

    // https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/908
    test("SingleLineBasic: Multiple tags in note (including non-flashcard ones)", async () => {
        const noteText: string = `---
created: 2024-03-11 10:41
tags:
  - flashcards
  - data-structure
---
#2024/03-11

**What is a Heap?**
?
In computer-science, a *heap* is a tree-based data-structure, that satisfies the *heap property*. A heap is a complete *binary-tree*!
    `;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const expected = [
            {
                questionType: CardType.MultiLineBasic,
                // Explicitly checking that #data-structure and #2024/03-11 are not included
                topicPathList: TopicPathList.fromPsv("#flashcards", frontmatterTagPseudoLineNum),
            },
        ];
        expect(
            await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            ),
        ).toMatchObject(expected);
    });
});

describe("Single question in the text (with block identifier)", () => {
    test("SingleLineBasic: No schedule info", async () => {
        const noteText: string = `#flashcards
A::B ^d7cee0
`;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const card1 = {
            cardIdx: 0,
            scheduleInfo: null as RepItemScheduleInfoOsr,
        };
        const expected = [
            {
                topicPathList: {
                    list: [TopicPath.getTopicPathFromTag("#flashcards")],
                    lineNum: 0,
                },
                parsedQuestionInfo: {
                    cardType: CardType.SingleLineBasic,
                    firstLineNum: 1,
                },
                questionText: {
                    original: "A::B ^d7cee0",
                    actualQuestion: "A::B",
                    obsidianBlockId: "^d7cee0",
                },

                hasEditLaterTag: false,
                cards: [card1],
                hasChanged: false,
            },
        ];
        expect(
            await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            ),
        ).toMatchObject(expected);
    });

    test("SingleLineBasic: With schedule info (next line)", async () => {
        const noteText: string = `#flashcards/test
A::B ^d7cee0
<!--SR:!2023-09-03,1,230-->
    `;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const delayDays = 3 - 6;
        const scheduleInfo = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-03", 1, 230);
        scheduleInfo.delayedBeforeReviewTicks = delayDays * TICKS_PER_DAY;

        const card1 = {
            cardIdx: 0,
            scheduleInfo,
        };
        const expected = [
            {
                topicPathList: {
                    list: [TopicPath.getTopicPathFromTag("#flashcards/test")],
                    lineNum: 0,
                },
                parsedQuestionInfo: {
                    cardType: CardType.SingleLineBasic,
                    firstLineNum: 1,
                },
                questionText: {
                    original: `A::B ^d7cee0
<!--SR:!2023-09-03,1,230-->`,
                    actualQuestion: "A::B",
                    textHash: "1c6b0b01215dc4",
                    obsidianBlockId: "^d7cee0",
                },
                hasEditLaterTag: false,
                cards: [card1],
                hasChanged: false,
            },
        ];
        expect(
            await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            ),
        ).toMatchObject(expected);
    });

    test("SingleLineBasic: With schedule info (same line)", async () => {
        const noteText: string = `#flashcards/test
A::B <!--SR:!2023-09-03,1,230--> ^d7cee0
    `;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const delayDays = 3 - 6;
        const scheduleInfo = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-03", 1, 230);
        scheduleInfo.delayedBeforeReviewTicks = delayDays * TICKS_PER_DAY;
        const card1 = {
            cardIdx: 0,
            scheduleInfo,
        };
        const expected = [
            {
                topicPathList: {
                    list: [TopicPath.getTopicPathFromTag("#flashcards/test")],
                    lineNum: 0, // Line numbers start at zero
                },
                parsedQuestionInfo: {
                    cardType: CardType.SingleLineBasic,
                    firstLineNum: 1,
                },
                questionText: {
                    original: "A::B <!--SR:!2023-09-03,1,230--> ^d7cee0",
                    actualQuestion: "A::B",
                    textHash: "1c6b0b01215dc4",
                    obsidianBlockId: "^d7cee0",
                },
                hasEditLaterTag: false,
                cards: [card1],
                hasChanged: false,
            },
        ];
        expect(
            await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            ),
        ).toMatchObject(expected);
    });

    test("SingleLineBasic: With topic tag and schedule info (same line)", async () => {
        const noteText: string = `
#flashcards/test A::B <!--SR:!2023-09-03,1,230--> ^d7cee0
    `;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const delayDays = 3 - 6;
        const scheduleInfo = RepItemScheduleInfoOsr.fromDueDateStr("2023-09-03", 1, 230);
        scheduleInfo.delayedBeforeReviewTicks = delayDays * TICKS_PER_DAY;
        const card1 = {
            cardIdx: 0,
            scheduleInfo,
        };
        const expected = [
            {
                topicPathList: {
                    list: [TopicPath.getTopicPathFromTag("#flashcards/test")],
                    lineNum: 1,
                },
                parsedQuestionInfo: {
                    cardType: CardType.SingleLineBasic,
                    firstLineNum: 1,
                },
                questionText: {
                    original: "#flashcards/test A::B <!--SR:!2023-09-03,1,230--> ^d7cee0",
                    actualQuestion: "A::B",
                    obsidianBlockId: "^d7cee0",
                },
                hasEditLaterTag: false,
                cards: [card1],
                hasChanged: false,
            },
        ];
        expect(
            await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            ),
        ).toMatchObject(expected);
    });
});

describe("Multiple questions in the text", () => {
    test("SingleLineBasic: No schedule info", async () => {
        const noteText: string = `#flashcards/test
Q1::A1
Q2::A2
`;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);
        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const questionList: Question[] = await parserConvertFoldersToDecks.createQuestionList(
            noteFile,
            TextDirection.Ltr,
            folderTopicPath,
            true,
        );
        expect(questionList.length).toEqual(2);
    });

    test("SingleLineBasic: Note topic applies to all questions when not overriden", async () => {
        const noteText: string = `
Q1::A1
Q2::A2
Q3::A3
`;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        const folderTopicPath: TopicPath = new TopicPath(["flashcards", "science"]);
        const questionList: Question[] = await parserConvertFoldersToDecks.createQuestionList(
            noteFile,
            TextDirection.Ltr,
            folderTopicPath,
            true,
        );
        expect(questionList.length).toEqual(3);
        expect(questionList[0].topicPathList.formatPsv()).toEqual("#flashcards/science");
        expect(questionList[1].topicPathList.formatPsv()).toEqual("#flashcards/science");
        expect(questionList[2].topicPathList.formatPsv()).toEqual("#flashcards/science");
    });

    test("SingleLineBasic: Tags within frontmatter applies to all questions when not overriden", async () => {
        const noteText: string = `---
sr-due: 2024-01-17
sr-interval: 16
sr-ease: 278
tags:
  - flashcards/aws
---
Q1::A1
Q2::A2
Q3::A3
`;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const questionList: Question[] = await parserWithDefaultSettings.createQuestionList(
            noteFile,
            TextDirection.Ltr,
            folderTopicPath,
            true,
        );
        expect(questionList.length).toEqual(3);
        expect(questionList[0].topicPathList.formatPsv()).toEqual("#flashcards/aws");
        expect(questionList[1].topicPathList.formatPsv()).toEqual("#flashcards/aws");
        expect(questionList[2].topicPathList.formatPsv()).toEqual("#flashcards/aws");
    });

    test("MultiLine: Space before multi line separator", async () => {
        // https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/853
        const noteText: string = `
#flashcards/test/b853

Question::Answer

Multiline question
 ?
Multiline answer

Multiline question2
 ??
Multiline answer2

`;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);
        const questionList: Question[] = await parserWithDefaultSettings.createQuestionList(
            noteFile,
            TextDirection.Ltr,
            TopicPath.emptyPath,
            true,
        );
        expect(questionList.length).toEqual(3);
        expect(questionList[0].cards).toMatchObject([
            {
                front: "Question",
                back: "Answer",
            },
        ]);
        expect(questionList[1].cards).toMatchObject([
            {
                front: "Multiline question",
                back: "Multiline answer",
            },
        ]);
        expect(questionList[2].cards).toMatchObject([
            {
                front: "Multiline question2",
                back: "Multiline answer2",
            },
            {
                front: "Multiline answer2",
                back: "Multiline question2",
            },
        ]);
    });
});

describe("Handling tags within note", () => {
    describe("Settings mode: Convert folder path to tag", () => {
        const settings: SRSettings = { ...DEFAULT_SETTINGS };
        settings.convertFoldersToDecks = true;
        const parser2: NoteQuestionParser = createTestNoteQuestionParser(settings);

        test("Folder path applies to all questions within note", async () => {
            const noteText: string = `
    Q1::A1
    Q2::A2
    Q3::A3
    `;

            const noteFile: ISRFile = new UnitTestSRFile(noteText);
            const folderTopicPath: TopicPath = new TopicPath(["folder", "subfolder"]);
            const questionList: Question[] = await parser2.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(3);
            for (let i = 0; i < questionList.length; i++)
                expect(questionList[i].topicPathList.formatPsv()).toEqual("#folder/subfolder");
        });

        test("Topic tag within note is ignored (outside all questions)", async () => {
            const noteText: string = `#flashcards/test
Q1::A1
    `;

            const noteFile: ISRFile = new UnitTestSRFile(noteText);
            const folderTopicPath: TopicPath = new TopicPath(["folder", "subfolder"]);
            const questionList: Question[] = await parser2.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(1);
            expect(questionList[0].topicPathList.formatPsv()).toEqual("#folder/subfolder");
        });

        // Behavior here mimics SR_ORIGINAL
        // It could be argued that topic tags within a question should override the folder based topic
        test("Topic tag within note is ignored (within specific question)", async () => {
            // The tag "#flashcards/test" specifies a different topic than the folderTopicPath below
            const noteText: string = `
#flashcards/test Q1::A1
    `;

            const noteFile: ISRFile = new UnitTestSRFile(noteText);
            const folderTopicPath: TopicPath = new TopicPath(["folder", "subfolder"]);
            const questionList: Question[] = await parser2.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(1);
            expect(questionList[0].topicPathList.formatPsv()).toEqual("#folder/subfolder");
        });
    });

    describe("Settings mode: Use tags within note", () => {
        expect(parserWithDefaultSettings.settings.convertFoldersToDecks).toEqual(false);

        test("Topic tag before first question applies to all questions", async () => {
            const noteText: string = `#flashcards/test
    Q1::A1
    Q2::A2
    Q3::A3
    `;
            const noteFile: ISRFile = new UnitTestSRFile(noteText);

            const expectedPath: string = "#flashcards/test";
            const folderTopicPath: TopicPath = TopicPath.emptyPath;
            const questionList: Question[] = await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(3);
            expect(questionList[0].topicPathList.formatPsv()).toEqual(expectedPath);
            expect(questionList[1].topicPathList.formatPsv()).toEqual(expectedPath);
            expect(questionList[2].topicPathList.formatPsv()).toEqual(expectedPath);
        });

        // https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/915#issuecomment-2017508391
        test("Topic tag on first line after frontmatter", async () => {
            const noteText: string = `---
created: 2023-10-26T07:34
---
#flashcards/English

## taunting & teasing & irony & sarcasm

Stop trying ==to milk the crowd== for sympathy. // доить толпу
`;
            const noteFile: ISRFile = new UnitTestSRFile(noteText);

            const folderTopicPath: TopicPath = TopicPath.emptyPath;
            const expected = [
                {
                    questionType: CardType.Cloze,
                    topicPathList: TopicPathList.fromPsv("#flashcards/English", 3), // #flashcards/English is on the 4th line, line number 3
                    cards: [
                        new Card({
                            front: "Stop trying <span style='color:#2196f3'>[...]</span> for sympathy. // доить толпу",
                            back: "Stop trying <span style='color:#2196f3'>to milk the crowd</span> for sympathy. // доить толпу",
                        }),
                    ],
                },
            ];
            expect(
                await parserWithDefaultSettings.createQuestionList(
                    noteFile,
                    TextDirection.Ltr,
                    folderTopicPath,
                    true,
                ),
            ).toMatchObject(expected);
        });

        test("Topic tag within question overrides the note topic, for that topic only", async () => {
            const noteText: string = `#flashcards/test
    Q1::A1
    #flashcards/examination Q2::A2
    Q3::This has the "flashcards/test" topic, not "flashcards/examination"
    `;
            const noteFile: ISRFile = new UnitTestSRFile(noteText);

            const folderTopicPath: TopicPath = TopicPath.emptyPath;
            const questionList: Question[] = await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(3);
            expect(questionList[0].topicPathList.formatPsv()).toEqual("#flashcards/test");
            expect(questionList[1].topicPathList.formatPsv()).toEqual("#flashcards/examination");
            expect(questionList[2].topicPathList.formatPsv()).toEqual("#flashcards/test");
        });

        test("First topic tag within note (outside questions) is used as the note's topic tag, even if it appears after the first question", async () => {
            const noteText: string = `
    Q1::A1 This has the "flashcards/test" topic, even though the first topic tag is after this line in the file
    #flashcards/test
    Q2::A2
    Q3::A3
    `;
            const noteFile: ISRFile = new UnitTestSRFile(noteText);

            const folderTopicPath: TopicPath = TopicPath.emptyPath;
            const questionList: Question[] = await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(3);
            for (let i = 0; i < questionList.length; i++)
                expect(questionList[i].topicPathList.formatPsv()).toEqual("#flashcards/test");
        });

        test("The last topic tag within note prior to the question is used as the note's topic tag", async () => {
            const noteText: string = `
    Q1::A1
    #flashcards/test
    Q2::A2
    #flashcards/examination
    Q3::This has the "flashcards/examination" topic, not "flashcards/test"
    `;
            const noteFile: ISRFile = new UnitTestSRFile(noteText);

            const folderTopicPath: TopicPath = TopicPath.emptyPath;
            const questionList: Question[] = await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(3);
            expect(questionList[0].topicPathList.formatPsv()).toEqual("#flashcards/test");
            expect(questionList[1].topicPathList.formatPsv()).toEqual("#flashcards/test");
            expect(questionList[2].topicPathList.formatPsv()).toEqual("#flashcards/examination");
        });
    });

    describe("Tags within question", () => {
        expect(parserWithDefaultSettings.settings.convertFoldersToDecks).toEqual(false);

        test("Leading white space before topic tag", async () => {
            const noteText: string = `
            #flashcards/science Q5::A5 <!--SR:!2023-09-02,4,270-->
    `;
            const noteFile: ISRFile = new UnitTestSRFile(noteText);

            const folderTopicPath: TopicPath = TopicPath.emptyPath;
            const questionList: Question[] = await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            );
            expect(questionList.length).toEqual(1);
            expect(questionList[0].topicPathList.formatPsv()).toEqual("#flashcards/science");
            expect(questionList[0].cards.length).toEqual(1);
            expect(questionList[0].cards[0].front).toEqual("Q5");
        });

        // https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/915#issuecomment-2016580471
        test("Topic tag at end of line question line (no other tags present)", async () => {
            const noteText: string = `---
Title: "Aegon's Conquest: 2BC-1AC"
Authors: "GRRM"
Year: 2019
URL:
DOI:
Unique Citekey: AegonsConquest2BC1AC
Zotero Link: zotero://select/items/@AegonsConquest2BC1AC
---
> [!PDF|255, 208, 0] [[Aegon's Conquest_ 2BC - 1AC.pdf#page=10&annotation=1440R|Aegon's Conquest_ 2BC - 1AC, page 10]]
> > Aegon's Conquest also known as the War of Conquest or simply the Conquest, was the first of the Wars of Conquest initiated by Aegon Targaryen to conquer the continent of Westeros. Supported by his sister-wives, Rhaenys and Visenya, and their dragons, Meraxes and Vhagar, as well as his own, Balerion, Aegon successfully unified six of the Seven Kingdoms of Westeros under the invading forces of House Targaryen within two years. Only Dorne was able to successfully resist Aegon's conquest. Despite its name, the conflict was not entirely resolved on the field of battle, as some regions and houses of Westeros actively supported the Targaryen war effort, while others voluntarily surrendered to their might.

What year did Aegon's Conquest start?::2BC #flashcards
`;
            const noteFile: ISRFile = new UnitTestSRFile(noteText);

            const folderTopicPath: TopicPath = TopicPath.emptyPath;
            const expected = [
                {
                    questionType: CardType.SingleLineBasic,
                    topicPathList: TopicPathList.fromPsv("#flashcards", 12),
                    cards: [
                        new Card({
                            front: "What year did Aegon's Conquest start?",
                            back: "2BC #flashcards",
                        }),
                    ],
                },
            ];
            expect(
                await parserWithDefaultSettings.createQuestionList(
                    noteFile,
                    TextDirection.Ltr,
                    folderTopicPath,
                    true,
                ),
            ).toMatchObject(expected);
        });
    });
});

describe("Questions immediately after closing line of frontmatter", () => {
    // The frontmatter should be discarded
    // (only the specified question text should be used)
    test("Multi-line with question", async () => {
        const noteText: string = `---
created: 2024-03-11 10:41
tags:
  - flashcards
  - data-structure
---
**What is a Heap?**
?
In computer-science, a *heap* is a tree-based data-structure, that satisfies the *heap property*. A heap is a complete *binary-tree*!
`;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const expected = [
            {
                questionType: CardType.MultiLineBasic,
                // Explicitly checking that #data-structure is not included
                topicPathList: TopicPathList.fromPsv("#flashcards", frontmatterTagPseudoLineNum),
                cards: [
                    new Card({
                        front: "**What is a Heap?**",
                        back: "In computer-science, a *heap* is a tree-based data-structure, that satisfies the *heap property*. A heap is a complete *binary-tree*!",
                    }),
                ],
            },
        ];
        expect(
            await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            ),
        ).toMatchObject(expected);
    });

    test("Multi-line without question is ignored", async () => {
        const noteText: string = `---
created: 2024-03-11 10:41
tags:
  - flashcards
  - data-structure
---
?
A1

Q2
?
A2
    `;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const expected = [
            {
                questionType: CardType.MultiLineBasic,
                // Explicitly checking that #data-structure is not included
                topicPathList: TopicPathList.fromPsv("#flashcards", frontmatterTagPseudoLineNum),

                // No card A1; only card Q2/A2
                cards: [
                    new Card({
                        front: "Q2",
                        back: "A2",
                    }),
                ],
            },
        ];
        expect(
            await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            ),
        ).toMatchObject(expected);
    });

    test("single-line question", async () => {
        const noteText: string = `---
created: 2024-03-11 10:41
tags:
  - flashcards
  - data-structure
---
In computer-science, a *heap* is::a tree-based data-structure
A::B
    `;
        const noteFile: ISRFile = new UnitTestSRFile(noteText);

        const folderTopicPath: TopicPath = TopicPath.emptyPath;
        const expected = [
            {
                questionType: CardType.SingleLineBasic,
                topicPathList: TopicPathList.fromPsv("#flashcards", frontmatterTagPseudoLineNum),
                cards: [
                    new Card({
                        front: "In computer-science, a *heap* is",
                        back: "a tree-based data-structure",
                    }),
                ],
            },
            {
                questionType: CardType.SingleLineBasic,
                topicPathList: TopicPathList.fromPsv("#flashcards", frontmatterTagPseudoLineNum),
                cards: [
                    new Card({
                        front: "A",
                        back: "B",
                    }),
                ],
            },
        ];
        expect(
            await parserWithDefaultSettings.createQuestionList(
                noteFile,
                TextDirection.Ltr,
                folderTopicPath,
                true,
            ),
        ).toMatchObject(expected);
    });
});
