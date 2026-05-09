import { DEFAULT_SETTINGS, SRSettings } from "src/data/settings";

export interface SerializedScheduleInfo {
    dueDate: string;
    interval: number;
    ease: number;
}

/**
 * Represents the schedule data stored in the plugin data.
 *
 * @interface IPluginScheduleData
 */
export interface IPluginScheduleData {
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
    scheduleData: IPluginScheduleData;
}

export const DEFAULT_DATA: PluginData = {
    settings: DEFAULT_SETTINGS,
    buryDate: "",
    buryList: [],
    historyDeck: null,
    scheduleData: {
        version: 1,
        noteSchedules: {},
        cardSchedules: {},
    },
};
