import { TagCache } from "obsidian";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { Card } from "src/card";
import { DataStore } from "src/data-stores/base/data-store";
import { frontmatterTagPseudoLineNum, ISRFile } from "src/file";
import { parse, ParsedQuestionInfo, ParserOptions } from "src/parser";
import { Question, QuestionText } from "src/question";
import { CardFrontBack, CardFrontBackUtil } from "src/question-type";
import { SettingsUtil, SRSettings } from "src/settings";
import { TopicPath, TopicPathList } from "src/topic-path";
import {
    splitNoteIntoFrontmatterAndContent,
    splitTextIntoLineArray,
    TextDirection,
} from "src/utils/strings";

export class NoteQuestionParser {
    settings: SRSettings;
    noteFile: ISRFile;
    folderTopicPath: TopicPath;
    noteText: string;
    frontmatterText: string;

    // This is the note text, but with the frontmatter blanked out (see extractFrontmatter for reasoning)
    contentText: string;
    noteLines: string[];

    // Complete list of tags
    tagCacheList: TagCache[];

    // tagCacheList filtered to those specified in the user settings (e.g. "#flashcards")
    flashcardTagList: TagCache[];

    // flashcardTagList filtered to those within the frontmatter
    frontmatterTopicPathList: TopicPathList;

    // flashcardTagList filtered to those within the note's content and are note-level tags (i.e. not question specific)
    contentTopicPathInfo: TopicPathList[];

    questionList: Question[];

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    async createQuestionList(
        noteFile: ISRFile,
        defaultTextDirection: TextDirection,
        folderTopicPath: TopicPath,
        onlyKeepQuestionsWithTopicPath: boolean,
    ): Promise<Question[]> {
        this.noteFile = noteFile;
        // For efficiency, we first get the tag list from the Obsidian cache
        // (this only gives the tag names, not the line numbers, but this is sufficient for this first step)
        const tagCacheList: string[] = noteFile.getAllTagsFromCache();
        const hasTopicPaths: boolean =
            tagCacheList.some((item) => SettingsUtil.isFlashcardTag(this.settings, item)) ||
            folderTopicPath.hasPath;

        if (hasTopicPaths) {
            // Reading the file is relatively an expensive operation, so we only do this when needed
            const noteText: string = await noteFile.read();

            // Now that we know there are relevant flashcard tags in the file, we can get the more detailed info
            // that includes the line numbers of each tag
            const tagCompleteList: TagCache[] = noteFile.getAllTagsFromText();

            // The following analysis can require fair computation.
            // There is no point doing it if there aren't any topic paths
            [this.frontmatterText, this.contentText] = splitNoteIntoFrontmatterAndContent(noteText);

            // Create the question list
            let textDirection: TextDirection = noteFile.getTextDirection();
            if (textDirection == TextDirection.Unspecified) textDirection = defaultTextDirection;
            this.questionList = this.doCreateQuestionList(
                noteText,
                textDirection,
                folderTopicPath,
                this.tagCacheList,
            );

            // For each question, determine it's TopicPathList
            [this.frontmatterTopicPathList, this.contentTopicPathInfo] =
                this.analyseTagCacheList(tagCompleteList);
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
        textDirection: TextDirection,
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
            const question: Question = this.createQuestionObject(parsedQuestionInfo, textDirection);

            // Each rawCardText can turn into multiple CardFrontBack's (e.g. CardType.Cloze, CardType.SingleLineReversed)
            const cardFrontBackList: CardFrontBack[] = CardFrontBackUtil.expand(
                question.questionType,
                question.questionText.actualQuestion,
                this.settings,
            );

            // And if the card has been reviewed, then scheduling info as well
            let cardScheduleInfoList: RepItemScheduleInfo[] =
                DataStore.getInstance().questionCreateSchedule(
                    question.questionText.original,
                    null,
                );

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
        const settings = this.settings;
        const parserOptions: ParserOptions = {
            singleLineCardSeparator: settings.singleLineCardSeparator,
            singleLineReversedCardSeparator: settings.singleLineReversedCardSeparator,
            multilineCardSeparator: settings.multilineCardSeparator,
            multilineReversedCardSeparator: settings.multilineReversedCardSeparator,
            multilineCardEndMarker: settings.multilineCardEndMarker,
            clozePatterns: settings.clozePatterns,
        };

        // We pass contentText which has the frontmatter blanked out; see extractFrontmatter for reasoning
        return parse(this.contentText, parserOptions);
    }

    private createQuestionObject(
        parsedQuestionInfo: ParsedQuestionInfo,
        textDirection: TextDirection,
    ): Question {
        const questionContext: string[] = this.noteFile.getQuestionContext(
            parsedQuestionInfo.firstLineNum,
        );
        const result = Question.Create(
            this.settings,
            parsedQuestionInfo,
            null, // We haven't worked out the TopicPathList yet
            textDirection,
            questionContext,
        );
        return result;
    }

    private createCardList(
        cardFrontBackList: CardFrontBack[],
        cardScheduleInfoList: RepItemScheduleInfo[],
    ): Card[] {
        const siblings: Card[] = [];

        // One card for each CardFrontBack, regardless if there is scheduled info for it
        for (let i = 0; i < cardFrontBackList.length; i++) {
            const { front, back } = cardFrontBackList[i];

            const hasScheduleInfo: boolean = i < cardScheduleInfoList.length;
            const schedule: RepItemScheduleInfo = cardScheduleInfoList[i];

            const cardObj: Card = new Card({
                front,
                back,
                cardIdx: i,
            });

            cardObj.scheduleInfo = hasScheduleInfo ? schedule : null;

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
        // The tag (e.g. "#flashcards") must be a valid flashcard tag as per the user settings
        this.flashcardTagList = tagCacheList.filter((item) =>
            SettingsUtil.isFlashcardTag(this.settings, item.tag),
        );
        if (this.flashcardTagList.length > 0) {
            // To simplify analysis, sort the flashcard list ordered by line number
            this.flashcardTagList.sort((a, b) => a.position.start.line - b.position.start.line);
        }

        let frontmatterLineCount: number = 0;
        if (this.frontmatterText) {
            frontmatterLineCount = splitTextIntoLineArray(this.frontmatterText).length;
        }

        const frontmatterTopicPathList: TopicPathList = this.determineFrontmatterTopicPathList(
            this.flashcardTagList,
            frontmatterLineCount,
        );
        const contentTopicPathList: TopicPathList[] = this.determineContentTopicPathList(
            this.flashcardTagList,
            frontmatterLineCount,
        );

        return [frontmatterTopicPathList, contentTopicPathList];
    }

    private determineFrontmatterTopicPathList(
        flashcardTagList: TagCache[],
        frontmatterLineCount: number,
    ): TopicPathList {
        let result: TopicPathList = null;

        // Filter for tags that are:
        //      1. specified in the user settings as flashcardTags, and
        //      2. is not question specific (determined by line number) - i.e. is "note level"
        const noteLevelTagList: TagCache[] = flashcardTagList.filter(
            (item) =>
                item.position.start.line == frontmatterTagPseudoLineNum &&
                this.isNoteLevelFlashcardTag(item),
        );
        if (noteLevelTagList.length > 0) {
            // Treat the frontmatter slightly differently (all tags grouped together even if on separate lines)
            if (this.frontmatterText) {
                const frontmatterTagCacheList = noteLevelTagList.filter(
                    (item) => item.position.start.line < frontmatterLineCount,
                );

                if (frontmatterTagCacheList.length > 0)
                    result = this.createTopicPathList(
                        frontmatterTagCacheList,
                        frontmatterTagPseudoLineNum,
                    );
            }
        }
        return result;
    }

    private determineContentTopicPathList(
        flashcardTagList: TagCache[],
        frontmatterLineCount: number,
    ): TopicPathList[] {
        const result: TopicPathList[] = [] as TopicPathList[];

        // NOTE: Line numbers are zero based, therefore don't add 1 to frontmatterLineCount to get contentStartLineNum
        const contentStartLineNum: number = frontmatterLineCount;
        const contentTagCacheList: TagCache[] = flashcardTagList.filter(
            (item) =>
                item.position.start.line >= contentStartLineNum &&
                this.isNoteLevelFlashcardTag(item),
        );

        // We group together all tags that are on the same line, taking advantage of flashcardTagList being ordered by line number
        let list: TagCache[] = [] as TagCache[];
        for (const tag of contentTagCacheList) {
            if (list.length != 0) {
                const startLineNum: number = list[0].position.start.line;
                if (startLineNum != tag.position.start.line) {
                    result.push(this.createTopicPathList(list, startLineNum));
                    list = [] as TagCache[];
                }
            }
            list.push(tag);
        }
        if (list.length > 0) {
            const startLineNum: number = list[0].position.start.line;
            result.push(this.createTopicPathList(list, startLineNum));
        }
        return result;
    }

    private isNoteLevelFlashcardTag(tagItem: TagCache): boolean {
        const tagLineNum: number = tagItem.position.start.line;

        // Check that the tag is not question specific (determined by line number)
        const isQuestionSpecific: boolean = this.questionList.some((q) =>
            q.parsedQuestionInfo.isQuestionLineNum(tagLineNum),
        );
        return !isQuestionSpecific;
    }

    private createTopicPathList(tagCacheList: TagCache[], lineNum: number): TopicPathList {
        const list: TopicPath[] = [] as TopicPath[];
        for (const tagCache of tagCacheList) {
            list.push(TopicPath.getTopicPathFromTag(tagCache.tag));
        }
        return new TopicPathList(list, lineNum);
    }

    private createTopicPathListFromSingleTag(tagCache: TagCache): TopicPathList {
        const list: TopicPath[] = [TopicPath.getTopicPathFromTag(tagCache.tag)];
        return new TopicPathList(list, tagCache.position.start.line);
    }

    // A question can be associated with multiple topics (hence returning TopicPathList and not just TopicPath).
    //
    // If the question has an associated question specific TopicPath, then that is returned.
    //
    // Else the first TopicPathList prior to the question (in the order present in the file) is returned.
    // That could be either the tags within the note's frontmatter, or tags on lines within the note's content.
    private determineQuestionTopicPathList(question: Question): TopicPathList {
        let result: TopicPathList;
        if (this.settings.convertFoldersToDecks) {
            result = new TopicPathList([this.folderTopicPath]);
        } else {
            // If present, the question specific TopicPath takes precedence over everything else
            const questionText: QuestionText = question.questionText;
            if (questionText.topicPathWithWs)
                result = new TopicPathList(
                    [questionText.topicPathWithWs.topicPath],
                    question.parsedQuestionInfo.firstLineNum,
                );
            else {
                // By default we start off with any TopicPathList present in the frontmatter
                result = this.frontmatterTopicPathList;

                // Find the last TopicPathList prior to the question (in the order present in the file)
                for (let i = this.contentTopicPathInfo.length - 1; i >= 0; i--) {
                    const topicPathList: TopicPathList = this.contentTopicPathInfo[i];
                    if (topicPathList.lineNum < question.parsedQuestionInfo.firstLineNum) {
                        result = topicPathList;
                        break;
                    }
                }

                // For backward compatibility with functionality pre https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/495:
                // if nothing matched, then use the first one
                // This could occur if the only topic tags present are question specific
                if (!result && this.flashcardTagList.length > 0) {
                    result = this.createTopicPathListFromSingleTag(this.flashcardTagList[0]);
                }
            }
        }
        return result;
    }
}
