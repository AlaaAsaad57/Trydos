import { defineConfig } from "cypress";
import TS from "@cypress/code-coverage/task";
export default defineConfig({
  projectId: "c2mz74",
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
  screenshotOnRunFailure: true,
  defaultCommandTimeout: 120000,
  pageLoadTimeout: 120000,
  requestTimeout: 120000,
  retries: { runMode: 2, openMode: 2 },
  e2e: {
    // @ts-ignore
    hideXHRInCommandLog: true,
    experimentalStudio: true,
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      TS(on, config);
      require("cypress-mochawesome-reporter/plugin")(on);
      return config;
      // implement node event listeners here
    },
    // baseUrl:
    //   "https://trydos-front-git-development-trydos-front-team.vercel.app/",
    baseUrl: "http://localhost:3000",
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
