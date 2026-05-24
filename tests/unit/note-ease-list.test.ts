import { DEFAULT_SETTINGS } from "src/data/settings";
import { NoteEaseList } from "src/note/note-ease-list";

test("baseEase", () => {
    const list: NoteEaseList = new NoteEaseList(DEFAULT_SETTINGS);
    expect(list.baseEase).toEqual(250);
});

test("hasEaseForPath", () => {
    const list: NoteEaseList = new NoteEaseList(DEFAULT_SETTINGS);
    expect(list.hasEaseForPath("Unknown path")).toEqual(false);

    list.setEaseForPath("Known path", 100);
    expect(list.hasEaseForPath("Known path")).toEqual(true);
});

test("getEaseByPath", () => {
    const list: NoteEaseList = new NoteEaseList(DEFAULT_SETTINGS);

    list.setEaseForPath("Known path", 100);
    expect(list.getEaseByPath("Known path")).toEqual(100);
});
