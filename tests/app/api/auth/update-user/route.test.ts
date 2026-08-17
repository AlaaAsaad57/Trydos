// @vitest-environment node
//
// Tests for the profile update route. AC-29, AC-30.
//
// AC-30 is the one worth reading twice. When a sub-service re-authenticates it
// hands back a fresh credential pair, and this route has to store both halves.
// The trap is where it reads them from: the stored profile blob still holds
// whatever pair was written at sign-in, while the credential cookies are rotated
// on every renewal and the blob is not. Taking them from the merged result would
// push the old, already-revoked pair back over the freshly rotated one — undoing
// the very renewal that just succeeded. So both halves must come from the
// incoming payload, and a name-only update must touch neither.
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

const STALE_ACCESS = "test-stale-access-token-1234567890";
const STALE_REFRESH = "test-stale-refresh-token-1234567890";
const FRESH_ACCESS = "test-fresh-access-token-1234567890";
const FRESH_REFRESH = "test-fresh-refresh-token-1234567890";

let net: ReturnType<typeof makeMockFetch>;

const loadRoute = async () => {
  vi.resetModules();
  return import("app/api/auth/update-user/route");
};

const makeRequest = (body: unknown) =>
  new NextRequest("https://trydos.test/api/auth/update-user", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

const storedProfile = (profile: unknown) =>
  encodeURIComponent(JSON.stringify(profile));

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

describe("updating only what may be updated (AC-29)", () => {
  it("merges an update into the stored profile", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.USER_DATA]: storedProfile({
          id: 3,
          name: "Sara",
          phone: "963900000000",
        }),
      },
    });
    const { POST } = await loadRoute();

    const response = await POST(
      makeRequest({
        updates: [{ name: COOKIE_NAMES.USER_DATA, value: { name: "Sara A" } }],
      }),
    );

    await expect(response.json()).resolves.toEqual({
      success: true,
      updated: [COOKIE_NAMES.USER_DATA],
    });
    // The merge keeps what was there and applies what arrived.
    expect(writtenProfile(COOKIE_NAMES.USER_DATA)).toEqual({
      id: 3,
      name: "Sara A",
      phone: "963900000000",
    });
  });

  it("ignores a name that is not on the allowed list", async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      makeRequest({
        updates: [{ name: COOKIE_NAMES.MARKET_TOKEN, value: { a: 1 } }],
      }),
    );

    await expect(response.json()).resolves.toEqual({
      success: true,
      updated: [],
    });
    expect(headers.__writes).toEqual([]);
  });

  it("skips an update carrying nothing", async () => {
    headers.__reset({
      cookies: { [COOKIE_NAMES.USER_DATA]: storedProfile({ id: 3 }) },
    });
    const { POST } = await loadRoute();

    const response = await POST(
      makeRequest({ updates: [{ name: COOKIE_NAMES.USER_DATA, value: null }] }),
    );

    await expect(response.json()).resolves.toEqual({
      success: true,
      updated: [],
    });
    expect(headers.__writes).toEqual([]);
  });

  it("stores the update as-is when there was no profile to merge into", async () => {
    const { POST } = await loadRoute();

    await POST(
      makeRequest({
        updates: [{ name: COOKIE_NAMES.WALLET_USER, value: { id: 11 } }],
      }),
    );

    expect(writtenProfile(COOKIE_NAMES.WALLET_USER)).toEqual({ id: 11 });
  });

  it("gives a profile its long lifetime, not the short credential one", async () => {
    const { POST } = await loadRoute();

    await POST(
      makeRequest({
        updates: [{ name: COOKIE_NAMES.USER_DATA, value: { id: 3 } }],
      }),
    );

    expect(headers.__lastWrite(COOKIE_NAMES.USER_DATA)?.options).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365,
    });
  });
});

describe("keeping a rotated credential pair intact (AC-30)", () => {
  it("stores both halves of a fresh pair from the incoming payload", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.USER_CHAT]: storedProfile({
          id: 7,
          access_token: STALE_ACCESS,
          refresh_token: STALE_REFRESH,
        }),
      },
    });
    const { POST } = await loadRoute();

    await POST(
      makeRequest({
        updates: [
          {
            name: COOKIE_NAMES.USER_CHAT,
            value: {
              access_token: FRESH_ACCESS,
              refresh_token: FRESH_REFRESH,
            },
          },
        ],
      }),
    );

    expect(headers.__lastWrite(COOKIE_NAMES.CHAT_TOKEN)?.value).toBe(
      FRESH_ACCESS,
    );
    expect(headers.__lastWrite(COOKIE_NAMES.CHAT_REFRESH_TOKEN)?.value).toBe(
      FRESH_REFRESH,
    );
  });

  it("gives the renewal half its own long lifetime, not the short one", async () => {
    const { POST } = await loadRoute();

    await POST(
      makeRequest({
        updates: [
          {
            name: COOKIE_NAMES.USER_STORIES,
            value: {
              access_token: FRESH_ACCESS,
              refresh_token: FRESH_REFRESH,
            },
          },
        ],
      }),
    );

    // The pair it renews lives about thirty days; matching the 48-hour
    // credential lifetime would kill the cookie at the same moment as the
    // credential it exists to replace.
    expect(
      headers.__lastWrite(COOKIE_NAMES.STORIES_REFRESH_TOKEN)?.options,
    ).toMatchObject({ maxAge: 60 * 60 * 24 * 30 });
    expect(
      headers.__lastWrite(COOKIE_NAMES.STORIES_TOKEN)?.options,
    ).toMatchObject({ maxAge: 60 * 60 * 48 });
  });

  // The heart of AC-30.
  it("does not push a stale stored pair back over a freshly rotated one", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.USER_CHAT]: storedProfile({
          id: 7,
          name: "Sara",
          access_token: STALE_ACCESS,
          refresh_token: STALE_REFRESH,
        }),
      },
    });
    const { POST } = await loadRoute();

    // A name-only update. The merged result still carries the stale pair, but
    // nothing arrived in the payload, so neither credential cookie may be touched.
    await POST(
      makeRequest({
        updates: [{ name: COOKIE_NAMES.USER_CHAT, value: { name: "Sara A" } }],
      }),
    );

    expect(headers.__lastWrite(COOKIE_NAMES.CHAT_TOKEN)).toBeUndefined();
    expect(headers.__lastWrite(COOKIE_NAMES.CHAT_REFRESH_TOKEN)).toBeUndefined();
  });

  it("touches no credential cookie for a profile that has none", async () => {
    const { POST } = await loadRoute();

    await POST(
      makeRequest({
        updates: [
          {
            name: COOKIE_NAMES.WALLET_USER,
            value: { access_token: FRESH_ACCESS },
          },
        ],
      }),
    );

    // Only the chat and stories profiles carry a credential pair.
    expect(headers.__writes.map((w) => w.name)).toEqual([
      COOKIE_NAMES.WALLET_USER,
    ]);
  });

  it("answers a breakage with text that names no backend technology", async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      new NextRequest("https://trydos.test/api/auth/update-user", {
        method: "POST",
        body: "not json at all",
        headers: { "content-type": "application/json" },
      }),
    );
    const raw = JSON.stringify(await response.json());

    expect(response.status).toBe(500);
    expect(raw).not.toMatch(
      /\b(go|golang|gin|fiber|laravel|php|django|rails|symfony|nest|nestjs)\b/i,
    );
  });
});
