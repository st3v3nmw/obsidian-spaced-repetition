import { Card } from "./Card";
import { CardScheduleInfo, NoteCardScheduleParser } from "./CardSchedule";
import { SR_HTML_COMMENT_BEGIN, SR_HTML_COMMENT_END } from "./constants";
import { Note } from "./Note";
import { SRSettings } from "./settings";
import { ISRFile } from "./SRFile";
import { TopicPath } from "./TopicPath";
import { cyrb53, escapeRegexString } from "./util/utils";

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

    // Just the question text, e.g. "Q1::A1"
    actualQuestion: string;

    // Hash of string  (topicPath + actualQuestion)
    // Explicitly excludes the HTML comment with the scheduling info
    textHash: string;

    constructor(original: string, topicPath: TopicPath, actualQuestion: string) {
        this.original = original;
        this.topicPath = topicPath;
        this.actualQuestion = actualQuestion;
        this.textHash = cyrb53(this.formatForNote());
    }

    endsWithCodeBlock(): boolean {
        return this.actualQuestion.endsWith("```");
    }

    static Create(original: string, settings: SRSettings): QuestionText {
        let [topicPath, actualQuestion] = this.SplitText(original, settings);

        return new QuestionText(original, topicPath, actualQuestion);
    }

    static SplitText(original: string, settings: SRSettings): [TopicPath, string] {
        let strippedSR = NoteCardScheduleParser.removeCardScheduleInfo(original).trim();
        let actualQuestion: string = strippedSR;

        let topicPath: TopicPath = TopicPath.emptyPath;
        if (!settings.convertFoldersToDecks) {
            const t = TopicPath.getTopicPathFromCardText(strippedSR);
            if (t?.hasPath) {
                topicPath = t;
                actualQuestion = TopicPath.removeTopicPathFromStartOfCardText(strippedSR).trim();
            }
        }

        return [topicPath, actualQuestion];
    }
    formatForNote(): string {
        let result: string = "";
        if (this.topicPath.hasPath) result += `${this.topicPath.formatAsTag()} `;
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
        let defaultSchedule: CardScheduleInfo = CardScheduleInfo.fromDueDateStr(
            "2000-01-01",
            CardScheduleInfo.initialInterval,
            settings.baseEase,
            0,
        );

        for (let i = 0; i < this.cards.length; i++) {
            let card: Card = this.cards[i];
            let schedule: CardScheduleInfo = card.hasSchedule ? card.scheduleInfo : defaultSchedule;
            result += schedule.formatSchedule();
        }
        result += SR_HTML_COMMENT_END;
        return result;
    }

    formatForNote(settings: SRSettings): string {
        let result: string =
            this.questionText.formatForNote() +
            this.getHtmlCommentSeparator(settings) +
            this.formatScheduleAsHtmlComment(settings);
        return result;
    }

    updateQuestionText(noteText: string, settings: SRSettings): string {
        let originalText: string = this.questionText.original;

        let replacementText = this.formatForNote(settings);
        let newText: string = noteText.replace(originalText, replacementText);
        this.questionText = QuestionText.Create(replacementText, settings);
        return newText;
    }

    async writeQuestion(settings: SRSettings): Promise<void> {
        let fileText: string = await this.note.file.read();

        let newText: string = this.updateQuestionText(fileText, settings);
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
        let hasEditLaterTag = originalText.includes(settings.editLaterTag);
        let questionText: QuestionText = QuestionText.Create(originalText, settings);

        let topicPath: TopicPath = noteTopicPath;
        if (questionText.topicPath.hasPath) {
            topicPath = questionText.topicPath;
        }

        let result: Question = new Question({
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
