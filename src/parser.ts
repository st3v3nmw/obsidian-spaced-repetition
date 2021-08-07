import { CardType } from "src/scheduling";
import { SRSettings } from "src/settings";

export function parse(
    fileText: string,
    settingsObj: SRSettings
): [CardType, string, number][] {
    let cardText: string = "";
    let cards: [CardType, string, number][] = [];
    let cardType: CardType | null = null;
    let startLineNo: number = 0;

    let lines: string[] = fileText.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length === 0) {
            if (cardType) {
                cards.push([cardType, cardText, startLineNo]);
                cardType = null;
            }

            cardText = "";
            continue;
        } else if (
            lines[i].startsWith("<!--") &&
            !lines[i].startsWith("<!--SR:")
        ) {
            while (i + 1 < lines.length && !lines[i + 1].includes("-->")) i++;
            i++;
            continue;
        }

        if (cardText.length > 0) cardText += "\n";
        cardText += lines[i];

        if (
            lines[i].includes(settingsObj.singlelineReversedCardSeparator) ||
            lines[i].includes(settingsObj.singlelineCardSeparator)
        ) {
            cardType = lines[i].includes(
                settingsObj.singlelineReversedCardSeparator
            )
                ? CardType.SingleLineReversed
                : CardType.SingleLineBasic;
            if (i + 1 < lines.length && lines[i + 1].startsWith("<!--SR:")) {
                cardText += "\n" + lines[i + 1];
                i++;
            }
            cards.push([cardType, cardText, i]);
            cardType = null;
            cardText = "";
        } else if (cardType === null && /==.*?==/gm.test(lines[i])) {
            cardType = CardType.Cloze;
            startLineNo = i;
        } else if (lines[i] === settingsObj.multilineCardSeparator) {
            cardType = CardType.MultiLineBasic;
            startLineNo = i;
        } else if (lines[i] === settingsObj.multilineReversedCardSeparator) {
            cardType = CardType.MultiLineReversed;
            startLineNo = i;
        } else if (lines[i].startsWith("```")) {
            while (i + 1 < lines.length && !lines[i + 1].startsWith("```")) {
                i++;
                cardText += "\n" + lines[i];
            }
            cardText += "\n" + "```";
            i++;
        }
    }

    if (cardType && cardText) cards.push([cardType, cardText, startLineNo]);

    return cards;
}
