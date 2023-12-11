import { Card } from "./Card";
import { CardScheduleInfo, NoteCardScheduleParser } from "./CardSchedule";
import { OBSIDIAN_TAG_AT_STARTOFLINE_REGEX, SR_HTML_COMMENT_BEGIN, SR_HTML_COMMENT_END } from "./constants";
import { Note } from "./Note";
import { SRSettings } from "./settings";
import { TopicPath, TopicPathWithWs } from "./TopicPath";
import { MultiLineTextFinder } from "./util/MultiLineTextFinder";
import { cyrb53, stringTrimStart } from "./util/utils";

export enum CardType {
    SingleLineBasic,
    SingleLineReversed,
    MultiLineBasic,
    MultiLineReversed,
    Cloze,
}

//
// QuestionText comprises the following components:
//      1. QuestionTopicPath (optional, and if present there may be whitespace before)
// 
//      2. Actual question text (mandatory)
//         
//      3. Card schedule info as HTML comment (optional). If present then there is
//          optional whitespace after the question text, before this.
//          (whitespace always included when text is generated by formatForNote(), would only
//          be missing if manually removed by the user)
// 
// Actual Question - Whitespace Handling
// 
//      It is important that whitespace is maintained accurately by this class.  
//    
//      **Leading Whitespace**
//         
//          It's important to retain the leading whitespace in the case where there is no QuestionTopicPath,
//          as leading whitespace is an indicator in markdown of the indent level.
//          see "[BUG] Problem with nested list item's indentation"
//          https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/800
//         
//          In the case where QuestionTopicPath is present, whitespace pre and post QuestionTopicPath
//          are retained so that if the question is written back to the file, for aesthetic reasons
//          there won't be any change to the whitespace.
//          
//          However, actualQuestion will not have any leading spaces.
//         
//      **Trailing Whitespace**
//         
//         Trailing whitespace is always removed.
//         
//         This is because Question.formatForNote() uses the whitespace generated by Question.getHtmlCommentSeparator()
//         as the separator between the end of the question text and the OSR html comment - 
//         either a single space or a new line (settings based)
//
// For example
//
//  Actual question text only:
//      Q1::A1
//
//  Question text with topic path:
//      #flashcards/science  Q2::A2
//
//  Question text with card schedule info:
//      #flashcards/science  Q2::A2 <!--SR:!2023-10-16,34,290-->
//
export class QuestionText {
    // Complete text including all components, as read from file
    original: string;

    // The question topic path (only present if topic path included in original text)
    // If present, it also includes whitespace before and after the topic path itself
    topicPathWithWs: TopicPathWithWs;

    // The question text, e.g. "Q1::A1" with leading/trailing whitespace as described above
    actualQuestion: string;

    // Hash of string  (topicPath + actualQuestion)
    // Explicitly excludes the HTML comment with the scheduling info
    textHash: string;

    constructor(
        original: string,
        topicPathWithWs: TopicPathWithWs,
        actualQuestion: string,
    ) {
        this.original = original;
        this.topicPathWithWs = topicPathWithWs;
        this.actualQuestion = actualQuestion;
        this.textHash = cyrb53(this.formatForNote());
    }

    endsWithCodeBlock(): boolean {
        return this.actualQuestion.endsWith("```");
    }

    static create(original: string, settings: SRSettings): QuestionText {
        const [topicPathWithWs, actualQuestion] = this.splitText(
            original,
            settings,
        );

        return new QuestionText(original, topicPathWithWs, actualQuestion);
    }

    static splitText(original: string, settings: SRSettings): [TopicPathWithWs, string] {
        const originalWithoutSR = NoteCardScheduleParser.removeCardScheduleInfo(original);
        let actualQuestion: string = originalWithoutSR.trimEnd();

        let topicPathWithWs: TopicPathWithWs = null;
        if (!settings.convertFoldersToDecks) {
            const topicPath = TopicPath.getTopicPathFromCardText(originalWithoutSR);
            if (topicPath?.hasPath) {

                // originalWithoutSR - preTopicPathWs TopicPath postTopicPathWs Question
                // cardText1 - TopicPath postTopicPathWs Question
                const [preTopicPathWs, cardText1] = stringTrimStart(originalWithoutSR);
                const actualQuestionWithWs: string = cardText1.replaceAll(OBSIDIAN_TAG_AT_STARTOFLINE_REGEX, "");
            
                // actualQuestionWithWs - postTopicPathWs Question
                let postTopicPathWs: string;
                [postTopicPathWs, actualQuestion] = stringTrimStart(actualQuestionWithWs);
                topicPathWithWs = new TopicPathWithWs(topicPath, preTopicPathWs, postTopicPathWs);
            }
        }

        return [topicPathWithWs, actualQuestion];
    }

    formatForNote(): string {
        let result: string = "";
        if (this.topicPathWithWs) {
            result += this.topicPathWithWs.formatWithWs();
        }

        // Note that actualQuestion can have leading/trailing spaces
        result += this.actualQuestion;
        return result;
    }
}

export class Question {
    note: Note;
    questionType: CardType;
    topicPath: TopicPath;
    questionText: QuestionText;
    lineNo: number;
    hasEditLaterTag: boolean;
    questionContext: string[];
    cards: Card[];
    hasChanged: boolean;

    constructor(init?: Partial<Question>) {
        Object.assign(this, init);
    }

    getHtmlCommentSeparator(settings: SRSettings): string {
        let sep: string = settings.cardCommentOnSameLine ? " " : "\n";
        // Override separator if last block is a codeblock
        if (this.questionText.endsWithCodeBlock() && sep !== "\n") {
            sep = "\n";
        }
        return sep;
    }

    setCardList(cards: Card[]): void {
        this.cards = cards;
        this.cards.forEach((card) => (card.question = this));
    }

    formatScheduleAsHtmlComment(settings: SRSettings): string {
        let result: string = SR_HTML_COMMENT_BEGIN;

        // We always want the correct schedule format, so we use this if there is no schedule for a card

        for (let i = 0; i < this.cards.length; i++) {
            const card: Card = this.cards[i];
            const schedule: CardScheduleInfo = card.hasSchedule
                ? card.scheduleInfo
                : CardScheduleInfo.getDummyScheduleForNewCard(settings);
            result += schedule.formatSchedule();
        }
        result += SR_HTML_COMMENT_END;
        return result;
    }

    formatForNote(settings: SRSettings): string {
        let result: string = this.questionText.formatForNote();
        if (this.cards.some((card) => card.hasSchedule)) {
            result = result.trimEnd() + 
                this.getHtmlCommentSeparator(settings) + this.formatScheduleAsHtmlComment(settings);
        }
        return result;
    }

    updateQuestionText(noteText: string, settings: SRSettings): string {
        const originalText: string = this.questionText.original;

        // Get the entire text for the question including:
        //      1. the topic path (if present),
        //      2. the question text
        //      3. the schedule HTML comment (if present)
        const replacementText = this.formatForNote(settings);

        let newText = MultiLineTextFinder.findAndReplace(noteText, originalText, replacementText);
        if (newText) {
            this.questionText = QuestionText.create(replacementText, settings);
        } else {
            console.error(
                `updateQuestionText: Text not found: ${originalText.substring(
                    0,
                    100,
                )} in note: ${noteText.substring(0, 100)}`,
            );
            newText = noteText;
        }
        return newText;
    }

    async writeQuestion(settings: SRSettings): Promise<void> {
        const fileText: string = await this.note.file.read();

        const newText: string = this.updateQuestionText(fileText, settings);
        await this.note.file.write(newText);
        this.hasChanged = false;
    }

    static Create(
        settings: SRSettings,
        questionType: CardType,
        noteTopicPath: TopicPath,
        originalText: string,
        lineNo: number,
        context: string[],
    ): Question {
        const hasEditLaterTag = originalText.includes(settings.editLaterTag);
        const questionText: QuestionText = QuestionText.create(originalText, settings);

        let topicPath: TopicPath = noteTopicPath;
        if (questionText.topicPathWithWs) {
            topicPath = questionText.topicPathWithWs.topicPath;
        }

        const result: Question = new Question({
            questionType,
            topicPath,
            questionText,
            lineNo,
            hasEditLaterTag,
            questionContext: context,
            cards: null,
            hasChanged: false,
        });

        return result;
    }
}
