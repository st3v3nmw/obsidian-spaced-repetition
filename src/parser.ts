import internal from "stream";
import { CardType } from "./Question";
import { parse, SyntaxError } from "./peggy.mjs";

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
 * @param singlelineCardSeparator - Separator for inline basic cards
 * @param singlelineReversedCardSeparator - Separator for inline reversed cards
 * @param multilineCardSeparator - Separator for multiline basic cards
 * @param multilineReversedCardSeparator - Separator for multiline basic card
 * @param multilineCardEndMarker - Marker indicating the end of a multi-line card
 * @returns An array of [CardType, card text, line number] tuples
 */
export function parseEx(
	text: string,
	singlelineCardSeparator: string,
	singlelineReversedCardSeparator: string,
	multilineCardSeparator: string,
	multilineReversedCardSeparator: string,
	multilineCardEndMarker: string,
	convertHighlightsToClozes: boolean,
	convertBoldTextToClozes: boolean,
	convertCurlyBracketsToClozes: boolean,
): ParsedQuestionInfo[] {
	// let cardText = "";
	let cards: ParsedQuestionInfo[] = [];
	// let cardType: CardType | null = null;
	// let firstLineNo = 0;
	// let lastLineNo = 0;
	// let annotation = "";

	// Use this function when you call the parse method
	try {
		cards = parse(text,  {
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
 * @param singlelineCardSeparator - Separator for inline basic cards
 * @param singlelineReversedCardSeparator - Separator for inline reversed cards
 * @param multilineCardSeparator - Separator for multiline basic cards
 * @param multilineReversedCardSeparator - Separator for multiline basic card
 * @param multilineCardEndMarker - Marker indicating the end of a multi-line card
 * @returns An array of [CardType, card text, line number] tuples
 */
export function parseExOld(
	text: string,
	singlelineCardSeparator: string,
	singlelineReversedCardSeparator: string,
	multilineCardSeparator: string,
	multilineReversedCardSeparator: string,
	multilineCardEndMarker: string,
	convertHighlightsToClozes: boolean,
	convertBoldTextToClozes: boolean,
	convertCurlyBracketsToClozes: boolean,
): ParsedQuestionInfo[] {
	let cardText = "";
	const cards: ParsedQuestionInfo[] = [];
	let cardType: CardType | null = null;
	let firstLineNo = 0;
	let lastLineNo = 0;
	let annotation = "";

	const lines: string[] = text.replaceAll("\r\n", "\n").split("\n");
	for (let i = 0; i < lines.length; i++) {
		const currentLine = lines[i];

		// Ignore non-SR comments
		if (currentLine.startsWith("<!--") && !currentLine.startsWith("<!--SR:")) {
			while (i + 1 < lines.length && !lines[i + 1].includes("-->")) i++;
			i++;
			continue;
		}

		// Capture SR annotations
		if (currentLine.startsWith("<!--SR:!")) {
			annotation = currentLine;
			lastLineNo = i;
			continue;
		}

		// Check for end marker for multi-line cards
		if ( cardType && currentLine.trim() === multilineCardEndMarker ) {
			if (annotation) {
				cardText = cardText.trimEnd() + "\n" + annotation;
				annotation = "";
			}
			cards.push(new ParsedQuestionInfo(cardType, cardText.trimEnd(), firstLineNo, lastLineNo-1));
			cardType = null;
			cardText = "";
			continue;
		}

		if(currentLine.length > 0) {
			lastLineNo = i;
		}

		// Concatenate lines for the current card
		if (cardText.length > 0) {
			cardText += "\n";
		} else {
			firstLineNo = i;
		}
		cardText += currentLine;

		// Handle single-line cards
		if (
			currentLine.includes(singlelineReversedCardSeparator) ||
			currentLine.includes(singlelineCardSeparator)
		) {
			cardType = currentLine.includes(singlelineReversedCardSeparator)
				? CardType.SingleLineReversed
				: CardType.SingleLineBasic;
			cardText = currentLine;
			firstLineNo = i;
			if (i + 1 < lines.length && lines[i + 1].startsWith("<!--SR:")) {
				cardText += "\n" + lines[i + 1];
				i++;
			}
			const lastLineNo = i;
			cards.push(new ParsedQuestionInfo(cardType, cardText.trimEnd(), firstLineNo, lastLineNo));
			cardType = null;
			cardText = "";
		} else if (cardType === null && currentLine.trim() === multilineCardSeparator) {
			cardType = CardType.MultiLineBasic;
			// Explicitly don't change firstLineNo, as per above comment
		} else if (cardType === null && currentLine.trim() === multilineReversedCardSeparator) {
			cardType = CardType.MultiLineReversed;
			// Explicitly don't change firstLineNo, as per above comment
		} else if (
			cardType === null &&
			((convertHighlightsToClozes && /==.*?==/gm.test(currentLine)) ||
				(convertBoldTextToClozes && /\*\*.*?\*\*/gm.test(currentLine)) ||
				(convertCurlyBracketsToClozes && /{{.*?}}/gm.test(currentLine)))
		) {
			cardType = CardType.Cloze;

			// Explicitly don't change firstLineNo, as we might not see the cloze markers on the first line
			// of a multi line cloze question. I.e. firstLineNo may be less than i;
		} else if (currentLine.startsWith("```") || currentLine.startsWith("~~~")) {
			const codeBlockClose = currentLine.match(/`+|~+/)[0];
			while (i + 1 < lines.length && !lines[i + 1].startsWith(codeBlockClose)) {
				i++;
				cardText += "\n" + lines[i];
			}
			cardText += "\n" + codeBlockClose;
			i++;
		}
	}

	// Handle the last card if any
	if (cardType && cardText) {
		const lastLineNo = lines.length - 1;
		if (annotation) {
			cardText += "\n" + annotation;
		}
		cards.push(new ParsedQuestionInfo(cardType, cardText.trimEnd(), firstLineNo, lastLineNo));
	}
	console.log(`OLD PARSER: PROCESSED ${cards.length} FLASHCARDS!`);
	console.log(cards);
	return cards;
}
