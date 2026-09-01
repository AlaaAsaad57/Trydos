// Does a shared cache entry ever carry one shopper's data?
//
// The homepage is partially prerendered: a shared shell plus dynamic holes. The
// signed-in navigation is one of those holes — `AuthNavContainer` reads the
// profile cookies and streams behind `<Suspense>` (D-9). This check asks the
// running server for the same page twice, with and without a profile cookie,
// and looks for one request's marker in the other request's document.
//
// WHAT THIS CHECK DOES NOT COVER
//
// `pnpm start` has no CDN in front of it. Every header risk that only appears
// when a shared cache sits between the browser and the app — a proxy storing a
// document with no `Vary: Cookie`, an edge cache keyed on the URL alone — is out
// of this check's reach entirely. It sees what one server sends. It cannot see
// what a CDN does with it.
//
// That part is covered by tests/next-config.test.ts, which asserts on the
// headers the config sends, and by the platform firewall rules. Do not read a
// pass here as "the CDN is safe".
//
// HOW TO RUN IT
//
//   pnpm build && pnpm start -p 3111
//   pnpm test:run -- tests/cache/sharedEntryIsNotPersonal.test.ts
//
// With no server on that port the server-dependent cases skip with a message
// naming those two commands. They skip rather than fail because this file sits
// in the unit suite, which CI runs on every pull request with no server up.
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { http, passthrough } from "msw";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { server } from "../msw/server";

const BASE = process.env.CACHE_CHECK_BASE ?? "http://localhost:3111";
const PATH = "/sy-en";

// The wire names, not the constant names. `USER_DATA` is the key in
// utils/cookies/cookie-manager; `User-Data` is what actually travels. Getting
// this wrong is how the first draft of this check passed without testing
// anything (finding 16), so the names are written out here and checked against
// the app's own list below.
const WIRE_USER_DATA = "User-Data";
const WIRE_USER_CHAT = "USER-CHAT";
const WIRE_USER_STORIES = "USER-STORIES";
const WIRE_MARKET_TOKEN = "MARKET-TOKEN";

// A made-up shopper, not a real one. No credential is needed: the personal read
// in the document comes from the profile cookies, which the login route writes
// as `encodeURIComponent(JSON.stringify(profile))` and which
// `AuthNavContainer` reads straight back. A real staging token would only make
// the app's own backend calls succeed; it would not change what this check
// looks at, and the repository's rules forbid keeping one in a test file.
const MARKER = "CacheCheckShopper4f2a";
const PROFILE = {
  id: 999999,
  first_name: MARKER,
  last_name: "Fixture",
  phone: "0000000000",
};

const cookie = (name: string, value: unknown) =>
  `${name}=${encodeURIComponent(JSON.stringify(value))}`;

// All three profile cookies, because `getUserType()` in
// components/Home/UserNavTopSection.tsx only reports a fully signed-in shopper
// when the chat and stories profiles are there too. One cookie would render the
// half-signed-in branch and put less of the profile on the page.
const SIGNED_IN_JAR = [
  cookie(WIRE_USER_DATA, PROFILE),
  cookie(WIRE_USER_CHAT, { id: 999999, first_name: MARKER }),
  cookie(WIRE_USER_STORIES, { id: 999999, first_name: MARKER }),
].join("; ");

let serverIsUp = false;
let signedInHtml = "";
let signedInHeaders: Headers | null = null;
let guestHtml = "";

const NO_SERVER =
  `no server answered at ${BASE}${PATH}. Run \`pnpm build && pnpm start -p 3111\` ` +
  `first — this check cannot run against \`next dev\`, which does not store ` +
  `pages the way production does`;

beforeEach(() => {
  // The unit suite runs behind msw with `onUnhandledRequest: "error"`, so a real
  // request to the running server would be refused before it left the process.
  // Registered per test because tests/setup.ts resets the handlers after each
  // one.
  server.use(http.all(`${BASE}/*`, () => passthrough()));
});

beforeAll(async () => {
  server.use(http.all(`${BASE}/*`, () => passthrough()));

  // The signed-in request goes FIRST, on purpose. Warming the entry as a guest
  // and then asking as a signed-in shopper proves nothing: the guest entry was
  // already correct. The risk runs the other way — a signed-in render being
  // stored and handed to the next visitor.
  try {
    const signedIn = await fetch(`${BASE}${PATH}`, {
      headers: { cookie: SIGNED_IN_JAR },
      signal: AbortSignal.timeout(90_000),
    });
    serverIsUp = signedIn.ok;
    signedInHeaders = signedIn.headers;
    signedInHtml = await signedIn.text();
  } catch {
    serverIsUp = false;
    return;
  }

  const guest = await fetch(`${BASE}${PATH}`, {
    signal: AbortSignal.timeout(90_000),
  });
  guestHtml = await guest.text();
}, 200_000);

describe("a shared cache entry never carries one shopper's data", () => {
  it("sends the cookie names the app actually reads", () => {
    expect(
      WIRE_USER_DATA,
      "this check sends a profile cookie under a name the app does not read, so " +
        "the server would see a guest both times and the comparison below could " +
        "never fail",
    ).toBe(COOKIE_NAMES.USER_DATA);
    expect(
      WIRE_USER_CHAT,
      "this check sends the chat profile under a name the app does not read",
    ).toBe(COOKIE_NAMES.USER_CHAT);
    expect(
      WIRE_USER_STORIES,
      "this check sends the stories profile under a name the app does not read",
    ).toBe(COOKIE_NAMES.USER_STORIES);
    expect(
      WIRE_MARKET_TOKEN,
      "the auth cookie's wire name changed, so the note above about which cookie " +
        "carries the token is now wrong",
    ).toBe(COOKIE_NAMES.MARKET_TOKEN);
  });

  it("renders the shopper's own marker when it is given the profile", (ctx) => {
    if (!serverIsUp) return ctx.skip(NO_SERVER);

    // The positive control. If the signed-in document does not itself contain
    // the marker, the comparison in the next case is empty and would pass no
    // matter what the server did.
    expect(
      signedInHtml.includes(MARKER),
      `the signed-in request rendered no trace of the profile it was given, so ` +
        `this check has nothing to look for and cannot fail — the fixture, not ` +
        `the app, is what to fix (document was ${signedInHtml.length} bytes)`,
    ).toBe(true);
  });

  it("does not put a signed-in shopper's profile into the guest document", (ctx) => {
    if (!serverIsUp) return ctx.skip(NO_SERVER);

    expect(
      guestHtml.includes(MARKER),
      "the guest document carries the signed-in shopper's profile, so a shared " +
        "entry is serving one shopper's data to another",
    ).toBe(false);
  });

  it("never marks a document that streams a signed-in navigation as public", (ctx) => {
    if (!serverIsUp) return ctx.skip(NO_SERVER);

    const cacheControl = signedInHeaders?.get("cache-control") ?? "";

    expect(
      cacheControl,
      `the home document answered "${cacheControl}"; a document that streams a ` +
        `signed-in navigation must never be publicly cacheable`,
    ).not.toContain("public");
  });
});
