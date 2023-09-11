import { App, CachedMetadata, HeadingCache, MetadataCache, TFile, Vault } from "obsidian";
import { TopicPath } from "./TopicPath";
import { SRSettings } from "./settings";
import { parse } from "./parser";
import { LEGACY_SCHEDULING_EXTRACTOR, MULTI_SCHEDULING_EXTRACTOR, OBSIDIAN_TAG_AT_STARTOFLINE_REGEX } from "./constants";
import { Deck } from "./deck";
import { Card } from "./card";
import { cyrb53, escapeRegexString } from "./utils";
import { Question } from "./question";
import { ISRFile } from "./SRFile";

export class Note {
    file: ISRFile;
    questionList: Question[];

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
}






function getCardContext(cardLine: number, headings: HeadingCache[], note_title: string): string {
    const stack: HeadingCache[] = [];
    for (const heading of headings) {
        if (heading.position.start.line > cardLine) {
            break;
        }

        while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
            stack.pop();
        }

        stack.push(heading);
    }

    let context = `${note_title} > `;
    for (const headingObj of stack) {
        headingObj.heading = headingObj.heading.replace(/\[\^\d+\]/gm, "").trim();
        context += `${headingObj.heading} > `;
    }
    return context.slice(0, -3);
}



export interface INoteUpdator {
    modifyQuestionText(noteFile: ISRFile, question: Question, replacementText: string): Promise<void>;
//     modifyQuestion(noteFile: ISRFile, question: Question): Promise<void>;
}

export class NoteUpdator implements INoteUpdator {

    async modifyQuestionText(noteFile: ISRFile, question: Question, replacementText: string): Promise<void> {

        let originalText: string = question.questionTextStrippedSR;
        const originalTextRegex = new RegExp(escapeRegexString(originalText), "gm");

        let fileText: string = await noteFile.read();
        let newText: string = fileText.replace(originalTextRegex, replacementText);
        await noteFile.write(newText);
        question.questionTextStrippedSR = replacementText;
    }

/* 
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
    } */
}