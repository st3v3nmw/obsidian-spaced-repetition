import { App, CachedMetadata, HeadingCache, MetadataCache, TFile, Vault } from "obsidian";
import { TopicPath } from "./topic-path";
import { SRSettings } from "./settings";
import { parse } from "./parser";
import { LEGACY_SCHEDULING_EXTRACTOR, MULTI_SCHEDULING_EXTRACTOR, tagInCardRegEx } from "./constants";
import { Deck } from "./deck";
import { Card } from "./card";
import { cyrb53, escapeRegexString } from "./utils";
import { Question } from "./question";
import { ISRFile } from "./SRFile";

export class Note {
    file: ISRFile;
}

export class NoteFileLoader {
    app: App;
    settings: SRSettings;
    fileText: string;
    fileCachedData: CachedMetadata;
    headings: HeadingCache[];
    fixesMade: boolean;
    noteTopicPath: TopicPath;
    noteFile: TFile;

    constructor(app: App, settings: SRSettings) { 
        this.app = app;
        this.settings = settings;
    }

    async Load(noteFile: TFile, noteTopicPath: TopicPath): Promise<Note> { 
        this.noteFile = noteFile;
        this.fileText = await this.app.vault.read(noteFile);
        this.fileCachedData = this.app.metadataCache.getFileCache(noteFile) || {};
        this.headings = this.fileCachedData.headings || [];
        this.fixesMade = false;
            
        const now: number = Date.now();
        
        const rawCardInfoList: Question[] = this.createRawCardInfoList();
        for (const rawCardInfo of rawCardInfoList) {
            var { questionType: cardType, questionTextCleaned: rawCardText, lineNo, hasEditLaterTag } = rawCardInfo;

            // Each rawCardText can turn into multiple CardFrontBack's (e.g. CardType.Cloze, CardType.SingleLineReversed)
            let cardFrontBackList: CardFrontBack[] = this.createCardFrontBackList(cardType, rawCardText);

            // And if the card has been reviewed, then scheduling info as well
            let cardScheduleInfoList: CardScheduleInfo[] = this.createCardScheduleInfoList(rawCardText);

            // we have some extra scheduling dates to delete
            let correctLength = cardFrontBackList.length;
            if (cardScheduleInfoList.length > correctLength) {
                this.fixesMade = true;
                cardScheduleInfoList = cardScheduleInfoList.slice(0, correctLength);
            }


            const siblings: Card[] = [];
            for (let i = 0; i < siblingMatches.length; i++) {
                const front: string = siblingMatches[i][0].trim(),
                    back: string = siblingMatches[i][1].trim();

                const cardObj: Card = {
                    isDue: i < scheduling.length,
                    note,
                    lineNo,
                    front,
                    back,
                    cardText: rawCardText,
                    context,
                    cardType,
                    siblingIdx: i,
                    siblings,
                    editLater: false,
                };

                // card scheduled
                if (ignoreStats) {
                    this.cardStats.newCount++;
                    cardObj.isDue = true;
                    this.deckTree.insertFlashcard([...deckPath], cardObj);
                } else if (i < scheduling.length) {

                    const nDays: number = Math.ceil((dueUnix - now) / (24 * 3600 * 1000));
                    if (!Object.prototype.hasOwnProperty.call(this.dueDatesFlashcards, nDays)) {
                        this.dueDatesFlashcards[nDays] = 0;
                    }
                    this.dueDatesFlashcards[nDays]++;


                    totalNoteEase += ease;
                    scheduledCount++;



                    if (this.data.buryList.includes(cardTextHash)) {
                        this.deckTree.countFlashcard([...deckPath]);
                        continue;
                    }

                    if (dueUnix <= now) {
                        cardObj.interval = interval;
                        cardObj.ease = ease;
                        cardObj.delayBeforeReview = now - dueUnix;
                        deckTree.insertFlashcard([...deckPath], cardObj);
                    } else {
                        deckTree.countFlashcard([...deckPath]);
                        continue;
                    }
                } else {
                    this.cardStats.newCount++;
                    if (this.data.buryList.includes(cyrb53(rawCardText))) {
                        deckTree.countFlashcard([...deckPath]);
                        continue;
                    }
                    this.deckTree.insertFlashcard([...deckPath], cardObj);
                }

                siblings.push(cardObj);
            }
        }

        if (fileChanged) {
            await this.app.vault.modify(note, fileText);
        }

        if (scheduledCount > 0) {
            const flashcardsInNoteAvgEase: number = totalNoteEase / scheduledCount;
            const flashcardContribution: number = Math.min(
                1.0,
                Math.log(scheduledCount + 0.5) / Math.log(64),
            );
            return (
                flashcardsInNoteAvgEase * flashcardContribution +
                settings.baseEase * (1.0 - flashcardContribution)
            );
        }

        return 0;
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
    modifyQuestion(noteFile: ISRFile, question: Question): Promise<void>;
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
}