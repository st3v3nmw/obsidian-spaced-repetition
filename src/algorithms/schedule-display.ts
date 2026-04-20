import moment from "moment";

import { RepItemScheduleInfo } from "src/algorithms/base/rep-item-schedule-info";
import { textInterval } from "src/algorithms/osr/note-scheduling";
import { globalDateProvider } from "src/utils/dates";

export function formatScheduleInterval(
    schedule: RepItemScheduleInfo | null | undefined,
    isMobile: boolean,
): string {
    if (!schedule || schedule.interval >= 1 || !schedule.dueDate) {
        return textInterval(schedule?.interval, isMobile);
    }

    const diffMs = Math.max(0, schedule.dueDateAsUnix - globalDateProvider.now.valueOf());
    const totalMinutes = Math.max(1, Math.ceil(diffMs / (60 * 1000)));
    if (totalMinutes < 60) {
        return isMobile ? `${totalMinutes}m` : `${totalMinutes} min`;
    }

    const totalHours = Math.max(1, Math.ceil(totalMinutes / 60));
    return isMobile ? `${totalHours}h` : `${totalHours} hr`;
}

export function formatPendingDueTime(dueUnix: number): string {
    return moment(dueUnix).format("HH:mm:ss");
}
