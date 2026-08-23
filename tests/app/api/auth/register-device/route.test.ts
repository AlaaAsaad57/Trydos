// @vitest-environment node
//
// Tests for the guest-registration route. AC-23 to AC-26.
//
// This route and the expiry route both ask the same backend path for a brand-new
// guest, and they are deliberately proven separately: what surrounds that call
// is different in each, and a helper written for one and reused loosely for the
// other would hide the difference. Here the point is *replacement* — a new guest
// means the previous identity is gone, and none of its sub-service credentials
// may survive.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { makeErrorReporterMock } from "../../../../mocks/authGraph";
import { makeMockFetch, jsonReply } from "../../../../mocks/mockFetch";
import { makeNextHeadersMock } from "../../../../mocks/nextHeaders";

const headers = makeNextHeadersMock();
vi.mock("next/headers", () => headers);
vi.mock("utils/serverErrorReporter", () => makeErrorReporterMock());

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
const OLD_TOKEN = "test-old-market-token-1234567890";

/** Everything that belonged to whoever was here before. */
const PREVIOUS_IDENTITY = [
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
  return import("app/api/auth/register-device/route");
};

const makeRequest = (requestHeaders: Record<string, string> = {}) =>
  new NextRequest("https://trydos.test/api/auth/register-device", {
    method: "POST",
    headers: requestHeaders,
  });

const storedProfile = (profile: unknown) =>
  encodeURIComponent(JSON.stringify(profile));

const writtenProfile = (name: string) => {
  const write = headers.__lastWrite(name);
  return write ? JSON.parse(decodeURIComponent(write.value)) : undefined;
};

const guestReply = (data: Record<string, unknown> = {}) =>
  jsonReply({
    data: {
      token: GUEST_TOKEN,
      refresh_token: GUEST_REFRESH,
      user: { id: 55, name: "guest" },
      expires_at: "2026-09-01T00:00:00Z",
      ...data,
    },
  });

beforeEach(() => {
  headers.__reset();
  Object.entries(ADDRESSES).forEach(([key, value]) => vi.stubEnv(key, value));
  net = makeMockFetch();
  vi.stubGlobal("fetch", net.fetch);
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

describe("while a logout is in progress (AC-23)", () => {
  it("registers no guest at all", async () => {
    headers.__reset({ cookies: { [COOKIE_NAMES.LOGOUT_GUARD]: "1" } });
    const { POST } = await loadRoute();

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ loggingOut: true });
    // A request racing the logout must not re-register the person just signed out.
    expect(net.callCount).toBe(0);
    expect(headers.__writes).toEqual([]);
  });
});

describe("replacing the previous identity (AC-24)", () => {
  it("clears every sub-service credential and profile in the same answer", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.MARKET_TOKEN]: OLD_TOKEN,
        [COOKIE_NAMES.CHAT_TOKEN]: "old-chat-token-1234567890",
        [COOKIE_NAMES.USER_CHAT]: storedProfile({ id: 7 }),
      },
    });
    net.queueReply(guestReply());
    const { POST } = await loadRoute();

    await POST(makeRequest());

    PREVIOUS_IDENTITY.forEach((name) => {
      expect(headers.__deletes).toContain(name);
    });
  });

  it("installs the fresh credentials with their own lifetimes", async () => {
    net.queueReply(guestReply());
    const { POST } = await loadRoute();

    await POST(makeRequest());

    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)?.value).toBe(
      GUEST_TOKEN,
    );
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)?.options).toMatchObject(
      { httpOnly: true, sameSite: "strict", maxAge: 60 * 60 * 48 },
    );
    expect(
      headers.__lastWrite(COOKIE_NAMES.MARKET_REFRESH_TOKEN)?.options,
    ).toMatchObject({ maxAge: 60 * 60 * 24 * 30 });
  });

  it("sends the previous credential so the backend knows who is asking", async () => {
    headers.__reset({ cookies: { [COOKIE_NAMES.MARKET_TOKEN]: OLD_TOKEN } });
    net.queueReply(guestReply());
    const { POST } = await loadRoute();

    await POST(makeRequest());

    expect(net.calls[0].headers.authorization).toBe(`Bearer ${OLD_TOKEN}`);
    expect(net.calls[0].url).toBe(
      `${ADDRESSES.GO_BACKEND_URL}/auth/register-guest`,
    );
  });

  it("carries the stories identity across to the fresh profile", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.USER_DATA]: storedProfile({ id: 3, story_user_id: 88 }),
      },
    });
    net.queueReply(guestReply());
    const { POST } = await loadRoute();

    await POST(makeRequest());

    expect(writtenProfile(COOKIE_NAMES.USER_DATA)).toMatchObject({
      id: 55,
      story_user_id: 88,
    });
  });
});

describe("a registration that brings back no credential (AC-25)", () => {
  it("clears nothing, so a working session is not stripped", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.CHAT_TOKEN]: "old-chat-token-1234567890",
        [COOKIE_NAMES.USER_CHAT]: storedProfile({ id: 7 }),
      },
    });
    net.queueReply(jsonReply({ data: { user: { id: 55 } } }));
    const { POST } = await loadRoute();

    await POST(makeRequest());

    expect(headers.__deletes).toEqual([]);
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)).toBeUndefined();
  });
});

describe("what leaves the server (AC-26)", () => {
  it("strips both halves of the credential pair from the answer", async () => {
    net.queueReply(guestReply());
    const { POST } = await loadRoute();

    const response = await POST(makeRequest());
    const raw = JSON.stringify(await response.json());

    expect(raw).not.toContain(GUEST_TOKEN);
    expect(raw).not.toContain(GUEST_REFRESH);
  });

  it("passes a refusal through without inventing a session", async () => {
    net.queueReply(jsonReply({ message: "refused" }, 422));
    const { POST } = await loadRoute();

    const response = await POST(makeRequest());

    expect(response.status).toBe(422);
    expect(headers.__writes).toEqual([]);
  });

  it("answers a breakage with text that names no backend technology", async () => {
    // No reply queued: the fake network raises, which is the unexpected-failure
    // path this route has to survive.
    const { POST } = await loadRoute();

    const response = await POST(makeRequest());
    const raw = JSON.stringify(await response.json());

    expect(response.status).toBe(500);
    expect(raw).not.toMatch(
      /\b(go|golang|gin|fiber|laravel|php|django|rails|symfony|nest|nestjs)\b/i,
    );
  });
});
