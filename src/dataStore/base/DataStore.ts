import { RepItemScheduleInfo } from "src/algorithms/base/RepItemScheduleInfo";
import { INoteStore } from "./NoteStore";
import { RepItemStorageInfo } from "./RepItemStorageInfo";
import { Question } from "src/Question";
import { ISRFile } from "src/SRFile";

export interface IDataStore {
    // noteStore: INoteStore;
    questionCreateSchedule(originalQuestionText: string, storageInfo: RepItemStorageInfo): RepItemScheduleInfo[];
    questionRemoveScheduleInfo(questionText: string): string;
    questionWrite(question: Question): Promise<void>;
    questionWriteSchedule(question: Question): Promise<void>;
}

export class DataStore {
    static instance: IDataStore;

    public static getInstance(): IDataStore {
        if (!DataStore.instance) {
            throw Error("there is no DataStore instance.");
        }
        return DataStore.instance;
    }
}
