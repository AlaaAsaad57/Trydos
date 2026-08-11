// @vitest-environment node
//
// The cookie contract: which cookies exist, which one holds the auth token, and
// which of them the browser must not be able to read. AC-13 and AC-14.
//
// These are constants, and that is the point. Every other part of the app —
// sign-out, the auth routes, the request proxy, the one-time-code limiter —
// reads these names and this set. Pinning them here means a change to any of
// them has to be deliberate.
//
// The server-side read is covered too, now that it lives in its own module.
// It used to be unreachable: the reader came in through a bare `require` at
// module scope inside a `try`, which the runner does not provide, so every read
// returned null even with the cookie present — a test written the obvious way
// passed while proving nothing.
//
// What is NOT covered here, and why: the three browser-only helpers
// (get/set/delete) refuse to run outside a browser. This ticket is the
// server-side plumbing; they belong with the client-side phase.
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  COOKIE_NAMES,
  HTTPONLY_COOKIE_NAMES,
} from "utils/cookies/cookie-manager";
import { makeNextHeadersMock } from "../mocks/nextHeaders";

const headers = makeNextHeadersMock();
vi.mock("next/headers", () => headers);

// The token module pulls in the failure reporter, and that drags the whole
// error-reporting stack behind it. Nothing here calls it, so standing it in
// keeps this file offline and quick — the same stand-in the token module's own
// test file uses.
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: vi.fn(async () => undefined),
  default: vi.fn(async () => undefined),
}));

// Anything that reaches next/headers is imported inside the tests, never at the
// top of the file: a top-level import would run before the stand-in above
// exists. That is the server reader, and the token module.
const loadReader = async () =>
  (await import("utils/cookies/server-cookie-manager")).getCookieServer;
const loadPurgeList = async () =>
  (await import("utils/server/tokenManager")).SECURE_COOKIE_NAMES;

beforeEach(() => {
  headers.__reset();
});

describe("cookie names (AC-13)", () => {
  it("holds the auth token in one cookie, for guest and signed-in alike", () => {
    expect(COOKIE_NAMES.MARKET_TOKEN).toBe("MARKET-TOKEN");
  });

  it("keeps the refresh token in its own cookie", () => {
    expect(COOKIE_NAMES.MARKET_REFRESH_TOKEN).toBe("MARKET-REFRESH-TOKEN");
  });

  it("still defines the legacy device cookie, for cleanup only", () => {
    // It has to exist so sign-out can purge it from browsers that still carry
    // it. Nothing may read it or write it — see the next test.
    expect(COOKIE_NAMES.DEVICE_TOKEN).toBe("DEVICE-TOKEN");
  });

  it("is named nowhere outside the cleanup lists it exists for", async () => {
    // AC-13 says the legacy cookie survives only in cleanup lists: never read,
    // never written. The repository rule says the same in as many words.
    //
    // `services/elastic/sellerComments.ts` used to break it — it declared its
    // own copy of the name and read the cookie as a fallback token. That read is
    // gone. This walks the source so a new one cannot appear unnoticed.
    const { execSync } = await import("node:child_process");
    const hits = execSync(
      'git grep -ln "COOKIE_NAMES.DEVICE_TOKEN\\|\\"DEVICE-TOKEN\\"" -- "*.ts" "*.tsx" ":!tests/**"',
      { encoding: "utf8" },
    )
      .split("\n")
      .filter(Boolean)
      // Where it is declared, and the cleanup list it exists for.
      .filter((file) => file !== "utils/cookies/cookie-manager.ts")
      .filter((file) => file !== "utils/server/tokenManager.ts");

    expect(hits).toEqual([]);
  });

  it("keeps the visit id and the logout guard separate from the auth cookies", () => {
    // The visit id is never rotated, so the one-time-code limit cannot be reset
    // by forcing a token refresh. The logout guard is what stops a late
    // rejection resurrecting a session that was just signed out.
    expect(COOKIE_NAMES.VISIT_ID).toBe("VISIT-ID");
    expect(COOKIE_NAMES.LOGOUT_GUARD).toBe("LOGOUT-GUARD");
  });
});

describe("cookies the browser must not read (AC-14)", () => {
  const mustBeHidden = [
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
  ];

  it.each(mustBeHidden)("keeps %s out of the browser's reach", (name) => {
    expect(HTTPONLY_COOKIE_NAMES.has(name)).toBe(true);
  });

  it("does not hide the localisation cookies, which the client does read", () => {
    // Widened on purpose: the set's type is narrowed to the names it was built
    // from, so asking about a name that is deliberately absent needs the wider
    // type. That absence is the assertion.
    const hidden = HTTPONLY_COOKIE_NAMES as ReadonlySet<string>;
    expect(hidden.has(COOKIE_NAMES.COUNTRY)).toBe(false);
    expect(hidden.has(COOKIE_NAMES.LANG)).toBe(false);
  });

  it("is the same list the token module purges on sign-out", async () => {
    // Two lists used to make this claim: HTTPONLY_COOKIE_NAMES here, and a
    // hand-written SECURE_COOKIE_NAMES in the token module. They drifted — the
    // chat refresh token was in one and not the other, so which list a change
    // happened to consult decided whether that cookie was protected and whether
    // sign-out cleared it.
    //
    // The token module now derives its list from this one. This test fails if a
    // second hand-written copy comes back.
    const purged = await loadPurgeList();

    expect([...purged].sort()).toEqual([...HTTPONLY_COOKIE_NAMES].sort());
  });

  it("clears the chat refresh token on sign-out, like every other token", async () => {
    // The concrete cookie the drift above left unprotected.
    const purged = await loadPurgeList();

    expect(purged).toContain(COOKIE_NAMES.CHAT_REFRESH_TOKEN);
  });
});

describe("reading a cookie on the server", () => {
  it("returns a plain string as it was stored", async () => {
    const getCookieServer = await loadReader();
    headers.__reset({
      cookies: { [COOKIE_NAMES.MARKET_TOKEN]: "fake.jwt.abc" },
    });

    expect(await getCookieServer(COOKIE_NAMES.MARKET_TOKEN)).toBe(
      "fake.jwt.abc",
    );
  });

  it("gives back a profile as an object, not the text it was stored as", async () => {
    // The app stores JSON encoded. A caller that had to parse it itself would
    // sooner or later parse it differently somewhere.
    const getCookieServer = await loadReader();
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.USER_DATA]: encodeURIComponent(
          JSON.stringify({ id: 7, phone: "0500000000" }),
        ),
      },
    });

    expect(await getCookieServer(COOKIE_NAMES.USER_DATA)).toEqual({
      id: 7,
      phone: "0500000000",
    });
  });

  it("undoes the encoding a stored value was written with", async () => {
    const getCookieServer = await loadReader();
    headers.__reset({ cookies: { greeting: encodeURIComponent("a b+c") } });

    expect(await getCookieServer("greeting")).toBe("a b+c");
  });

  it("returns nothing for a cookie that is not there", async () => {
    const getCookieServer = await loadReader();

    expect(await getCookieServer("no-such-cookie")).toBeNull();
  });

  it("returns nothing for a cookie that is present but empty", async () => {
    const getCookieServer = await loadReader();
    headers.__reset({ cookies: { [COOKIE_NAMES.MARKET_TOKEN]: "" } });

    expect(await getCookieServer(COOKIE_NAMES.MARKET_TOKEN)).toBeNull();
  });

  it("hands back text it cannot parse rather than throwing", async () => {
    // A half-written or hand-edited cookie must not take a page down.
    const getCookieServer = await loadReader();
    headers.__reset({ cookies: { [COOKIE_NAMES.USER_DATA]: "{not json" } });

    expect(await getCookieServer(COOKIE_NAMES.USER_DATA)).toBe("{not json");
  });

  it("returns nothing when there is no request to read from", async () => {
    // A static render has no request store, so the framework throws. A missing
    // cookie is the right answer for a request that does not exist — the old
    // code answered null here too, and callers depend on it.
    const getCookieServer = await loadReader();
    headers.cookies.mockRejectedValueOnce(
      new Error("`cookies` was called outside a request scope."),
    );

    expect(await getCookieServer(COOKIE_NAMES.MARKET_TOKEN)).toBeNull();
  });
});
