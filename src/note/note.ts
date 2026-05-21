import { Question } from "src/data/data-structures/card/questions/question";
import { Deck } from "src/data/data-structures/deck/deck";
import { ISRNoteTFile } from "src/data/data-structures/file/note-file";
import { SRSettings } from "src/data/settings";

export class Note {
    file: ISRNoteTFile;
    questionList: Question[];

    get hasChanged(): boolean {
        return this.questionList.some((question) => question.hasChanged);
    }

    get filePath(): string {
        return this.file.path;
    }

    constructor(file: ISRNoteTFile, questionList: Question[]) {
        this.file = file;
        this.questionList = questionList;
        questionList.forEach((question) => (question.note = this));
    }

    appendCardsToDeck(deck: Deck): void {
        for (const question of this.questionList) {
            for (const card of question.cards) {
                deck.appendRepItem(question.topicPathList, card);
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
                fileText = await question.updateQuestionWithinNoteText(fileText, settings);
            }
        }
        await this.file.write(fileText);
        this.questionList.forEach((question) => (question.hasChanged = false));
    }
}
