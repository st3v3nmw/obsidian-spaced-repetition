export enum LogLevel {
    Info,
    Warn,
    Error,
}

export interface Logger {
    info: Function;
    warn: Function;
    error: Function;
}

export const createLogger = (console: Console, logLevel: LogLevel): Logger => {
    let info: Function, warn: Function;

    if (logLevel === LogLevel.Info)
        info = Function.prototype.bind.call(console.info, console, "SR:");
    else info = (..._: any[]) => {};

    if (logLevel <= LogLevel.Warn)
        warn = Function.prototype.bind.call(console.warn, console, "SR:");
    else warn = (..._: any[]) => {};

    let error: Function = Function.prototype.bind.call(
        console.error,
        console,
        "SR:"
    );

    return { info, warn, error };
};
