import SRPlugin from "src/main";
import { PluginData } from "src/plugin-data";
import { Question } from "src/question";
import { SRSettings } from "src/settings";

export interface IQuestionPostponementList {
    clear(): void;
    add(question: Question): void;
    includes(question: Question): boolean;
    write(): Promise<void>;
}

export class QuestionPostponementList implements IQuestionPostponementList {
    list: string[];
    plugin: SRPlugin;
    settings: SRSettings;

    constructor(plugin: SRPlugin, settings: SRSettings, list: string[]) {
        this.plugin = plugin;
        this.settings = settings;
        this.list = list;
    }

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

    clear(): void {
        this.list.splice(0);
    }

    add(question: Question): void {
        if (!this.includes(question)) this.list.push(question.questionText.textHash);
    }

    includes(question: Question): boolean {
        return this.list.includes(question.questionText.textHash);
    }

    async write(): Promise<void> {
        // This is null only whilst unit testing is being performed
        if (this.plugin == null) return;

        await this.plugin.savePluginData();
    }
}
