// The `\cloze[seq]{answer}{hint}` LaTeX macro, with [seq] and {hint} optional. Unlike `{{...}}`,
// this token never occurs in ordinary LaTeX, so there are no false positives, and a MathJax
// command (registered in cloze-math-macro.ts) renders it as the answer in normal preview.
//
// For flashcard review, each macro is replaced by an opaque token that clozecraft parses with an
// extra pattern (MATH_CLOZE_PATTERN), next to the user's own patterns. clozecraft therefore
// decides which deletions are asked, shown or hidden on each card, exactly as for `{{...}}`:
// - `\cloze{a}{h}`        one card per deletion (simple)
// - `\cloze[2]{a}{h}`     a sequence number: deletions with the same number share a card
// - `\cloze[hsa]{a}{h}`   generalized overlapping: a/h/s = ask/hide/show on card 1, 2, 3, ...
// MathClozeFormatter then renders the tokens back as LaTeX, and restoreMathClozes puts the plain
// answer back wherever clozecraft left a deletion unformatted.

import { IClozeFormatter } from "clozecraft";

const CLOZE_COLOR = "#2196f3";
const HIDDEN_COLOR = "gray";

// Private-use characters: they never occur in notes and match none of the user's patterns.
const OPEN = "";
const CLOSE = "";
const SEP = "";
const KEY = "";

/** The clozecraft pattern for math cloze tokens; list it before the user's patterns. */
export const MATH_CLOZE_PATTERN = `${OPEN}[123${SEP}]answer[${SEP}hint]${CLOSE}`;

/** Matches one math cloze token (global, for scanning). */
export const MATH_CLOZE_TOKEN = new RegExp(`${OPEN}[^${CLOSE}]*${CLOSE}`, "g");

export interface MathCloze {
    start: number; // index of the leading backslash
    end: number; // index just past the closing brace of the hint arg
    seq: string | null; // the optional [...] argument: a sequence number or an a/h/s string
    answer: string;
    hint: string;
}

/**
 * Whether `text` contains a `\cloze` macro. Deliberately lenient (the arguments are not checked),
 * since the parser tests single lines and a macro's arguments may continue on the next one.
 *
 * @param text - The text to test (a single line in the parser, or a whole card)
 * @returns True if `\cloze{` or `\cloze[` is present
 */
export function containsMathCloze(text: string): boolean {
    return /\\cloze\s*[[{]/.test(text);
}

/**
 * Replace each `\cloze` macro with a token for MATH_CLOZE_PATTERN.
 *
 * @param text - The card text
 * @returns The tokenized text and the clozes, indexed by the key inside each token
 */
export function tokenizeMathClozes(text: string): { text: string; clozes: MathCloze[] } {
    const clozes = findMathClozes(text);
    let out = "";
    let cursor = 0;
    clozes.forEach((cloze, k) => {
        const seq = cloze.seq === null ? "" : cloze.seq + SEP;
        out += text.slice(cursor, cloze.start) + OPEN + seq + KEY + k + KEY + CLOSE;
        cursor = cloze.end;
    });
    return { text: out + text.slice(cursor), clozes };
}

/**
 * Put the plain answer back for every math cloze that clozecraft left unformatted: deletions not
 * asked on this card, and whole tokens of a type the note does not use (e.g. an unnumbered
 * `\cloze` in a note with sequence numbers).
 *
 * @param text - A rendered card side
 * @param clozes - The clozes returned by tokenizeMathClozes
 * @returns The text with every leftover token or key replaced by its answer
 */
export function restoreMathClozes(text: string, clozes: MathCloze[]): string {
    const token = new RegExp(`${OPEN}[^${CLOSE}]*?${KEY}(\\d+)${KEY}[^${CLOSE}]*${CLOSE}`, "g");
    const key = new RegExp(`${KEY}(\\d+)${KEY}`, "g");
    const restore = (match: string, k: string, offset: number, whole: string) =>
        separated(
            whole.slice(0, offset),
            clozes[Number(k)].answer,
            whole.slice(offset + match.length),
        );
    return text.replace(token, restore).replace(key, restore);
}

/**
 * A cloze's plain answer, ready to stand in for the macro between `before` and `after`.
 *
 * A command name ends at the first non-letter, so a bare answer would run into its neighbours:
 * `\le\cloze{c_0}{}` must become `\le c_0`, not `\lec_0`. A space is added only where a command
 * would otherwise absorb a letter; spaces inside math change nothing else. A cloze right after
 * another is still a token when this one is restored, so it counts as a possible letter.
 */
function separated(before: string, answer: string, after: string): string {
    const endsInCommand = /\\[A-Za-z]+$/;
    const startsWithLetter = /^[A-Za-z]/;
    const startsWithLetterOrToken = new RegExp(`^[A-Za-z${OPEN}${KEY}]`);
    const lead = endsInCommand.test(before) && startsWithLetter.test(answer) ? " " : "";
    const trail = endsInCommand.test(answer) && startsWithLetterOrToken.test(after) ? " " : "";
    return lead + answer + trail;
}

/**
 * Renders math cloze tokens as LaTeX and leaves every other deletion to the wrapped formatter.
 * The color is scoped in braces: MathJax's `\color` is a switch, and unscoped it would recolor the
 * rest of the formula.
 */
export class MathClozeFormatter implements IClozeFormatter {
    private inner: IClozeFormatter;
    private clozes: MathCloze[];

    constructor(inner: IClozeFormatter, clozes: MathCloze[]) {
        this.inner = inner;
        this.clozes = clozes;
    }

    asking(answer?: string, hint?: string): string {
        const cloze = this.lookup(answer);
        if (!cloze) return this.inner.asking(answer, hint);
        return `{\\color{${CLOZE_COLOR}}{${placeholder(cloze)}}}`;
    }

    showingAnswer(answer: string, hint?: string): string {
        const cloze = this.lookup(answer);
        if (!cloze) return this.inner.showingAnswer(answer, hint);
        return `{\\color{${CLOZE_COLOR}}{${cloze.answer}}}`;
    }

    hiding(answer?: string, hint?: string): string {
        const cloze = this.lookup(answer);
        if (!cloze) return this.inner.hiding(answer, hint);
        return `{\\color{${HIDDEN_COLOR}}{${placeholder(cloze)}}}`;
    }

    private lookup(answer?: string): MathCloze | null {
        const m = answer?.match(new RegExp(`^${KEY}(\\d+)${KEY}$`));
        return m ? this.clozes[Number(m[1])] : null;
    }
}

function placeholder(cloze: MathCloze): string {
    const hint = cloze.hint.trim();
    return hint.length ? `[\\text{${hint}}]` : "[\\ldots]";
}

// Locate every `\cloze[seq]{answer}{hint}`, reading the arguments as balanced-brace groups. The
// optional [seq] must be a sequence number or an a/h/s overlapping string; {hint} is optional.
function findMathClozes(text: string): MathCloze[] {
    const result: MathCloze[] = [];
    const cmd = "\\cloze";
    let i = text.indexOf(cmd);
    while (i !== -1) {
        const after = i + cmd.length;
        // Reject `\clozeXYZ` (a TeX command name continues with letters).
        if (/[a-zA-Z]/.test(text[after] ?? "")) {
            i = text.indexOf(cmd, after);
            continue;
        }
        const seq = readSeqArgument(text, after);
        const answer = seq !== undefined && readBraceGroup(text, seq ? seq.end : after);
        // The hint is optional: a brace group right after the answer is the hint (as in TeX,
        // spaces between are skipped); an opening brace that never closes is malformed.
        const hint =
            answer &&
            (nextNonSpace(text, answer.end) === "{"
                ? readBraceGroup(text, answer.end)
                : { content: "", end: answer.end });
        if (answer && hint) {
            result.push({
                start: i,
                end: hint.end,
                seq: seq ? seq.content : null,
                answer: answer.content,
                hint: hint.content,
            });
            i = text.indexOf(cmd, hint.end);
        } else {
            i = text.indexOf(cmd, after);
        }
    }
    return result;
}

// From `pos` (skipping whitespace), read an optional `[seq]` argument. Returns null when there is
// none, the argument when it is valid, and undefined when it is present but malformed.
function readSeqArgument(
    text: string,
    pos: number,
): { content: string; end: number } | null | undefined {
    let p = pos;
    while (p < text.length && /\s/.test(text[p])) p++;
    if (text[p] !== "[") return null;
    const close = text.indexOf("]", p);
    const content = close === -1 ? "" : text.slice(p + 1, close).trim();
    if (!/^(\d+|[ash]+)$/.test(content)) return undefined;
    return { content, end: close + 1 };
}

// The first non-whitespace character at or after `pos` ("" at the end of the text).
function nextNonSpace(text: string, pos: number): string {
    let p = pos;
    while (p < text.length && /\s/.test(text[p])) p++;
    return text[p] ?? "";
}

// From `pos` (skipping whitespace), read a `{ ... }` group with balanced braces, ignoring escaped
// braces (\{ \}). Returns the inner content and the index past the closing brace, or null.
function readBraceGroup(text: string, pos: number): { content: string; end: number } | null {
    let p = pos;
    while (p < text.length && /\s/.test(text[p])) p++;
    if (text[p] !== "{") return null;

    let depth = 0;
    for (let j = p; j < text.length; j++) {
        const ch = text[j];
        if (ch === "\\") {
            j++; // skip the escaped character (\{ \} \\)
            continue;
        }
        if (ch === "{") depth++;
        else if (ch === "}") {
            depth--;
            if (depth === 0) return { content: text.slice(p + 1, j), end: j + 1 };
        }
    }
    return null;
}
