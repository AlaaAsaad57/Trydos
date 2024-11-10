import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "d1rk7o",
  chromeWebSecurity: false,
  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    // To display small circular charts regarding test results
    embeddedScreenshots: true,
    html: true,
    inlineAssets: true,
    reportDir: "cypress/reports",
    charts: true,
    reportPageTitle: "My Test Suite",
    overwrite: true,
  },
  video: true,
  e2e: {
    // @ts-ignore
    hideXHRInCommandLog: true,
    setupNodeEvents(on, config) {
      require("cypress-mochawesome-reporter/plugin")(on);
      // implement node event listeners here
    },
    // baseUrl: "http://127.0.0.1:3000",
    baseUrl:
      "https://trydos-front-git-development-trydos-front-team.vercel.app",
    testIsolation: false,
    env: {
      browserPermissions: {
        notifications: "allow",
        geolocation: "allow",
      },
    },
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
