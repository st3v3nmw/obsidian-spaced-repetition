import { Question } from "src/data/data-structures/card/questions/question";
import {
    RepetitionItem,
    RepetitionItemType,
    RepetitionPhase,
} from "src/scheduling/algorithms/base/repetition-item";

export class Card extends RepetitionItem {
    question: Question;
    cardIdx: number;

    // Suspended cards are excluded from all decks, and therefore from review and cram sessions
    isSuspended: boolean = false;

    // Permanent id stored in the scheduling comment (see SR_CARD_ID_PREFIX). Assigned lazily, the first time a usage
    // history event is recorded for the card, so null for cards that were never shown in a review session.
    id: string | null = null;

    // visuals
    front: string = "";
    back: string = "";

    constructor(init?: Partial<Card>) {
        super(RepetitionItemType.Card, RepetitionPhase.New, null, null);
        Object.assign(this, init);
    }

    formatSchedule(): string {
        return this.scheduleInfo !== null
            ? this.scheduleInfo.formatScheduleAsSRHtmlComment()
            : "New";
    }

    toString(): string {
        return `${this.front}::${this.back}`;
    }
}
