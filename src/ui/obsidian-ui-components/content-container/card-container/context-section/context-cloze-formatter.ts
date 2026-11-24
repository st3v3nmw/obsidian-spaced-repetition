import { ClozePattern } from "clozecraft/dist/implementation/ClozePattern";
import { ClozeTypeEnum, ClozeTypesPriority } from "clozecraft/dist/implementation/ClozeTypeEnum";

/** Mask clozes in headings, whose deletions are indexed independently of the card body. */
export function maskContextClozes(context: string, patterns: string[]): string {
    if (patterns.length === 0) return context;

    const matches = patterns.flatMap((rawPattern) => {
        let pattern: ClozePattern;
        try {
            pattern = new ClozePattern(rawPattern);
        } catch {
            return [];
        }
        return ClozeTypesPriority.flatMap((type: ClozeTypeEnum) =>
            Array.from(context.matchAll(pattern.getClozeRegex(type).regex)),
        );
    });
    matches.sort((a, b) => (a.index ?? 0) - (b.index ?? 0) || b[0].length - a[0].length);

    let result = "";
    let end = 0;
    for (const match of matches) {
        const start = match.index ?? 0;
        if (start < end) continue;
        result += context.slice(end, start) + "[...]";
        end = start + match[0].length;
    }
    return result + context.slice(end);
}
