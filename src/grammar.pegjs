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

  const convertHighlightsToClozes = (typeof options.convertHighlightsToClozes !== undefined) ? options.convertHighlightsToClozes : true;
  const convertBoldTextToClozes = (typeof options.convertBoldTextToClozes !== undefined) ? options.convertBoldTextToClozes : true;
  const convertCurlyBracketsToClozes = (typeof options.convertCurlyBracketsToClozes !== undefined) ? options.convertCurlyBracketsToClozes : true;

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
  = left:(!"::" [^\n\r])+ "::" right:not_newline (newline annotation)? {
      return createParsedQuestionInfo(CardType.SingleLineBasic,text(),location().start.line-1,location().end.line-1);
    }

inline_rev_card
  = e:inline_rev newline? { return e; }

inline_rev
  = left:(!":::" [^\n\r])+ ":::" right:not_newline (newline annotation)? {
      return createParsedQuestionInfo(CardType.SingleLineReversed,text(),location().start.line-1,location().end.line-1);
    }

multiline_card
  = c:multiline separator_line {
  	return c;
  }
    
multiline
  = arg1:multiline_before question_mark arg2:multiline_after {
  	return createParsedQuestionInfo(CardType.MultiLineBasic,(arg1+"?\n"+arg2.trim()),location().start.line-1,location().end.line-2);
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
  	return createParsedQuestionInfo(CardType.MultiLineReversed,(arg1+"??\n"+arg2.trim()),location().start.line-1,location().end.line-2);
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

question_mark
  = "?" _ newline

double_question_mark
  = "??" _ newline

separator_line
  = "" newline
  // separator

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
