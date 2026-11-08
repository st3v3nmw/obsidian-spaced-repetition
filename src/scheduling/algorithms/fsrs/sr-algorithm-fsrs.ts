import { State } from "ts-fsrs";

import { SRSettings } from "src/data/settings";
import { Note } from "src/note/note";
import { INoteEaseList } from "src/note/note-ease-list";
import { ISRAlgorithm, SRAlgorithmType } from "src/scheduling/algorithms/base/isr-algorithm";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { reviewResponseToFsrsGrade } from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import {
    createFsrs6Scheduler,
    createFsrs7Scheduler,
    FSRS_SCHEDULER_CARD_ID,
    Fsrs6Scheduler,
    Fsrs7Scheduler,
} from "src/scheduling/algorithms/fsrs/fsrs-schedulers";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoFsrs7 } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs7";
import { OsrNoteGraph } from "src/scheduling/algorithms/osr/osr-note-graph";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { SRAlgorithmOsr } from "src/scheduling/algorithms/osr/srs-algorithm-osr";
import { DueDateHistogram } from "src/scheduling/due-date-histogram";
import { globalDateProvider } from "src/utils/dates";

/**
 * Represents a scheduling algorithm that uses the FSRS algorithm.
 *
 * Which FSRS model schedules a card depends on the card:
 *  - New cards, and cards that were reset (their memory starts over), use FSRS-7.
 *  - SM-2 cards move to FSRS-7 when they are reviewed, keeping their due date.
 *  - Cards that are already on FSRS-6 stay on FSRS-6.
 *
 * @class SrsAlgorithmFsrs
 * @extends {ISRAlgorithm}
 * @property {SRAlgorithmType} algorithmType - The type of scheduling algorithm.
 * @property {SrsAlgorithmOsr} noteDelegate - The note scheduling algorithm.
 * @property {Fsrs6Scheduler} fsrs6 - The FSRS-6 scheduler.
 * @property {Fsrs7Scheduler} fsrs7 - The FSRS-7 scheduler.
 */
export class SrsAlgorithmFsrs implements ISRAlgorithm {
    public readonly algorithmType: SRAlgorithmType = SRAlgorithmType.FSRS;
    private noteDelegate: SRAlgorithmOsr;
    private fsrs6: Fsrs6Scheduler;
    private fsrs7: Fsrs7Scheduler;

    constructor(settings: SRSettings) {
        this.noteDelegate = new SRAlgorithmOsr(settings);
        this.fsrs6 = createFsrs6Scheduler(settings);
        this.fsrs7 = createFsrs7Scheduler(settings);
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

    /**
     * A reset card starts over without any memory, like a new card, so it continues on FSRS-7.
     */
    cardGetResetSchedule(): RepItemScheduleInfo {
        const now = globalDateProvider.now.toDate();
        return RepItemScheduleInfoFsrs7.fromFsrs7Card(
            this.fsrs7.newCard({ cardId: FSRS_SCHEDULER_CARD_ID, now }),
        );
    }

    cardGetNewSchedule(
        response: ReviewResponse,
        _notePath: string,
        _dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        return this.reviewNewCard(response);
    }

    cardCalcUpdatedSchedule(
        response: ReviewResponse,
        schedule: RepItemScheduleInfo,
        _dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        // A card in the "new" state has no memory yet (e.g. it was reset), so it starts on FSRS-7
        if (
            (schedule instanceof RepItemScheduleInfoFsrs7 ||
                schedule instanceof RepItemScheduleInfoFsrs) &&
            schedule.state === State.New
        ) {
            return this.reviewNewCard(response);
        }

        const now = globalDateProvider.now.toDate();
        const grade = reviewResponseToFsrsGrade(response);

        if (schedule instanceof RepItemScheduleInfoFsrs) {
            const { card } = this.fsrs6.review({ card: schedule.toFsrs6Card(), grade, now });
            return RepItemScheduleInfoFsrs.fromFsrs6Card(card);
        }

        const fsrs7Schedule: RepItemScheduleInfoFsrs7 = this.toFsrs7Schedule(schedule);
        const { card } = this.fsrs7.review({ card: fsrs7Schedule.toFsrs7Card(), grade, now });
        return RepItemScheduleInfoFsrs7.fromFsrs7Card(card);
    }

    /**
     * The probability that the card is recalled now, as predicted by the FSRS model of its schedule.
     * It is what FSRS bases its next schedule on when the card is reviewed now.
     *
     * @returns {number | null} - null for SM-2 schedules and new cards, which have no FSRS memory state.
     */
    cardRecallProbability(schedule: RepItemScheduleInfo): number | null {
        const now = globalDateProvider.now.toDate();

        if (schedule instanceof RepItemScheduleInfoFsrs7) {
            if (schedule.state === State.New) return null;
            const card = schedule.toFsrs7Card();
            return this.fsrs7.model.forgettingCurve(
                card,
                this.fsrs7.chrono.difference(card.lastReviewAt, now),
            );
        }
        if (schedule instanceof RepItemScheduleInfoFsrs) {
            if (schedule.state === State.New) return null;
            const card = schedule.toFsrs6Card();
            return this.fsrs6.model.forgettingCurve(
                card,
                this.fsrs6.chrono.difference(card.lastReviewAt, now),
            );
        }
        return null;
    }

    private reviewNewCard(response: ReviewResponse): RepItemScheduleInfoFsrs7 {
        const now = globalDateProvider.now.toDate();
        const { card } = this.fsrs7.review({
            card: this.fsrs7.newCard({ cardId: FSRS_SCHEDULER_CARD_ID, now }),
            grade: reviewResponseToFsrsGrade(response),
            now,
        });
        return RepItemScheduleInfoFsrs7.fromFsrs7Card(card);
    }

    private toFsrs7Schedule(schedule: RepItemScheduleInfo): RepItemScheduleInfoFsrs7 {
        if (schedule instanceof RepItemScheduleInfoFsrs7) {
            return schedule;
        }
        if (schedule instanceof RepItemScheduleInfoOsr) {
            return RepItemScheduleInfoFsrs7.fromSm2Schedule(schedule);
        }
        throw new Error(`Unsupported schedule for FSRS: ${schedule.algorithmType}`);
    }
}
