import { Notice } from "obsidian";

import { Card } from "src/data/data-structures/card/card";
import { TopicPath } from "src/data/data-structures/deck/topic-path";
import { ensureCardId } from "src/history/ensure-card-id";
import {
    CardRef,
    formatDeckForHistory,
    HISTORY_SCHEMA_VERSION,
    HistoryEventBase,
    HistoryEventPayload,
} from "src/history/history-events";
import { IHistoryStore } from "src/history/history-store";
import { generateRandomId } from "src/utils/random-id";

const EVENT_ID_LENGTH = 12;
const SESSION_ID_LENGTH = 10;
const DEVICE_ID_LENGTH = 8;

export function generateSessionId(): string {
    return generateRandomId(SESSION_ID_LENGTH);
}

export function generateDeviceId(): string {
    return generateRandomId(DEVICE_ID_LENGTH);
}

/**
 * Records usage history events.
 */
export class HistoryRecorder {
    public readonly store: IHistoryStore;
    private deviceId: string;
    private isEnabled: () => boolean;
    private now: () => number;

    constructor(
        store: IHistoryStore,
        deviceId: string,
        isEnabled: () => boolean,
        now: () => number = () => Date.now(),
    ) {
        this.store = store;
        this.deviceId = deviceId;
        this.isEnabled = isEnabled;
        this.now = now;
    }

    get enabled(): boolean {
        return this.isEnabled();
    }

    /**
     * Records an event, unless recording is disabled in the settings.
     *
     * @returns The recorded event, or null if recording is disabled.
     */
    async record<P extends HistoryEventPayload>(
        payload: P,
        sessionId: string | null,
    ): Promise<(HistoryEventBase & P) | null> {
        if (!this.isEnabled()) return null;

        const ts: number = this.now();
        const event: HistoryEventBase & P = {
            v: HISTORY_SCHEMA_VERSION,
            id: generateRandomId(EVENT_ID_LENGTH),
            ts,
            at: new Date(ts).toISOString(),
            device: this.deviceId,
            sessionId,
            ...payload,
        };

        try {
            await this.store.append(event);
        } catch (error) {
            new Notice(`Spaced Repetition: Could not record usage history: ${String(error)}`);
            throw error;
        }
        return event;
    }

    /**
     * Creates the reference to a card for an event. Gives the card an id first, if it doesn't have one yet.
     *
     * @param {Card} card - The card.
     * @param {TopicPath | null} deck - The deck the card is shown in, if any.
     */
    async cardRef(card: Card, deck: TopicPath | null): Promise<CardRef> {
        return {
            cardId: await ensureCardId(card),
            notePath: card.question.note.filePath,
            cardIdx: card.cardIdx,
            deck: deck === null ? null : formatDeckForHistory(deck),
        };
    }
}
