{
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

  const convertHighlightsToClozes = options.hasOwnProperty("convertHighlightsToClozes") ? options.convertHighlightsToClozes : true;
  const convertBoldTextToClozes = options.hasOwnProperty("convertBoldTextToClozes") ? options.convertBoldTextToClozes : true;
  const convertCurlyBracketsToClozes = options.hasOwnProperty("convertCurlyBracketsToClozes") ? options.convertCurlyBracketsToClozes : true;

  const singlelineCardSeparator = options.hasOwnProperty("singlelineCardSeparator") ? options.singlelineCardSeparator : "::";
  const singlelineReversedCardSeparator = options.hasOwnProperty("singlelineReversedCardSeparator") ? options.singlelineReversedCardSeparator : ":::";
  const multilineCardSeparator = options.hasOwnProperty("multilineCardSeparator") ? options.multilineCardSeparator : "?";
  const multilineReversedCardSeparator = options.hasOwnProperty("multilineReversedCardSeparator") ? options.multilineReversedCardSeparator : "??";
  const multilineCardEndMarker = options.hasOwnProperty("multilineCardEndMarker") ? options.multilineCardEndMarker : "";

  // BEGIN HACK

  // The following functions allows parsing the keywords defined by the user. The backbone
  // of the functions defined below has been obtained by nearly copyin and pasting from the
  // automatically generated `peggy.mjs` file.

  function my$generate_end_card_mark(str) {
	const len = str.length;
  	const e = peg$literalExpectation(str, false);
    return () => {
	    var s0;

	    if (input.substr(peg$currPos, len) === str) {
	      s0 = str;
	      peg$currPos += len;
	    } else {
	      s0 = peg$FAILED;
	      if (peg$silentFails === 0) { peg$fail(e); }
	    }

	    return s0;
	  }
  }
  peg$parseend_card_mark = my$generate_end_card_mark(multilineCardEndMarker);

  function my$generate_question_mark_parser(str) {
  	const len = str.length;
  	const e = peg$literalExpectation(str, false);
    return () => {
	    var s0, s1, s2, s3;

	    s0 = peg$currPos;
	    if (input.substr(peg$currPos, len) === str) {
	      s1 = str;
	      peg$currPos += len;
	    } else {
	      s1 = peg$FAILED;
	      if (peg$silentFails === 0) { peg$fail(e); }
	    }
	    if (s1 !== peg$FAILED) {
	      s2 = peg$parse_();
	      s3 = peg$parsenewline();
	      if (s3 !== peg$FAILED) {
	        s1 = [s1, s2, s3];
	        s0 = s1;
	      } else {
	        peg$currPos = s0;
	        s0 = peg$FAILED;
	      }
	    } else {
	      peg$currPos = s0;
	      s0 = peg$FAILED;
	    }

	    return s0;
    }
  }
  peg$parsequestion_mark = my$generate_question_mark_parser(multilineCardSeparator);
  peg$parsedouble_question_mark = my$generate_question_mark_parser(multilineReversedCardSeparator);

  function my$generate_inline_mark_parser(str) {
  	const len = str.length;
  	const e = peg$literalExpectation(str, false);
  	return () => {
	    var s0;

	    if (input.substr(peg$currPos, len) === str) {
	      s0 = str;
	      peg$currPos += len;
	    } else {
	      s0 = peg$FAILED;
	      if (peg$silentFails === 0) { peg$fail(e); }
	    }

	    return s0;
	}
  }
  peg$parseinline_mark = my$generate_inline_mark_parser(singlelineCardSeparator);
  peg$parseinline_rev_mark = my$generate_inline_mark_parser(singlelineReversedCardSeparator);

  // END HACK

  
  function parseOperatorLine(parts, t) {
    return {
      type: t,
      left: parts[0].map((d)=>d[1]).join(''),
      right: parts[2].join(''),
      location: {
        start: location().start.offset,
        end: location().end.offset
      }
    };
  }

  function filterBlocks(b) {
  	return b.filter( (d) => d.cardType === CardType.Ignore ? false : true )
  }
}

main
  = blocks:block* { return filterBlocks(blocks); }

block
  = html_comment / inline_rev_card / inline_card / multiline_rev_card / multiline_card / close_card / loose_line

html_comment
  = $("<!--" (!"-->" (html_comment / .))* "-->" newline?) {
    return createParsedQuestionInfo(CardType.Ignore,"",0,0);
  }

inline_card
  = e:inline newline? { return e; }

inline
  = left:(!inline_mark [^\n\r])+ inline_mark right:not_newline (newline annotation)? {
      return createParsedQuestionInfo(CardType.SingleLineBasic,text(),location().start.line-1,location().end.line-1);
    }

inline_rev_card
  = e:inline_rev newline? { return e; }

inline_rev
  = left:(!inline_rev_mark [^\n\r])+ inline_rev_mark right:not_newline (newline annotation)? {
      return createParsedQuestionInfo(CardType.SingleLineReversed,text(),location().start.line-1,location().end.line-1);
    }

multiline_card
  = c:multiline separator_line {
  	return c;
  }
    
multiline
  = arg1:multiline_before question_mark arg2:multiline_after {
  	return createParsedQuestionInfo(CardType.MultiLineBasic,(arg1+multilineCardSeparator+"\n"+arg2.trim()),location().start.line-1,location().end.line-2);
  }
  
multiline_before
  = $(!question_mark nonempty_text_line)+

multiline_after
  = $(!separator_line (tilde_code / backprime_code / text_line))+

tilde_code
  = $(left:$tilde_marker text_line t:$(!(middle:$tilde_marker  &{ return left.length===middle.length;}) (tilde_code / text_line))* (right:$tilde_marker &{ return left.length===right.length; }) newline)  
  
tilde_marker
  = "~~~" "~"*

backprime_code
  = $(left:$backprime_marker text_line t:$(!(middle:$backprime_marker  &{ return left.length===middle.length;}) (backprime_code / text_line))* (right:$backprime_marker &{ return left.length===right.length; }) newline)  
  
backprime_marker
  = "```" "`"*

multiline_rev_card
  = d:multiline_rev separator_line {
  	return d;
  }
    
multiline_rev
  = arg1:multiline_rev_before double_question_mark arg2:multiline_rev_after {
  	return createParsedQuestionInfo(CardType.MultiLineReversed,(arg1+multilineReversedCardSeparator+"\n"+arg2.trim()),location().start.line-1,location().end.line-2);
  }

multiline_rev_before
  = e:(!double_question_mark nonempty_text_line)+ {
  	  return text();
    }

multiline_rev_after
  = $(!separator_line text_line)+
  
close_card
  = t:$close {
    return createParsedQuestionInfo(CardType.Cloze,t.trim(),location().start.line-1,location().end.line-1);
  }

close
  = $(multiline_before_close? f:close_line e:(multiline_after_close)? e1:(newline annotation)?)

close_line
  = ((!close_text [^\n\r])* close_text) text_line_nonterminated?
  
multiline_before_close
  = (!close_line nonempty_text_line)+

multiline_after_close
  = e:(!(newline separator_line) text_line1)+

close_text
  = close_equal / close_star / close_bracket

close_equal
  = close_mark_equal (!close_mark_equal [^\n\r])+  close_mark_equal

close_mark_equal
  = "==" &{return convertHighlightsToClozes;}
  
close_star
  = close_mark_star (!close_mark_star [^\n\r])+  close_mark_star

close_mark_star
  = "**" &{return convertBoldTextToClozes;}

close_bracket
  = close_mark_bracket_open (!close_mark_bracket_close [^\n\r])+  close_mark_bracket_close

close_mark_bracket_open
  = "{{" &{return convertCurlyBracketsToClozes;}

close_mark_bracket_close
  = "}}"

inline_mark
  = "SINGLELINECARDSEPARATOR"

inline_rev_mark
  = "SINGLELINEREVERSEDCARDSEPARATOR"

question_mark
  = "MULTILINECARDSEPARATOR" _ newline

double_question_mark
  = "MULTILINEREVERSEDCARDSEPARATOR" _ newline

end_card_mark
  = "MULTILINECARDENDMARKER"

separator_line
  = end_card_mark newline
  
text_line_nonterminated
  = t:$[^\n\r]+ {
      return t;
    }

nonempty_text_line
  = t:$[^\n\r]+ newline {
  	  return t;
    }

text_line
  = t:$[^\n\r]* newline {
  	  return t;
    }

text_line1
  = newline @$[^\n\r]*
    
loose_line
  = (([^\n\r]* newline) / [^\n\r]+) {
      return createParsedQuestionInfo(CardType.Ignore,"",0,0);
    }
    
annotation
  = "<!--SR:" (!"-->" .)+ "-->"
    
not_newline
  = [^\n\r]*

newline
  = [\n\r]

empty_line
  = $(_ [\n\r])

empty_lines
  = emptylines:empty_line+

nonemptyspace
  = [^ \f\t\v\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]

emptyspace
  = _

_ = ([ \f\t\v\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff])*
