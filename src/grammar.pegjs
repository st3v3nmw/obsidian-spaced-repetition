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

  function parseMultiLine(arg1, arg2) {
    return {
      type: CardType.MultiLineBasic,
      before: arg1,
      after: arg2,
      location: {
        start: location().start.offset,
        end: location().end.offset
      }
    };
  }

  function parseTextLine(text) {
    return {
      type: 'text',
      value: text.join(''),
      location: {
        start: location().start.offset,
        end: location().end.offset
      }
    };
  }

  function parseEmptyLine(exp) {
    return {
      type: 'text',
      value: exp[0].concat([exp[1]]).join(''),
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
  = inline_rev_card / inline_card / multiline_rev_card / multiline_card / loose_line

inline_card
  = e:inline newline? { return e; }

inline
  = left:(!"::" [^\n\r])+ "::" right:not_newline (newline annotation)? {
  	console.log(text(),">>");
      return createParsedQuestionInfo(CardType.SingleLineBasic,text(),location().start.line-1,location().end.line-1);
    }

inline_rev_card
  = e:inline_rev newline? { return e; }

inline_rev
  = left:(!":::" [^\n\r])+ ":::" right:not_newline (newline annotation)? {
      return createParsedQuestionInfo(CardType.SingleLineReversed,text(),location().start.line-1,location().end.line-1);
    }

multiline_card
  = d:multiline separator_line {
  	return d;
  }
    
multiline
  = arg1:multiline_before question_mark arg2:multiline_after {
  	return createParsedQuestionInfo(CardType.MultiLineBasic,(arg1+"?\n"+arg2.trim()),location().start.line-1,location().end.line-2);
  }
  
multiline_before
  = e:(!question_mark nonempty_text_line)+ {
  	  return text();
    }

multiline_after
  = e:(!separator_line text_line)+ {
      return text();
    } 

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
  = e:(!separator_line text_line)+ {
      return text();
    }

/*
multiline
  = arg1:multiline_before question_mark arg2:multiline_after separator_line {
      return parseMultiLine(arg1, arg2);
    }

multiline_before
  = e:((!empty_line !question_mark .)+ newline)+ {
      return e.map((d) => d[0].map((f)=> f[2]).join('')+d[1]).join('');
    }

multiline_after
  = e:(!separator_line .)+ {
  	  return e.map((d) => d[1]).join('');
    }
*/

question_mark
  = "?" _ newline

double_question_mark
  = "??" _ newline

separator_line
  = "---" newline
  // separator

text_line_nonterminated
  = text:[^\n\r]+ {
      return parseTextLine(text);
    }

nonempty_text_line
  = text:[^\n\r]+ newline {
  	  return parseTextLine(text);
    }

text_line
  = text:[^\n\r]* newline {
  	  return parseTextLine(text);
    }
    
loose_line
  = text:([^\n\r]* newline / [^\n\r]+) {
      return createParsedQuestionInfo(CardType.Ignore,"",0,0);
    }
    
annotation
  = "<!--SR:!" (!"-->" .)+ "-->" {
      return createParsedQuestionInfo(CardType.Ignore,"",0,0);
    }
    
not_newline
  = [^\n\r]*

newline
  = [\n\r]

empty_line
  = exp:(_ [\n\r]) {
      return parseEmptyLine(exp);
    }

empty_lines
  = emptylines:empty_line+

nonemptyspace
  = [^ \f\t\v\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]

emptyspace
  = _

_ = ([ \f\t\v\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff])*
