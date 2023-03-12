import { SRSettings } from "./settings";

export function matchClozesWithinCardText(
    cardText: string,
    settings: SRSettings
): RegExpMatchArray[] {
    const siblings: RegExpMatchArray[] = [];
    if (settings.convertHighlightsToClozes) {
        siblings.push(...cardText.matchAll(/==(.*?)==/gm));
    }
    if (settings.convertBoldTextToClozes) {
        siblings.push(...cardText.matchAll(/\*\*(.*?)\*\*/gm));
    }
    if (settings.convertCurlyBracketsToClozes) {
        siblings.push(...cardText.matchAll(/{{(.*?)}}/gm));
    }

    return siblings.sort((a, b) => {
        if (a.index < b.index) {
            return -1;
        }
        if (a.index > b.index) {
            return 1;
        }
        return 0;
    });
}
