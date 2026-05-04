import { DEFAULT_SETTINGS, SRSettings } from "src/settings";

export interface SerializedScheduleInfo {
    dueDate: string;
    interval: number;
    ease: number;
}

export interface PluginDataScheduleState {
    version: number;
    noteSchedules: Record<string, SerializedScheduleInfo | null>;
    cardSchedules: Record<string, (SerializedScheduleInfo | null)[]>;
}

export interface PluginData {
    settings: SRSettings;
    buryDate: string;
    // hashes of card texts
    // should work as long as user doesn't modify card's text
    // which covers most of the cases
    buryList: string[];
    historyDeck: string | null;
    scheduleState: PluginDataScheduleState;
}

export const DEFAULT_DATA: PluginData = {
    settings: DEFAULT_SETTINGS,
    buryDate: "",
    buryList: [],
    historyDeck: null,
    scheduleState: {
        version: 1,
        noteSchedules: {},
        cardSchedules: {},
    },
};
