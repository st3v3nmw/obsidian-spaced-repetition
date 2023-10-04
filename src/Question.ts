import { Card } from "./Card";
import { CardScheduleInfo, NoteCardScheduleParser } from "./CardSchedule";
import { SR_HTML_COMMENT_BEGIN, SR_HTML_COMMENT_END } from "./constants";
import { Note } from "./Note";
import { SRSettings } from "./settings";
import { TopicPath } from "./TopicPath";
import { MultiLineTextFinder } from "./util/MultiLineTextFinder";
import { cyrb53 } from "./util/utils";

export enum CardType {
    SingleLineBasic,
    SingleLineReversed,
    MultiLineBasic,
    MultiLineReversed,
    Cloze,
}

//
// QuestionText comprises the following components:
//      1. QuestionTopicPath (optional)
//      2. Actual question text (mandatory)
//      3. Card schedule info as HTML comment (optional)
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
    topicPath: TopicPath;

    // The white space after the topic path, before the actualQuestion
    // We keep this so that when a question is updated, we can retain the original spacing
    postTopicPathWhiteSpace: string;

    // Just the question text, e.g. "Q1::A1"
    actualQuestion: string;

    // Hash of string  (topicPath + actualQuestion)
    // Explicitly excludes the HTML comment with the scheduling info
    textHash: string;

    constructor(
        original: string,
        topicPath: TopicPath,
        postTopicPathWhiteSpace: string,
        actualQuestion: string,
    ) {
        this.original = original;
        this.topicPath = topicPath;
        this.postTopicPathWhiteSpace = postTopicPathWhiteSpace;
        this.actualQuestion = actualQuestion;
        this.textHash = cyrb53(this.formatForNote());
    }

    endsWithCodeBlock(): boolean {
        return this.actualQuestion.endsWith("```");
    }

    static create(original: string, settings: SRSettings): QuestionText {
        const [topicPath, postTopicPathWhiteSpace, actualQuestion] = this.splitText(
            original,
            settings,
        );

        return new QuestionText(original, topicPath, postTopicPathWhiteSpace, actualQuestion);
    }

    static splitText(original: string, settings: SRSettings): [TopicPath, string, string] {
        const strippedSR = NoteCardScheduleParser.removeCardScheduleInfo(original).trim();
        let actualQuestion: string = strippedSR;
        let whiteSpace: string = "";

        let topicPath: TopicPath = TopicPath.emptyPath;
        if (!settings.convertFoldersToDecks) {
            const t = TopicPath.getTopicPathFromCardText(strippedSR);
            if (t?.hasPath) {
                topicPath = t;
                [actualQuestion, whiteSpace] =
                    TopicPath.removeTopicPathFromStartOfCardText(strippedSR);
            }
        }

        return [topicPath, whiteSpace, actualQuestion];
    }

    formatForNote(): string {
        let result: string = "";
        if (this.topicPath.hasPath) {
            result += this.topicPath.formatAsTag();
            result += this.postTopicPathWhiteSpace ?? " ";
        }
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
                : CardScheduleInfo.getDummySchedule(settings);
            result += schedule.formatSchedule();
        }
        result += SR_HTML_COMMENT_END;
        return result;
    }

    formatForNote(settings: SRSettings): string {
        let result: string = this.questionText.formatForNote();
        if (this.cards.some((card) => card.hasSchedule)) {
            result +=
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
        if (questionText.topicPath.hasPath) {
            topicPath = questionText.topicPath;
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
