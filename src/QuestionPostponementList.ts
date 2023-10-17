import { Question } from "./Question";
import SRPlugin from "./main";
import { SRSettings } from "./settings";

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

    clear(): void {
        this.list = [];
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
