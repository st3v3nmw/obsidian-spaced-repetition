import { MetadataCache, TFile, getAllTags } from "obsidian";
import { SRSettings } from "src/settings";
import { tagInCardRegEx } from "./constants";

export class TopicPath {
    path: string[];

    constructor(path: string[]) { 
        if (!(path?.length > 0))
            throw "empty or null path";

        this.path = path;
    }

    get hasPath(): boolean { 
        return (this.path.length > 1) || ((this.path.length == 1) && (this.path[0] != "/"));
    }

    get hasEmptyPath(): boolean { 
        return !this.hasPath;
    }
    
    static get rootPath(): TopicPath { 
        return new TopicPath(["/"]);
    }

    shift(): string { 
        return this.path.shift();
    }

    static getTopicPathOfFile(note: TFile, settings: SRSettings, appMetadataCache: MetadataCache): TopicPath {
        var deckPath: string[] = [];
        var result: TopicPath;

        if (settings.convertFoldersToDecks) {
            deckPath = note.path.split("/");
            deckPath.pop(); // remove filename
            if (deckPath.length === 0) {
                result = TopicPath.rootPath;
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
        return cardText.replaceAll(tagInCardRegEx, "");
    }
}

