export enum LogLevel {
    Info,
    Warn,
    Error,
}

export const LOG_PREFIX: string = "SR: ";
export class Logger {
    private logLevel: LogLevel;
    constructor(logLevel: LogLevel) {
        this.logLevel = logLevel;
    }

    info(text: string) {
        if (this.logLevel == LogLevel.Info) console.info(LOG_PREFIX + text);
    }

    warn(text: string) {
        if (this.logLevel <= LogLevel.Warn) console.warn(LOG_PREFIX + text);
    }

    error(text: string) {
        console.error(LOG_PREFIX + text);
    }
}
