import { CardScheduleInfo, NoteCardScheduleParser } from "src/CardSchedule";

test("No schedule info for question", () => {
    expect(
        NoteCardScheduleParser.createCardScheduleInfoList("A::B"),
    ).toEqual([]);

});


test("Single schedule info for question (on separate line)", () => {
    let actual: CardScheduleInfo[] = NoteCardScheduleParser.createCardScheduleInfoList( `What symbol represents an electric field:: $\\large \\vec E$
<!--SR:!2023-09-02,4,270-->`);

    expect(actual).toEqual([
        new CardScheduleInfo("2023-09-02", 4, 270)
    ]);
    expect(actual[0].date()).toEqual(1693576800000);
});

test("Single schedule info for question (on same line)", () => {
    let actual: CardScheduleInfo[] = NoteCardScheduleParser.createCardScheduleInfoList( `What symbol represents an electric field:: $\\large \\vec E$<!--SR:!2023-09-02,4,270-->`);

    expect(actual).toEqual([
        new CardScheduleInfo("2023-09-02", 4, 270)
    ]);
});

test("Multiple schedule info for question (on separate line)", () => {
    let actual: CardScheduleInfo[] = NoteCardScheduleParser.createCardScheduleInfoList( `This is a really very ==interesting== and ==fascinating== and ==great== test
    <!--SR:!2023-09-03,1,230!2023-09-05,3,250!2023-09-06,4,270-->`);

    expect(actual).toEqual([
        new CardScheduleInfo("2023-09-03", 1, 230), 
        new CardScheduleInfo("2023-09-05", 3, 250), 
        new CardScheduleInfo("2023-09-06", 4, 270)
    ]);

});