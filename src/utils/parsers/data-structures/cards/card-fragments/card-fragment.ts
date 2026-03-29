export type CardFragmentType =
    | "ROUGE_SR_COMMENT"
    | "ROUGE_MULTILINE_SEPARATOR"
    | "ROUGE_HTML_COMMENT_END"
    | "MALFORMED_INLINE_CARD"
    | "MALFORMED_MULTILINE_CARD_WITH_END_MARKER"
    | "MALFORMED_MULTILINE_CARD"
    | "ROUGE_MULTILINE_END_MARKER";

/**
 * A card fragment
 */
export interface CardFragment {
    text: string;
    type: CardFragmentType;
    startLineNum: number;
    endLineNum: number;
}
