import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { ISerializedScheduleEntry } from "src/data/plugin-data";
import { ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";
import { FlashcardReviewMode } from "src/scheduling/flashcard-review-sequencer";

/**
 * The usage history is an append-only log of everything the user does within the plugin, one JSON object per line
 * (see HistoryStore). It is the basis for the usage statistics, and is meant to be usable as input for scheduling
 * algorithms later on (e.g. optimizing FSRS parameters from the review log).
 *
 * Compatibility rules for changes to the event schema:
 *  - Only ever add new event types or new optional fields.
 *  - Increase HISTORY_SCHEMA_VERSION when the meaning of an existing field changes.
 */
export const HISTORY_SCHEMA_VERSION = 1;

export type ReviewModeName = "review" | "cram";
export type ReviewResponseName = "easy" | "good" | "hard" | "again" | "reset";

export const REVIEW_RESPONSE_NAMES: ReadonlyArray<ReviewResponseName> = [
    "again",
    "hard",
    "good",
    "easy",
    "reset",
];

export function reviewModeName(mode: FlashcardReviewMode): ReviewModeName {
    switch (mode) {
        case FlashcardReviewMode.Review:
            return "review";
        case FlashcardReviewMode.Cram:
            return "cram";
    }
}

export function reviewResponseName(response: ReviewResponse): ReviewResponseName {
    switch (response) {
        case ReviewResponse.Easy:
            return "easy";
        case ReviewResponse.Good:
            return "good";
        case ReviewResponse.Hard:
            return "hard";
        case ReviewResponse.Again:
            return "again";
        case ReviewResponse.Reset:
            return "reset";
    }
}

export function formatDeckForHistory(topicPath: TopicPath): string {
    return topicPath.path.join("/");
}

/**
 * Identifies the card an event is about.
 */
export interface CardRef {
    // The permanent id stored in the card's scheduling comment
    cardId: string;
    // Vault path of the note containing the card (at the time of the event)
    notePath: string;
    // Index of the card within its question (questions with several clozes, or reversed cards, have several cards)
    cardIdx: number;
    // The deck the card was shown in, e.g. "flashcards/science" ("" for the root deck), or null outside of a
    // review session (e.g. commands)
    deck: string | null;
}

/**
 * Fields every event has. They are filled in by the HistoryRecorder.
 */
export interface HistoryEventBase {
    // Schema version (HISTORY_SCHEMA_VERSION at the time the event was written)
    v: number;
    // Unique id of this event, e.g. referenced by "action_undone"
    id: string;
    // Time of the event, milliseconds since the epoch
    ts: number;
    // Same time as an ISO 8601 string (UTC), for humans reading the raw log
    at: string;
    // Random id of the device (and vault) the event was recorded on
    device: string;
    // Id of the review session (one per opened review view), null for events outside of a review session
    sessionId: string | null;
}

export interface SessionStartedPayload {
    type: "session_started";
    mode: ReviewModeName;
    // Set if only the cards of a single note are reviewed
    singleNotePath: string | null;
}

export interface SessionEndedPayload {
    type: "session_ended";
}

export interface DeckListShownPayload {
    type: "deck_list_shown";
}

export interface DeckReviewStartedPayload {
    type: "deck_review_started";
    // Same format as CardRef.deck
    deck: string;
}

export interface ReviewModeChangedPayload {
    type: "review_mode_changed";
    mode: ReviewModeName;
}

export interface CardShownPayload extends CardRef {
    type: "card_shown";
    mode: ReviewModeName;
    isNew: boolean;
    schedule: ISerializedScheduleEntry | null;
}

export interface AnswerShownPayload extends CardRef {
    type: "answer_shown";
    msSinceCardShown: number;
}

export interface CardReviewedPayload extends CardRef {
    type: "card_reviewed";
    mode: ReviewModeName;
    response: ReviewResponseName;
    // Whether the card had never been reviewed before this review
    isNew: boolean;
    scheduleBefore: ISerializedScheduleEntry | null;
    // In cram mode the schedule doesn't change, so scheduleAfter equals scheduleBefore
    scheduleAfter: ISerializedScheduleEntry | null;
    // The probability of recall right before this review, as predicted by the FSRS model of scheduleBefore with the
    // weights in use at the time. null for new cards and SM-2 schedules, which have no prediction.
    // Missing in events written before 2026-11-08.
    recallProbability?: number | null;
    msSinceCardShown: number;
    // null if the answer wasn't shown before responding (e.g. "reset" from the front of the card)
    msSinceAnswerShown: number | null;
    redoneEventId?: string;
}

/*
 * About redoneEventId (card_reviewed, card_skipped, card_suspended): only present if the event re-applies an undone
 * action (redo). It is the id of the undone event, whose timings (msSince...) are copied. The undone event itself
 * stays ignored, so statistics should count the redo event like any other.
 */

export interface CardSkippedPayload extends CardRef {
    type: "card_skipped";
    msSinceCardShown: number;
    redoneEventId?: string;
}

export interface CardSuspendedPayload extends CardRef {
    type: "card_suspended";
    msSinceCardShown: number;
    redoneEventId?: string;
}

export interface CardUnsuspendedPayload extends CardRef {
    type: "card_unsuspended";
}

export interface CardEditedPayload extends CardRef {
    type: "card_edited";
}

export interface CardDeletedPayload extends CardRef {
    type: "card_deleted";
}

export interface CardOpenedInNotePayload extends CardRef {
    type: "card_opened_in_note";
}

export interface CardInfoViewedPayload extends CardRef {
    type: "card_info_viewed";
}

export interface ActionUndonePayload {
    type: "action_undone";
    // The event of the action that was undone. Statistics (and algorithms) should ignore that event.
    undoneEventId: string;
    undoneEventType: UndoableEventType;
    cardId: string;
    notePath: string;
}

export interface NoteReviewedPayload {
    type: "note_reviewed";
    notePath: string;
    response: ReviewResponseName;
}

export type HistoryEventPayload =
    | SessionStartedPayload
    | SessionEndedPayload
    | DeckListShownPayload
    | DeckReviewStartedPayload
    | ReviewModeChangedPayload
    | CardShownPayload
    | AnswerShownPayload
    | CardReviewedPayload
    | CardSkippedPayload
    | CardSuspendedPayload
    | CardUnsuspendedPayload
    | CardEditedPayload
    | CardDeletedPayload
    | CardOpenedInNotePayload
    | CardInfoViewedPayload
    | ActionUndonePayload
    | NoteReviewedPayload;

export type HistoryEventType = HistoryEventPayload["type"];

export type UndoableEventType = "card_reviewed" | "card_skipped" | "card_suspended";

export type HistoryEvent = HistoryEventBase & HistoryEventPayload;
