import { OBSIDIAN_TAG_AT_STARTOFLINE_REGEX } from "src/constants";
import { ISRFile } from "src/file";
import { SRSettings } from "src/settings";

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
            const tagList: TopicPath[] = this.getTopicPathsFromTagList(
                noteFile.getAllTagsFromCache(),
            );

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

    static getFolderPathFromFilename(noteFile: ISRFile, settings: SRSettings): TopicPath {
        let result: TopicPath = TopicPath.emptyPath;

        if (settings.convertFoldersToDecks) {
            const deckPath: string[] = noteFile.path.split("/");
            deckPath.pop(); // remove filename
            if (deckPath.length != 0) {
                result = new TopicPath(deckPath);
            }
        }

        return result;
    }
}

export class TopicPathList {
    list: TopicPath[];
    lineNum: number;

    constructor(list: TopicPath[], lineNum: number = null) {
        if (list == null) throw "TopicPathList null";
        this.list = list;
        this.lineNum = lineNum;
    }

    get length(): number {
        return this.list.length;
    }

    isAnyElementSameOrAncestorOf(topicPath: TopicPath): boolean {
        return this.list.some((item) => item.isSameOrAncestorOf(topicPath));
    }

    formatPsv() {
        return this.format("|");
    }

    format(sep: string) {
        return this.list.map((topicPath) => topicPath.formatAsTag()).join(sep);
    }

    static empty(): TopicPathList {
        return new TopicPathList([]);
    }

    static fromPsv(str: string, lineNum: number): TopicPathList {
        const result: TopicPathList = TopicPathList.convertTagListToTopicPathList(str.split("|"));
        result.lineNum = lineNum;
        return result;
    }

    //
    // tagList is a list of tags such as:
    //      ["#flashcards/computing", "#boring-stuff", "#news-worthy"]
    // validTopicPathList is a list of valid tags, such as those from settings.flashcardTags,E.g.
    //      ["#flashcards"]
    //
    // This returns a filtered version of tagList, containing only topic paths that are considered valid.
    // Validity is defined as "isAnyElementSameOrAncestorOf", and "#flashcards" is considered the ancestor of
    // "#flashcards/computing".
    //
    // Therefore this would return:
    //      "#flashcards/computing" (but not "#boring-stuff" or "#news-worthy")
    //
    static filterValidTopicPathsFromTagList(
        list: TopicPathList,
        validTopicPathList: TopicPathList,
        lineNum: number = null,
    ): TopicPathList {
        const result: TopicPath[] = [];
        for (const tag of list.list) {
            if (validTopicPathList.isAnyElementSameOrAncestorOf(tag)) result.push(tag);
        }

        return new TopicPathList(result, lineNum);
    }

    static convertTagListToTopicPathList(tagList: string[]): TopicPathList {
        const result: TopicPath[] = [];
        for (const tag of tagList) {
            if (TopicPath.isValidTag(tag)) result.push(TopicPath.getTopicPathFromTag(tag));
        }
        return new TopicPathList(result);
    }
}

export class TopicPathWithWs {
    topicPath: TopicPath;

    // The white space prior to the topic path
    // We keep this so that when a question is updated, we can retain the original spacing
    preWhitespace: string;

    postWhitespace: string;

    constructor(topicPath: TopicPath, preWhitespace: string, postWhitespace: string) {
        if (!topicPath || topicPath.isEmptyPath) throw "topicPath null";

        this.topicPath = topicPath;
        this.preWhitespace = preWhitespace;
        this.postWhitespace = postWhitespace;
    }

    formatWithWs(): string {
        return `${this.preWhitespace}${this.topicPath.formatAsTag()}${this.postWhitespace}`;
    }
}
