import { CardType } from "./Question";

import { Parser } from "peggy";
import { SRSettings } from "./settings";
import { generateParser } from "./generateParser";

let parser: Parser | null = null;

export function setParser(p: Parser): void {
    parser = p;
    // console.log(parser);
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

/**
 * Returns flashcards found in `text`
 *
 * It is best that the text does not contain frontmatter, see extractFrontmatter for reasoning
 *
 * Multi-line question with blank lines user workaround:
 *      As of 3/04/2024 there is no support for including blank lines within multi-line questions
 *      As a workaround, one user uses a zero width Unicode character - U+200B
 *      https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/915#issuecomment-2031003092
 *
 * @param text - The text to extract flashcards from
 * @param settings - Plugin's settings
 * @returns An array of [CardType, card text, line number] tuples
 */
export function parseEx(
	text: string,
	settings: SRSettings,
    force_parser_generation = false
): ParsedQuestionInfo[] {
	// let cardText = "";
	let cards: ParsedQuestionInfo[] = [];

    if(force_parser_generation || parser === null) {
        generateParser(settings);
    }
	
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
