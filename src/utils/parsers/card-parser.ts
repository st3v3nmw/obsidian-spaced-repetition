import { NotesWithCardFragments } from "src/utils/parsers/data-structures/cards/card-fragments/note-with-card-fragments";
import ParsedCardInfo from "src/utils/parsers/data-structures/parser/parsed-card-info";
import { ParserData } from "src/utils/parsers/data-structures/parser/parser-data";
import ParserOptions from "src/utils/parsers/data-structures/parser/parser-options";
import LineParser from "src/utils/parsers/line-parser";

/**
 * The card parser class
 *
 * This class is responsible for parsing the text of a note for cards.
 * It is a state machine that parses the text line by line and
 * always first determines in which state it should be in based on the current line. Then it parses the line based on the current state.
 *
 * While parsing it also keeps track of any card fragments that it finds in each note along the way, so that they can be handled later.This is done by keeping a list of note paths and a list of rouge card fragments for each note path.
 *
 * It also has an option for verbose debugging, which can be enabled or disabled.
 */
export class CardParser {
    static debugParser = false; // Enable to see the parser state changes
    static notesWithCardFragments: NotesWithCardFragments = new NotesWithCardFragments(); // The list of notes with card fragments from the last parsing of each note

    /**
     * Returns flashcards found in `noteText`
     *
     * It is best that the text does not contain frontmatter, see extractFrontmatter for reasoning
     *
     * @param noteText - The text to extract flashcards from
     * @param ParserOptions - Parser options
     * @returns An array of parsed question information
     */
    static parse(notePath: string, noteText: string, options: ParserOptions): ParsedCardInfo[] {
        if (CardParser.debugParser) {
            console.log("[DEBUG]: Text to parse:\n<<<" + noteText + ">>>");
        }

        // Reset the rouge card fragments for the note, as it will be rebuild while parsing
        CardParser.notesWithCardFragments.resetNote(notePath, noteText);

        // Create a fresh parser data object
        let parserData = new ParserData(options, noteText, notePath);

        // Parse the note line by line
        for (let i = 0; i < parserData.lineData.lines.length; i++) {
            parserData.lineData.setCurrentLine(i);
            parserData.noHTMLCommentsInCurrentLine = false;

            // Set the current parser state to PARSE_LINE
            // which is the initial state, where it determines the next state based on the current line
            parserData.setParserState("PARSE_LINE");

            if (CardParser.debugParser) {
                console.log(
                    "[DEBUG]: Current line: " + parserData.lineData.currentLine,
                    parserData.lineData.currentLineNum,
                );
                console.log("[DEBUG]: Current parser state: " + parserData.currentParserState);
            }

            // Parse the current line based on the current parser data
            parserData = LineParser.parseLine(parserData);
        }

        if (CardParser.debugParser) {
            console.log("[DEBUG]: Parsed cards:\n", parserData.cardData.cards);
        }

        // Return the list of parsed cards
        return parserData.cardData.cards;
    }

    public static setDebugParser(value: boolean) {
        CardParser.debugParser = value;
    }
}

//     // Skip everything in HTML comments
//     if (currentLine.startsWith("<!--") && !currentLine.startsWith("<!--SR:")) {
//         while (i + 1 < lines.length && !currentLine.includes("-->")) i++;
//         i++;
//         continue;
//     }

//     // Have we reached the end of a card?
//     const isEmptyLine = currentTrimmed.length === 0;
//     const hasMultilineCardEndMarker =
//         options.multilineCardEndMarker && !isEmptyLine && currentTrimmed === options.multilineCardEndMarker;

//     if (
//         // We've probably reached the end of a card
//         (isEmptyLine && !options.multilineCardEndMarker) ||
//         // Empty line & we're not picking up any card
//         (isEmptyLine && cardType === null) ||
//         // We've reached the end of a multi line card &
//         //  we're using custom end markers
//         hasMultilineCardEndMarker
//     ) {
//         if (cardType) {
//             // Create a new card
//             lastLineNo = i - 1;
//             if (options.multilineCardEndMarker && (cardType === CardType.MultiLineBasic || cardType === CardType.MultiLineReversed)) {
//                 console.log(cardText);
//             }

//             cards.push(
//                 new ParsedQuestionInfo(cardType, cardText.trimEnd(), firstLineNo, lastLineNo),
//             );
//             cardType = null;
//         }

//         cardText = "";
//         firstLineNo = i + 1;
//         continue;
//     }

//     // Update card text
//     if (cardText.length > 0) {
//         cardText += "\n";
//     }
//     cardText += currentLine.trimEnd();

//     // Pick up inline cards
//     for (const { separator, type } of inlineSeparators) {
//         if (QuestionParser.hasInlineMarker(currentLine, separator)) {
//             cardType = type;
//             break;
//         }
//     }

//     if (cardType === CardType.SingleLineBasic || cardType === CardType.SingleLineReversed) {
//         cardText = currentLine;
//         firstLineNo = i;

//         // Pick up scheduling information if present
//         if (i + 1 < lines.length && lines[i + 1].startsWith("<!--SR:")) {
//             cardText += "\n" + lines[i + 1];
//             i++;
//         }

//         lastLineNo = i;
//         cards.push(new ParsedQuestionInfo(cardType, cardText, firstLineNo, lastLineNo));

//         cardType = null;
//         cardText = "";
//     } else if (currentTrimmed === options.multilineCardSeparator) {
//         // Ignore card if the front of the card is empty
//         if (cardText.length > 1) {
//             // Pick up multiline basic cards
//             cardType = CardType.MultiLineBasic;
//         }
//     } else if (currentTrimmed === options.multilineReversedCardSeparator) {
//         // Ignore card if the front of the card is empty
//         if (cardText.length > 1) {
//             // Pick up multiline basic cards
//             cardType = CardType.MultiLineReversed;
//         }
//     } else if (currentLine.startsWith("```") || currentLine.startsWith("~~~")) {
//         // Pick up codeblocks
//         const codeBlockClose = currentLine.match(/`+|~+/)[0];
//         while (i + 1 < lines.length && !lines[i + 1].startsWith(codeBlockClose)) {
//             i++;
//             cardText += "\n" + lines[i];
//         }
//         cardText += "\n" + codeBlockClose;
//         i++;
//     } else if (cardType === null && clozeCrafter.isClozeNote(currentLine)) {
//         // Pick up cloze cards
//         cardType = CardType.Cloze;
//     }
// }

// // Do we have a card left in the queue?
// if (cardType && cardText) {
//     lastLineNo = lines.length - 1;
//     cards.push(new ParsedQuestionInfo(cardType, cardText.trimEnd(), firstLineNo, lastLineNo));
// }
