// @vitest-environment node
//
// Tests for the scoped clearing route — the one a sub-service failure calls when
// its own credential has gone stale. AC-21, AC-22.
//
// The point of this route is that it is *scoped*. Before it was fixed, any
// sub-service failure invalidated the stories profile and downgraded the main
// profile to unverified, which silently re-routed the renewal exchange to the
// guest backend over an unrelated failure. AC-22 is what stops that coming back.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { makeErrorReporterMock } from "../../../../mocks/authGraph";
import { makeMockFetch } from "../../../../mocks/mockFetch";
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

let net: ReturnType<typeof makeMockFetch>;

const loadRoute = async () => {
  vi.resetModules();
  return import("app/api/auth/clear-tokens/route");
};

const makeRequest = (body: unknown) =>
  new NextRequest("https://trydos.test/api/auth/clear-tokens", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

/** Profiles are stored the way the app stores them: encoded JSON. */
const storedProfile = (profile: unknown) =>
  encodeURIComponent(JSON.stringify(profile));

/** Read a profile the route wrote back. */
const writtenProfile = (name: string) => {
  const write = headers.__lastWrite(name);
  return write ? JSON.parse(decodeURIComponent(write.value)) : undefined;
};

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

describe("clearing only what may be cleared (AC-21)", () => {
  it("clears a credential that is on the allowed list", async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      makeRequest({ tokens: [COOKIE_NAMES.CHAT_TOKEN] }),
    );

    await expect(response.json()).resolves.toEqual({
      success: true,
      cleared: [COOKIE_NAMES.CHAT_TOKEN],
    });
    expect(headers.__deletes).toEqual([COOKIE_NAMES.CHAT_TOKEN]);
  });

  it("refuses the main credential, which is not on the list", async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      makeRequest({ tokens: [COOKIE_NAMES.MARKET_TOKEN] }),
    );

    // Reported as cleared: nothing. This route may never touch the main
    // session — only a logout or an expiry may.
    await expect(response.json()).resolves.toEqual({
      success: true,
      cleared: [],
    });
    expect(headers.__deletes).toEqual([]);
  });

  it("ignores a name it does not know at all", async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      makeRequest({ tokens: ["SOMETHING-ELSE", COOKIE_NAMES.WALLET_TOKEN] }),
    );

    await expect(response.json()).resolves.toEqual({
      success: true,
      cleared: [COOKIE_NAMES.WALLET_TOKEN],
    });
    expect(headers.__deletes).toEqual([COOKIE_NAMES.WALLET_TOKEN]);
  });

  it("copes with a call that names nothing", async () => {
    const { POST } = await loadRoute();

    const response = await POST(makeRequest({}));

    await expect(response.json()).resolves.toEqual({
      success: true,
      cleared: [],
    });
    expect(headers.__deletes).toEqual([]);
  });
});

describe("marking only the service that failed (AC-22)", () => {
  it("marks the chat profile when the chat credential was cleared", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.USER_CHAT]: storedProfile({ id: 7, name: "Sara" }),
        [COOKIE_NAMES.USER_STORIES]: storedProfile({ id: 9, name: "Sara" }),
        [COOKIE_NAMES.USER_DATA]: storedProfile({
          id: 3,
          phone: "963900000000",
          is_phone_verified: 1,
        }),
      },
    });
    const { POST } = await loadRoute();

    await POST(makeRequest({ tokens: [COOKIE_NAMES.CHAT_TOKEN] }));

    expect(writtenProfile(COOKIE_NAMES.USER_CHAT)).toMatchObject({ id: 7 });
    // The other two are untouched — this is the whole point of the criterion.
    expect(headers.__lastWrite(COOKIE_NAMES.USER_STORIES)).toBeUndefined();
    expect(headers.__lastWrite(COOKIE_NAMES.USER_DATA)).toBeUndefined();
  });

  it("marks the stories profile as needing re-authentication", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.USER_CHAT]: storedProfile({ id: 7 }),
        [COOKIE_NAMES.USER_STORIES]: storedProfile({ id: 9 }),
      },
    });
    const { POST } = await loadRoute();

    await POST(makeRequest({ tokens: [COOKIE_NAMES.STORIES_REFRESH_TOKEN] }));

    expect(writtenProfile(COOKIE_NAMES.USER_STORIES)).toMatchObject({
      id: 9,
      need_auth: true,
    });
    expect(headers.__lastWrite(COOKIE_NAMES.USER_CHAT)).toBeUndefined();
  });

  it("downgrades the main profile only when the comments credential was cleared", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.USER_DATA]: storedProfile({
          id: 3,
          phone: "963900000000",
          is_phone_verified: 1,
        }),
      },
    });
    const { POST } = await loadRoute();

    await POST(makeRequest({ tokens: [COOKIE_NAMES.USER_ID_HASH] }));

    expect(writtenProfile(COOKIE_NAMES.USER_DATA)).toMatchObject({
      need_auth: true,
      is_phone_verified: 0,
    });
  });

  it("leaves the main profile alone when an unrelated service failed", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.USER_DATA]: storedProfile({
          id: 3,
          phone: "963900000000",
          is_phone_verified: 1,
        }),
      },
    });
    const { POST } = await loadRoute();

    // A wallet failure must not make a verified shopper look unverified — that
    // would re-route the renewal exchange to the guest backend.
    await POST(makeRequest({ tokens: [COOKIE_NAMES.WALLET_TOKEN] }));

    expect(headers.__lastWrite(COOKIE_NAMES.USER_DATA)).toBeUndefined();
  });

  it("writes no profile back when there was none stored", async () => {
    const { POST } = await loadRoute();

    await POST(makeRequest({ tokens: [COOKIE_NAMES.CHAT_TOKEN] }));

    expect(headers.__writes).toEqual([]);
  });
});
