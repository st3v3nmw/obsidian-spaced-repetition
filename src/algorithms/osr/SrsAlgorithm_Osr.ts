import { globalDateProvider } from "src/util/DateProvider";
import { RepItemScheduleInfo } from "../base/RepItemScheduleInfo";
import { Moment } from "moment";
import { RepItemScheduleInfo_Osr } from "./RepItemScheduleInfo_Osr";
import { ReviewResponse } from "../base/RepetitionItem";
import { SRSettings } from "src/settings";
import { INoteEaseList, NoteEaseList } from "src/NoteEaseList";
import { osrSchedule } from "src/algorithms/osr/NoteScheduling";
import { ISrsAlgorithm } from "../base/ISrsAlgorithm";
import { ISRFile } from "src/SRFile";
import { LinkStat, NoteLinkStat, OsrNoteGraph } from "./OsrNoteGraph";
import { Question } from "src/Question";
import { Note } from "src/Note";
import moment from "moment";
import { DueDateHistogram } from "src/DueDateHistogram";


export class SrsAlgorithm_Osr implements ISrsAlgorithm {
    private settings: SRSettings;
    private noteEaseList: INoteEaseList;
    private dueDateFlashcardHistogram: DueDateHistogram;
    private dueDateNoteHistogram: DueDateHistogram;

    constructor(settings: SRSettings) {
        this.settings = settings;
        this.noteEaseList = new NoteEaseList(settings);
    }

    static get initialInterval(): number {
        return 1.0;
    }

    noteCalcNewSchedule(notePath: string, osrNoteGraph: OsrNoteGraph, response: ReviewResponse): RepItemScheduleInfo {
        const noteLinkStat: NoteLinkStat = osrNoteGraph.calcNoteLinkStat(notePath, this.noteEaseList, this.settings);

        const linkContribution: number =
            this.settings.maxLinkFactor *
            Math.min(1.0, Math.log(noteLinkStat.totalLinkCount + 0.5) / Math.log(64));
        let ease: number =
            (1.0 - linkContribution) * this.settings.baseEase +
            (noteLinkStat.totalLinkCount > 0
                ? (linkContribution * noteLinkStat.linkTotal) / noteLinkStat.linkPGTotal
                : linkContribution * this.settings.baseEase);

        // add note's average flashcard ease if available
        if (this.noteEaseList.hasEaseForPath(notePath)) {
            ease = (ease + this.noteEaseList.getEaseByPath(notePath)) / 2;
        }

        // Don't know the due date until we know the calculated interval
        const dueDate: Moment = null;
        const interval: number = SrsAlgorithm_Osr.initialInterval;
        ease = Math.round(ease);
        const temp: RepItemScheduleInfo_Osr = new RepItemScheduleInfo_Osr(dueDate, interval, ease);

        return this.calcSchedule(temp, response, this.dueDateNoteHistogram);
    }

    noteOnLoadedNote(note: Note): void {
        const flashcardsInNoteAvgEase: number = SrsAlgorithm_Osr.calculateFlashcardAvgEase(
            note.questionList,
            this.settings,
        );
        if (flashcardsInNoteAvgEase > 0) {
            this.noteEaseList.setEaseForPath(note.filePath, flashcardsInNoteAvgEase);
        }

    }

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

    noteCalcUpdatedSchedule(notePath: string, noteSchedule: RepItemScheduleInfo, response: ReviewResponse): RepItemScheduleInfo {
        const noteScheduleOsr: RepItemScheduleInfo_Osr = noteSchedule as RepItemScheduleInfo_Osr;
        const temp: RepItemScheduleInfo_Osr = this.calcSchedule(
            noteScheduleOsr,
            response,
            this.dueDateNoteHistogram,
        );
        const interval: number = temp.interval;
        const ease: number = temp.latestEase;

        const dueDate: Moment = moment(globalDateProvider.now.valueOf() + interval * 24 * 3600 * 1000);
        this.noteEaseList.setEaseForPath(notePath, ease);
        return new RepItemScheduleInfo_Osr(dueDate, interval, ease);
    }

    private calcSchedule(schedule: RepItemScheduleInfo_Osr, response: ReviewResponse, dueDateHistogram: DueDateHistogram): RepItemScheduleInfo_Osr {
        const temp: Record<string, number> = osrSchedule(
            response,
            schedule.interval,
            schedule.latestEase,
            schedule.delayedBeforeReviewTicks,
            this.settings,
            dueDateHistogram,
        );

        return new RepItemScheduleInfo_Osr(globalDateProvider.today, temp.interval, temp.ease);
    }

    cardGetResetSchedule(): RepItemScheduleInfo {
        const interval = SrsAlgorithm_Osr.initialInterval;
        const ease = this.settings.baseEase;
        const dueDate = globalDateProvider.today.add(interval, "d");
        return new RepItemScheduleInfo_Osr(dueDate, interval, ease);
    }

    cardGetNewSchedule(response: ReviewResponse, notePath: string): RepItemScheduleInfo {
        let initial_ease: number = this.settings.baseEase;
        if (this.noteEaseList.hasEaseForPath(notePath)) {
            initial_ease = Math.round(this.noteEaseList.getEaseByPath(notePath));
        }
        const delayBeforeReview = 0;

        const schedObj: Record<string, number> = osrSchedule(
            response,
            SrsAlgorithm_Osr.initialInterval,
            initial_ease,
            delayBeforeReview,
            this.settings,
            this.dueDateFlashcardHistogram,
        );

        const interval = schedObj.interval;
        const ease = schedObj.ease;
        const dueDate = globalDateProvider.today.add(interval, "d");
        return new RepItemScheduleInfo_Osr(dueDate, interval, ease, delayBeforeReview);
    }

    cardCalcUpdatedSchedule(
        response: ReviewResponse,
        cardSchedule: RepItemScheduleInfo,
    ): RepItemScheduleInfo {
        const cardScheduleOsr: RepItemScheduleInfo_Osr = cardSchedule as RepItemScheduleInfo_Osr;
        const schedObj: Record<string, number> = osrSchedule(
            response,
            cardScheduleOsr.interval,
            cardSchedule.latestEase,
            cardSchedule.delayedBeforeReviewTicks,
            this.settings,
            this.dueDateFlashcardHistogram,
        );
        const interval = schedObj.interval;
        const ease = schedObj.ease;
        const dueDate = globalDateProvider.today.add(interval, "d");
        const delayBeforeReview = 0;
        return new RepItemScheduleInfo_Osr(dueDate, interval, ease, delayBeforeReview);
    }

}