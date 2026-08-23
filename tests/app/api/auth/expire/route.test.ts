// @vitest-environment node
//
// Tests for the expiry route — what happens when a session is found dead.
// AC-13 to AC-17.
//
// The order inside this route is the whole story, and it is the reason the
// criteria are written the way they are:
//
//   0. a logout in progress stops everything;
//   1. one last renewal attempt, so a request that merely lost a race renews
//      instead of destroying a live session;
//   2. only then the session is torn down — and whether it belonged to a
//      verified shopper is read BEFORE that, because the teardown overwrites the
//      profile it would be read from;
//   3. a brand-new guest replaces it.
//
// The renewal helper is stood in, for the same reason as in the renewal route's
// own file: this route's decision is which branch to take, not how an exchange
// is performed. The credential helper runs for real, so every cookie name and
// option below is the real one.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { makeErrorReporterMock } from "../../../../mocks/authGraph";
import { makeMockFetch, jsonReply } from "../../../../mocks/mockFetch";
import { makeNextHeadersMock } from "../../../../mocks/nextHeaders";

const headers = makeNextHeadersMock();
vi.mock("next/headers", () => headers);
vi.mock("utils/serverErrorReporter", () => makeErrorReporterMock());

const refreshMarketSession = vi.fn();
vi.mock("utils/server/authRefresh", () => ({
  refreshMarketSession,
  refreshChatSession: vi.fn(),
  refreshStoriesSession: vi.fn(),
}));

const ADDRESSES = {
  BACKEND_URL: "https://core.invalid/api/v1",
  GO_BACKEND_URL: "https://gateway.invalid/api/v1",
  NEXT_PUBLIC_CHAT_BACKEND_URL: "https://chat.invalid",
  STORIES_BACKEND_URL: "https://stories.invalid",
  COMMENT_BACKEND_URL: "https://comments.invalid",
  WALLET_BACKEND_URL: "https://wallet.invalid",
  ELASTIC_BACKEND_URL: "https://search.invalid",
  WALLET_PUBLIC_API_KEY: "test-wallet-api-key",
};

const GUEST_TOKEN = "test-guest-token-1234567890";
const GUEST_REFRESH = "test-guest-refresh-1234567890";

/** Every credential and profile a dead session must lose. */
const CLEARED_ON_EXPIRY = [
  COOKIE_NAMES.MARKET_TOKEN,
  COOKIE_NAMES.MARKET_REFRESH_TOKEN,
  COOKIE_NAMES.CHAT_TOKEN,
  COOKIE_NAMES.CHAT_REFRESH_TOKEN,
  COOKIE_NAMES.STORIES_TOKEN,
  COOKIE_NAMES.STORIES_REFRESH_TOKEN,
  COOKIE_NAMES.WALLET_TOKEN,
  COOKIE_NAMES.USER_ID_HASH,
  COOKIE_NAMES.USER_CHAT,
  COOKIE_NAMES.USER_STORIES,
  COOKIE_NAMES.WALLET_USER,
];

let net: ReturnType<typeof makeMockFetch>;

const loadRoute = async () => {
  vi.resetModules();
  return import("app/api/auth/expire/route");
};

const makeRequest = () =>
  new NextRequest("https://trydos.test/api/auth/expire", { method: "POST" });

const storedProfile = (profile: unknown) =>
  encodeURIComponent(JSON.stringify(profile));

const writtenProfile = (name: string) => {
  const write = headers.__lastWrite(name);
  return write ? JSON.parse(decodeURIComponent(write.value)) : undefined;
};

/** A verified shopper: a real phone in the stored profile. */
const VERIFIED_PROFILE = {
  id: 3,
  name: "Sara",
  phone: "963900000000",
  is_phone_verified: 1,
};

const guestReply = (overrides: Record<string, unknown> = {}) =>
  jsonReply({
    data: {
      token: GUEST_TOKEN,
      refresh_token: GUEST_REFRESH,
      user: { id: 55, name: "guest" },
      expires_at: "2026-09-01T00:00:00Z",
      ...overrides,
    },
  });

beforeEach(() => {
  headers.__reset();
  Object.entries(ADDRESSES).forEach(([key, value]) => vi.stubEnv(key, value));
  net = makeMockFetch();
  vi.stubGlobal("fetch", net.fetch);
  refreshMarketSession.mockResolvedValue({ status: "invalid" });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("the addresses these tests use", () => {
  it("are all different, so no two services can be confused", () => {
    const hosts = Object.values(ADDRESSES);
    expect(new Set(hosts).size).toBe(hosts.length);
  });
});

describe("while a logout is in progress (AC-13)", () => {
  it("registers no guest and writes no identity", async () => {
    headers.__reset({ cookies: { [COOKIE_NAMES.LOGOUT_GUARD]: "1" } });
    const { POST } = await loadRoute();

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      expired: true,
      loggingOut: true,
    });
    expect(net.callCount).toBe(0);
    expect(headers.__writes).toEqual([]);
    expect(headers.__deletes).toEqual([]);
  });
});

describe("the last-chance renewal (AC-14)", () => {
  it("renews and clears nothing when a renewal credential still works", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.MARKET_REFRESH_TOKEN]: GUEST_REFRESH,
        [COOKIE_NAMES.USER_DATA]: storedProfile(VERIFIED_PROFILE),
      },
    });
    refreshMarketSession.mockResolvedValue({ status: "refreshed" });
    const { POST } = await loadRoute();

    const response = await POST(makeRequest());

    await expect(response.json()).resolves.toEqual({
      renewed: true,
      expired: false,
    });
    // Nothing is torn down: this is a race loser, not a dead session.
    expect(headers.__deletes).toEqual([]);
    expect(net.callCount).toBe(0);
  });

  it("does not attempt a renewal when there is no renewal credential", async () => {
    net.queueReply(guestReply());
    const { POST } = await loadRoute();

    await POST(makeRequest());

    expect(refreshMarketSession).not.toHaveBeenCalled();
  });

  it("tears the session down when the renewal fails", async () => {
    headers.__reset({
      cookies: { [COOKIE_NAMES.MARKET_REFRESH_TOKEN]: GUEST_REFRESH },
    });
    refreshMarketSession.mockResolvedValue({ status: "invalid" });
    net.queueReply(guestReply());
    const { POST } = await loadRoute();

    await POST(makeRequest());

    expect(headers.__deletes).toEqual(
      expect.arrayContaining(CLEARED_ON_EXPIRY),
    );
  });
});

describe("clearing the dead session (AC-15)", () => {
  it("clears the main pair and every sub-service credential and profile", async () => {
    net.queueReply(guestReply());
    const { POST } = await loadRoute();

    await POST(makeRequest());

    CLEARED_ON_EXPIRY.forEach((name) => {
      expect(headers.__deletes).toContain(name);
    });
  });

  it("clears the old session before registering the new guest", async () => {
    net.queueReply(guestReply());
    const { POST } = await loadRoute();

    await POST(makeRequest());

    // A leftover credential would let the fresh guest keep calling a
    // sub-service as the previous shopper, so the order matters.
    expect(headers.__deletes.length).toBeGreaterThan(0);
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)?.value).toBe(
      GUEST_TOKEN,
    );
  });

  it("gives the fresh guest credentials their own lifetimes", async () => {
    net.queueReply(guestReply());
    const { POST } = await loadRoute();

    await POST(makeRequest());

    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)?.options).toMatchObject(
      { httpOnly: true, sameSite: "strict", path: "/", maxAge: 60 * 60 * 48 },
    );
    expect(
      headers.__lastWrite(COOKIE_NAMES.MARKET_REFRESH_TOKEN)?.options,
    ).toMatchObject({ maxAge: 60 * 60 * 24 * 30 });
  });

  it("keeps no credential in the answer", async () => {
    net.queueReply(guestReply());
    const { POST } = await loadRoute();

    const response = await POST(makeRequest());
    const raw = JSON.stringify(await response.json());

    expect(raw).not.toContain(GUEST_TOKEN);
    expect(raw).not.toContain(GUEST_REFRESH);
  });
});

describe("reporting who was signed out (AC-16)", () => {
  it("says the cleared session belonged to a verified shopper", async () => {
    headers.__reset({
      cookies: { [COOKIE_NAMES.USER_DATA]: storedProfile(VERIFIED_PROFILE) },
    });
    net.queueReply(guestReply());
    const { POST } = await loadRoute();

    const response = await POST(makeRequest());

    // Read before the teardown — afterwards the stored profile describes the
    // fresh guest, so this could not be worked out any more.
    await expect(response.json()).resolves.toMatchObject({
      expired: true,
      wasVerified: true,
    });
  });

  it("says it did not when the session was already a guest", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.USER_DATA]: storedProfile({ id: 9, name: "guest" }),
      },
    });
    net.queueReply(guestReply());
    const { POST } = await loadRoute();

    const response = await POST(makeRequest());

    await expect(response.json()).resolves.toMatchObject({
      wasVerified: false,
    });
  });
});

describe("when registering the new guest fails (AC-17)", () => {
  it("leaves the stored profile marked unverified", async () => {
    headers.__reset({
      cookies: { [COOKIE_NAMES.USER_DATA]: storedProfile(VERIFIED_PROFILE) },
    });
    net.queueReply(jsonReply({ message: "no" }, 503));
    const { POST } = await loadRoute();

    await POST(makeRequest());

    // Without this the dead session would still read as phone-verified, which
    // also decides which backend serves it.
    expect(writtenProfile(COOKIE_NAMES.USER_DATA)).toMatchObject({
      is_phone_verified: 0,
      is_verified: false,
    });
  });

  it("writes no fresh credential and passes the failure through", async () => {
    net.queueReply(jsonReply({ message: "no" }, 503));
    const { POST } = await loadRoute();

    const response = await POST(makeRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ expired: true });
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)).toBeUndefined();
  });

  it("answers with a failure that names no backend technology", async () => {
    net.queueReply(jsonReply({ message: "no" }, 503));
    const { POST } = await loadRoute();

    const response = await POST(makeRequest());
    const raw = JSON.stringify(await response.json());

    expect(raw).not.toMatch(
      /\b(go|golang|gin|fiber|laravel|php|django|rails|symfony|nest|nestjs)\b/i,
    );
  });
});
