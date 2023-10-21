import { SRSettings } from "src/settings";
import { OBSIDIAN_TAG_AT_STARTOFLINE_REGEX } from "./constants";
import { ISRFile } from "./SRFile";

export class TopicPath {
    path: string[];

    constructor(path: string[]) {
        if (path == null) throw "null path";
        if (path.some((str) => str.includes("/"))) throw "path entries must not contain '/'";
        this.path = path;
    }

    get hasPath(): boolean {
        return this.path.length > 0;
    }

    get isEmptyPath(): boolean {
        return !this.hasPath;
    }

    static get emptyPath(): TopicPath {
        return new TopicPath([]);
    }

    shift(): string {
        if (this.isEmptyPath) throw "can't shift an empty path";
        return this.path.shift();
    }

    clone(): TopicPath {
        return new TopicPath([...this.path]);
    }

    formatAsTag(): string {
        if (this.isEmptyPath) throw "Empty path";
        const result = "#" + this.path.join("/");
        return result;
    }

    static getTopicPathOfFile(noteFile: ISRFile, settings: SRSettings): TopicPath {
        let deckPath: string[] = [];
        let result: TopicPath = TopicPath.emptyPath;

        if (settings.convertFoldersToDecks) {
            deckPath = noteFile.path.split("/");
            deckPath.pop(); // remove filename
            if (deckPath.length != 0) {
                result = new TopicPath(deckPath);
            }
        } else {
            const tagList: TopicPath[] = this.getTopicPathsFromTagList(noteFile.getAllTags());

            outer: for (const tagToReview of this.getTopicPathsFromTagList(
                settings.flashcardTags,
            )) {
                for (const tag of tagList) {
                    if (tagToReview.isSameOrAncestorOf(tag)) {
                        result = tag;
                        break outer;
                    }
                }
            }
        }

        return result;
    }

    isSameOrAncestorOf(topicPath: TopicPath): boolean {
        if (this.isEmptyPath) return topicPath.isEmptyPath;
        if (this.path.length > topicPath.path.length) return false;
        for (let i = 0; i < this.path.length; i++) {
            if (this.path[i] != topicPath.path[i]) return false;
        }
        return true;
    }

    static getTopicPathFromCardText(cardText: string): TopicPath {
        const path = cardText.trimStart().match(OBSIDIAN_TAG_AT_STARTOFLINE_REGEX)?.slice(-1)[0];
        return path?.length > 0 ? TopicPath.getTopicPathFromTag(path) : null;
    }

    static removeTopicPathFromStartOfCardText(cardText: string): [string, string] {
        const cardText1: string = cardText
            .trimStart()
            .replaceAll(OBSIDIAN_TAG_AT_STARTOFLINE_REGEX, "");
        const cardText2: string = cardText1.trimStart();
        const whiteSpaceLength: number = cardText1.length - cardText2.length;
        const whiteSpace: string = cardText1.substring(0, whiteSpaceLength);
        return [cardText2, whiteSpace];
    }

    static getTopicPathsFromTagList(tagList: string[]): TopicPath[] {
        const result: TopicPath[] = [];
        for (const tag of tagList) {
            if (this.isValidTag(tag)) result.push(TopicPath.getTopicPathFromTag(tag));
        }
        return result;
    }

    static isValidTag(tag: string): boolean {
        if (tag == null || tag.length == 0) return false;
        if (tag[0] != "#") return false;
        if (tag.length == 1) return false;

        return true;
    }

    static getTopicPathFromTag(tag: string): TopicPath {
        if (tag == null || tag.length == 0) throw "Null/empty tag";
        if (tag[0] != "#") throw "Tag must start with #";
        if (tag.length == 1) throw "Invalid tag";

        const path: string[] = tag
            .replace("#", "")
            .split("/")
            .filter((str) => str);
        return new TopicPath(path);
    }
}
