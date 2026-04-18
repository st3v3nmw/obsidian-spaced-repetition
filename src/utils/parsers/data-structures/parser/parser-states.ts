// All the states that the parser can be in, when parsing a note for cards
export type ParserStates =
    | "READY_TO_PARSE"
    | "PARSE_LINE"
    | "EMPTY_LINE"
    | "TEXT"
    | "HTML_COMMENT_START_OR_END"
    | "HTML_COMMENT_MIDDLE"
    | "CODE_BLOCK_START_OR_END"
    | "CODE_BLOCK_MIDDLE"
    | "SR_HTML_COMMENT"
    | "CLOZE"
    | "INLINE_CARD"
    | "MULTILINE_SEPARATOR"
    | "MULTILINE_END_MARKER";
