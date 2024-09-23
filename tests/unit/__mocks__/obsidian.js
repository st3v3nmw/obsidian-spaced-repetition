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
};
