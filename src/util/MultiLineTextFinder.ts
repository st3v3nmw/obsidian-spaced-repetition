import { literalStringReplace, splitTextIntoLineArray } from "./utils";

export class MultiLineTextFinder {
    static findAndReplace(
        sourceText: string,
        searchText: string,
        replacementText: string,
    ): string | null {
        let result: string = null;
        if (sourceText.includes(searchText)) {
            result = literalStringReplace(sourceText, searchText, replacementText);
        } else {
            const sourceTextArray = splitTextIntoLineArray(sourceText);
            const searchTextArray = splitTextIntoLineArray(searchText);
            const lineNo: number = MultiLineTextFinder.find(sourceTextArray, searchTextArray);
            if (lineNo) {
                const replacementTextArray = splitTextIntoLineArray(replacementText);
                const linesToRemove: number = searchTextArray.length;
                sourceTextArray.splice(lineNo, linesToRemove, ...replacementTextArray);
                result = sourceTextArray.join("\n");
            }
        }
        return result;
    }

    static find(sourceText: string[], searchText: string[]): number | null {
        let result: number = null;
        let searchIdx: number = 0;
        const maxSearchIdx: number = searchText.length - 1;
        for (let sourceIdx = 0; sourceIdx < sourceText.length; sourceIdx++) {
            const sourceLine: string = sourceText[sourceIdx].trim();
            const searchLine: string = searchText[searchIdx].trim();
            if (searchLine == sourceLine) {
                if (searchIdx == maxSearchIdx) {
                    result = sourceIdx - searchIdx;
                    break;
                }
                searchIdx++;
            } else {
                searchIdx = 0;
            }
        }
        return result;
    }
}
