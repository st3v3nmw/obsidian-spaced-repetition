import { MetadataCache, TFile, getAllTags } from "obsidian";
import { SRSettings } from "src/settings";
import { tagInCardRegEx } from "./constants";

export class TopicPath {
    path: string[];

    constructor(path: string[]) { 
        if (path == null)
            throw "null path";
        if (path.some((str) => str.includes("/")))
            throw "path entries must not contain '/'";
        this.path = path;
    }

    get hasPath(): boolean { 
        return (this.path.length > 0);
    }

    get isEmptyPath(): boolean { 
        return !this.hasPath;
    }
    
    static get emptyPath(): TopicPath { 
        return new TopicPath([]);
    }

    shift(): string {
        if (this.isEmptyPath)
            throw "can't shift an empty path"
        return this.path.shift();
    }

    static getTopicPathOfFile(note: TFile, settings: SRSettings, appMetadataCache: MetadataCache): TopicPath {
        var deckPath: string[] = [];
        var result: TopicPath = TopicPath.emptyPath;

        if (settings.convertFoldersToDecks) {
            deckPath = note.path.split("/");
            deckPath.pop(); // remove filename
            if (deckPath.length === 0) {
                result = TopicPath.emptyPath;
            }
        } else {
            const fileCachedData = appMetadataCache.getFileCache(note) || {};
            const tags = getAllTags(fileCachedData) || [];

            outer: for (const tagToReview of settings.flashcardTags) {
                for (const tag of tags) {
                    if (tag === tagToReview || tag.startsWith(tagToReview + "/")) {
                        deckPath = tag.substring(1).split("/");
                        result = new TopicPath(deckPath);
                        break outer;
                    }
                }
            }
        }

        return result;
    }

    static getTopicPathFromCardText(cardText: string): TopicPath { 
        const cardDeckPath = cardText
            .match(tagInCardRegEx)
            ?.slice(-1)[0]
            .replace("#", "")
            .split("/");
        return  (cardDeckPath?.length > 0) ? new TopicPath(cardDeckPath) : null;
    }

    static removeTopicPathFromCardText(cardText: string): string { 
        return cardText.replaceAll(tagInCardRegEx, "").trim();
    }
}

