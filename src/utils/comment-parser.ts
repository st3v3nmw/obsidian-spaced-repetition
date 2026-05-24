import { PREFERRED_DATE_FORMAT } from "src/data/constants";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import {
    FSRS_COMMENT_PREFIX,
    parseFsrsTimestamp,
} from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { DateUtil, formatDate, globalDateProvider } from "src/utils/dates";

export class CommentParser {
    static parseMultiScheduleComment(comment: string): RepItemScheduleInfo[] {
        const segments = comment
            .split("!")
            .map((segment) => segment.trim())
            .filter((segment) => segment.length > 0)
            .map((segment) => this.parseScheduleSegment(segment))
            .filter((info): info is RepItemScheduleInfo => info !== null);

        return segments;
    }

    static parseScheduleSegment(segment: string): RepItemScheduleInfo | null {
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
            formatDate(dueDate.unix(), PREFERRED_DATE_FORMAT) ===
                RepItemScheduleInfoOsr.dummyDueDateForNewCard
        ) {
            return null;
        }

        const delayBeforeReviewTicks: number =
            dueDate.valueOf() - globalDateProvider.today.valueOf();
        return new RepItemScheduleInfoOsr(dueDate, interval, ease, delayBeforeReviewTicks);
    }
}
