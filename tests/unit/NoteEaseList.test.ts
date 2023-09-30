import { NoteEaseList } from "src/NoteEaseList";
import { DEFAULT_SETTINGS } from "src/settings";

test("baseEase", async () => {
    let list: NoteEaseList = new NoteEaseList(DEFAULT_SETTINGS);
    expect(list.baseEase).toEqual(250);
});

test("hasEaseForPath", async () => {
    let list: NoteEaseList = new NoteEaseList(DEFAULT_SETTINGS);
    expect(list.hasEaseForPath("Unknown path")).toEqual(false);

    list.setEaseForPath("Known path", 100);
    expect(list.hasEaseForPath("Known path")).toEqual(true);
});

test("getEaseByPath", async () => {
    let list: NoteEaseList = new NoteEaseList(DEFAULT_SETTINGS);

    list.setEaseForPath("Known path", 100);
    expect(list.getEaseByPath("Known path")).toEqual(100);
});
