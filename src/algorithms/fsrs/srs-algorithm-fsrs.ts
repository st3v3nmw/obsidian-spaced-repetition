import { CardInput, createEmptyCard, FSRS, fsrs, State } from "ts-fsrs";

import { ISrsAlgorithm } from "src/algorithms/base/isrs-algorithm";
import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import {
    buildFsrsParameters,
    legacyScheduleToFsrsCard,
    reviewResponseToFsrsGrade,
} from "src/algorithms/fsrs/fsrs-helpers";
import { RepItemScheduleInfoFsrs } from "src/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { OsrNoteGraph } from "src/algorithms/osr/osr-note-graph";
import { SrsAlgorithmOsr } from "src/algorithms/osr/srs-algorithm-osr";
import { DueDateHistogram } from "src/due-date-histogram";
import { Note } from "src/note/note";
import { INoteEaseList } from "src/note/note-ease-list";
import { SRSettings } from "src/settings";
import { globalDateProvider } from "src/utils/dates";

export class SrsAlgorithmFsrs implements ISrsAlgorithm {
    private noteDelegate: SrsAlgorithmOsr;
    private scheduler: FSRS;

    constructor(settings: SRSettings) {
        this.noteDelegate = new SrsAlgorithmOsr(settings);
        this.scheduler = fsrs(buildFsrsParameters(settings));
    }

    noteOnLoadedNote(path: string, note: Note, noteEase: number): void {
        this.noteDelegate.noteOnLoadedNote(path, note, noteEase);
    }

    noteCalcNewSchedule(
        notePath: string,
        osrNoteGraph: OsrNoteGraph,
        response: ReviewResponse,
        dueDateNoteHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        return this.noteDelegate.noteCalcNewSchedule(
            notePath,
            osrNoteGraph,
            response,
            dueDateNoteHistogram,
        );
    }

    noteCalcUpdatedSchedule(
        notePath: string,
        noteSchedule: RepItemScheduleInfo,
        response: ReviewResponse,
        dueDateNoteHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        return this.noteDelegate.noteCalcUpdatedSchedule(
            notePath,
            noteSchedule,
            response,
            dueDateNoteHistogram,
        );
    }

    noteStats(): INoteEaseList {
        return this.noteDelegate.noteStats();
    }

    cardGetResetSchedule(): RepItemScheduleInfo {
        const now = globalDateProvider.now.toDate();
        const emptyCard = createEmptyCard(now);
        emptyCard.state = State.New;
        emptyCard["scheduled_days"] = 0;
        emptyCard["learning_steps"] = 0;
        emptyCard.due = now;
        emptyCard["last_review"] = null;
        return RepItemScheduleInfoFsrs.fromFsrsCard(emptyCard);
    }

    cardGetNewSchedule(
        response: ReviewResponse,
        _notePath: string,
        _dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const now = globalDateProvider.now.toDate();
        const recordLog = this.scheduler.next(
            createEmptyCard(now),
            now,
            reviewResponseToFsrsGrade(response),
        );
        return RepItemScheduleInfoFsrs.fromFsrsCard(recordLog.card);
    }

    cardCalcUpdatedSchedule(
        response: ReviewResponse,
        schedule: RepItemScheduleInfo,
        _dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const now = globalDateProvider.now;
        const card: CardInput =
            schedule instanceof RepItemScheduleInfoFsrs
                ? schedule.toFsrsCardInput(now)
                : legacyScheduleToFsrsCard(schedule, now);

        const recordLog = this.scheduler.next(card, now.toDate(), reviewResponseToFsrsGrade(response));
        return RepItemScheduleInfoFsrs.fromFsrsCard(recordLog.card);
    }
}
