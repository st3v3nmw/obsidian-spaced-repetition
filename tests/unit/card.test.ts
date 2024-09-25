import { RepItemScheduleInfoOsr } from "src/algorithms/osr/rep-item-schedule-info-osr";
import { Card } from "src/card";
import { TICKS_PER_DAY } from "src/constants";

describe("Card", () => {
    test("format Schedule", () => {
        expect(
            new Card({
                front: "What year did Aegon's Conquest start?",
                back: "2BC #flashcards",
            }).formatSchedule(),
        ).toBe("New");
        expect(
            new Card({
                front: "What year did Aegon's Conquest start?",
                back: "2BC #flashcards",
                scheduleInfo: RepItemScheduleInfoOsr.fromDueDateStr(
                    "2023-09-03",
                    1,
                    230,
                    3 * TICKS_PER_DAY,
                ),
            }).formatSchedule(),
        ).toBe("!2023-09-03,1,230");
    });
});
