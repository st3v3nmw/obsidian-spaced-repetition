import { PREFERRED_DATE_FORMAT, SR_CARD_ID_PREFIX, SR_SUSPENDED_FLAG } from "src/data/constants";
import { isValidCardId } from "src/data/data-structures/card/card-id";
import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import {
    FSRS_COMMENT_PREFIX,
    FSRS7_COMMENT_PREFIX,
    parseFsrsState,
    parseFsrsTimestamp,
} from "src/scheduling/algorithms/fsrs/fsrs-helpers";
import { RepItemScheduleInfoFsrs } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs";
import { RepItemScheduleInfoFsrs7 } from "src/scheduling/algorithms/fsrs/rep-item-schedule-info-fsrs7";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";
import { DateUtil, globalDateProvider } from "src/utils/dates";

/**
 * Card specific data stored next to the card's schedule within the SR comment.
 */
export interface CardStorageMetadata {
    isSuspended: boolean;
    id: string | null;
}

export class CommentParser {
    static parseMultiScheduleComment(comment: string): RepItemScheduleInfo[] {
        return this.splitScheduleSegments(comment).map((segment) =>
            this.parseScheduleSegment(segment),
        );
    }

    /**
     * Reads the per card metadata (suspended flag, card id) of each card schedule segment within the comment.
     *
     * @param {string} comment - The content of the SR comment, e.g. "!2023-09-02,4,270,suspended,id=k2n8x0c4qz7m!2023-09-02,5,270"
     * @returns {CardStorageMetadata[]} - One entry per segment, in the same order as parseMultiScheduleComment()
     */
    static parseMultiCardMetadataComment(comment: string): CardStorageMetadata[] {
        return this.splitScheduleSegments(comment).map(
            (segment) => this.splitSegmentFlags(segment).metadata,
        );
    }

    private static splitScheduleSegments(comment: string): string[] {
        return comment
            .split("!")
            .map((segment) => segment.trim())
            .filter((segment) => segment.length > 0);
    }

    /**
     * Splits the trailing flags (",suspended" and ",id=...", in any order) off a card schedule segment.
     *
     * @param {string} segment - A card schedule segment, e.g. "2023-09-02,4,270,suspended,id=k2n8x0c4qz7m"
     * @returns The schedule part of the segment (e.g. "2023-09-02,4,270") and the card metadata
     */
    static splitSegmentFlags(segment: string): { schedule: string; metadata: CardStorageMetadata } {
        const fields: string[] = segment.split(",");
        const metadata: CardStorageMetadata = { isSuspended: false, id: null };

        while (fields.length > 0) {
            const field: string = fields[fields.length - 1].trim();
            if (field === SR_SUSPENDED_FLAG) {
                metadata.isSuspended = true;
            } else if (field.startsWith(SR_CARD_ID_PREFIX)) {
                const id: string = field.slice(SR_CARD_ID_PREFIX.length);
                if (!isValidCardId(id)) {
                    throw new Error(`Invalid card id "${id}" in scheduling comment "${segment}"`);
                }
                if (metadata.id !== null) {
                    throw new Error(`More than one card id in scheduling comment "${segment}"`);
                }
                metadata.id = id;
            } else {
                break;
            }
            fields.pop();
        }

        return { schedule: fields.join(","), metadata };
    }

    static parseScheduleSegment(segmentWithFlags: string): RepItemScheduleInfo | null {
        const segment: string = this.splitSegmentFlags(segmentWithFlags).schedule;

        if (segment.startsWith(FSRS7_COMMENT_PREFIX + ",")) {
            const [
                _algorithm,
                dueDateStr,
                intervalStr,
                stabilityStr,
                stabilityFastStr,
                difficultyStr,
                stateStr,
                repsStr,
                lapsesStr,
                learningStepsStr,
                lastReviewStr,
            ] = this.splitFsrsFields(segment, 11);

            return new RepItemScheduleInfoFsrs7(
                this.parseRequiredFsrsTimestamp(dueDateStr, segment),
                this.parseFsrsNumber(intervalStr, segment),
                this.parseFsrsNumber(difficultyStr, segment),
                this.parseFsrsNumber(stabilityStr, segment),
                this.parseFsrsNumber(stabilityFastStr, segment),
                parseFsrsState(stateStr),
                this.parseFsrsInteger(repsStr, segment),
                this.parseFsrsInteger(lapsesStr, segment),
                this.parseFsrsInteger(learningStepsStr, segment),
                parseFsrsTimestamp(lastReviewStr),
            );
        }

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
                parseFsrsState(stateStr),
                parseInt(repsStr),
                parseInt(lapsesStr),
                parseInt(learningStepsStr),
                parseFsrsTimestamp(lastReviewStr),
            );
        }

        const [dueDateStr, intervalStr, easeStr] = segment.split(",");
        return this.parseSM2Schedule(dueDateStr, parseInt(intervalStr), parseInt(easeStr));
    }

    private static splitFsrsFields(segment: string, count: number): string[] {
        const fields: string[] = segment.split(",");
        if (fields.length !== count) {
            throw new Error(
                `Expected ${count} fields in FSRS scheduling comment "${segment}", found ${fields.length}`,
            );
        }
        return fields;
    }

    private static parseRequiredFsrsTimestamp(input: string, segment: string): moment.Moment {
        const result: moment.Moment | null = parseFsrsTimestamp(input);
        if (result === null || !result.isValid()) {
            throw new Error(`Invalid due date "${input}" in FSRS scheduling comment "${segment}"`);
        }
        return result;
    }

    private static parseFsrsNumber(input: string, segment: string): number {
        const result: number = Number(input);
        if (input.trim() === "" || !Number.isFinite(result)) {
            throw new Error(`Invalid number "${input}" in FSRS scheduling comment "${segment}"`);
        }
        return result;
    }

    private static parseFsrsInteger(input: string, segment: string): number {
        const result: number = this.parseFsrsNumber(input, segment);
        if (!Number.isInteger(result)) {
            throw new Error(`Invalid integer "${input}" in FSRS scheduling comment "${segment}"`);
        }
        return result;
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
