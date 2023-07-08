export class DateUtils {
    static addTime(date: Date, time: number): Date {
        return new Date(date.getTime() + time);
    }

    static fromNow(time: number): Date {
        return this.addTime(new Date(), time);
    }

    static DAYS_TO_MILLIS = 86400000;
}

const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
export class BlockUtils {
    static generateBlockId(length?: number): string {
        if (length === undefined) length = 6;
        let hash = "";
        for (let i = 0; i < length; i++) {
            hash += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        return hash;
    }
}

export class MiscUtils {
    /**
     * Creates a copy of obj, and copies values from source into
     * the copy, but only if there already is a property with the
     * matching name.
     *
     * @param obj
     * @param source
     */
    static assignOnly(obj: any, source: any): any {
        const newObj = Object.assign(obj);
        if (source != undefined) {
            Object.keys(obj).forEach((key) => {
                if (key in source) {
                    newObj[key] = source[key];
                }
            });
        }
        return newObj;
    }

    /**
     * Creates a copy of obj, and copies values from source into
     * the copy
     *
     * @param obj
     * @param source
     */
    static assignObjFully(obj: any, source: any): any {
        const newObj = Object.assign(obj, JSON.parse(JSON.stringify(source)));
        return newObj;
    }

    /**
     * getRegExpGroups. Counts the number of capturing groups in the provided regular
     * expression.
     *
     * @param {RegExp} exp
     * @returns {number}
     */
    static getRegExpGroups(exp: RegExp): number {
        // Count capturing groups in RegExp, source: https://stackoverflow.com/questions/16046620/regex-to-count-the-number-of-capturing-groups-in-a-regex
        return new RegExp(exp.source + "|").exec("").length - 1;
    }

    /**
     * shuffle. Shuffles the given array in place into a random order
     * using Durstenfeld shuffle.
     *
     * @param {any[]} array
     */
    static shuffle(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
