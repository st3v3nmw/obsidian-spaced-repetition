import moment, { Moment } from "moment";

import { ISRAlgorithm, SRAlgorithmType } from "src/algorithms/base/isr-algorithm";
import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { ReviewResponse } from "src/algorithms/base/repetition-item";
import { osrSchedule } from "src/algorithms/osr/note-scheduling";
import { NoteLinkStat, OsrNoteGraph } from "src/algorithms/osr/osr-note-graph";
import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { Question } from "src/data/data-structures/card/questions/question";
import { SRSettings } from "src/data/settings";
import { DueDateHistogram } from "src/due-date-histogram";
import { Note } from "src/note/note";
import { INoteEaseList, NoteEaseList } from "src/note/note-ease-list";
import { globalDateProvider } from "src/utils/dates";

/**
 * Represents a scheduling algorithm that uses the OSR algorithm.
 *
 * @class SrsAlgorithmOsr
 * @extends {ISRAlgorithm}
 * @property {SRAlgorithmType} algorithmType - The type of scheduling algorithm.
 * @property {SRSettings} settings - The settings object.
 * @property {INoteEaseList} noteEaseList - The note ease list.
 */
export class SRAlgorithmOsr implements ISRAlgorithm {
    public readonly algorithmType: SRAlgorithmType = SRAlgorithmType.SM_2_OSR;
    private settings: SRSettings;
    private noteEaseList: INoteEaseList;

    constructor(settings: SRSettings) {
        this.settings = settings;
        this.noteEaseList = new NoteEaseList(settings);
    }

    static get initialInterval(): number {
        return 1.0;
    }

    /**
     * Calculates the new schedule for a note.
     *
     * @param {string} notePath - The note path.
     * @param {OsrNoteGraph} osrNoteGraph - The OSR note graph.
     * @param {ReviewResponse} response - The review response.
     * @param {DueDateHistogram} dueDateNoteHistogram - The due date note histogram.
     * @returns {RepItemScheduleInfo} - The new schedule for the note.
     */
    noteCalcNewSchedule(
        notePath: string,
        osrNoteGraph: OsrNoteGraph,
        response: ReviewResponse,
        dueDateNoteHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const noteLinkStat: NoteLinkStat = osrNoteGraph.calcNoteLinkStat(
            notePath,
            this.noteEaseList,
        );

        const linkContribution: number =
            this.settings.maxLinkFactor *
            Math.min(1.0, Math.log(noteLinkStat.totalLinkCount + 0.5) / Math.log(64));
        let ease: number =
            (1.0 - linkContribution) * this.settings.baseEase +
            (noteLinkStat.totalLinkCount > 0
                ? (linkContribution * noteLinkStat.linkTotal) / noteLinkStat.linkPGTotal
                : linkContribution * this.settings.baseEase);

        // add note's average flashcard ease if available
        const easeByPath: number | null = this.noteEaseList.getEaseByPath(notePath);
        if (this.noteEaseList.hasEaseForPath(notePath) && easeByPath) {
            ease = (ease + easeByPath) / 2;
        }

        // Don't know the due date until we know the calculated interval
        const dueDate: Moment | null = null;
        const interval: number = SRAlgorithmOsr.initialInterval;
        ease = Math.round(ease);
        const temp: RepItemScheduleInfoOsr = new RepItemScheduleInfoOsr(dueDate, interval, ease);

        const result: RepItemScheduleInfoOsr = this.calcSchedule(
            temp,
            response,
            dueDateNoteHistogram,
        );

        // Calculate the due date now that we know the interval
        result.dueDate = moment(globalDateProvider.today.add(result.interval, "d"));
        return result;
    }

    /**
     * Called when a note is loaded.
     *
     * @param {string} path - The note path.
     * @param {Note} note - The note.
     * @param {number} noteEase - The note ease.
     * @returns {void}
     */
    noteOnLoadedNote(path: string, note: Note | null, noteEase: number | null): void {
        let flashcardsInNoteAvgEase: number | null = null;
        if (note) {
            flashcardsInNoteAvgEase = SRAlgorithmOsr.calculateFlashcardAvgEase(
                note.questionList,
                this.settings,
            );
        }

        let ease: number;
        if (flashcardsInNoteAvgEase && noteEase) {
            ease = (flashcardsInNoteAvgEase + noteEase) / 2;
        } else {
            ease = flashcardsInNoteAvgEase ? flashcardsInNoteAvgEase : noteEase;
        }

        if (ease) {
            this.noteEaseList.setEaseForPath(path, ease);
        }
    }

    /**
     * Calculates the average ease for a list of questions.
     *
     * @param {Question[]} questionList - The list of questions.
     * @param {SRSettings} settings - The settings object.
     * @returns {number} - The average ease for the list of questions.
     */
    static calculateFlashcardAvgEase(questionList: Question[], settings: SRSettings): number {
        let totalEase: number = 0;
        let scheduledCount: number = 0;

        questionList.forEach((question) => {
            question.cards
                .filter((card) => card.hasSchedule)
                .forEach((card) => {
                    totalEase += card.scheduleInfo.latestEase;
                    scheduledCount++;
                });
        });

        let result: number = 0;
        if (scheduledCount > 0) {
            const flashcardsInNoteAvgEase: number = totalEase / scheduledCount;
            const flashcardContribution: number = Math.min(
                1.0,
                Math.log(scheduledCount + 0.5) / Math.log(64),
            );
            result =
                flashcardsInNoteAvgEase * flashcardContribution +
                settings.baseEase * (1.0 - flashcardContribution);
        }
        return result;
    }

    /**
     * Calculates the updated schedule for a note.
     *
     * @param {string} notePath - The note path.
     * @param {RepItemScheduleInfo} noteSchedule - The note schedule.
     * @param {ReviewResponse} response - The review response.
     * @param {DueDateHistogram} dueDateNoteHistogram - The due date note histogram.
     * @returns {RepItemScheduleInfo} - The updated schedule for the note.
     */
    noteCalcUpdatedSchedule(
        notePath: string,
        noteSchedule: RepItemScheduleInfo,
        response: ReviewResponse,
        dueDateNoteHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const noteScheduleOsr: RepItemScheduleInfoOsr = noteSchedule as RepItemScheduleInfoOsr;
        const temp: RepItemScheduleInfoOsr = this.calcSchedule(
            noteScheduleOsr,
            response,
            dueDateNoteHistogram,
        );
        const interval: number = temp.interval;
        const ease: number = temp.latestEase;

        const dueDate: Moment = moment(globalDateProvider.today.add(interval, "d"));
        this.noteEaseList.setEaseForPath(notePath, ease);
        return new RepItemScheduleInfoOsr(dueDate, interval, ease);
    }

    /**
     * Calculates the scheduling information for a note.
     *
     * @param {RepItemScheduleInfoOsr} schedule - The scheduling information for the note.
     * @param {ReviewResponse} response - The review response.
     * @param {DueDateHistogram} dueDateHistogram - The due date histogram.
     * @returns {RepItemScheduleInfoOsr} - The scheduling information for the note.
     */
    private calcSchedule(
        schedule: RepItemScheduleInfoOsr,
        response: ReviewResponse,
        dueDateHistogram: DueDateHistogram,
    ): RepItemScheduleInfoOsr {
        const temp: Record<string, number> = osrSchedule(
            response,
            schedule.interval,
            schedule.latestEase,
            schedule.delayedBeforeReviewTicks,
            this.settings,
            dueDateHistogram,
        );

        return new RepItemScheduleInfoOsr(globalDateProvider.today, temp.interval, temp.ease);
    }

    /**
     * Gets the reset schedule for a card.
     *
     * @returns {RepItemScheduleInfo} - The reset schedule for a card.
     */
    cardGetResetSchedule(): RepItemScheduleInfo {
        const interval = SRAlgorithmOsr.initialInterval;
        const ease = this.settings.baseEase;
        const dueDate = globalDateProvider.today;
        return new RepItemScheduleInfoOsr(dueDate, interval, ease);
    }

    /**
     * Gets the new schedule for a card.
     *
     * @param {ReviewResponse} response - The review response.
     * @param {string} notePath - The note path.
     * @param {DueDateHistogram} dueDateFlashcardHistogram - The due date flashcard histogram.
     * @returns {RepItemScheduleInfo} - The new schedule for a card.
     */
    cardGetNewSchedule(
        response: ReviewResponse,
        notePath: string,
        dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        let initialEase: number = this.settings.baseEase;
        if (this.noteEaseList.hasEaseForPath(notePath)) {
            initialEase = Math.round(this.noteEaseList.getEaseByPath(notePath));
        }
        const delayBeforeReview = 0;

        const schedObj: Record<string, number> = osrSchedule(
            response,
            SRAlgorithmOsr.initialInterval,
            initialEase,
            delayBeforeReview,
            this.settings,
            dueDateFlashcardHistogram,
        );

        const interval = schedObj.interval;
        const ease = schedObj.ease;
        const dueDate = globalDateProvider.today.add(interval, "d");
        return new RepItemScheduleInfoOsr(dueDate, interval, ease, delayBeforeReview);
    }

    /**
     * Calculates the updated schedule for a card.
     *
     * @param {ReviewResponse} response - The review response.
     * @param {RepItemScheduleInfo} cardSchedule - The card schedule.
     * @param {DueDateHistogram} dueDateFlashcardHistogram - The due date flashcard histogram.
     * @returns {RepItemScheduleInfo} - The updated schedule for a card.
     */
    cardCalcUpdatedSchedule(
        response: ReviewResponse,
        cardSchedule: RepItemScheduleInfo,
        dueDateFlashcardHistogram: DueDateHistogram,
    ): RepItemScheduleInfo {
        const cardScheduleOsr: RepItemScheduleInfoOsr = cardSchedule as RepItemScheduleInfoOsr;
        const schedObj: Record<string, number> = osrSchedule(
            response,
            cardScheduleOsr.interval,
            cardSchedule.latestEase,
            cardSchedule.delayedBeforeReviewTicks,
            this.settings,
            dueDateFlashcardHistogram,
        );
        const interval = schedObj.interval;
        const ease = schedObj.ease;
        const dueDate = globalDateProvider.today.add(interval, "d");
        const delayBeforeReview = 0;
        return new RepItemScheduleInfoOsr(dueDate, interval, ease, delayBeforeReview);
    }

    /**
     * Gets the note stats.
     *
     * @returns {INoteEaseList} - The note stats.
     */
    noteStats() {
        return this.noteEaseList;
    }
}
