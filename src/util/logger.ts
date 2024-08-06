import { normalizePath, Vault } from "obsidian";
import { globalDateProvider } from "./DateProvider";
import { SRSettings } from "src/settings";
import * as path from "path";
import { versionString } from "src/main";

export enum LoggerDestination {
    None,
    Console,
    File,
}

export class logger {
    private static _vault: Vault;
    private static _dest: LoggerDestination = LoggerDestination.None;
    private static _filename: string;

    static setVault(vault: Vault): void {
        logger._vault = vault;
    }
 
    static async setDestination(settings: SRSettings): Promise<void> {
        logger._dest = logger.convertStrToLoggerDestination(settings.debugLoggerDestination);
        const dateStr: string = globalDateProvider.now.format("YYYYMMDD");
        logger._filename = settings.debugLoggerFilename.replace("{DATE}", dateStr);
        await logger.log(`\r\n---\r\n## Obsidian: SpacedRepetition: ${versionString}\r\n`);
    }

    static error(str: string, e: Error) {
        if (e && e.stack == null) {
            // 
            if (e.message) str += `: ${e.message}`;
            if (e.name) str += `: ${e.name}`;
        }
        logger.log(`ERROR: ${str}`);
        if (e?.stack) logger.log(`STACK: ${e.stack}`);
    }

    static async log(str: string): Promise<void> {
        switch (logger._dest) {
            case LoggerDestination.Console:
                console.log(str);
                break;

            case LoggerDestination.File:
                await logger.logToFile(str);
                break;
        }
    }

    static async logToFile(str: string): Promise<void> {
        const dateStr: string = globalDateProvider.now.format("YYYY-MM-DD HH:mm:ss");
        const output: string = `[${dateStr}]: ${str}\r\n`;
        const filename: string = normalizePath(logger._filename) + ".md";

        try {
            if (await logger._vault.adapter.exists(filename)) {
                await this._vault.adapter.append(filename, output);
            } else {
                const dir: string = path.dirname(filename);
                if (!await logger._vault.adapter.exists(dir)) {
                    await logger._vault.createFolder(dir);
                }
                await logger._vault.create(filename, output);
            }
        } catch (e) {
            console.log(`logToFile: ${output}`, e);
        }
    }

    static convertStrToLoggerDestination(str: string): LoggerDestination {
        let result = LoggerDestination[str as keyof typeof LoggerDestination];
        if (result == undefined) result = LoggerDestination.None;
        return result;
    }

    static defaultFilenameTemplate(): string {
        return "temp/logs/osr_{DATE}";
    }
}
