
export class Stats {
    eases: Record<number, number>;
    intervals: Record<number, number>;
    newCount: number;
    youngCount: number;
    matureCount: number;

    update(interval: number, ease: number) {
        if (!Object.prototype.hasOwnProperty.call(this.intervals, interval)) {
            this.intervals[interval] = 0;
        }
        this.intervals[interval]++;
        if (!Object.prototype.hasOwnProperty.call(this.eases, ease)) {
            this.eases[ease] = 0;
        }
        this.eases[ease]++;

        if (interval >= 32) {
            this.matureCount++;
        } else {
            this.youngCount++;
        }
    }
}
