// generateParser.ts

import { generate, Parser } from "peggy";
import { areParserOptionsEqual, copyParserOptions, debugParser, ParserOptions } from "./parser";

let parser: Parser | null = null;
let oldOptions: ParserOptions;

export function generateParser(options: ParserOptions): Parser {
    let grammar: string | null = null;

    // If the parser did not already exist or if the parser options changed since last the last
    // parser was generated, we generate a new parser. Otherwise, we skip the block to save
    // some execution time.
    if (parser === null || !areParserOptionsEqual(options, oldOptions)) {
        /* GENERATE A NEW PARSER */

        oldOptions = copyParserOptions(options);

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
        if (debugParser) console.log("Parser already existed. No need to generate a new parser.");
    }

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

    return parser;
}

function generateGrammar(options: ParserOptions): string {
    const close_rules_list: string[] = [];

    if (options.convertHighlightsToClozes) close_rules_list.push("close_equal");
    if (options.convertBoldTextToClozes) close_rules_list.push("close_star");
    if (options.convertCurlyBracketsToClozes) close_rules_list.push("close_bracket");

    const close_rules = close_rules_list.join(" / ");

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
  CardType.Ignore=null;
  const createParsedQuestionInfo = options.createParsedQuestionInfo ? options.createParsedQuestionInfo : createParsedQuestionInfoFallBack;

  function filterBlocks(b) {
    return b.filter( (d) => d.cardType === CardType.Ignore ? false : true )
  }
}

main
  = blocks:block* { return filterBlocks(blocks); }

/* The input text to the parser contains arbitrary text, not just card definitions. 
  Hence we fallback to matching on loose_line. The result from loose_line is filtered out by filterBlocks() */  
block
  = html_comment / inline_rev_card / inline_card / multiline_rev_card / multiline_card / close_card / loose_line

html_comment
  = $("<!--" (!"-->" (html_comment / .))* "-->" newline?) {
    return createParsedQuestionInfo(CardType.Ignore,"",0,0);
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
  = left:(!inline_mark non_newline)+ inline_mark right:text_till_newline (newline annotation)? {
    return createParsedQuestionInfo(CardType.SingleLineBasic,text(),location().start.line-1,location().end.line-1);
  }

inline_rev_card
  = e:inline_rev newline? { return e; }

inline_rev
  = left:(!inline_rev_mark non_newline)+ inline_rev_mark right:text_till_newline (newline annotation)? {
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

tilde_code
  = $(
    left:$tilde_marker text_line 
    t:$(!(middle:$tilde_marker  &{ return left.length===middle.length;}) (tilde_code / text_line))* 
    (right:$tilde_marker &{ return left.length===right.length; }) 
    newline
  )  
  
tilde_marker
  = "~~~" "~"*

backprime_code
  = $(
    left:$backprime_marker text_line 
    t:$(!(middle:$backprime_marker  &{ return left.length===middle.length;}) (backprime_code / text_line))* 
    (right:$backprime_marker &{ return left.length===right.length; }) 
    newline
  )  
  
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
  
close_card
  = $(multiline_before_close? close_line (multiline_after_close)? (newline annotation)?) {
    return createParsedQuestionInfo(CardType.Cloze,text().trimEnd(),location().start.line-1,location().end.line-1);
  }

close_line
  = ((!close_text non_newline)* close_text) text_line_nonterminated?
  
multiline_before_close
  = (!close_line nonempty_text_line)+

multiline_after_close
  = e:(!(newline separator_line) text_line1)+

close_text
  = ${close_rules}

close_equal
  = close_mark_equal (!close_mark_equal non_newline)+  close_mark_equal

close_mark_equal
  = "=="
  
close_star
  = close_mark_star (!close_mark_star non_newline)+  close_mark_star

close_mark_star
  = "**"

close_bracket
  = close_mark_bracket_open (!close_mark_bracket_close non_newline)+  close_mark_bracket_close

close_mark_bracket_open
  = "{{"

close_mark_bracket_close
  = "}}"

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
      return createParsedQuestionInfo(CardType.Ignore,"",0,0);
    }

annotation
  = $("<!--SR:" (!"-->" .)+ "-->")
    
nonempty_text_till_newline
  = $non_newline+

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
