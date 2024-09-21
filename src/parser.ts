import { generate, Parser } from "peggy";

import { CardType } from "src/question";

let parser: Parser | null = null;
let oldOptions: ParserOptions;
export let debugParser = false;

export interface ParserOptions {
    singleLineCardSeparator: string;
    singleLineReversedCardSeparator: string;
    multilineCardSeparator: string;
    multilineReversedCardSeparator: string;
    multilineCardEndMarker: string;
    convertHighlightsToClozes: boolean;
    convertBoldTextToClozes: boolean;
    convertCurlyBracketsToClozes: boolean;
}

function areParserOptionsEqual(options1: ParserOptions, options2: ParserOptions): boolean {
    return (
        options1.singleLineCardSeparator === options2.singleLineCardSeparator &&
        options1.singleLineReversedCardSeparator === options2.singleLineReversedCardSeparator &&
        options1.multilineCardSeparator === options2.multilineCardSeparator &&
        options1.multilineReversedCardSeparator === options2.multilineReversedCardSeparator &&
        options1.multilineCardEndMarker === options2.multilineCardEndMarker &&
        options1.convertHighlightsToClozes === options2.convertHighlightsToClozes &&
        options1.convertBoldTextToClozes === options2.convertBoldTextToClozes &&
        options1.convertCurlyBracketsToClozes === options2.convertCurlyBracketsToClozes
    );
}

export function generateParser(options: ParserOptions): Parser {
    let grammar: string | null = null;

    // Debug the grammar before generating the parser `generate(grammar)` from the grammar.
    if (debugParser) {
        if (grammar === null) {
            grammar = generateGrammar(options);
        }
        console.log(
            "The parsers grammar is provided below. You can test it with https://peggyjs.org/online.html.",
        );
        console.log({
            info: "Copy the grammar by right-clicking on the property grammar and copying it as a string. Then, paste it in https://peggyjs.org/online.html.",
            grammar: grammar,
        });
    }

    // If the parser did not already exist or if the parser options changed since last the last
    // parser was generated, we generate a new parser. Otherwise, we skip the block to save
    // some execution time.
    if (parser === null || !areParserOptionsEqual(options, oldOptions)) {
        /* GENERATE A NEW PARSER */

        oldOptions = Object.assign({}, options);

        grammar = generateGrammar(options);

        if (debugParser) {
            const t0 = Date.now();
            parser = generate(grammar);
            const t1 = Date.now();
            console.log("New parser generated in " + (t1 - t0) + " milliseconds.");
        } else {
            parser = generate(grammar);
        }
    } else {
        if (debugParser) {
            console.log("Parser already exists. No need to generate a new parser.");
        }
    }

    return parser;
}

function generateGrammar(options: ParserOptions): string {
    // Contains the grammar for cloze cards
    let clozes_grammar = ""

    // An array contianing the types of cards enabled by the user
    let card_rules_list: string[] = ['html_comment', 'tilde_code', 'backprime_code'];

    // Include reversed inline flashcards rule only if the user provided a non-empty marker for reversed inline flashcards
    if(options.singleLineCardSeparator.trim()!=="") card_rules_list.push('inline_rev_card');

    // Include inline flashcards rule only if the user provided a non-empty marker for inline flashcards
    if(options.singleLineCardSeparator.trim()!=="") card_rules_list.push('inline_card');

    // Include reversed multiline flashcards rule only if the user provided a non-empty marker for reversed multiline flashcards
    if(options.multilineReversedCardSeparator.trim()!=="") card_rules_list.push('multiline_rev_card');

    // Include multiline flashcards rule only if the user provided a non-empty marker for multiline flashcards
    if(options.multilineCardSeparator.trim()!=="") card_rules_list.push('multiline_card');

    const cloze_rules_list: string[] = [];
    if (options.convertHighlightsToClozes) cloze_rules_list.push("cloze_equal");
    if (options.convertBoldTextToClozes) cloze_rules_list.push("cloze_star");
    if (options.convertCurlyBracketsToClozes) cloze_rules_list.push("cloze_bracket");
        
    // Include cloze cards only if the user enabled at least one type of cloze cards
    if(cloze_rules_list.length>0) {
        card_rules_list.push('cloze_card');
        const cloze_rules = cloze_rules_list.join(" / ");
        clozes_grammar = `
cloze_card
= $(multiline_before_cloze? cloze_line (multiline_after_cloze)? (newline annotation)?) {
  return createParsedQuestionInfo(CardType.Cloze,text().trimEnd(),location().start.line-1,location().end.line-1);
}

cloze_line
= ((!cloze_text (inline_code / non_newline))* cloze_text) text_line_nonterminated?

multiline_before_cloze
= (!cloze_line nonempty_text_line)+

multiline_after_cloze
= e:(!(newline separator_line) text_line1)+

cloze_text
= ${cloze_rules}

cloze_equal
= cloze_mark_equal (!cloze_mark_equal non_newline)+  cloze_mark_equal

cloze_mark_equal
= "=="

cloze_star
= cloze_mark_star (!cloze_mark_star non_newline)+  cloze_mark_star

cloze_mark_star
= "**"

cloze_bracket
= cloze_mark_bracket_open (!cloze_mark_bracket_close non_newline)+  cloze_mark_bracket_close

cloze_mark_bracket_open
= "{{"

cloze_mark_bracket_close
= "}}"
` ;
    }

    // Important: we need to include `loose_line` rule to detect any other loose line.
    // Otherwise, we get a syntax error because the parser is likely not able to reach the end
    // of the file, as it may encounter loose lines, which it would not know how to handle.
    card_rules_list.push('loose_line');

    const card_rules = card_rules_list.join(" / ");

    return `{
    // The fallback case is important if we want to test the rules with https://peggyjs.org/online.html
    const CardTypeFallBack = {
      SingleLineBasic: 0,
      SingleLineReversed: 1,
      MultiLineBasic: 2,
      MultiLineReversed: 3,
      Cloze: 4,
    };

    // The fallback case is important if we want to test the rules with https://peggyjs.org/online.html
    const createParsedQuestionInfoFallBack = (cardType, text, firstLineNum, lastLineNum) => {
      return {cardType, text, firstLineNum, lastLineNum};
    };

    const CardType = options.CardType ? options.CardType : CardTypeFallBack;
    const createParsedQuestionInfo = options.createParsedQuestionInfo ? options.createParsedQuestionInfo : createParsedQuestionInfoFallBack;

    function filterBlocks(b) {
      return b.filter( (d) => d !== null )
    }
}

main
= blocks:block* { return filterBlocks(blocks); }

/* The input text to the parser contains arbitrary text, not just card definitions.
Hence we fallback to matching on loose_line. The result from loose_line is filtered out by filterBlocks() */
block
= ${card_rules}

html_comment
= $("<!--" (!"-->" (html_comment / .))* "-->" newline?) {
  return null;
}

/* Obsidian tag definition: https://help.obsidian.md/Editing+and+formatting/Tags#Tag+format */
tag
= $("#" + name:([a-zA-Z/\\-_] { return 1; } / [0-9]{ return 0;})+ &{
  // check if it is a valid Obsidian tag - (Tags must contain at least one non-numerical character)
  return name.includes(1);
})

inline_card
= e:inline newline? { return e; }

inline
= $(left:(!inline_mark (inline_code / non_newline))+ inline_mark right:text_till_newline (newline annotation)?) {
  return createParsedQuestionInfo(CardType.SingleLineBasic,text(),location().start.line-1,location().end.line-1);
}

inline_rev_card
= e:inline_rev newline? { return e; }

inline_rev
= left:(!inline_rev_mark (inline_code / non_newline))+ inline_rev_mark right:text_till_newline (newline annotation)? {
    return createParsedQuestionInfo(CardType.SingleLineReversed,text(),location().start.line-1,location().end.line-1);
}

multiline_card
= c:multiline separator_line {
  return c;
}

multiline
= arg1:multiline_before multiline_mark arg2:multiline_after {
  return createParsedQuestionInfo(CardType.MultiLineBasic,(arg1+"${options.multilineCardSeparator}\\n"+arg2.trimEnd()),location().start.line-1,location().end.line-2);
}

multiline_before
= $(!multiline_mark nonempty_text_line)+

multiline_after
= $(!separator_line (tilde_code / backprime_code / text_line))+

inline_code
= $("\`" (!"\`" .)* "\`")

tilde_code
= $(
  " "* left:$tilde_marker text_line
  (!(middle:$tilde_marker &{ return left.length===middle.length;}) (tilde_code / text_line))*
  (right:$tilde_marker &{ return left.length===right.length; })
  newline
) { return null; }

tilde_marker
= "~~~" "~"*

backprime_code
= $(
  " "* left:$backprime_marker text_line
  (!(middle:$backprime_marker  &{ return left.length===middle.length;}) (backprime_code / text_line))*
  (right:$backprime_marker &{ return left.length===right.length; })
  newline
) { return null; }

backprime_marker
= "\`\`\`" "\`"*

multiline_rev_card
= @multiline_rev separator_line

multiline_rev
= arg1:multiline_rev_before multiline_rev_mark arg2:multiline_rev_after {
  return createParsedQuestionInfo(CardType.MultiLineReversed,(arg1+"${options.multilineReversedCardSeparator}\\n"+arg2.trimEnd()),location().start.line-1,location().end.line-2);
}

multiline_rev_before
= $(!multiline_rev_mark nonempty_text_line)+

multiline_rev_after
= $(!separator_line text_line)+

${clozes_grammar}

inline_mark
= "${options.singleLineCardSeparator}"

inline_rev_mark
= "${options.singleLineReversedCardSeparator}"

multiline_mark
= optional_whitespaces "${options.multilineCardSeparator}" optional_whitespaces newline

multiline_rev_mark
= optional_whitespaces "${options.multilineReversedCardSeparator}" optional_whitespaces newline

end_card_mark
= "${options.multilineCardEndMarker}"

separator_line
= end_card_mark optional_whitespaces newline

text_line_nonterminated
= $nonempty_text_till_newline

nonempty_text_line
= nonempty_text_till_newline newline

text_line
= @$text_till_newline newline

// very likely, it is possible to homogeneize/modify the rules to use only either 'text_line1' or 'text_line'
text_line1
= newline @$text_till_newline

loose_line
= $((text_till_newline newline) / nonempty_text_till_newline) {
    return null;
  }

annotation
= $("<!--SR:" (!"-->" .)+ "-->")

nonempty_text_till_newline
= $(inline_code / non_newline)+

text_till_newline
= $non_newline*

non_newline
= [^\\n]

newline
= $[\\n]

empty_line
= $(whitespace_char* [\\n])

nonemptyspace
= [^ \\f\\t\\v\\u0020\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]

optional_whitespaces
= whitespace_char*

whitespace_char = ([ \\f\\t\\v\\u0020\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff])
`;
}

export function setDebugParser(value: boolean) {
    debugParser = value;
}

export class ParsedQuestionInfo {
    cardType: CardType;
    text: string;

    // Line numbers start at 0
    firstLineNum: number;
    lastLineNum: number;

    constructor(cardType: CardType, text: string, firstLineNum: number, lastLineNum: number) {
        this.cardType = cardType;
        this.text = text; // text.replace(/\s*$/gm, ""); // reproduce the same old behavior as when adding new lines with trimEnd. It is not clear why we need it in real life. However, it is needed to pass the tests.
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
 * EXCEPTIONS: The underlying peggy parser can throw an exception if the input it receives does
 * not conform to the grammar it was built with. However, the grammar used in generating this
 * parser, see generateParser(), intentionally matches all input text and therefore
 * this function should not throw an exception.
 *
 * @param text - The text to extract flashcards from
 * @param options - Plugin's settings
 * @returns An array of [CardType, card text, line number] tuples
 */
export function parseEx(text: string, options: ParserOptions): ParsedQuestionInfo[] {
    if (debugParser) {
        console.log("Text to parse:\n<<<" + text + ">>>");
    }

    let cards: ParsedQuestionInfo[] = [];
    try {
        if (!options) throw new Error("No parser options provided.");

        const parser: Parser = generateParser(options);

        // Use this function when you call the parse method
        //
        // The few extra lines empty lines appended to the end of the text "\n\n\n"
        // is a trick to avoid unnecessarily complex grammar rules for the parer,
        // which differen between the case when the last line ends with "\n" or not.
        //
        // Prusamably a single "\n" would be sufficient, but a few more do not bother.
        cards = parser.parse(text + "\n\n\n", {
            CardType,
            createParsedQuestionInfo: (
                cardType: CardType,
                text: string,
                firstLineNum: number,
                lastLineNum: number,
            ) => {
                return new ParsedQuestionInfo(cardType, text, firstLineNum, lastLineNum);
            },
        });
    } catch (error) {
        console.error("Unexpected error:", error);
    }

    if (debugParser) {
        console.log("Parsed cards:\n", cards);
    }

    return cards;
}
