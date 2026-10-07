// Locating LaTeX math in note text.
//
// Inside math, braces belong to LaTeX: `{{...}}` there is never a cloze, and the only cloze syntax
// is the `\cloze{answer}{hint}` macro. These helpers find the math so the parser and the cloze
// expander can treat the two regions differently.
//
// Recognised math:
// - `$$...$$`, which may span lines.
// - `$...$` on a single line, with the pandoc/Obsidian rule: the opening `$` is followed by a
//   non-space, the closing `$` is preceded by a non-space and not followed by a digit. So
//   "costs $5 and $10" is not math.
// - `\$` is a literal dollar, never a delimiter.
// - Nothing inside fenced code blocks (``` or ~~~) or inline code spans is math.
// An unclosed `$$` is not math.

export interface MathSpan {
    start: number; // index of the opening delimiter
    end: number; // index just past the closing delimiter
}

/**
 * Find every math span in `text`.
 *
 * @param text - Note or card text, possibly spanning many lines
 * @returns The spans in order, delimiters included
 */
export function findMathSpans(text: string): MathSpan[] {
    const spans: MathSpan[] = [];
    let fence: string | null = null; // the opening fence run while inside a fenced code block
    let displayStart = -1; // start of an open $$ span, or -1

    let offset = 0;
    for (const line of text.split("\n")) {
        const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
        if (displayStart < 0 && fence !== null) {
            if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length)
                fence = null;
        } else if (displayStart < 0 && fenceMatch) {
            fence = fenceMatch[1];
        } else {
            displayStart = scanLine(line, offset, displayStart, spans);
        }
        offset += line.length + 1;
    }
    return spans;
}

// Scan one line outside fenced code. Returns the start of a display span still open at the end
// of the line (or -1), pushing completed spans.
function scanLine(line: string, offset: number, displayStart: number, spans: MathSpan[]): number {
    let j = 0;
    while (j < line.length) {
        const c = line[j];
        if (displayStart >= 0) {
            if (c === "\\") {
                j += 2;
            } else if (line.startsWith("$$", j)) {
                spans.push({ start: displayStart, end: offset + j + 2 });
                displayStart = -1;
                j += 2;
            } else {
                j++;
            }
            continue;
        }
        if (c === "\\") {
            j += 2;
        } else if (c === "`") {
            let run = 1;
            while (line[j + run] === "`") run++;
            const close = findBacktickRun(line, j + run, run);
            j = close >= 0 ? close + run : j + run;
        } else if (line.startsWith("$$", j)) {
            displayStart = offset + j;
            j += 2;
        } else if (c === "$") {
            const close = findInlineMathClose(line, j);
            if (close >= 0) {
                spans.push({ start: offset + j, end: offset + close + 1 });
                j = close + 1;
            } else {
                j++;
            }
        } else {
            j++;
        }
    }
    return displayStart;
}

// Index of a run of exactly `run` backticks at or after `from`, or -1.
function findBacktickRun(line: string, from: number, run: number): number {
    for (let k = from; k < line.length; k++) {
        if (line[k] !== "`") continue;
        let len = 1;
        while (line[k + len] === "`") len++;
        if (len === run) return k;
        k += len - 1;
    }
    return -1;
}

// For an opening `$` at `open`, the index of the matching closing `$` on the line, or -1.
function findInlineMathClose(line: string, open: number): number {
    const first = line[open + 1];
    if (first === undefined || /\s/.test(first)) return -1;
    for (let k = open + 1; k < line.length; k++) {
        const c = line[k];
        if (c === "\\") {
            k++;
            continue;
        }
        if (c !== "$") continue;
        if (line[k + 1] === "$") return -1; // a `$$` inside: not a well-formed inline span
        if (/\s/.test(line[k - 1]) || /[0-9]/.test(line[k + 1] ?? "")) continue;
        return k;
    }
    return -1;
}

/**
 * Split `text` into its non-math and math parts, both the same length as `text`.
 *
 * In `textOnly` every character inside math is replaced by a space; in `mathOnly` every
 * character outside math is. Newlines are kept in both, so line and column positions still match
 * the original.
 *
 * @param text - The text to split
 * @param spans - Precomputed math spans (defaults to findMathSpans(text))
 * @returns `{ textOnly, mathOnly }`
 */
export function splitMath(
    text: string,
    spans: MathSpan[] = findMathSpans(text),
): { textOnly: string; mathOnly: string } {
    const blank = (s: string) => s.replace(/[^\n]/g, " ");
    let textOnly = "";
    let mathOnly = "";
    let cursor = 0;
    for (const span of spans) {
        const before = text.slice(cursor, span.start);
        const math = text.slice(span.start, span.end);
        textOnly += before + blank(math);
        mathOnly += blank(before) + math;
        cursor = span.end;
    }
    const rest = text.slice(cursor);
    return { textOnly: textOnly + rest, mathOnly: mathOnly + blank(rest) };
}

/**
 * Replace the math in `text` with opaque placeholders, so text-level cloze patterns (`{{...}}`)
 * cannot match LaTeX braces. `restore` puts the original math back into any string derived from
 * the masked text (e.g. a rendered card front).
 *
 * Placeholders are built from Unicode private-use characters, which never occur in notes and
 * contain no characters a cloze pattern could match.
 *
 * @param text - The text to mask
 * @param keep - Matches inside math that stay visible (e.g. math cloze tokens); must be global
 * @returns `{ masked, restore }`
 */
export function maskMath(
    text: string,
    keep?: RegExp,
): { masked: string; restore: (s: string) => string } {
    const spans = findMathSpans(text);
    if (spans.length === 0) return { masked: text, restore: (s) => s };
    const originals: string[] = [];
    const hide = (s: string) => {
        if (s.length === 0) return "";
        originals.push(s);
        return `\uE000${originals.length - 1}\uE001`;
    };
    let masked = "";
    let cursor = 0;
    for (const span of spans) {
        masked += text.slice(cursor, span.start);
        const math = text.slice(span.start, span.end);
        let last = 0;
        for (const m of keep ? math.matchAll(keep) : []) {
            masked += hide(math.slice(last, m.index)) + m[0];
            last = m.index + m[0].length;
        }
        masked += hide(math.slice(last));
        cursor = span.end;
    }
    masked += text.slice(cursor);
    const restore = (s: string) =>
        s.replace(/\uE000(\d+)\uE001/g, (_, k: string) => originals[Number(k)]);
    return { masked, restore };
}
