import { TICKS_PER_DAY } from "src/data/constants";
import { Card } from "src/data/data-structures/card/card";
import { RepItemScheduleInfoOsr } from "src/scheduling/algorithms/osr/rep-item-schedule-info-osr";

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
