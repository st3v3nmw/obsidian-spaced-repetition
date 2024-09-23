import { DEFAULT_SETTINGS, SRSettings } from "src/settings";

export interface PluginData {
    settings: SRSettings;
    buryDate: string;
    // hashes of card texts
    // should work as long as user doesn't modify card's text
    // which covers most of the cases
    buryList: string[];
    historyDeck: string | null;
}

export const DEFAULT_DATA: PluginData = {
    settings: DEFAULT_SETTINGS,
    buryDate: "",
    buryList: [],
    historyDeck: null,
};
