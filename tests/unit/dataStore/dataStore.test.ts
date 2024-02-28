import { DataStore } from "src/dataStore/base/DataStore";

test("getInstance() not initialised exception", () => {
    const t = () => {
        DataStore.getInstance();
    };
    expect(t).toThrow(Error);
});

