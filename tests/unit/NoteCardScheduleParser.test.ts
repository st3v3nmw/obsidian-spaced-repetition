import { CardScheduleInfo, NoteCardScheduleParser } from "src/CardSchedule";
import { TICKS_PER_DAY } from "src/constants";
import { setupStaticDateProvider_20230906 } from "src/util/DateProvider";

beforeAll(() => {
    setupStaticDateProvider_20230906();
});

test("No schedule info for question", () => {
    expect(NoteCardScheduleParser.createCardScheduleInfoList("A::B")).toEqual([]);
});

test("Single schedule info for question (on separate line)", () => {
    let actual: CardScheduleInfo[] =
        NoteCardScheduleParser.createCardScheduleInfoList(`What symbol represents an electric field:: $\\large \\vec E$
<!--SR:!2023-09-02,4,270-->`);

    expect(actual).toEqual([
        CardScheduleInfo.fromDueDateStr("2023-09-02", 4, 270, -4 * TICKS_PER_DAY),
    ]);
});

test("Single schedule info for question (on same line)", () => {
    let actual: CardScheduleInfo[] = NoteCardScheduleParser.createCardScheduleInfoList(
        `What symbol represents an electric field:: $\\large \\vec E$<!--SR:!2023-09-02,4,270-->`,
    );

    expect(actual).toEqual([
        CardScheduleInfo.fromDueDateStr("2023-09-02", 4, 270, -4 * TICKS_PER_DAY),
    ]);
});

test("Multiple schedule info for question (on separate line)", () => {
    let actual: CardScheduleInfo[] =
        NoteCardScheduleParser.createCardScheduleInfoList(`This is a really very ==interesting== and ==fascinating== and ==great== test
    <!--SR:!2023-09-03,1,230!2023-09-05,3,250!2023-09-06,4,270-->`);

    expect(actual).toEqual([
        CardScheduleInfo.fromDueDateStr("2023-09-03", 1, 230, -3 * TICKS_PER_DAY),
        CardScheduleInfo.fromDueDateStr("2023-09-05", 3, 250, -1 * TICKS_PER_DAY),
        CardScheduleInfo.fromDueDateStr("2023-09-06", 4, 270, 0),
    ]);
});
