export enum LogLevel {
    Info,
    Warn,
    Error,
}

export const Logger = (console: Console, logLevel: LogLevel) => {
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
