import { App, CachedMetadata, HeadingCache, MetadataCache, TFile, Vault } from "obsidian";
import { TopicPath } from "./topic-path";
import { SRSettings } from "./settings";
import { parse } from "./parser";
import { LEGACY_SCHEDULING_EXTRACTOR, MULTI_SCHEDULING_EXTRACTOR, tagInCardRegEx } from "./constants";
import { Deck } from "./deck";
import { Card } from "./card";
import { cyrb53 } from "./utils";
import { Question } from "./question";
export class Note {
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
            var { cardType, rawCardText, lineNo, hasEditLaterTag } = rawCardInfo;

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

    private createCardScheduleInfoList(cardText: string): CardScheduleInfo[] {
        let scheduling: RegExpMatchArray[] = [...cardText.matchAll(MULTI_SCHEDULING_EXTRACTOR)];
        if (scheduling.length === 0)
            scheduling = [...cardText.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];
        
        let result: CardScheduleInfo[] = [];
        for (let i = 0; i < scheduling.length; i++) { 
            let match: RegExpMatchArray = scheduling[i];
            let rawDate = match[1];
            let interval = parseInt(match[2]);
            let ease = parseInt(match[3]);
            let info: CardScheduleInfo = new CardScheduleInfo(rawDate, interval, ease);
            result.push(info);
        }
        return result;
    }

    private createCardFrontBackList(cardType: CardType, cardText: string): CardFrontBack[] { 
        let settings: SRSettings = this.settings;
        const siblingMatches: CardFrontBack[] = [];
        if (cardType === CardType.Cloze) {
            const siblings: RegExpMatchArray[] = [];
            if (settings.convertHighlightsToClozes) {
                siblings.push(...cardText.matchAll(/==(.*?)==/gm));
            }
            if (settings.convertBoldTextToClozes) {
                siblings.push(...cardText.matchAll(/\*\*(.*?)\*\*/gm));
            }
            if (settings.convertCurlyBracketsToClozes) {
                siblings.push(...cardText.matchAll(/{{(.*?)}}/gm));
            }
            siblings.sort((a, b) => {
                if (a.index < b.index) {
                    return -1;
                }
                if (a.index > b.index) {
                    return 1;
                }
                return 0;
            });

            let front: string, back: string;
            for (const m of siblings) {
                const deletionStart: number = m.index,
                    deletionEnd: number = deletionStart + m[0].length;
                front =
                    cardText.substring(0, deletionStart) +
                    "<span style='color:#2196f3'>[...]</span>" +
                    cardText.substring(deletionEnd);
                front = front
                    .replace(/==/gm, "")
                    .replace(/\*\*/gm, "")
                    .replace(/{{/gm, "")
                    .replace(/}}/gm, "");
                back =
                    cardText.substring(0, deletionStart) +
                    "<span style='color:#2196f3'>" +
                    cardText.substring(deletionStart, deletionEnd) +
                    "</span>" +
                    cardText.substring(deletionEnd);
                back = back
                    .replace(/==/gm, "")
                    .replace(/\*\*/gm, "")
                    .replace(/{{/gm, "")
                    .replace(/}}/gm, "");
                siblingMatches.push(new CardFrontBack(front, back));
            }
        } else {
            let idx: number;
            if (cardType === CardType.SingleLineBasic) {
                idx = cardText.indexOf(settings.singleLineCardSeparator);
                siblingMatches.push(new CardFrontBack(
                    cardText.substring(0, idx),
                    cardText.substring(idx + settings.singleLineCardSeparator.length),
                ));
            } else if (cardType === CardType.SingleLineReversed) {
                idx = cardText.indexOf(settings.singleLineReversedCardSeparator);
                const side1: string = cardText.substring(0, idx),
                    side2: string = cardText.substring(
                        idx + settings.singleLineReversedCardSeparator.length,
                    );
                siblingMatches.push(new CardFrontBack(side1, side2));
                siblingMatches.push(new CardFrontBack(side2, side1));
            } else if (cardType === CardType.MultiLineBasic) {
                idx = cardText.indexOf("\n" + settings.multilineCardSeparator + "\n");
                siblingMatches.push(new CardFrontBack(
                    cardText.substring(0, idx),
                    cardText.substring(idx + 2 + settings.multilineCardSeparator.length),
                ));
            } else if (cardType === CardType.MultiLineReversed) {
                idx = cardText.indexOf("\n" + settings.multilineReversedCardSeparator + "\n");
                const side1: string = cardText.substring(0, idx),
                    side2: string = cardText.substring(
                        idx + 2 + settings.multilineReversedCardSeparator.length,
                    );
                    siblingMatches.push(new CardFrontBack(side1, side2));
                    siblingMatches.push(new CardFrontBack(side2, side1));
                }
        }
        return siblingMatches;
    }

    private createCardList(rawCardInfo: Question, cardFrontBackList: CardFrontBack[], cardScheduleInfoList: CardScheduleInfo[]): Card[] { 

        const siblings: Card[] = [];

        // One card for each CardFrontBack, regardless if there is scheduled info for it
        for (let i = 0; i < cardFrontBackList.length; i++) {

            let { front, back } = cardFrontBackList[i];

            const cardObj: Card = {
                isDue: i < cardScheduleInfoList.length,
                note: this.noteFile,
                lineNo: rawCardInfo.lineNo,
                cardTextHash: rawCardInfo.questionTextHash,
                front,
                back,
                cardText: rawCardInfo.rawCardText,
                context: rawCardInfo.context,
                cardType: rawCardInfo.cardType,
                siblingIdx: i,
                siblings,
                editLater: false,
            };
            siblings.push(cardObj);
        }
        return siblings;
    }
}

class CardScheduleInfo { 
    rawDate: string;
    interval: number;
    ease: number;

    constructor(rawDate: string, interval: number, ease: number) { 
        this.rawDate = rawDate;
        this.interval = interval;
        this.ease = ease;
    }

    dueUnix(): number { 
        return window
            .moment(this.rawDate, ["YYYY-MM-DD", "DD-MM-YYYY"])
            .valueOf();
    }
}

class CardFrontBack { 
    front: string;
    back: string;

    constructor(front: string, back: string) { 
        this.front = front.trim();
        this.back = back.trim();
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
