import { SRSettings } from "./settings";
import { Deck } from "./Deck";
import { Question } from "./Question";
import { ISRFile } from "./SRFile";

export class Note {
    file: ISRFile;
    questionList: Question[];

    get hasChanged(): boolean {
        return this.questionList.some((question) => question.hasChanged);
    }

    get filePath(): string {
        return this.file.path;
    }

    constructor(file: ISRFile, questionList: Question[]) {
        this.file = file;
        this.questionList = questionList;
        questionList.forEach((question) => (question.note = this));
    }

    appendCardsToDeck(deck: Deck): void {
        for (const question of this.questionList) {
            for (const card of question.cards) {
                deck.appendCard(question.topicPathList, card);
            }
        }
    }

    debugLogToConsole(desc: string = "") {
        let str: string = `Note: ${desc}: ${this.questionList.length} questions\r\n`;
        for (let i = 0; i < this.questionList.length; i++) {
            const q: Question = this.questionList[i];
            str += `[${i}]: ${q.questionType}: ${q.lineNo}: ${q.topicPathList?.format("|")}: ${
                q.questionText.original
            }\r\n`;
        }
        console.debug(str);
    }

    async writeNoteFile(settings: SRSettings): Promise<void> {
        let fileText: string = await this.file.read();
        for (const question of this.questionList) {
            if (question.hasChanged) {
                fileText = question.updateQuestionText(fileText, settings);
            }
        }
        await this.file.write(fileText);
        this.questionList.forEach((question) => (question.hasChanged = false));
    }
}
