import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { RepItemStorageInfo } from "src/data-stores/base/rep-item-storage-info";

export enum ReviewResponse {
    Easy,
    Good,
    Hard,
    Reset,
}
export enum RepetitionPhase {
    New,
    Review,
}

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
