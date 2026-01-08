import { ISrsAlgorithm } from "src/algorithms/base/isrs-algorithm";
import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { OsrNoteGraph } from "src/algorithms/osr/osr-note-graph";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
// TICKS_PER_DAY not needed for custom intervals
// import { TICKS_PER_DAY } from "src/constants";
import { DueDateHistogram } from "src/due-date-histogram";
import { Note } from "src/note";
import { INoteEaseList } from "src/note-ease-list";
import { SRSettings } from "src/settings";
import { globalDateProvider } from "src/utils/dates";

export class SrsAlgorithmCustom implements ISrsAlgorithm {
    private settings: SRSettings;

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    noteOnLoadedNote(_path: string, _note: Note, _noteEase: number): void {
        // For custom intervals, we don't need to track note ease like SM-2
        // This is a no-op for the custom intervals algorithm
    }

    noteCalcNewSchedule(
        notePath: string,
        osrNoteGraph: OsrNoteGraph,
        response: ReviewResponse,
        _dueDateNoteHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const interval = this.getCustomInterval(response);
        const dueDate = globalDateProvider.today.add(interval, "d");

        return new RepItemScheduleInfoOsr(dueDate, interval, 250); // Use default ease for custom intervals
    }

    noteCalcUpdatedSchedule(
        notePath: string,
        noteSchedule: RepItemScheduleInfo,
        response: ReviewResponse,
        _dueDateNoteHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const interval = this.getCustomInterval(response);
        const dueDate = globalDateProvider.today.add(interval, "d");

        return new RepItemScheduleInfoOsr(dueDate, interval, 250); // Use default ease for custom intervals
    }

    noteStats(): INoteEaseList {
        // Return empty note stats for custom intervals
        return {
            dict: {},
            hasEaseForPath: () => false,
            getEaseByPath: () => 250,
            baseEase: () => 250,
        };
    }

    cardGetResetSchedule(): RepItemScheduleInfo {
        // Reset to new card state
        return null;
    }

    cardGetNewSchedule(
        response: ReviewResponse,
        _notePath: string,
        _dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const interval = this.getCustomInterval(response);
        const dueDate = globalDateProvider.today.add(interval, "d");

        return new RepItemScheduleInfoOsr(dueDate, interval, 250); // Use default ease for custom intervals
    }

    cardCalcUpdatedSchedule(
        response: ReviewResponse,
        _schedule: RepItemScheduleInfo,
        _dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const interval = this.getCustomInterval(response);
        const dueDate = globalDateProvider.today.add(interval, "d");

        return new RepItemScheduleInfoOsr(dueDate, interval, 250); // Use default ease for custom intervals
    }

    private getCustomInterval(response: ReviewResponse): number {
        switch (response) {
            case ReviewResponse.Easy:
                return this.settings.customIntervalEasy;
            case ReviewResponse.Good:
                return this.settings.customIntervalGood;
            case ReviewResponse.Hard:
                return this.settings.customIntervalHard;
            case ReviewResponse.Reset:
                return 0; // Reset means new card
            default:
                return this.settings.customIntervalGood; // Default to Good interval
        }
    }
}
