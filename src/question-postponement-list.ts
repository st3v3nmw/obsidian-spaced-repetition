import SRPlugin from "src/main";
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

    async clearIfNewDay(): Promise<void> {
        const todayDate = this._todayDate();

        // clear bury list if we've changed dates
        const isNewDay: boolean = todayDate !== this.plugin.data.buryDate;
        if (isNewDay) {
            // set buryDate before writing so we can clear bury list on new day
            this.plugin.data.buryDate = todayDate;
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

    _todayDate(): string {
        const now = window.moment(Date.now());
        const todayDate: string = now.format("YYYY-MM-DD");
        return todayDate;
    }
}
