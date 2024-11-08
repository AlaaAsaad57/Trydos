import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "d1rk7o",
  chromeWebSecurity: false,
  e2e: {
    // @ts-ignore
    hideXHRInCommandLog: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: "http://localhost:3000",
    // baseUrl: "https://trydos-front.vercel.app",
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
