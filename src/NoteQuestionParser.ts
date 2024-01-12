import { TagCache } from "obsidian";
import { Card } from "./Card";
import { CardScheduleInfo, NoteCardScheduleParser } from "./CardSchedule";
import { parseEx, ParsedQuestionInfo } from "./parser";
import { Question, QuestionText } from "./Question";
import { CardFrontBack, CardFrontBackUtil } from "./QuestionType";
import { SRSettings, SettingsUtil } from "./settings";
import { ISRFile } from "./SRFile";
import { TopicPath, TopicPathList } from "./TopicPath";
import { extractFrontmatter, splitTextIntoLineArray } from "./util/utils";

export class NoteQuestionParser {
    settings: SRSettings;
    noteFile: ISRFile;
    folderTopicPath: TopicPath;
    noteText: string;
    noteLines: string[];
    tagCacheList: TagCache[];
    frontmatterTopicPathList: TopicPathList;
    contentTopicPathInfo: TopicPathList[];
    questionList: Question[];

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    async createQuestionList(
        noteFile: ISRFile,
        folderTopicPath: TopicPath,
        onlyKeepQuestionsWithTopicPath: boolean,
    ): Promise<Question[]> {
        this.noteFile = noteFile;
        const noteText: string = await noteFile.read();

        // Get the list of tags, and analyse for the topic list
        const tagCacheList: TagCache[] = noteFile.getAllTagsFromText();

        const hasTopicPaths =
            tagCacheList.some((item) => SettingsUtil.isFlashcardTag(this.settings, item.tag)) ||
            folderTopicPath.hasPath;
        if (hasTopicPaths) {
            // The following analysis can require fair computation.
            // There is no point doing it if there aren't any topic paths

            // Create the question list
            this.questionList = this.doCreateQuestionList(
                noteText,
                folderTopicPath,
                this.tagCacheList,
            );

            // For each question, determine it's TopicPathList
            [this.frontmatterTopicPathList, this.contentTopicPathInfo] =
                this.analyseTagCacheList(tagCacheList);
            for (const question of this.questionList) {
                question.topicPathList = this.determineQuestionTopicPathList(question);
            }

            // Now only keep questions that have a topic list
            if (onlyKeepQuestionsWithTopicPath) {
                this.questionList = this.questionList.filter((q) => q.topicPathList);
            }
        } else {
            this.questionList = [] as Question[];
        }
        return this.questionList;
    }

    private doCreateQuestionList(
        noteText: string,
        folderTopicPath: TopicPath,
        tagCacheList: TagCache[],
    ): Question[] {
        this.noteText = noteText;
        this.noteLines = splitTextIntoLineArray(noteText);
        this.folderTopicPath = folderTopicPath;
        this.tagCacheList = tagCacheList;

        const result: Question[] = [];
        const parsedQuestionInfoList: ParsedQuestionInfo[] = this.parseQuestions();
        for (const parsedQuestionInfo of parsedQuestionInfoList) {
            const question: Question = this.createQuestionObject(parsedQuestionInfo);

            // Each rawCardText can turn into multiple CardFrontBack's (e.g. CardType.Cloze, CardType.SingleLineReversed)
            const cardFrontBackList: CardFrontBack[] = CardFrontBackUtil.expand(
                question.questionType,
                question.questionText.actualQuestion,
                this.settings,
            );

            // And if the card has been reviewed, then scheduling info as well
            let cardScheduleInfoList: CardScheduleInfo[] =
                NoteCardScheduleParser.createCardScheduleInfoList(question.questionText.original);

            // we have some extra scheduling dates to delete
            const correctLength = cardFrontBackList.length;
            if (cardScheduleInfoList.length > correctLength) {
                question.hasChanged = true;
                cardScheduleInfoList = cardScheduleInfoList.slice(0, correctLength);
            }

            // Create the list of card objects, and attach to the question
            const cardList: Card[] = this.createCardList(cardFrontBackList, cardScheduleInfoList);
            question.setCardList(cardList);
            result.push(question);
        }
        return result;
    }

    private parseQuestions(): ParsedQuestionInfo[] {
        const settings: SRSettings = this.settings;
        const result: ParsedQuestionInfo[] = parseEx(
            this.noteText,
            settings.singleLineCardSeparator,
            settings.singleLineReversedCardSeparator,
            settings.multilineCardSeparator,
            settings.multilineReversedCardSeparator,
            settings.convertHighlightsToClozes,
            settings.convertBoldTextToClozes,
            settings.convertCurlyBracketsToClozes,
        );
        return result;
    }

    private createQuestionObject(parsedQuestionInfo: ParsedQuestionInfo): Question {
        const questionContext: string[] = this.noteFile.getQuestionContext(
            parsedQuestionInfo.firstLineNum,
        );
        const result = Question.Create(
            this.settings,
            parsedQuestionInfo,
            null, // We haven't worked out the TopicPathList yet
            questionContext,
        );
        return result;
    }

    private createCardList(
        cardFrontBackList: CardFrontBack[],
        cardScheduleInfoList: CardScheduleInfo[],
    ): Card[] {
        const siblings: Card[] = [];

        // One card for each CardFrontBack, regardless if there is scheduled info for it
        for (let i = 0; i < cardFrontBackList.length; i++) {
            const { front, back } = cardFrontBackList[i];

            const hasScheduleInfo: boolean = i < cardScheduleInfoList.length;
            const schedule: CardScheduleInfo = cardScheduleInfoList[i];

            const cardObj: Card = new Card({
                front,
                back,
                cardIdx: i,
            });
            cardObj.scheduleInfo =
                hasScheduleInfo && !schedule.isDummyScheduleForNewCard() ? schedule : null;

            siblings.push(cardObj);
        }
        return siblings;
    }

    //
    // Given the complete list of tags within a note:
    // 1.   Only keep tags that are specified in the user settings as flashcardTags
    // 2.   Filter out tags that are question specific
    //      (these will be parsed separately by class QuestionText)
    // 3.   Combine all tags present logically grouped together into a single entry
    //      - All tags present on the same line grouped together
    //      - All tags within frontmatter grouped together (note that multiple tags
    //      within frontmatter appear on separate lines)
    //
    private analyseTagCacheList(tagCacheList: TagCache[]): [TopicPathList, TopicPathList[]] {
        let frontmatterTopicPathList: TopicPathList = null;
        const contentTopicPathList: TopicPathList[] = [] as TopicPathList[];

        // Only keep tags that are:
        //      1. specified in the user settings as flashcardTags, and
        //      2. is not question specific (determined by line number)
        const filteredTagCacheList: TagCache[] = tagCacheList.filter(
            (item) =>
                SettingsUtil.isFlashcardTag(this.settings, item.tag) &&
                this.questionList.every(
                    (q) => !q.parsedQuestionInfo.isQuestionLineNum(item.position.start.line),
                ),
        );
        let frontmatterLineCount: number = null;
        if (filteredTagCacheList.length > 0) {
            // To simplify analysis, ensure that the supplied list is ordered by line number
            tagCacheList.sort((a, b) => a.position.start.line - b.position.start.line);

            // Treat the frontmatter slightly differently (all tags grouped together even if on separate lines)
            const [frontmatter, _] = extractFrontmatter(this.noteText);
            if (frontmatter) {
                frontmatterLineCount = splitTextIntoLineArray(frontmatter).length;
                const frontmatterTagCacheList = filteredTagCacheList.filter(
                    (item) => item.position.start.line < frontmatterLineCount,
                );

                // Doesn't matter what line number we specify, as long as it's less than frontmatterLineCount
                if (frontmatterTagCacheList.length > 0)
                    frontmatterTopicPathList = this.createTopicPathList(tagCacheList, 0);
            }
        }
        //
        const contentStartLineNum: number = frontmatterLineCount > 0 ? frontmatterLineCount + 1 : 0;
        const contentTagCacheList: TagCache[] = filteredTagCacheList.filter(
            (item) => item.position.start.line >= contentStartLineNum,
        );

        let list: TagCache[] = [] as TagCache[];
        for (const t of contentTagCacheList) {
            if (list.length != 0) {
                const startLineNum: number = list[0].position.start.line;
                if (startLineNum != t.position.start.line) {
                    contentTopicPathList.push(this.createTopicPathList(list, startLineNum));
                    list = [] as TagCache[];
                }
            }
            list.push(t);
        }
        if (list.length > 0) {
            const startLineNum: number = list[0].position.start.line;
            contentTopicPathList.push(this.createTopicPathList(list, startLineNum));
        }

        return [frontmatterTopicPathList, contentTopicPathList];
    }

    private createTopicPathList(tagCacheList: TagCache[], lineNum: number): TopicPathList {
        const list: TopicPath[] = [] as TopicPath[];
        for (const tagCache of tagCacheList) {
            list.push(TopicPath.getTopicPathFromTag(tagCache.tag));
        }
        return new TopicPathList(list, lineNum);
    }

    //
    // A question can be associated with multiple topics (hence returning TopicPathList and not just TopicPath).
    //
    // If the question has an associated question specific TopicPath, then that is returned.
    //
    // Else the first TopicPathList prior to the question (in the order present in the file) is returned.
    // That could be either the tags within the note's frontmatter, or tags on lines within the note's content.
    //
    private determineQuestionTopicPathList(question: Question): TopicPathList {
        let result: TopicPathList;
        if (this.settings.convertFoldersToDecks) {
            result = new TopicPathList([this.folderTopicPath]);
        } else {
            // If present, the question specific TopicPath takes precedence over everything else
            const questionText: QuestionText = question.questionText;
            if (questionText.topicPathWithWs)
                result = new TopicPathList([questionText.topicPathWithWs.topicPath]);
            else {
                // By default we start off with any TopicPathList present in the frontmatter
                result = this.frontmatterTopicPathList;

                // Find the last TopicPathList prior to the question (in the order present in the file)
                for (let i = this.contentTopicPathInfo.length - 1; i >= 0; i--) {
                    const info: TopicPathList = this.contentTopicPathInfo[i];
                    if (info.lineNum < question.parsedQuestionInfo.firstLineNum) {
                        result = info;
                        break;
                    }
                }

                // For backward compatibility with functionality pre https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/495:
                // if nothing matched, then use the first one
                if (!result && this.contentTopicPathInfo.length > 0) {
                    result = this.contentTopicPathInfo[0];
                }
            }
        }
        return result;
    }
}
