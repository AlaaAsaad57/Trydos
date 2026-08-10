// Stand-in for the cookie manager (utils/cookies/cookie-manager.ts).
//
// Use it like this, at the top of a test file:
//
//   vi.mock("utils/cookies/cookie-manager", () => makeCookieManagerMock());
//
// WHY THE NAMES ARE COPIED HERE INSTEAD OF IMPORTED
// A test that replaces the cookie manager replaces it for everything that test
// loads. If this file imported the real module at the top, it would import its
// own replacement and get nothing back. Reading the real module from inside the
// factory would avoid that, but then every test file using this stand-in would
// pull in the token library the real module depends on, and would need the
// browser-like test environment as well.
//
// So the names are copied, and tests/mocks/mocks.test.ts loads the REAL module
// once and checks every copied name still matches. That test is the only place
// in the kit that loads the real cookie module, so it is the only place that
// pays for the token library — and the only place that needs the browser-like
// (jsdom) environment, because the real module reaches for server-side request
// reading whenever there is no browser window. If a later phase moves pure
// logic tests to a cheaper plain environment, that one file has to stay on
// jsdom.
//
// If a name below ever drifts from the real module, the comparison test fails
// and says which one. Fix it here.

/** A copy of `COOKIE_NAMES` in utils/cookies/cookie-manager.ts. */
export const COOKIE_NAMES = {
  LOCAL: "local",
  WALLET_USER: "WALLET_USER",
  WALLET_TOKEN: "rdb_at",
  DEVICE_TOKEN: "DEVICE-TOKEN",
  USER_DATA: "User-Data",
  MARKET_TOKEN: "MARKET-TOKEN",
  MARKET_REFRESH_TOKEN: "MARKET-REFRESH-TOKEN",
  CHAT_TOKEN: "CHAT-TOKEN",
  CHAT_REFRESH_TOKEN: "CHAT-REFRESH-TOKEN",
  STORIES_TOKEN: "STORIES-TOKEN",
  USER_CHAT: "USER-CHAT",
  USER_STORIES: "USER-STORIES",
  COUNTRY: "country",
  LANG: "lang",
  lANGUAGE: "language",
  VISIT_ID: "VISIT-ID",
  LOGOUT_GUARD: "LOGOUT-GUARD",
  USER_ID_HASH:
    "x7k9m2p4q8r1s5t3u6v2w9y4z7a1b5c8d2e6f9g3h7j1k4l8m2n5p9q3r6s1t4u7v2w5x8y1z4a7b2c5d8e1f4g7h2j5k8l1m4n7o2p5q8r1s4t7u2v5w8x1y4z7",
} as const;

/** A copy of `HTTPONLY_COOKIE_NAMES` in utils/cookies/cookie-manager.ts. */
export const HTTPONLY_COOKIE_NAMES = new Set<string>([
  COOKIE_NAMES.MARKET_TOKEN,
  COOKIE_NAMES.MARKET_REFRESH_TOKEN,
  COOKIE_NAMES.DEVICE_TOKEN,
  COOKIE_NAMES.CHAT_TOKEN,
  COOKIE_NAMES.CHAT_REFRESH_TOKEN,
  COOKIE_NAMES.STORIES_TOKEN,
  COOKIE_NAMES.WALLET_TOKEN,
  COOKIE_NAMES.USER_ID_HASH,
  COOKIE_NAMES.USER_DATA,
  COOKIE_NAMES.USER_CHAT,
  COOKIE_NAMES.USER_STORIES,
  COOKIE_NAMES.WALLET_USER,
]);

/** The cookies a test wants the stand-in to hold, keyed by cookie name. */
export type CookieJar = Record<string, any>;

/**
 * Build a fresh stand-in for the cookie manager.
 *
 * It covers everything the real module makes available, server half included:
 * `getCookieServer`, `getCookie`, `setCookie`, `deleteCookie`,
 * `clearHashedUserId`, `setLocaizationCookies`, `COOKIE_NAMES` and
 * `HTTPONLY_COOKIE_NAMES`. A missing part would break any test whose code path
 * happens to reach it.
 *
 * Reads and writes go to a plain object held by this stand-in, so nothing
 * touches a real browser cookie store. Pass a starting jar if a test needs a
 * cookie to be there already.
 */
export function makeCookieManagerMock(initialCookies: CookieJar = {}) {
  const jar: CookieJar = { ...initialCookies };

  return {
    COOKIE_NAMES,
    HTTPONLY_COOKIE_NAMES,

    // The jar itself, so a test can look at what the code under test wrote.
    __jar: jar,

    getCookie: vi.fn((name: string) => jar[name] ?? null),
    getCookieServer: vi.fn(async (name: string) => jar[name] ?? null),
    setCookie: vi.fn((name: string, value: any) => {
      jar[name] = value;
    }),
    deleteCookie: vi.fn((name: string) => {
      delete jar[name];
    }),
    clearHashedUserId: vi.fn(() => {
      delete jar[COOKIE_NAMES.USER_ID_HASH];
    }),
    setLocaizationCookies: vi.fn((country: string, language: string) => {
      if (country) jar[COOKIE_NAMES.COUNTRY] = country;
      if (language) {
        jar[COOKIE_NAMES.LANG] = language.toLowerCase();
        jar[COOKIE_NAMES.lANGUAGE] = language.toLowerCase();
      }
    }),
  };
}
