// Phase 1's smoke test: proof that the harness itself works.
//
// It asserts four things, and deliberately nothing else. Every later phase tests
// the product; this file tests the machinery those phases stand on:
//
//   1. the built server is up and answering on the loopback origin;
//   2. a guest gets the real HttpOnly cookie pair, and the response body carries
//      no token;
//   3. a proxied, allow-listed guest read reaches the gateway — which proves the
//      whole chain at once: the jar held the cookie, the proxy read it, the
//      routing decision ran, and a real staging backend answered;
//   4. redaction masks every configured secret, and a token by shape.
//
// The whole file skips when the staging addresses are not configured, and in that
// case the global setup never built anything either.

import { beforeAll, describe, expect, it } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import {
  CookieJar,
  containsSecret,
  envValue,
  hasBackends,
  jarFetch,
  proxyJson,
  redact,
  registerGuest,
  type GuestRegistration,
} from "./harness";

describe.skipIf(!hasBackends())("the live harness", () => {
  // One guest for the file. Registering per test would create a staging row per
  // assertion for no gain, and rule 9 — one login per identity per run — starts
  // as a habit here rather than at phase 6.
  const guest = new CookieJar("guest");
  let registration: GuestRegistration;

  beforeAll(async () => {
    registration = await registerGuest(guest);
  });

  it("answers on the loopback origin", async () => {
    const response = await jarFetch(guest)("/");

    // Any answer proves it is listening. The storefront root redirects to a
    // locale path, so this is a 307 rather than a 200 — asserting the redirect
    // itself belongs to phase 13, which owns locale routing.
    expect(response.status).toBeLessThan(500);
  });

  it("gives a guest the token pair without putting a token in the body", () => {
    expect(registration.status).toBe(200);

    // The single auth cookie, plus its rotating refresh partner. Both, or the
    // session cannot survive the first expiry.
    expect(registration.cookies).toContain(COOKIE_NAMES.MARKET_TOKEN);
    expect(registration.cookies).toContain(COOKIE_NAMES.MARKET_REFRESH_TOKEN);

    // The route strips both from what it returns (NFR-3). A token in a response
    // body is readable by client JavaScript, which is the whole thing HttpOnly
    // cookies exist to prevent.
    expect(containsSecret(registration.body)).toBe(false);
  });

  it("serves an allow-listed guest read from the gateway", async () => {
    const { status, response, body } = await proxyJson(guest, {
      service: "market",
      url: "/customer/info",
    });

    expect(status, redact(body)).toBe(200);

    // The backend's own answer about which of the two served the request.
    // `/customer/info` is on the guest allow-list and this jar holds a guest
    // token, so it must be the gateway. Phase 5 walks the whole list both ways.
    expect(response.headers.get("x-market-backend")).toBe("gateway");
  });

  it("masks every configured secret, and a token by its shape", () => {
    const secrets = [
      "TEST_ACCOUNT_PHONE",
      "TEST_ACCOUNT_PHONE_2",
      "TEST_ACCOUNT_OTP",
      "FLEET_EMAIL",
      "FLEET_PASSWORD",
      "ADMIN_DASHBOARD_EMAIL",
      "ADMIN_DASHBOARD_PASSWORD",
    ]
      .map((key) => envValue(key))
      .filter((value) => value !== "");

    for (const secret of secrets) {
      const masked = redact(`something failed near ${secret} here`);
      expect(masked).not.toContain(secret);
      expect(masked).toContain("[redacted:");
    }

    // Not a real token — a shape. Tokens are minted at run time and never
    // configured, so this is the only rule that can catch one.
    const shaped = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.notasignature";
    expect(redact(`Authorization: Bearer ${shaped}`)).not.toContain(shaped);
    expect(containsSecret(`MARKET-TOKEN=${shaped}`)).toBe(true);
  });
});
