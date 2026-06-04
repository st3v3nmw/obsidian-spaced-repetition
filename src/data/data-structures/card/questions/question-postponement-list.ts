import { Question } from "src/data/data-structures/card/questions/question";
import { PluginData } from "src/data/plugin-data";
import { PluginDataManager } from "src/data/plugin-data-manager";
import { SRSettings } from "src/data/settings";

/**
 * Represents a list of postponed questions (i.e. questions buried siblings).
 *
 * @interface IQuestionPostponementList
 */
export interface IQuestionPostponementList {
    /**
     * Clears the list of postponed questions.
     */
    clear(): void;
    /**
     * Adds a question to the list of postponed questions.
     *
     * @param {Question} question - The question to add.
     */
    add(question: Question): void;
    /**
     * Checks if a question is in the list of postponed questions.
     *
     * @param {Question} question - The question to check.
     * @returns {boolean} - True if the question is in the list, false otherwise.
     */
    includes(question: Question): boolean;
    /**
     * Writes the list of postponed questions to the plugin data.
     *
     * @returns {Promise<void>} - A promise that resolves when the list is written.
     */
    write(): Promise<void>;
}

/**
 * This class manages the list of postponed questions (i.e. questions buried siblings).
 *
 * The list is stored as an array of question text hashes in the plugin data. When a question is added to the list, its text hash is added to the array. When a question is removed from the list, its text hash is removed from the array.
 */
export class QuestionPostponementList implements IQuestionPostponementList {
    list: string[];
    private pluginDataManager: PluginDataManager;
    settings: SRSettings;

    constructor(pluginDataManager: PluginDataManager, settings: SRSettings, list: string[]) {
        this.pluginDataManager = pluginDataManager;
        this.settings = settings;
        this.list = list;
    }

    /**
     * Clears the list of postponed questions if the date has changed since the last time the list was cleared. This ensures that questions are only postponed for one day.
     *
     * @param {PluginData} data - The plugin data containing the bury date and list.
     * @returns {Promise<void>} - A promise that resolves when the list is cleared if it's a new day.
     */
    async clearIfNewDay(data: PluginData): Promise<void> {
        const now = window.moment(Date.now());
        const todayDate: string = now.format("YYYY-MM-DD");

        // clear bury list if we've changed dates
        const isNewDay: boolean = todayDate !== data.buryDate;
        if (isNewDay) {
            data.buryDate = todayDate;
            this.clear();

            await this.write();
        }
    }

    /**
     * Clears the list of postponed questions.
     */
    clear(): void {
        this.list.splice(0);
    }

    /**
     * Adds a question to the list of postponed questions.
     *
     * @param {Question} question - The question to add.
     */
    add(question: Question): void {
        if (!this.includes(question)) this.list.push(question.questionText.textHash);
    }

    /**
     * Checks if a question is in the list of postponed questions.
     *
     * @param {Question} question - The question to check.
     * @returns {boolean} - True if the question is in the list, false otherwise.
     */
    includes(question: Question): boolean {
        return this.list.includes(question.questionText.textHash);
    }

    /**
     * Writes the list of postponed questions to the plugin data.
     *
     * @returns {Promise<void>} - A promise that resolves when the list is written.
     */
    async write(): Promise<void> {
        // This is null only whilst unit testing is being performed
        if (this.pluginDataManager === null) return;

        await this.pluginDataManager.savePluginData();
    }
}
