import { ISRFile } from "src/SRFile";
import { IDataStoreAlgorithm } from "./IDataStoreAlgorithm";
import { RepItemScheduleInfo } from "src/algorithms/base/RepItemScheduleInfo";
import { RepItemScheduleInfo_Osr } from "src/algorithms/osr/RepItemScheduleInfo_Osr";

// 
// Algorithm: The original OSR algorithm
//      (RZ: Perhaps not the original algorithm, but the one in use in 2023/early 2024)
// 
// Data Store: With data stored in the note's markdown file
// 
export class DataStoreInNote_AlgorithmOsr implements IDataStoreAlgorithm {
    async noteGetSchedule(note: ISRFile): Promise<RepItemScheduleInfo> {
        let result: RepItemScheduleInfo = null;
        const frontmatter: Map<string, string> = note.getFrontmatter();

        if (frontmatter.has("sr-due") && frontmatter.has("sr-interval") && frontmatter.has("sr-ease")) {
            const dueUnix: number = window
                .moment(frontmatter.get("sr-due"), ["YYYY-MM-DD", "DD-MM-YYYY", "ddd MMM DD YYYY"])
                .valueOf();
            const interval: number = parseFloat(frontmatter.get("sr-interval"));
            const ease: number = parseFloat(frontmatter.get("sr-ease"));

            result = new RepItemScheduleInfo_Osr(dueUnix, interval, ease)
        }
        return result;
    }

    async noteSetSchedule(note: ISRFile, scheduleInfo: RepItemScheduleInfo): Promise<void> {
    }
}