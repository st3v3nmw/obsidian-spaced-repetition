export class RepItemStorageInfo {
    notePath: string;
    questionHash: string;

    constructor(notePath?: string, questionHash?: string) {
        this.notePath = notePath;
        this.questionHash = questionHash;
    }
}
