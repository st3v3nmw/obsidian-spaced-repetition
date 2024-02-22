import { ISRFile, YamlValue } from "src/SRFile";
import { IDataStoreAlgorithm } from "./IDataStoreAlgorithm";
import { RepItemScheduleInfo } from "src/algorithms/base/RepItemScheduleInfo";
import { RepItemScheduleInfo_Osr } from "src/algorithms/osr/RepItemScheduleInfo_Osr";
import { Moment } from "moment";
import moment from "moment";
import { SCHEDULING_INFO_REGEX, YAML_FRONT_MATTER_REGEX } from "src/constants";
import { formatDate_YYYY_MM_DD } from "src/util/utils";

// 
// Algorithm: The original OSR algorithm
//      (RZ: Perhaps not the original algorithm, but the only one available in 2023/early 2024)
// 
// Data Store: With data stored in the note's markdown file
// 
export class DataStoreInNote_AlgorithmOsr implements IDataStoreAlgorithm {

    async noteGetSchedule(note: ISRFile): Promise<RepItemScheduleInfo> {
        let result: RepItemScheduleInfo = null;
        const frontmatter: Map<string, YamlValue[]> = note.getFrontmatter();

        if (frontmatter.has("sr-due") && frontmatter.has("sr-interval") && frontmatter.has("sr-ease")) {
            const dueDate: Moment = moment(frontmatter.get("sr-due")[0], ["YYYY-MM-DD", "DD-MM-YYYY", "ddd MMM DD YYYY"]);
            const interval: number = parseFloat(frontmatter.get("sr-interval")[0]);
            const ease: number = parseFloat(frontmatter.get("sr-ease")[0]);

            result = new RepItemScheduleInfo_Osr(dueDate, interval, ease)
        }
        return result;
    }

    async noteSetSchedule(note: ISRFile, repItemScheduleInfo: RepItemScheduleInfo): Promise<void> {
        let fileText: string = await note.read();

        const schedInfo: RepItemScheduleInfo_Osr = repItemScheduleInfo as RepItemScheduleInfo_Osr;
        const dueString: string = formatDate_YYYY_MM_DD(schedInfo.dueDate);
        const interval: number = schedInfo.interval;
        const ease: number = schedInfo.latestEase;

        // check if scheduling info exists
        if (SCHEDULING_INFO_REGEX.test(fileText)) {
            const schedulingInfo = SCHEDULING_INFO_REGEX.exec(fileText);
            fileText = fileText.replace(
                SCHEDULING_INFO_REGEX,
                `---\n${schedulingInfo[1]}sr-due: ${dueString}\n` +
                    `sr-interval: ${interval}\nsr-ease: ${ease}\n` +
                    `${schedulingInfo[5]}---`,
            );
        } else if (YAML_FRONT_MATTER_REGEX.test(fileText)) {
            // new note with existing YAML front matter
            const existingYaml = YAML_FRONT_MATTER_REGEX.exec(fileText);
            fileText = fileText.replace(
                YAML_FRONT_MATTER_REGEX,
                `---\n${existingYaml[1]}sr-due: ${dueString}\n` +
                    `sr-interval: ${interval}\nsr-ease: ${ease}\n---`,
            );
        } else {
            fileText =
                `---\nsr-due: ${dueString}\nsr-interval: ${interval}\n` +
                `sr-ease: ${ease}\n---\n\n${fileText}`;
        }
    }
}