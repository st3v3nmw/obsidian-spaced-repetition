import { CardType } from "./Question";

import { Parser } from "peggy";
import { SRSettings } from "./settings";
import { generateParser } from "./generateParser";

let defaultParser: Parser | null = null;

let defaultSettings: SRSettings | null = null;

export function provideSettings(providedSettings: SRSettings): void {
    // we provides the plugin settings as a reference which is stored in the module
    defaultSettings = providedSettings;
}

export class ParsedQuestionInfo {
	cardType: CardType;
	text: string;

	// Line numbers start at 0
	firstLineNum: number;
	lastLineNum: number;

	constructor(cardType: CardType, text: string, firstLineNum: number, lastLineNum: number) {
		this.cardType = cardType;
		this.text = text;
		this.firstLineNum = firstLineNum;
		this.lastLineNum = lastLineNum;
	}

	isQuestionLineNum(lineNum: number): boolean {
		return lineNum >= this.firstLineNum && lineNum <= this.lastLineNum;
	}
}

export function setDefaultParser(parser: Parser): void {
    defaultParser = parser;
}

/**
 * Returns flashcards found in `text`
 *
 * It is best that the text does not contain frontmatter, see extractFrontmatter for reasoning
 *
 * @param text - The text to extract flashcards from
 * @param settings - Plugin's settings
 * @returns An array of [CardType, card text, line number] tuples
 */
export function parseEx(
	text: string,
	parser?: Parser,
): ParsedQuestionInfo[] {
	// let cardText = "";
	let cards: ParsedQuestionInfo[] = [];

    if(parser === undefined) {
        // if parser is not provided explicitly, use the parser configured
        // with the plugin settings provided by the user
        if(defaultParser === null) {
            if(defaultSettings === null) throw Error("Something went wrong. The variable 'defaultSettings' was not initialized yet.");
            defaultParser = generateParser(defaultSettings);
        }
        parser = defaultParser;    
    }

    console.log(text);

    // Use this function when you call the parse method
	try {
		cards = parser.parse(text + "\n\n\n",  {
			CardType,
			createParsedQuestionInfo: (cardType: CardType, text: string, firstLineNum: number, lastLineNum: number) => {
				return new ParsedQuestionInfo(cardType, text, firstLineNum, lastLineNum);
			}
		});
	} catch (error) {
		if (error instanceof SyntaxError) {
			console.error("Syntax error:", error);
		} else {
			console.error("Unexpected error:", error);
		}
	}

	return cards;
}
