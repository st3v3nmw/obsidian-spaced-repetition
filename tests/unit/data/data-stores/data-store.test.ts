import { DataStore } from "src/data/data-store-instances/base/data-store";

test("getInstance() not initialised exception", () => {
    const t = () => {
        DataStore.getInstance();
    };
    expect(t).toThrow(Error);
});
