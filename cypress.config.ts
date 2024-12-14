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
    experimentalStudio: true,

    setupNodeEvents(on, config) {
      require("cypress-mochawesome-reporter/plugin")(on);
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
