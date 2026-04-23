import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { Question } from "src/card/questions/question";
import { LEGACY_SCHEDULING_EXTRACTOR, MULTI_SCHEDULING_EXTRACTOR } from "src/constants";
import { IDataStore } from "src/data-stores/base/data-store";
import { RepItemStorageInfo } from "src/data-stores/base/rep-item-storage-info";
import { ScheduleDataRepository } from "src/data-stores/plugin-data/schedule-data-repository";
import { SRSettings } from "src/settings";
import { DateUtil, formatDateYYYYMMDD, globalDateProvider } from "src/utils/dates";
import { MultiLineTextFinder } from "src/utils/strings";

export class StoreInPluginData implements IDataStore {
    private settings: SRSettings;
    private scheduleDataRepository: ScheduleDataRepository;

    constructor(settings: SRSettings, scheduleDataRepository: ScheduleDataRepository) {
        this.settings = settings;
        this.scheduleDataRepository = scheduleDataRepository;
    }

    private parseScheduleFromText(originalQuestionText: string): RepItemScheduleInfo[] {
        let scheduling: RegExpMatchArray[] = [
            ...originalQuestionText.matchAll(MULTI_SCHEDULING_EXTRACTOR),
        ];
        if (scheduling.length === 0) {
            scheduling = [...originalQuestionText.matchAll(LEGACY_SCHEDULING_EXTRACTOR)];
        }

        const result: RepItemScheduleInfo[] = [];
        for (let i = 0; i < scheduling.length; i++) {
            const match: RegExpMatchArray = scheduling[i];
            const dueDateStr = match[1];
            const interval = parseInt(match[2]);
            const ease = parseInt(match[3]);
            const dueDate = DateUtil.dateStrToMoment(dueDateStr);
            if (
                dueDate === null ||
                formatDateYYYYMMDD(dueDate) === RepItemScheduleInfoOsr.dummyDueDateForNewCard
            ) {
                result.push(null);
                continue;
            }

            const delayBeforeReviewTicks: number =
                dueDate.valueOf() - globalDateProvider.today.valueOf();
            result.push(
                new RepItemScheduleInfoOsr(dueDate, interval, ease, delayBeforeReviewTicks),
            );
        }

        return result;
    }

    questionCreateSchedule(
        originalQuestionText: string,
        storageInfo: RepItemStorageInfo,
    ): RepItemScheduleInfo[] {
        if (!storageInfo?.questionHash) {
            return this.parseScheduleFromText(originalQuestionText);
        }

        if (!this.scheduleDataRepository.hasCardSchedules(storageInfo.questionHash)) {
            return this.parseScheduleFromText(originalQuestionText);
        }

        return this.scheduleDataRepository.getCardSchedules(storageInfo.questionHash);
    }

    questionRemoveScheduleInfo(questionText: string): string {
        return questionText.replace(/<!--SR:.+-->/gm, "");
    }

    private async persistQuestionSchedule(question: Question): Promise<void> {
        const schedules = question.cards.map((card) =>
            card.hasSchedule ? card.scheduleInfo : null,
        );
        await this.scheduleDataRepository.setCardSchedules(
            question.questionText.textHash,
            schedules,
        );
    }

    async questionWriteSchedule(question: Question): Promise<void> {
        await this.persistQuestionSchedule(question);
        await this.questionWrite(question);
    }

    async questionWrite(question: Question): Promise<void> {
        const fileText: string = await question.note.file.read();
        const newText: string = question.updateQuestionWithinNoteText(fileText, this.settings);
        await question.note.file.write(newText);
        await this.persistQuestionSchedule(question);
        question.hasChanged = false;
    }

    async questionDelete(question: Question): Promise<void> {
        const fileText: string = await question.note.file.read();
        const originalText: string = question.questionText.original;
        const newText = MultiLineTextFinder.findAndReplace(fileText, originalText, "");

        if (newText) {
            await question.note.file.write(newText);
        }

        await this.scheduleDataRepository.deleteCardSchedules(question.questionText.textHash);
    }
}
