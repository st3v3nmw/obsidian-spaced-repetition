import { DEBUG_MODE_ENABLED } from "src/constants";

export interface EmulatedPlatform {
    isDesktop: boolean;
    isMobile: boolean;
    isPhone: boolean;
    isTablet: boolean;
    isEmulated: boolean;
}

/**
 * Detects the emulated platform (once debug mode is active) and returns a CustomPlatform object with boolean properties indicating whether the emulated platform is desktop, mobile, tablet, or phone.
 *
 * @returns {EmulatedPlatform} An object containing boolean properties for the emulated platform.
 */
export default function EmulatedPlatform(): EmulatedPlatform {
    return {
        isDesktop: DEBUG_MODE_ENABLED && !document.body.hasClass("emulate-mobile"),
        isMobile: DEBUG_MODE_ENABLED && document.body.hasClass("emulate-mobile"),
        isPhone:
            DEBUG_MODE_ENABLED &&
            document.body.hasClass("emulate-mobile") &&
            document.body.hasClass("is-phone"),
        isTablet:
            DEBUG_MODE_ENABLED &&
            document.body.hasClass("emulate-mobile") &&
            document.body.hasClass("is-tablet"),
        isEmulated: DEBUG_MODE_ENABLED && document.body.hasClass("emulate-mobile"),
    };
}
