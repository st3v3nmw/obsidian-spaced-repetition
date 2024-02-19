import { Moment } from "moment";
import { RepItemScheduleInfo } from "src/algorithms/base/RepItemScheduleInfo";
import { RepItemStorageInfo } from "src/dataStore/base/RepItemStorageInfo";

export enum ReviewResponse {
    Easy,
    Good,
    Hard,
    Reset,
}
export enum RepetitionPhase { New, Review };

export class RepetitionItem {
    repetitionPhase: RepetitionPhase;

    scheduleInfo: RepItemScheduleInfo;
    storageInfo: RepItemStorageInfo;

    // scheduling
    get hasSchedule(): boolean {
        return this.scheduleInfo != null;
    }

    get isNew(): boolean {
        return !this.hasSchedule;
    }

    get isDue(): boolean {
        return this.hasSchedule && this.scheduleInfo.isDue();
    }
}