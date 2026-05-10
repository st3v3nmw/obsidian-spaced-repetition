import { RepItemScheduleInfo } from "src/scheduling/algorithms/base/rep-item-schedule-info";
import { RepItemStorageInfo } from "src/data/data-stores/base/rep-item-storage-info";

/**
* Represents the state of a repetition item, which can be new, due, or any item.
*
* It used to select the items based on their scheduling state. AnyItem is used to select all items, which means it shouldnt be used for anything else.
*
* @type {ReadonlyArray<RepItemState>}
*/
export enum RepItemState {
    NewItem,
    DueItem,
    AnyItem,
}

/**
 * Represents the type of repetition item, which determines how the scheduling information is stored.
 */
export enum RepetitionItemType {
    Card = "Card",
    Note = "Note",
}

/**
 * Represents the type of review response.
 */
export enum ReviewResponse {
    Easy,
    Good,
    Hard,
    Again,
    Reset,
}

/**
 * Represents the phase of repetition.
 */
export enum RepetitionPhase {
    New,
    Review,
}

/**
 * Represents a repetition item, which is either a card or a note.
 *
 * @class RepetitionItem
 * @property {RepetitionPhase} repetitionPhase - The repetition phase of the item.
 * @property {RepItemScheduleInfo} scheduleInfo - The scheduling information for the item.
 * @property {RepItemStorageInfo} storageInfo - The storage information for the item.
 */
export abstract class RepetitionItem {
    repItemType: RepetitionItemType;
    repetitionPhase: RepetitionPhase;

    scheduleInfo: RepItemScheduleInfo | null;
    storageInfo: RepItemStorageInfo;

    constructor(
        repetitionItemType: RepetitionItemType,
        repetitionPhase: RepetitionPhase,
        scheduleInfo: RepItemScheduleInfo | null,
        storageInfo: RepItemStorageInfo,
    ) {
        this.repItemType = repetitionItemType;
        this.repetitionPhase = repetitionPhase;
        this.scheduleInfo = scheduleInfo;
        this.storageInfo = storageInfo;
    }

    // scheduling
    get hasSchedule(): boolean {
        return this.scheduleInfo !== null;
    }

    get isNew(): boolean {
        return !this.hasSchedule;
    }

    get isDue(): boolean {
        return this.scheduleInfo !== null && this.scheduleInfo.isDue();
    }

    get repItemState(): RepItemState {
        return this.isNew ? RepItemState.NewItem : RepItemState.DueItem;
    }

    abstract toString(): string;
}
