// The browser shim.
//
// The app's client code reads two things Node does not have, and it reads them on
// paths a live test cannot avoid:
//
//   * **`window.location.pathname`** — `utils/fetchData.ts` derives the locale
//     from the first path segment, which is `country-language` in that order
//     (`/gb-en/...`). Get it wrong and every request carries the wrong `x-country`
//     and `x-language`, which changes what the backend answers rather than
//     failing outright. It also reads `window.location.href` when reporting an
//     error, so an unset location turns a real failure into a crash inside the
//     error handler.
//   * **`localStorage`** — the 401 recovery path stores the request it is about to
//     retry there.
//
// A live test file that drives client code therefore opens with
// `/** @vitest-environment jsdom */` and calls `installBrowserShim()`. A file that
// only addresses a route handler stays on `node` and needs none of this.

import { CookieJar, useJarFetch } from "./cookieJar";

/** The locale path the shim pretends the user is on.
 *
 *  Country first, then language — the order the app parses, not the order the
 *  phrase "language and country" suggests. */
export const DEFAULT_LOCALE_PATH = "/gb-en";

export type BrowserShim = {
  /** Put the globals back. Call it in `afterEach`/`afterAll`. */
  restore: () => void;
};

/** Give the current jsdom page a location, an empty localStorage, and a jar.
 *
 *  Throws outside jsdom rather than half-working: a test that forgot the
 *  environment docblock should be told so, not left to fail later on a missing
 *  `window`. */
export const installBrowserShim = (
  jar: CookieJar,
  options: { path?: string } = {},
): BrowserShim => {
  if (typeof window === "undefined") {
    throw new Error(
      [
        "installBrowserShim() needs jsdom, and this file is running on node.",
        'Add `/** @vitest-environment jsdom */` as the first line of the test file.',
      ].join("\n"),
    );
  }

  const path = options.path ?? DEFAULT_LOCALE_PATH;

  // replaceState rather than assigning to location: jsdom treats an assignment as
  // a navigation it cannot perform and logs "Not implemented: navigation", while
  // replaceState changes pathname exactly as the router does.
  window.history.replaceState({}, "", path);

  window.localStorage.clear();

  const restoreFetch = useJarFetch(jar);

  return {
    restore: () => {
      restoreFetch();
      window.localStorage.clear();
    },
  };
};
