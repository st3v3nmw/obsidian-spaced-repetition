import { Rating } from "ts-fsrs";
import { FSRS6_DEFAULT_WEIGHTS } from "ts-fsrs/models/fsrs-6";

import { SRSettings } from "src/data/settings";
import { Note } from "src/note/note";
import { INoteEaseList } from "src/note/note-ease-list";
import { ISRAlgorithm, SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import {
    reviewResponseToFsrsGrade,
    sm2ScheduleToFsrsCard,
} from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import {
    Fsrs6Scheduler,
    fsrs6SchedulerDefinition,
} from "src/scheduling/algorithms/fsrs/fsrs-scheduler";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { OsrNoteGraph } from "src/scheduling/algorithms/osr/osr-note-graph";
import { SRAlgorithmOsr } from "src/scheduling/algorithms/osr/srs-algorithm-osr";
import { DueDateHistogram } from "src/scheduling/due-date-histogram";
import { globalDateProvider } from "src/utils/dates";

/**
 * Represents a scheduling algorithm that uses the FSRS algorithm.
 *
 * @class SrsAlgorithmFsrs
 * @extends {ISRAlgorithm}
 * @property {SRAlgorithmType} algorithmType - The type of scheduling algorithm.
 * @property {SrsAlgorithmOsr} noteDelegate - The note scheduling algorithm.
 * @property {Fsrs6Scheduler} scheduler - The FSRS scheduler.
 */
export class SrsAlgorithmFsrs implements ISRAlgorithm {
    public readonly algorithmType: SRAlgorithmType = SRAlgorithmType.FSRS;
    private noteDelegate: SRAlgorithmOsr;
    private scheduler: Fsrs6Scheduler | null = null;

    constructor(private settings: SRSettings) {
        this.noteDelegate = new SRAlgorithmOsr(settings);
        this.getScheduler();
    }

    private getScheduler(): Fsrs6Scheduler {
        const settings = this.settings;
        if (
            this.scheduler &&
            this.scheduler.config.desiredRetention[Rating.Good] === settings.fsrsDesiredRetention &&
            this.scheduler.config.maximumInterval === settings.maximumInterval
        ) {
            return this.scheduler;
        }

        // Existing review sessions keep this algorithm instance when settings change.
        this.scheduler = fsrs6SchedulerDefinition.create({
            config: {
                desiredRetention: settings.fsrsDesiredRetention,
                maximumInterval: settings.maximumInterval,
                weights: FSRS6_DEFAULT_WEIGHTS,
                fractionalDays: false,
                enableShortTerm: true,
                learningSteps: ["1m", "10m"],
                relearningSteps: ["10m"],
                numRelearningSteps: 1,
                clearStatsOnForget: false,
            },
        });
        return this.scheduler;
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
        return RepItemScheduleInfoFsrs.fromFsrsCard(this.getScheduler().newCard({ now }));
    }

    cardGetNewSchedule(
        response: ReviewResponse,
        _notePath: string,
        _dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const now = globalDateProvider.now.toDate();
        const scheduler = this.getScheduler();
        const recordLog = scheduler.review({
            card: scheduler.newCard({ now }),
            now,
            grade: reviewResponseToFsrsGrade(response),
        });
        return RepItemScheduleInfoFsrs.fromFsrsCard(recordLog.card);
    }

    cardCalcUpdatedSchedule(
        response: ReviewResponse,
        schedule: RepItemScheduleInfo,
        _dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const now = globalDateProvider.now;
        const card =
            schedule instanceof RepItemScheduleInfoFsrs
                ? schedule.toFsrsCard()
                : sm2ScheduleToFsrsCard(schedule, now);

        const recordLog = this.getScheduler().review({
            card,
            now: now.toDate(),
            grade: reviewResponseToFsrsGrade(response),
        });
        return RepItemScheduleInfoFsrs.fromFsrsCard(recordLog.card);
    }
}
