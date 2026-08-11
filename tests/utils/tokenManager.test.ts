// @vitest-environment node
//
// Cookie shape, credential lookup, verified-shopper detection, backend routing,
// and the cleaners that decide what leaves the server. AC-15 to AC-19.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { makeNextHeadersMock } from "../mocks/nextHeaders";

const headers = makeNextHeadersMock();
vi.mock("next/headers", () => headers);

// `logSecureRequest` awaits the failure reporter, and that reporter fires its
// own outbound request which two catch blocks swallow — so the fake network
// cannot fail a test on it. Standing it in is what keeps this file offline.
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: vi.fn(async () => undefined),
  default: vi.fn(async () => undefined),
}));

// Reserved names that cannot resolve anywhere, so a request that somehow
// escapes a stand-in dies on this machine instead of leaving it.
const CORE = "https://core.invalid";
const GATEWAY = "https://gateway.invalid";

/** Store a profile the way the app stores it: encoded JSON. */
const seedProfile = (profile: unknown) => {
  headers.__reset({
    cookies: {
      [COOKIE_NAMES.USER_DATA]: encodeURIComponent(JSON.stringify(profile)),
    },
  });
};

beforeEach(() => {
  headers.__reset();
  vi.stubEnv("BACKEND_URL", CORE);
  vi.stubEnv("GO_BACKEND_URL", GATEWAY);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cookie shape (AC-15)", () => {
  it("writes token cookies hidden from the browser, same-site strict, site-wide", async () => {
    const { SECURE_COOKIE_OPTIONS } = await import("utils/server/tokenManager");

    expect(SECURE_COOKIE_OPTIONS).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });
  });

  it("gives a token cookie 48 hours by default, not a year", async () => {
    // The lifetime override is deliberately left unset here, so this proves the
    // default branch rather than whatever the environment happens to hold.
    vi.stubEnv("TOKEN_COOKIE_MAX_AGE", "");
    vi.resetModules();
    const { SECURE_COOKIE_OPTIONS } = await import("utils/server/tokenManager");

    expect(SECURE_COOKIE_OPTIONS.maxAge).toBe(60 * 60 * 48);
  });

  it("lets the deployment override the token lifetime", async () => {
    vi.stubEnv("TOKEN_COOKIE_MAX_AGE", "3600");
    vi.resetModules();
    const { SECURE_COOKIE_OPTIONS } = await import("utils/server/tokenManager");

    expect(SECURE_COOKIE_OPTIONS.maxAge).toBe(3600);
  });

  it("keeps the refresh cookie alive for 30 days, far longer than the token", async () => {
    // Storage must never expire before the thing it holds: the refresh token is
    // good for about a month and is re-issued on every use.
    const { SECURE_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } = await import(
      "utils/server/tokenManager"
    );

    expect(REFRESH_COOKIE_OPTIONS.maxAge).toBe(60 * 60 * 24 * 30);
    expect(REFRESH_COOKIE_OPTIONS.maxAge).toBeGreaterThan(
      SECURE_COOKIE_OPTIONS.maxAge,
    );
    expect(REFRESH_COOKIE_OPTIONS).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
    });
  });

  it("marks cookies secure in production and not outside it", async () => {
    // `secure` is decided once, when the module loads, so the only way to see
    // the other branch is to throw the module away and load it again. The
    // registry and the environment are both put back afterwards, or every test
    // after this one would be reading production values.
    const { SECURE_COOKIE_OPTIONS } = await import("utils/server/tokenManager");
    expect(SECURE_COOKIE_OPTIONS.secure).toBe(false);

    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const production = await import("utils/server/tokenManager");
    expect(production.SECURE_COOKIE_OPTIONS.secure).toBe(true);

    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("records every option when a cookie is actually written", async () => {
    // Membership of a list does not prove a cookie was written hidden. This
    // asserts the options that reached the cookie store.
    vi.resetModules();
    const { setSecureCookie } = await import("utils/server/tokenManager");
    await setSecureCookie(COOKIE_NAMES.MARKET_TOKEN, "a-token");

    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)).toMatchObject({
      value: "a-token",
      options: { httpOnly: true, sameSite: "strict", path: "/" },
    });
  });

  it("keeps profile cookies for a year, and encodes what it stores", async () => {
    vi.resetModules();
    const { setSecureCookieJSON } = await import("utils/server/tokenManager");
    await setSecureCookieJSON(COOKIE_NAMES.USER_DATA, { id: 1, name: "A B" });

    const write = headers.__lastWrite(COOKIE_NAMES.USER_DATA);
    expect(write?.options).toMatchObject({
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
    });
    expect(JSON.parse(decodeURIComponent(write!.value))).toEqual({
      id: 1,
      name: "A B",
    });
  });
});

describe("credential lookup (AC-16)", () => {
  beforeEach(() => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.MARKET_TOKEN]: "market-value",
        [COOKIE_NAMES.CHAT_TOKEN]: "chat-value",
        [COOKIE_NAMES.STORIES_TOKEN]: "stories-value",
        [COOKIE_NAMES.WALLET_TOKEN]: "wallet-value",
        [COOKIE_NAMES.USER_ID_HASH]: "comments-value",
      },
    });
  });

  it.each([
    ["market", "market-value"],
    ["market-dashboard", "market-value"],
    ["chat", "chat-value"],
    ["stories", "stories-value"],
    ["wallet", "wallet-value"],
    ["comments", "comments-value"],
  ])("gives %s its own credential", async (server, expected) => {
    const { getTokenForServer } = await import("utils/server/tokenManager");
    await expect(getTokenForServer(server as any)).resolves.toBe(expected);
  });

  it("gives search no credential rather than someone else's", async () => {
    const { getTokenForServer } = await import("utils/server/tokenManager");
    await expect(getTokenForServer("elastic" as any)).resolves.toBe("");
  });

  it("gives an unknown service an empty credential", async () => {
    const { getTokenForServer } = await import("utils/server/tokenManager");
    await expect(getTokenForServer("nonsense" as any)).resolves.toBe("");
  });

  it("never hands out the legacy device cookie", async () => {
    headers.__reset({
      cookies: { [COOKIE_NAMES.DEVICE_TOKEN]: "legacy-value" },
    });
    const { getTokenForServer } = await import("utils/server/tokenManager");

    await expect(getTokenForServer("market" as any)).resolves.toBe("");
  });
});

describe("verified-shopper detection (AC-17)", () => {
  it.each([
    ["undefined", undefined],
    ["null", null],
    ["the number zero", 0],
    ['the text "0"', "0"],
    ["an empty string", ""],
    ["only spaces", "   "],
  ])("does not count %s as a verified phone", async (_label, phone) => {
    const { hasValidPhone } = await import("utils/server/tokenManager");
    expect(hasValidPhone({ phone })).toBe(false);
  });

  it("counts a real phone as verified", async () => {
    const { hasValidPhone } = await import("utils/server/tokenManager");
    expect(hasValidPhone({ phone: "+441234567890" })).toBe(true);
  });

  it("treats a missing profile as not verified", async () => {
    const { hasValidPhone } = await import("utils/server/tokenManager");
    expect(hasValidPhone(null)).toBe(false);
    expect(hasValidPhone({})).toBe(false);
  });

  it("reads the profile cookie to decide", async () => {
    seedProfile({ phone: "+441234567890" });
    const { isVerifiedMarketUser } = await import("utils/server/tokenManager");
    await expect(isVerifiedMarketUser()).resolves.toBe(true);
  });

  it("falls back to guest when the profile cannot be read at all", async () => {
    // Contexts without request cookies must steer to guest, not throw. Routing
    // is a load decision; the backends still check the token themselves.
    headers.__reset();
    headers.cookies.mockImplementationOnce(async () => {
      throw new Error("no request context");
    });

    const { isVerifiedMarketUser } = await import("utils/server/tokenManager");
    await expect(isVerifiedMarketUser()).resolves.toBe(false);
  });
});

describe("backend routing (AC-18)", () => {
  it("sends a verified shopper to the core backend", async () => {
    seedProfile({ phone: "+441234567890" });
    const { getMarketFetchBase } = await import("utils/server/tokenManager");

    await expect(getMarketFetchBase()).resolves.toBe(CORE);
  });

  it("sends a guest to the gateway", async () => {
    headers.__reset();
    const { getMarketFetchBase } = await import("utils/server/tokenManager");

    await expect(getMarketFetchBase()).resolves.toBe(GATEWAY);
  });

  it("recognises an allow-listed address", async () => {
    const { isFromGoApi } = await import("utils/server/tokenManager");
    expect(isFromGoApi("/customer/info")).toBe(true);
    expect(isFromGoApi("/web/home/startingSettings")).toBe(true);
  });

  it("ignores a query string when matching the allow-list", async () => {
    const { isFromGoApi } = await import("utils/server/tokenManager");
    expect(isFromGoApi("/customer/info?expand=addresses")).toBe(true);
  });

  it("matches an address that ends in a changing segment", async () => {
    const { isFromGoApi } = await import("utils/server/tokenManager");
    expect(isFromGoApi("/web/product/globalDetails/some-product-slug")).toBe(
      true,
    );
  });

  it("does not match a sibling that merely starts the same way", async () => {
    const { isFromGoApi } = await import("utils/server/tokenManager");
    expect(isFromGoApi("/web/product/globalDetailsSomethingElse")).toBe(false);
  });

  it("leaves an address that is not allow-listed to the core backend", async () => {
    const { isFromGoApi } = await import("utils/server/tokenManager");
    expect(isFromGoApi("/orders/place")).toBe(false);
  });
});

describe("what leaves the server (AC-19)", () => {
  it("strips tokens from a profile before the browser sees it", async () => {
    const { sanitizeUserData } = await import("utils/server/tokenManager");

    const safe = sanitizeUserData({
      id: 1,
      name: "A B",
      token: "secret",
      access_token: "secret",
      id_token: "secret",
      // The refresh token used to survive this cleaner while its sibling below
      // stripped it, so a profile carrying the field reached the browser with
      // it intact. Both cleaners now remove it.
      refresh_token: "secret",
    });

    expect(safe).toEqual({ id: 1, name: "A B" });
  });

  it("strips tokens, including the refresh token, from a service profile", async () => {
    const { sanitizeServiceUser } = await import("utils/server/tokenManager");

    const safe = sanitizeServiceUser({
      role_id: 2,
      token: "secret",
      access_token: "secret",
      refresh_token: "secret",
    });

    expect(safe).toEqual({ role_id: 2 });
  });

  it("removes the private wallet fields and keeps the useful ones", async () => {
    const { sanitizeWalletUser } = await import("utils/server/tokenManager");

    const safe = sanitizeWalletUser({
      id: 9,
      balance: 10,
      email: "a@b.c",
      isBlocked: false,
      isTwoFactorEnabled: true,
      kycVerification: {},
      kycStatus: "done",
      sessionId: "abc",
    });

    expect(safe).toEqual({ id: 9, balance: 10 });
  });

  it("returns nothing for an absent profile rather than an empty shell", async () => {
    const { sanitizeUserData, sanitizeServiceUser, sanitizeWalletUser } =
      await import("utils/server/tokenManager");

    expect(sanitizeUserData(null)).toBeNull();
    expect(sanitizeServiceUser(undefined)).toBeNull();
    expect(sanitizeWalletUser(null)).toBeNull();
  });

  it("reduces a credential in a log to an unusable hint", async () => {
    const { maskToken } = await import("utils/server/tokenManager");

    const masked = maskToken("abcdefghijklmnopqrstuvwxyz");
    expect(masked).toBe("abcd...wxyz");
    expect(masked).not.toContain("efghijklmnopqrst");
  });

  it("hides a short credential completely rather than mostly", async () => {
    const { maskToken } = await import("utils/server/tokenManager");

    expect(maskToken("short")).toBe("***");
    expect(maskToken("")).toBe("***");
  });
});
