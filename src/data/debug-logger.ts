/**
 * Manages the debug logging.
 */
export class DebugLogger {
    public debugInfoLog: string[] = [];
    public debugErrorLog: string[] = [];
    public debugWarningLog: string[] = [];

    constructor() {}

    /**
     * Logs a message of the specified type.
     */
    public log(message: string, type: "info" | "error" | "warning") {
        switch (type) {
            case "info":
                this.debugInfoLog.push(message);
                break;
            case "error":
                this.debugErrorLog.push(message);
                break;
            case "warning":
                this.debugWarningLog.push(message);
                break;
        }
    }

    /**
     * Clears the log of all types.
     */
    emptyLogs() {
        this.debugInfoLog = [];
        this.debugErrorLog = [];
        this.debugWarningLog = [];
    }

    /**
     * Clears the log of the specified type.
     */
    emptyLog(type: "info" | "error" | "warning") {
        switch (type) {
            case "info":
                this.debugInfoLog = [];
                break;
            case "error":
                this.debugErrorLog = [];
                break;
            case "warning":
                this.debugWarningLog = [];
                break;
        }
    }

    getLog(type: "info" | "error" | "warning"): string {
        switch (type) {
            case "info":
                return this.debugInfoLog.join("\n");
            case "error":
                return this.debugErrorLog.join("\n");
            case "warning":
                return this.debugWarningLog.join("\n");
        }
    }

    getAllLogs(): string {
        return this.getLog("info") + "\n" + this.getLog("error") + "\n" + this.getLog("warning");
    }
}

/**
 * Gets the debug logger instance.
 */
export class DebugLoggerInstance {
    private static instance: DebugLogger | null = null;

    public static getInstance(): DebugLogger {
        if (!DebugLoggerInstance.instance) {
            DebugLoggerInstance.instance = new DebugLogger();
        }
        return DebugLoggerInstance.instance;
    }
}
