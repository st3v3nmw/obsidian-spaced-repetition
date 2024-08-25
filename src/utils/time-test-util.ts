import moment from "moment";

// These functions were used to diagnose performance issue
// https://github.com/st3v3nmw/obsidian-spaced-repetition/issues/914

let testTimeInfo: [string, number][];

export function testTimeStart(): void {
    testTimeInfo = [["Start", moment().valueOf()]];
}

export function testTimeLog(desc: string): void {
    if (testTimeInfo == null) testTimeStart();
    testTimeInfo.push([desc, moment().valueOf()]);
}

export function testTimeGetLapTime(): number {
    return moment().valueOf() - testTimeInfo[0][1];
}

export function testTimeFormatLapInfo(): string {
    let prevTime: number = testTimeInfo[0][1];
    let result: string = "";
    for (let i = 1; i < testTimeInfo.length; i++) {
        const thisTime: number = testTimeInfo[i][1];
        result += `\t${testTimeInfo[i][0]}\t${thisTime - prevTime}`;
        prevTime = thisTime;
    }
    result += `\tLapTime\t${testTimeGetLapTime()}|`;
    return result;
}
