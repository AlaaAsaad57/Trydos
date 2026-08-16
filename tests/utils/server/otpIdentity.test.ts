// @vitest-environment node
//
// Who is asking for a code. AC-8 to AC-14.
//
// The limiter counts sends per visitor and per address. That only works if two
// requests from one visitor produce the SAME two keys, and two different
// visitors produce different ones — which is harder than it sounds, because the
// obvious sources of identity all rotate. The sign-in token is replaced on every
// guest re-registration, the account id is replaced with it, and a home
// connection hands out a fresh address suffix per session. Key on any of those
// and a visitor gets a brand-new allowance for free.
//
// So the identity comes from a visit id that is minted once and never cleared,
// and from the address reduced to the part that actually stays put. These tests
// are about those two properties, and about the case where the request cannot
// store anything at all.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { makeNextHeadersMock } from "../../mocks/nextHeaders";
import { jsonReply, makeMockFetch } from "../../mocks/mockFetch";

const headers = makeNextHeadersMock();
vi.mock("next/headers", () => headers);

// The reporter fires its own outbound request that two catch blocks swallow, so
// the fake network cannot fail a test on it. Standing it in keeps this offline
// AND lets the failure tests prove the failure was actually reported.
const LogServerError = vi.fn(async () => undefined);
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...args: unknown[]) => LogServerError(...(args as [])),
  default: (...args: unknown[]) => LogServerError(...(args as [])),
}));

// A reserved name that cannot resolve anywhere: if a call ever escapes the fake
// network, it dies on this machine instead of leaving it. Named for the ROLE the
// backend plays, never for what it is built with.
const GATEWAY = "https://gateway.invalid";

// Every value below is invented and self-describing. Addresses come from the
// ranges reserved for documentation, which cannot be routed to anything real.
const VISIT_ID = "visit-id-for-tests-0000-0000";
const OTHER_VISIT_ID = "visit-id-for-tests-1111-1111";
const CLIENT_IP = "203.0.113.7";

const seed = (options: Parameters<typeof headers.__reset>[0] = {}) =>
  headers.__reset({
    cookies: { [COOKIE_NAMES.VISIT_ID]: VISIT_ID, ...options.cookies },
    headers: { "x-forwarded-for": CLIENT_IP, ...options.headers },
    failWrites: options.failWrites,
  });

/** Store a profile the way the app stores it: encoded JSON. */
const profileCookie = (profile: unknown) =>
  encodeURIComponent(JSON.stringify(profile));

beforeEach(() => {
  seed();
  LogServerError.mockClear();
  vi.stubEnv("GO_BACKEND_URL", GATEWAY);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("the same visitor gets the same keys (AC-8)", () => {
  it("gives two requests from one visitor identical session and address keys", async () => {
    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");

    const first = await resolveOtpIdentity();
    const second = await resolveOtpIdentity();

    expect(first.sid).toBe(second.sid);
    expect(first.ip).toBe(second.ip);
  });

  it("gives a different visitor different keys", async () => {
    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");
    const mine = await resolveOtpIdentity();

    seed({ cookies: { [COOKIE_NAMES.VISIT_ID]: OTHER_VISIT_ID } });
    const theirs = await resolveOtpIdentity();

    expect(theirs.sid).not.toBe(mine.sid);
  });

  it("keeps the session key even when the sign-in token is replaced", async () => {
    // This is the whole point of the visit id. A guest re-registration mints a
    // fresh token and a fresh account id mid-session; if either one keyed the
    // counter, forcing that rotation would reset the allowance.
    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");

    seed({
      cookies: {
        [COOKIE_NAMES.MARKET_TOKEN]: "market-token-before",
        [COOKIE_NAMES.USER_DATA]: profileCookie({ id: 1001 }),
      },
    });
    const before = await resolveOtpIdentity();

    seed({
      cookies: {
        [COOKIE_NAMES.MARKET_TOKEN]: "market-token-after",
        [COOKIE_NAMES.USER_DATA]: profileCookie({ id: 2002 }),
      },
    });
    const after = await resolveOtpIdentity();

    expect(after.sid).toBe(before.sid);
    expect(after.userId).toBe("2002");
    expect(before.userId).toBe("1001");
  });

  it("never puts the raw visit id or address into a key", async () => {
    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");
    const identity = await resolveOtpIdentity();

    expect(identity.sid).not.toContain(VISIT_ID);
    expect(identity.ip).not.toContain(CLIENT_IP);
    expect(identity.sid).toMatch(/^[0-9a-f]{32}$/);
    expect(identity.ip).toMatch(/^[0-9a-f]{32}$/);
  });

  it("mixes in the server's secret, so a key cannot be worked out from outside", async () => {
    // Without the secret the hash is reversible in practice: the whole IPv4
    // space is small enough to hash end to end, so anyone able to read a key
    // could tell which address it stood for. With it, the same address gives a
    // different key on a deployment that holds a different secret.
    const { hashKey } = await import("utils/server/otpIdentity");

    vi.stubEnv("OTP_KEY_SALT", "salt-for-tests-one");
    const withFirst = hashKey(CLIENT_IP);

    vi.stubEnv("OTP_KEY_SALT", "salt-for-tests-two");
    const withSecond = hashKey(CLIENT_IP);

    expect(withFirst).not.toBe(withSecond);
    expect(withFirst).toMatch(/^[0-9a-f]{32}$/);
    expect(withSecond).toMatch(/^[0-9a-f]{32}$/);
  });

  it("still gives one visitor one key while the secret stays put", async () => {
    const { hashKey } = await import("utils/server/otpIdentity");
    vi.stubEnv("OTP_KEY_SALT", "salt-for-tests-one");

    expect(hashKey(CLIENT_IP)).toBe(hashKey(CLIENT_IP));
    expect(hashKey(CLIENT_IP)).not.toBe(hashKey("198.51.100.9"));
  });
});

describe("reducing an address to something stable (AC-9)", () => {
  it.each([
    ["a plain v4 address", "203.0.113.7", "203.0.113.7"],
    ["a v4 address inside a v6 one", "::ffff:203.0.113.7", "203.0.113.7"],
    ["a v6 address", "2001:db8:1234:5678:9abc:def0:1234:5678", "2001:db8:1234:5678::/64"],
    ["a shortened v6 address", "2001:db8::1", "2001:db8:0:0::/64"],
    ["a bracketed address", "[2001:db8:1234:5678::1]", "2001:db8:1234:5678::/64"],
    ["an address with a zone", "fe80::1%eth0", "fe80:0:0:0::/64"],
    ["leading zeros", "2001:0db8:0000:0042::1", "2001:db8:0:42::/64"],
    ["nothing at all", "", "0.0.0.0"],
    ["a missing value", null, "0.0.0.0"],
  ])("reduces %s", async (_name, raw, expected) => {
    const { normalizeIp } = await import("utils/server/otpIdentity");
    expect(normalizeIp(raw as string)).toBe(expected);
  });

  it("gives two sessions on one home connection the same address key", async () => {
    // A private v6 address changes its second half on every new connection. Both
    // of these are the same subscriber; keying on the whole address would treat
    // them as two visitors and hand out two allowances.
    const { normalizeIp } = await import("utils/server/otpIdentity");

    expect(normalizeIp("2001:db8:1234:5678:aaaa:aaaa:aaaa:aaaa")).toBe(
      normalizeIp("2001:db8:1234:5678:bbbb:bbbb:bbbb:bbbb"),
    );
    // A different subscriber on the same provider still differs.
    expect(normalizeIp("2001:db8:1234:9999::1")).not.toBe(
      normalizeIp("2001:db8:1234:5678::1"),
    );
  });

  it("reads the address the edge forwarded, in the documented order", async () => {
    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");

    // Each case seeds the request headers from scratch, not through `seed()` —
    // that helper always supplies a forwarded address, which is the very thing
    // the fallback cases need to be missing.
    const withHeaders = async (bag: Record<string, string>) => {
      headers.__reset({
        cookies: { [COOKIE_NAMES.VISIT_ID]: VISIT_ID },
        headers: bag,
      });
      return (await resolveOtpIdentity()).rawIp;
    };

    // A forwarded list: the client is the FIRST entry, the rest are proxies.
    expect(
      await withHeaders({
        "x-forwarded-for": "203.0.113.7, 198.51.100.9, 198.51.100.10",
        "x-real-ip": "198.51.100.99",
      }),
    ).toBe("203.0.113.7");

    expect(await withHeaders({ "x-real-ip": "198.51.100.99" })).toBe(
      "198.51.100.99",
    );
    expect(await withHeaders({ "cf-connecting-ip": "198.51.100.55" })).toBe(
      "198.51.100.55",
    );
    expect(await withHeaders({})).toBe("0.0.0.0");
  });
});

describe("a visitor arriving for the first time (AC-10, AC-11)", () => {
  it("mints a visit id and keeps it for a year, far longer than a token", async () => {
    headers.__reset({ headers: { "x-forwarded-for": CLIENT_IP } });
    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");
    const { SECURE_COOKIE_OPTIONS } = await import("utils/server/tokenManager");

    const identity = await resolveOtpIdentity();

    expect(identity.mintedVisitId).toBe(true);
    expect(identity.visitId).toBeTruthy();

    const write = headers.__lastWrite(COOKIE_NAMES.VISIT_ID);
    expect(write?.value).toBe(identity.visitId);
    expect(write?.options).toMatchObject({ httpOnly: true });
    expect(write?.options.maxAge).toBe(60 * 60 * 24 * 365);

    // The counter must outlive the credential it is defending, or clearing the
    // credential clears the allowance with it.
    expect(Number(write?.options.maxAge)).toBeGreaterThan(
      Number(SECURE_COOKIE_OPTIONS.maxAge),
    );
  });

  it("says the visit id was not minted when the visitor already had one", async () => {
    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");
    const identity = await resolveOtpIdentity();

    expect(identity.mintedVisitId).toBe(false);
    expect(identity.visitId).toBe(VISIT_ID);
    expect(headers.__lastWrite(COOKIE_NAMES.VISIT_ID)).toBeUndefined();
  });

  it("still returns usable keys when the request cannot store cookies", async () => {
    // A plain page render is not allowed to write a cookie. The identity still
    // has to resolve, because the send itself happens in a context that can
    // write and will persist the same id there.
    headers.__reset({
      headers: { "x-forwarded-for": CLIENT_IP },
      failWrites: true,
    });
    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");

    const identity = await resolveOtpIdentity();

    expect(identity.sid).toMatch(/^[0-9a-f]{32}$/);
    expect(identity.mintedVisitId).toBe(true);
    expect(headers.__writes).toHaveLength(0);
  });
});

describe("registering a guest to get an account id (AC-12, AC-13, AC-14)", () => {
  const guestReply = (id: number | string) =>
    jsonReply({
      data: {
        token: "market-token-from-guest-registration",
        refresh_token: "market-refresh-token-from-guest-registration",
        expires_at: "2026-01-03T00:00:00Z",
        user: { id, name: "Guest For Tests" },
      },
    });

  it("registers once, stores what came back, and reports the id", async () => {
    seed({ cookies: { [COOKIE_NAMES.LOCAL]: "tr-tr" } });
    const net = makeMockFetch([guestReply(4242)]);
    vi.stubGlobal("fetch", net.fetch);

    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");
    const identity = await resolveOtpIdentity({ ensureUserId: true });

    // The call itself: one, to the gateway, and carrying the visitor's locale.
    expect(net.calls).toHaveLength(1);
    expect(net.calls[0].url).toBe(`${GATEWAY}/auth/register-guest`);
    expect(net.calls[0].method).toBe("POST");
    expect(net.calls[0].headers).toMatchObject({
      country: "tr",
      language: "tr",
    });

    expect(identity.userId).toBe("4242");
    expect(identity.hasUserId).toBe(true);
    expect(identity.registeredGuest).toBe(true);

    // Both halves of the credential pair are stored, and the profile with them.
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)?.value).toBe(
      "market-token-from-guest-registration",
    );
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_REFRESH_TOKEN)?.value).toBe(
      "market-refresh-token-from-guest-registration",
    );
    expect(headers.__lastWrite(COOKIE_NAMES.USER_DATA)?.value).toContain("4242");
    expect(LogServerError).not.toHaveBeenCalled();
  });

  it("falls back to the default locale when none is stored", async () => {
    const net = makeMockFetch([guestReply(1)]);
    vi.stubGlobal("fetch", net.fetch);

    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");
    await resolveOtpIdentity({ ensureUserId: true });

    expect(net.calls[0].headers).toMatchObject({
      country: "gb",
      language: "en",
    });
  });

  it("reports no id and says so when the registration is refused", async () => {
    const net = makeMockFetch([jsonReply({ message: "refused" }, 400)]);
    vi.stubGlobal("fetch", net.fetch);

    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");
    const identity = await resolveOtpIdentity({ ensureUserId: true });

    expect(identity.userId).toBeNull();
    expect(identity.hasUserId).toBe(false);
    expect(identity.registeredGuest).toBe(false);
    // Still usable: the send is limited by the session key, which does not need
    // an account id.
    expect(identity.sid).toMatch(/^[0-9a-f]{32}$/);
    expect(LogServerError).toHaveBeenCalledTimes(1);
  });

  it("reports no id and says so when the connection drops", async () => {
    const net = makeMockFetch([]); // asking for a reply that was never queued
    vi.stubGlobal("fetch", net.fetch);

    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");
    const identity = await resolveOtpIdentity({ ensureUserId: true });

    expect(identity.userId).toBeNull();
    expect(LogServerError).toHaveBeenCalledTimes(1);
  });

  it("does not register when the visitor already has an account id", async () => {
    seed({ cookies: { [COOKIE_NAMES.USER_DATA]: profileCookie({ id: 77 }) } });
    const net = makeMockFetch([]);
    vi.stubGlobal("fetch", net.fetch);

    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");
    const identity = await resolveOtpIdentity({ ensureUserId: true });

    expect(net.calls).toHaveLength(0);
    expect(identity.userId).toBe("77");
    expect(identity.registeredGuest).toBe(false);
  });

  it("does not register when the caller did not ask for an id", async () => {
    const net = makeMockFetch([]);
    vi.stubGlobal("fetch", net.fetch);

    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");
    const identity = await resolveOtpIdentity();

    expect(net.calls).toHaveLength(0);
    expect(identity.userId).toBeNull();
    expect(identity.hasUserId).toBe(false);
  });

  it("reports whether a sign-in credential is present, without exposing it", async () => {
    seed({ cookies: { [COOKIE_NAMES.MARKET_TOKEN]: "market-token-for-tests" } });
    const { resolveOtpIdentity } = await import("utils/server/otpIdentity");

    const identity = await resolveOtpIdentity();

    expect(identity.hasMarketToken).toBe(true);
    expect(JSON.stringify(identity)).not.toContain("market-token-for-tests");
  });
});
