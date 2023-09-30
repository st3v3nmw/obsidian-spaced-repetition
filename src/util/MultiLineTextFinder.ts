import { splitTextIntoLineArray } from "./utils";

export class MultiLineTextFinder {
    static findAndReplace(
        sourceText: string,
        searchText: string,
        replacementText: string,
    ): string | null {
        let result: string = null;
        if (sourceText.includes(searchText)) {
            result = sourceText.replace(searchText, replacementText);
        } else {
            let sourceTextArray = splitTextIntoLineArray(sourceText);
            let searchTextArray = splitTextIntoLineArray(searchText);
            let lineNo: number = MultiLineTextFinder.find(sourceTextArray, searchTextArray);
            if (lineNo) {
                let replacementTextArray = splitTextIntoLineArray(replacementText);
                let linesToRemove: number = searchTextArray.length;
                sourceTextArray.splice(lineNo, linesToRemove, ...replacementTextArray);
                result = sourceTextArray.join("\n");
            }
        }
        return result;
    }

    static find(sourceText: string[], searchText: string[]): number | null {
        let result: number = null;
        let searchIdx: number = 0;
        let maxSearchIdx: number = searchText.length - 1;
        for (let sourceIdx = 0; sourceIdx < sourceText.length; sourceIdx++) {
            let sourceLine: string = sourceText[sourceIdx].trim();
            let searchLine: string = searchText[searchIdx].trim();
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
