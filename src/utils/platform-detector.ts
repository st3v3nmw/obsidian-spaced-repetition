import { Platform } from "obsidian";

import { DEBUG_MODE_ENABLED } from "src/constants";

export interface CustomPlatform {
    isDesktop: boolean;
    isMobile: boolean;
    isPhone: boolean;
    isTablet: boolean;
}

/**
 * Detects the current and also emulated (once debug mode is active) platform and returns a CustomPlatform object with boolean properties indicating whether the current platform is desktop, mobile, tablet, or phone.
 *
 * @returns
 */
export default function getPlatform(): CustomPlatform {
    return {
        isDesktop:
            (!document.body.hasClass("emulate-mobile") && DEBUG_MODE_ENABLED) ||
            Platform.isDesktop ||
            Platform.isDesktopApp,
        isMobile:
            (document.body.hasClass("emulate-mobile") && DEBUG_MODE_ENABLED) || Platform.isMobile,
        isPhone:
            (document.body.hasClass("emulate-mobile") &&
                document.body.hasClass("is-phone") &&
                DEBUG_MODE_ENABLED) ||
            Platform.isPhone,
        isTablet:
            (document.body.hasClass("emulate-mobile") &&
                document.body.hasClass("is-tablet") &&
                DEBUG_MODE_ENABLED) ||
            Platform.isTablet,
    };
}
