exports.config = {
    specs: ["./tests/e2e/**/*.test.js"],
    exclude: [],
    capabilities: [
        {
            maxInstances: 1,
            browserName: "chrome",
            "goog:chromeOptions": {
                binary: "/var/lib/flatpak/exports/bin/md.obsidian.Obsidian",
                args: [],
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
