// The browser suite.
//
// It drives a real `next build` + `next start` against the real staging
// backends. It is never a pull request gate: it is red when staging is down,
// which is useful information about the backend and useless information about a
// pull request. See docs/testing/E2E_TEST_DESIGN.md.
//
// Two projects, split by file name, because they need opposite artifact rules:
//
//   *.live.spec.ts      real staging. Real session, real orders. Saves nothing.
//   *.scripted.spec.ts  the browser's own calls are faked. No secrets in play.
//
// **This repository is public, so every CI log and artifact is world-readable.**
// That splits the artifacts in two, and the line is not about how sensitive they
// feel — it is about what they contain:
//
//   * A trace archives every request header, so it *is* the auth token in a
//     downloadable file. The live project never records one. Debug locally with
//     `--trace on`, where the file never leaves the machine.
//   * A video or screenshot contains no headers and no token. It can still show
//     the test identity's phone number on the login screen, so the live project
//     records both and `test-e2e.yml` encrypts them before upload.
//
// The scripted project used to have no real session and no real secrets, so it
// could record freely. That is **no longer true of every spec in it**:
// `profile.scripted.spec.ts` signs in for real, and turns its own trace off with
// `test.use({ trace: "off" })` for exactly that reason. The project default below
// stays as it is, because `auth.scripted.spec.ts` still mints no real token — but
// a new scripted spec that signs in must do the same as the profile one.

import { defineConfig } from "@playwright/test";

import { LIVE_ORIGIN } from "./tests/e2e/harness/env";

export default defineConfig({
  testDir: "./tests/e2e",

  // Everything Playwright writes goes in one gitignored place.
  outputDir: "./tests/e2e/.artifacts",

  globalSetup: "./tests/e2e/globalSetup.ts",
  globalTeardown: "./tests/e2e/globalTeardown.ts",

  // **Never retry.** Playwright's usual CI setting is 2, and the reason it is 0
  // here is not flakiness tolerance: a checkout that fails at the last step and
  // retries twice leaves three real orders on staging. A retried write is a
  // duplicated write. Set here so no spec has to remember it.
  retries: 0,

  // One at a time, and this is not a performance setting. Every spec shares one
  // staging dataset and one set of OTP rate limits. Two specs adding to the same
  // cart, or logging in as the same identity at once, fail each other for
  // reasons that look exactly like product bugs.
  workers: 1,
  fullyParallel: false,

  // A real browser against a real backend over a real network. The default 30s
  // is a budget for a local app; a cold serverless route on staging can spend
  // most of a minute before it answers.
  timeout: 120_000,
  expect: { timeout: 15_000 },

  // The build is not bounded by this — it happens before Playwright starts. This
  // covers starting the server and logging in once.
  globalTimeout: 30 * 60 * 1000,

  // `list` for a human reading the CI log, plus `json` for the Telegram message
  // — which needs the counts and the failing test names, and cannot get them by
  // scraping console output.
  //
  // The HTML report is left out on CI on purpose: it is a directory we have
  // decided not to upload, so it would only ever be written and thrown away.
  // `e2e-results.json` is gitignored and never uploaded either; it is read in
  // the same job by `cli.ts report`, which redacts it before anything is sent.
  reporter: process.env.CI
    ? [["list"], ["json", { outputFile: "e2e-results.json" }]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: LIVE_ORIGIN,
    // The app decides the locale from the path (`/gb-en/…` — country first, then
    // language), so this only affects what the browser asks for.
    locale: "en-GB",

    // The app already carries about 800 `data-pw` attributes, left from an
    // earlier Cypress setup, and they cover the money path: `addToCartButton`,
    // `Confirm-Order-Button`, `cachondelivry-cartpage`, `cart-total-price`.
    // Pointing `getByTestId()` at them reuses all of it instead of adding a
    // second, parallel set of hooks to the same components.
    //
    // They are also the only locators here that do not break in Arabic: every
    // visible string goes through `translateFunction`, so matching on text ties
    // a spec to one language.
    testIdAttribute: "data-pw",
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },

  projects: [
    {
      name: "live",
      testMatch: /.*\.live\.spec\.ts$/,
      use: {
        // **No trace, ever.** This is the one artifact that carries the auth
        // token: it archives every request header, so a downloadable trace is a
        // downloadable session. Debug locally with `--trace on`.
        trace: "off",

        // Video and failure screenshots are recorded. They show what the browser
        // showed — which can include the test identity's phone number on the
        // login screen — so `test-e2e.yml` never uploads them in the clear: it
        // packs them into a passphrase-encrypted archive first.
        video: "on",
        screenshot: "only-on-failure",
      },
    },
    {
      name: "scripted",
      testMatch: /.*\.scripted\.spec\.ts$/,
      use: {
        // No service worker. `page.route` and `context.route` do not see a
        // request a service worker makes, so one registering mid-run would be a
        // hole in the closed mode `profile.scripted.spec.ts` depends on.
        serviceWorkers: "block",
        trace: "retain-on-failure",
        video: "retain-on-failure",
        screenshot: "only-on-failure",
      },
    },
  ],
});
