import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { RepItemStorageInfo } from "src/data/data-stores/base/rep-item-storage-info";
import { Question } from "src/data/data-structures/card/questions/question";

export enum DataStoreName {
    NOTES = "NOTES",
    PLUGIN_DATA = "PLUGIN_DATA",
}

export interface IDataStore {
    questionCreateSchedule(
        originalQuestionText: string,
        storageInfo: RepItemStorageInfo,
    ): RepItemScheduleInfo[];
    questionRemoveScheduleInfo(questionText: string): string;
    questionWrite(question: Question): Promise<void>;
    questionWriteSchedule(question: Question): Promise<void>;
    questionDelete(question: Question): Promise<void>;
}

export class DataStore {
    static instance: IDataStore;

    public static getInstance(): IDataStore {
        if (!DataStore.instance) {
            throw new Error("there is no DataStore instance.");
        }
        return DataStore.instance;
    }
}
