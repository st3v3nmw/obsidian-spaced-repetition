import { DataStore } from "src/data/data-stores/base/data-store";

test("getInstance() not initialised exception", () => {
    const t = () => {
        DataStore.getInstance();
    };
    expect(t).toThrow(Error);
});
