import EmulatedPlatform from "src/utils/platform-detector";

test("Emulation should be off", () => {
    expect(EmulatedPlatform().isEmulated).toEqual(false);
});

test("The emulated platform shouldn't be detected as desktop", () => {
    expect(EmulatedPlatform().isDesktop).toEqual(false);
});

test("The emulated platform shouldn't be detected as mobile", () => {
    expect(EmulatedPlatform().isMobile).toEqual(false);
});

test("The emulated platform shouldn't be detected as phone", () => {
    expect(EmulatedPlatform().isPhone).toEqual(false);
});

test("The emulated platform shouldn't be detected as tablet", () => {
    expect(EmulatedPlatform().isTablet).toEqual(false);
});
