export class RepItemStorageInfo {
    notePath: string | null = null;
    questionHash: string | null = null;

    constructor(notePath?: string, questionHash?: string) {
        this.notePath = notePath || null;
        this.questionHash = questionHash || null;
    }
}
