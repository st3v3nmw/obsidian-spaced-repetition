import { SRSettings } from "src/settings";

export interface INoteEaseList {
    dict: Record<string, number>;

    hasEaseForPath(path: string): boolean;
    getEaseByPath(path: string): number | null;
    setEaseForPath(path: string, ease: number): void;
}

export class NoteEaseList implements INoteEaseList {
    settings: SRSettings;
    dict: Record<string, number> = {};

    constructor(settings: SRSettings) {
        this.settings = settings;
    }

    get baseEase() {
        return this.settings.baseEase;
    }

    hasEaseForPath(path: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.dict, path);
    }

    getEaseByPath(path: string): number | null {
        let ease: number = null;
        if (this.hasEaseForPath(path)) {
            ease = Math.round(this.dict[path]);
        }
        return ease;
    }

    setEaseForPath(path: string, ease: number): void {
        this.dict[path] = ease;
    }
}
