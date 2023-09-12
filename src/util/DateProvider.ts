
export interface IDateProvider {
    get today(): Date;
}

export class LiveDateProvider implements IDateProvider {
    get today(): Date {
        return new Date();
    }
}

export class StaticDateProvider implements IDateProvider {
    private date: Date;

    constructor(date: Date) {
        this.date = date;
    }

    get today(): Date {
        return this.date;
    }

}

export var globalDateProvider: IDateProvider = new LiveDateProvider();

export function setupStaticDateProvider_20230906() {
    globalDateProvider = new StaticDateProvider(new Date(2023, 8, 6));
}