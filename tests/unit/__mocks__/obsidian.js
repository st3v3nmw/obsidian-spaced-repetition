/* eslint-disable no-undef */
/* eslint-disable getter-return */

module.exports = {
    moment: {
        locale: jest.fn(() => "en"),
    },
    PluginSettingTab: jest.fn().mockImplementation(),
    Platform: {
        get isMobile() {
            jest.fn(() => false);
        },
    },

    Notice: jest.fn().mockImplementation(),

    TFile: class TFile {
        constructor() {
            this.path = "";
            this.basename = "";
            this.extension = "md";
        }
    },

    normalizePath: (path) =>
        path
            .replace(/\\/g, "/")
            .replace(/\/{2,}/g, "/")
            .replace(/^\/+/, "")
            .replace(/\/+$/, ""),
};
