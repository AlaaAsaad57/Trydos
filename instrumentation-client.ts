// This file starts Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
//
// It runs before the app, so what it imports is on every page's first load. It
// therefore imports no SDK: utils/sentryClient.ts loads Sentry when the page is
// ready, or at once when the app reports an error. The options are there too.

import { pageIsReady } from "./utils/pageIsReady";
import { loadSentry, sentryIfLoaded } from "./utils/sentryClient";

/** Enough for a page that fails while it loads, not for an error storm. */
const MAX_EARLY_ERRORS = 20;

// Sentry's own listeners are not here yet, so uncaught errors wait in this list.
const early: unknown[] = [];

const keep = (event: ErrorEvent | PromiseRejectionEvent) => {
  if (early.length >= MAX_EARLY_ERRORS) return;
  early.push("reason" in event ? event.reason : (event.error ?? event.message));
};

window.addEventListener("error", keep);
window.addEventListener("unhandledrejection", keep);

void pageIsReady()
  .then(loadSentry)
  .then((sentry) => {
    window.removeEventListener("error", keep);
    window.removeEventListener("unhandledrejection", keep);
    early.splice(0).forEach((error) => sentry.captureException(error));
  })
  .catch(() => {
    // The chunk did not load. Reporting must never break the page.
  });

// Before the SDK is here there is no trace to add this navigation to.
export const onRouterTransitionStart = (
  href: string,
  navigationType: string,
) => {
  sentryIfLoaded()?.captureRouterTransitionStart(href, navigationType);
};
