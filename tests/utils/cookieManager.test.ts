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
// What is NOT covered here, and why:
//
//   - `getCookieServer` cannot be reached by any test. The module loads the
//     framework's request reader through a bare `require` at module scope
//     (cookie-manager.ts:3-11), inside a `try` that swallows the failure. The
//     test runner does not provide that `require`, so the module ends up with no
//     reader at all and every server-side read returns null — even when the
//     stand-in holds the cookie. It fails the same way under a browser-like
//     environment, where the `typeof window` guard skips the require entirely.
//     Recorded as finding 7; fixing it would mean changing the code under test.
//
//   - The three browser-only helpers (get/set/delete) refuse to run outside a
//     browser. This ticket is the server-side plumbing; they belong with the
//     client-side phase.
import { describe, expect, it } from "vitest";

import {
  COOKIE_NAMES,
  HTTPONLY_COOKIE_NAMES,
} from "utils/cookies/cookie-manager";
import { SECURE_COOKIE_NAMES } from "utils/server/tokenManager";

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

  it("PINS A DEFECT — the legacy device cookie is still read by one module (finding 8)", async () => {
    // AC-13 says the legacy cookie survives only in cleanup lists: never read,
    // never written. The repository rule says the same in as many words.
    //
    // It is not true today. This walks the source for uses of that cookie and
    // pins the ONE place that still reads it, so a second place cannot appear
    // without this test going red.
    //
    // When the read below is removed, this test SHOULD fail — change the
    // expectation to an empty list then.
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

    // `services/elastic/sellerComments.ts` declares its own copy of the name
    // (line 91) and reads the cookie through it (line 121). Nothing else does.
    expect(hits).toEqual(["services/elastic/sellerComments.ts"]);
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

  it("PINS A DEFECT — the two lists of hidden cookies disagree (finding 5)", () => {
    // There are two lists that both claim to name every cookie the browser must
    // not read: HTTPONLY_COOKIE_NAMES here, and SECURE_COOKIE_NAMES in the token
    // module. They do not match. The chat refresh token is in one and not the
    // other, so whichever list a future change consults decides whether that
    // cookie is protected.
    //
    // This test pins the disagreement AS IT IS TODAY. It is not the behaviour we
    // want. When the lists are made to agree, this test SHOULD fail — delete it
    // then, and move the name into the test above.
    const inHttpOnlyOnly = [...HTTPONLY_COOKIE_NAMES].filter(
      (name) => !(SECURE_COOKIE_NAMES as readonly string[]).includes(name),
    );

    expect(inHttpOnlyOnly).toEqual([COOKIE_NAMES.CHAT_REFRESH_TOKEN]);
  });
});
