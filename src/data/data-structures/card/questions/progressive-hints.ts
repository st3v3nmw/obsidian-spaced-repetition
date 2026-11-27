import { t } from "src/lang/helpers";

export interface ProgressiveHint {
    token: string;
    level: number;
    answer: string;
    surfaceHint: string | null;
}

export interface ExtractedProgressiveHints {
    text: string;
    hints: ProgressiveHint[];
    levels: number[];
}

const PROGRESSIVE_HINT_REGEX = /==h([1-9]\d*);;((?:(?!==)[\s\S])+?)==/g;
const TOKEN_PREFIX = "\uE000SR_PROGRESSIVE_HINT_";
const TOKEN_SUFFIX = "\uE001";

/**
 * Extracts progressive hint markers before ClozeCraft parses normal cloze deletions.
 * The private-use tokens are in-memory only and are never written back to the note.
 */
export function extractProgressiveHints(text: string): ExtractedProgressiveHints {
    const hints: ProgressiveHint[] = [];
    const extractedText = text.replace(
        PROGRESSIVE_HINT_REGEX,
        (raw: string, rawLevel: string, body: string) => {
            const fields = body.split(";;");
            if (fields.length > 2 || fields[0].length === 0 || fields[1] === "") {
                return raw;
            }

            const hint: ProgressiveHint = {
                token: `${TOKEN_PREFIX}${hints.length}${TOKEN_SUFFIX}`,
                level: Number.parseInt(rawLevel, 10),
                answer: fields[0],
                surfaceHint: fields.length === 2 ? fields[1] : null,
            };
            hints.push(hint);
            return hint.token;
        },
    );

    return {
        text: extractedText,
        hints,
        levels: [...new Set(hints.map((hint) => hint.level))].sort((a, b) => a - b),
    };
}

/**
 * Replaces extracted hint tokens with either their placeholder or revealed content.
 */
export function renderProgressiveHints(
    text: string,
    hints: ProgressiveHint[],
    revealedThroughLevel: number | null,
): string {
    let result = text;
    for (const hint of hints) {
        const isRevealed = revealedThroughLevel !== null && hint.level <= revealedThroughLevel;
        const content = isRevealed
            ? hint.answer
            : `[${hint.surfaceHint ?? t("PROGRESSIVE_HINT_PLACEHOLDER", { level: hint.level })}]`;
        const color = "var(--color-orange, #f59e0b)";
        result = result.replaceAll(hint.token, `<span style='color:${color}'>${content}</span>`);
    }
    return result;
}
