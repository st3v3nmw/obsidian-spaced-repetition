import { PREFERRED_DATE_FORMAT, SR_SUSPENDED_FLAG } from "src/data/constants";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import {
    FSRS_COMMENT_PREFIX,
    parseFsrsTimestamp,
} from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { DateUtil, globalDateProvider } from "src/utils/dates";

export class CommentParser {
    static parseMultiScheduleComment(comment: string): RepItemScheduleInfo[] {
        return this.splitScheduleSegments(comment).map((segment) =>
            this.parseScheduleSegment(segment),
        );
    }

    /**
     * Determines for each card schedule segment within the comment whether the card is suspended.
     *
     * @param {string} comment - The content of the SR comment, e.g. "!2023-09-02,4,270,suspended!2023-09-02,5,270"
     * @returns {boolean[]} - One entry per segment, in the same order as parseMultiScheduleComment()
     */
    static parseMultiSuspendedComment(comment: string): boolean[] {
        return this.splitScheduleSegments(comment).map((segment) =>
            this.isSegmentSuspended(segment),
        );
    }

    static isSegmentSuspended(segment: string): boolean {
        return segment.endsWith("," + SR_SUSPENDED_FLAG);
    }

    private static splitScheduleSegments(comment: string): string[] {
        return comment
            .split("!")
            .map((segment) => segment.trim())
            .filter((segment) => segment.length > 0);
    }

    static parseScheduleSegment(segmentWithFlags: string): RepItemScheduleInfo | null {
        const segment: string = this.isSegmentSuspended(segmentWithFlags)
            ? segmentWithFlags.slice(0, -("," + SR_SUSPENDED_FLAG).length)
            : segmentWithFlags;

        if (segment.startsWith(FSRS_COMMENT_PREFIX + ",")) {
            const fields = segment.split(",");
            const [
                _algorithm,
                dueDateStr,
                intervalStr,
                stabilityStr,
                difficultyStr,
                stateStr,
                repsStr,
                lapsesStr,
                learningStepsStr,
                lastReviewStr,
            ] = fields;

            const parsedDueDate: moment.Moment | null = parseFsrsTimestamp(dueDateStr);

            if (!parsedDueDate) {
                return null;
            }

            return new RepItemScheduleInfoFsrs(
                parsedDueDate,
                parseFloat(intervalStr),
                parseFloat(difficultyStr),
                parseFloat(stabilityStr),
                parseInt(stateStr),
                parseInt(repsStr),
                parseInt(lapsesStr),
                parseInt(learningStepsStr),
                parseFsrsTimestamp(lastReviewStr),
            );
        }

        const [dueDateStr, intervalStr, easeStr] = segment.split(",");
        return this.parseSM2Schedule(dueDateStr, parseInt(intervalStr), parseInt(easeStr));
    }

    static parseSM2Schedule(
        dueDateStr: string,
        interval: number,
        ease: number,
    ): RepItemScheduleInfo | null {
        const dueDate: moment.Moment = DateUtil.dateStrToMoment(dueDateStr);
        if (
            dueDate === null ||
            dueDate.format(PREFERRED_DATE_FORMAT) === RepItemScheduleInfoOsr.dummyDueDateForNewCard
        ) {
            return null;
        }

        const delayBeforeReviewTicks: number =
            dueDate.valueOf() - globalDateProvider.today.valueOf();
        return new RepItemScheduleInfoOsr(dueDate, interval, ease, delayBeforeReviewTicks);
    }
}
