import { Card } from "src/Card";
import { CardScheduleInfo } from "src/CardSchedule";
import { TICKS_PER_DAY } from "src/constants";

describe("Card", () => {
    test("format Schedule", () => {
        expect(
            new Card({
                front: "What year was the Taliban Emirate founded?",
                back: "1996 #flashcards",
            }).formatSchedule(),
        ).toBe("New");
        expect(
            new Card({
                front: "What year was the Taliban Emirate founded?",
                back: "1996 #flashcards",
                scheduleInfo: CardScheduleInfo.fromDueDateStr(
                    "2023-09-03",
                    1,
                    230,
                    3 * TICKS_PER_DAY,
                ),
            }).formatSchedule(),
        ).toBe("!2023-09-03,1,230");
    });
});
