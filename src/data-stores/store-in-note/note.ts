import { Moment } from "moment";
import { App } from "obsidian";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { RepItemScheduleInfo_Osr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { LEGACY_SCHEDULING_EXTRACTOR, MULTI_SCHEDULING_EXTRACTOR } from "src/constants";
import { IDataStore } from "src/data-stores/base/data-store";
import { RepItemStorageInfo } from "src/data-stores/base/rep-item-storage-info";
import { NoteEaseList } from "src/note-ease-list";
import { Question } from "src/question";
import { SRSettings } from "src/settings";
import { DateUtil, globalDateProvider } from "src/utils/date-provider";
import { formatDate_YYYY_MM_DD } from "src/utils/utils";

export class StoreInNote implements IDataStore {
    private settings: SRSettings;
    app: App;
    easeByPath: NoteEaseList;

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    questionCreateSchedule(
        originalQuestionText: string,
        _: RepItemStorageInfo,
    ): RepItemScheduleInfo[] {
        let scheduling: RegExpMatchArray[] = [
            ...originalQuestionText.matchAll(MULTI_SCHEDULING_EXTRACTOR),
        ];
        if (scheduling.length === 0)
            scheduling = [...originalQuestionText.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];

        const result: RepItemScheduleInfo[] = [];
        for (let i = 0; i < scheduling.length; i++) {
            const match: RegExpMatchArray = scheduling[i];
            const dueDateStr = match[1];
            const interval = parseInt(match[2]);
            const ease = parseInt(match[3]);
            const dueDate: Moment = DateUtil.dateStrToMoment(dueDateStr);
            let info: RepItemScheduleInfo;
            if (
                dueDate == null ||
                formatDate_YYYY_MM_DD(dueDate) == RepItemScheduleInfo_Osr.dummyDueDateForNewCard
            ) {
                info = null;
            } else {
                const delayBeforeReviewTicks: number =
                    dueDate.valueOf() - globalDateProvider.today.valueOf();

                info = new RepItemScheduleInfo_Osr(dueDate, interval, ease, delayBeforeReviewTicks);
            }
            result.push(info);
        }
        return result;
    }

    questionRemoveScheduleInfo(questionText: string): string {
        return questionText.replace(/<!--SR:.+-->/gm, "");
    }

    async questionWriteSchedule(question: Question): Promise<void> {
        await this.questionWrite(question);
    }

    async questionWrite(question: Question): Promise<void> {
        const fileText: string = await question.note.file.read();

        const newText: string = question.updateQuestionWithinNoteText(fileText, this.settings);
        await question.note.file.write(newText);
        question.hasChanged = false;
    }
}
