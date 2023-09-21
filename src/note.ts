import { HeadingCache } from "obsidian";
import { TopicPath } from "./TopicPath";
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
        questionList.forEach((question) => question.note = this);
    }

    appendCardsToDeck(deck: Deck): void {
        for (const question of this.questionList) {
            for (const card of question.cards) {
                deck.appendCard(question.topicPath, card);
            }
        }
    }

    debugLogToConsole(desc: string = "") {
        let str: string = `Note: ${desc}: ${this.questionList.length} questions\r\n`;
        for (let i = 0; i < this.questionList.length; i++) {
            let q: Question = this.questionList[i];
            str += `[${i}]: ${q.questionType}: ${q.lineNo}: ${q.topicPath?.path}: ${q.questionText.original}\r\n`;
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
        this.questionList.forEach((question) => question.hasChanged = false);
    }
}



/* export class NoteUpdator implements INoteUpdator {




    update(): void {
        const dueString: string = due.format("YYYY-MM-DD");

        let fileText: string = await this.app.vault.read(this.currentCard.note);
        const replacementRegex = new RegExp(escapeRegexString(this.currentCard.cardText), "gm");

        let question: Question;
        let currentCard: Card;
        let sep: string = question.getQuestionTextSeparator(this.settings)

        // check if we're adding scheduling information to the flashcard
        // for the first time
        if (currentCard.isNew) {
            this.currentCard.cardText =
                this.currentCard.cardText + sep + `<!--SR:!${dueString},${interval},${ease}-->`;
        } else {
            let scheduling: (RegExpMatchArray | string[])[] = [
                ...this.currentCard.cardText.matchAll(MULTI_SCHEDULING_EXTRACTOR),
            ];
            if (scheduling.length === 0) {
                scheduling = [...this.currentCard.cardText.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];
            }

            const currCardSched: string[] = ["0", dueString, interval.toString(), ease.toString()];
            if (this.currentCard.isDue) {
                scheduling[this.currentCard.siblingIdx] = currCardSched;
            } else {
                scheduling.push(currCardSched);
            }

            this.currentCard.cardText = this.currentCard.cardText.replace(/<!--SR:.+-->/gm, "");
            this.currentCard.cardText += "<!--SR:";
            for (let i = 0; i < scheduling.length; i++) {
                this.currentCard.cardText += `!${scheduling[i][1]},${scheduling[i][2]},${scheduling[i][3]}`;
            }
            this.currentCard.cardText += "-->";
        }

        fileText = fileText.replace(replacementRegex, () => this.currentCard.cardText);
        for (const sibling of this.currentCard.siblings) {
            sibling.cardText = this.currentCard.cardText;
        }
        if (this.plugin.data.settings.burySiblingCards) {
            this.burySiblingCards(true);
        }

        await this.app.vault.modify(this.currentCard.note, fileText);
        this.currentDeck.nextCard(this);
    }
} */