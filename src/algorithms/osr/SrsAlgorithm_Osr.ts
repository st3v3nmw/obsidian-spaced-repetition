import { globalDateProvider } from "src/util/DateProvider";
import { RepItemScheduleInfo } from "../base/RepItemScheduleInfo";
import { Moment } from "moment";
import { RepItemScheduleInfo_Osr } from "./RepItemScheduleInfo_Osr";
import { ReviewResponse } from "../base/RepetitionItem";
import { SRSettings } from "src/settings";
import { INoteEaseList } from "src/NoteEaseList";
import { schedule } from "src/algorithms/osr/scheduling";
import { ISrsAlgorithm } from "../base/ISrsAlgorithm";
import { ISRFile } from "src/SRFile";


export class SrsAlgorithm_Osr implements ISrsAlgorithm {
    settings: SRSettings;
    noteEaseList: INoteEaseList;
    dueDatesFlashcards: Record<number, number> = {}; // Record<# of days in future, due count>

    constructor(settings: SRSettings, noteEaseList: INoteEaseList) {
        this.settings = settings;
        this.noteEaseList = noteEaseList;
    }

    static get initialInterval(): number {
        return 1.0;
    }

    noteCalcNewSchedule(notePath: string): RepItemScheduleInfo {
        let linkTotal = 0,
        linkPGTotal = 0,
        totalLinkCount = 0;

        for (const statObj of incomingLinks[note.path] || []) {
            const ease: number = this.easeByPath.getEaseByPath(statObj.sourcePath);
            if (ease) {
                linkTotal += statObj.linkCount * pageranks[statObj.sourcePath] * ease;
                linkPGTotal += pageranks[statObj.sourcePath] * statObj.linkCount;
                totalLinkCount += statObj.linkCount;
            }
        }

        const outgoingLinks = this.app.metadataCache.resolvedLinks[note.path] || {};
        for (const linkedFilePath in outgoingLinks) {
            const ease: number = this.easeByPath.getEaseByPath(linkedFilePath);
            if (ease) {
                linkTotal +=
                    outgoingLinks[linkedFilePath] * pageranks[linkedFilePath] * ease;
                linkPGTotal += pageranks[linkedFilePath] * outgoingLinks[linkedFilePath];
                totalLinkCount += outgoingLinks[linkedFilePath];
            }
        }

        const linkContribution: number =
            this.settings.maxLinkFactor *
            Math.min(1.0, Math.log(totalLinkCount + 0.5) / Math.log(64));
        ease =
            (1.0 - linkContribution) * this.settings.baseEase +
            (totalLinkCount > 0
                ? (linkContribution * linkTotal) / linkPGTotal
                : linkContribution * this.settings.baseEase);
        // add note's average flashcard ease if available
        if (this.easeByPath.hasEaseForPath(note.path)) {
            ease = (ease + this.easeByPath.getEaseByPath(note.path)) / 2;
        }
        ease = Math.round(ease);
        interval = 1.0;
        delayBeforeReview = 0;

    }

    noteCalcUpdatedSchedule(noteSchedule: RepItemScheduleInfo, response: ReviewResponse): RepItemScheduleInfo {
        const schedObj: Record<string, number> = schedule(
            response,
            interval,
            ease,
            delayBeforeReview,
            this.data.settings,
            this.dueDatesNotes,
        );
        interval = schedObj.interval;
        ease = schedObj.ease;

        const due = window.moment(now + interval * 24 * 3600 * 1000);
        const dueString: string = due.format("YYYY-MM-DD");

    }

    cardGetResetSchedule(): RepItemScheduleInfo {
        const interval = SrsAlgorithm_Osr.initialInterval;
        const ease = this.settings.baseEase;
        const dueDate = globalDateProvider.today.add(interval, "d");
        const delayBeforeReview = 0;
        return RepItemScheduleInfo_Osr.fromDueDateMoment(dueDate, interval, ease, delayBeforeReview);
    }

    cardGetNewSchedule(response: ReviewResponse, notePath: string): RepItemScheduleInfo {
        let initial_ease: number = this.settings.baseEase;
        if (this.noteEaseList.hasEaseForPath(notePath)) {
            initial_ease = Math.round(this.noteEaseList.getEaseByPath(notePath));
        }
        const delayBeforeReview = 0;

        const schedObj: Record<string, number> = schedule(
            response,
            SrsAlgorithm_Osr.initialInterval,
            initial_ease,
            delayBeforeReview,
            this.settings,
            this.dueDatesFlashcards,
        );

        const interval = schedObj.interval;
        const ease = schedObj.ease;
        const dueDate = globalDateProvider.today.add(interval, "d");
        return RepItemScheduleInfo_Osr.fromDueDateMoment(dueDate, interval, ease, delayBeforeReview);
    }

    cardCalcUpdatedSchedule(
        response: ReviewResponse,
        cardSchedule: RepItemScheduleInfo,
    ): RepItemScheduleInfo {
        const cardScheduleOsr: RepItemScheduleInfo_Osr = cardSchedule as RepItemScheduleInfo_Osr;
        const schedObj: Record<string, number> = schedule(
            response,
            cardScheduleOsr.interval,
            cardSchedule.latestEase,
            cardSchedule.delayBeforeReviewTicks,
            this.settings,
            this.dueDatesFlashcards,
        );
        const interval = schedObj.interval;
        const ease = schedObj.ease;
        const dueDate = globalDateProvider.today.add(interval, "d");
        const delayBeforeReview = 0;
        return RepItemScheduleInfo_Osr.fromDueDateMoment(dueDate, interval, ease, delayBeforeReview);
    }

}