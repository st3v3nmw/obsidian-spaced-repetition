import { SRSettings } from "./settings";

export interface INoteEaseList {
    getEaseByPath(path: string): number;
}

export class NoteEaseList implements INoteEaseList {
    settings: SRSettings;
    easeByPath: Record<string, number> = {};

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    getEaseByPath(path: string): number {
        let ease: number = this.settings.baseEase;
        if (
            Object.prototype.hasOwnProperty.call(
                this.easeByPath,
                path
            )
        ) {
            ease = Math.round(this.easeByPath[path]);
        }
        return ease;

    }
}