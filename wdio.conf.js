exports.config = {
    specs: ["./tests/e2e/**/*.test.js"],
    exclude: [],
    capabilities: [
        {
            maxInstances: 1,
            browserName: "chrome",
            "goog:chromeOptions": {
                binary: process.env.OBSIDIAN_BINARY_PATH,
                args: process.env.CI ? ["headless"] : [],
            },
            acceptInsecureCerts: true,
        },
    ],
    logLevel: "info",
    bail: 0,
    baseUrl: "http://localhost",
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    framework: "mocha",
    reporters: ["spec"],
    mochaOpts: {
        ui: "bdd",
        timeout: 60000,
    },
};
