import { DataStore } from "src/data/data-store/base/data-store";

test("getInstance() not initialised exception", () => {
    const t = () => {
        DataStore.getInstance();
    };
    expect(t).toThrow(Error);
});
