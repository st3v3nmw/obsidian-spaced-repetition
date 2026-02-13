import { Platform } from "obsidian";

export interface CustomPlatform {
    isDesktop: boolean;
    isMobile: boolean;
    isPhone: boolean;
    isTablet: boolean;
}

export default function getPlatform(): CustomPlatform {
    return {
        isDesktop: !document.body.hasClass("emulate-mobile") && (Platform.isDesktop || Platform.isDesktopApp),
        isMobile: document.body.hasClass("emulate-mobile") || Platform.isMobile,
        isPhone: (document.body.hasClass("emulate-mobile") && document.body.hasClass("is-phone")) || Platform.isPhone,
        isTablet: (document.body.hasClass("emulate-mobile") && document.body.hasClass("is-tablet")) || Platform.isTablet,
    };
}