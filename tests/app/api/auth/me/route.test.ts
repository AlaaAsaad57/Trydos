// @vitest-environment node
//
// Tests for the identity read. AC-27.
//
// This is how client code learns who is signed in, because the profile itself is
// hidden from the browser. Two things matter: it returns what is stored, and the
// answer is never cached — a cached identity would show one shopper another
// shopper's name.
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

const TOKEN_FIXTURE = "test-market-token-1234567890";

let net: ReturnType<typeof makeMockFetch>;

const loadRoute = async () => {
  vi.resetModules();
  return import("app/api/auth/me/route");
};

const storedProfile = (profile: unknown) =>
  encodeURIComponent(JSON.stringify(profile));

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

describe("reading the current identity (AC-27)", () => {
  it("returns the stored profile and says the visitor is signed in", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.USER_DATA]: storedProfile({
          id: 3,
          name: "Sara",
          phone: "963900000000",
        }),
        [COOKIE_NAMES.MARKET_TOKEN]: TOKEN_FIXTURE,
      },
    });
    const { POST } = await loadRoute();

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user).toMatchObject({ id: 3, name: "Sara" });
    expect(body.isAuthenticated).toBe(true);
    expect(body.hasMarketToken).toBe(true);
  });

  it("says nothing is signed in when no profile is stored", async () => {
    const { POST } = await loadRoute();

    const response = await POST();
    const body = await response.json();

    expect(body.user).toBeNull();
    expect(body.isAuthenticated).toBe(false);
    expect(body.hasMarketToken).toBe(false);
  });

  it("reports whether a credential is present without revealing it", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.USER_DATA]: storedProfile({ id: 3, token: TOKEN_FIXTURE }),
        [COOKIE_NAMES.MARKET_TOKEN]: TOKEN_FIXTURE,
      },
    });
    const { POST } = await loadRoute();

    const response = await POST();
    const raw = JSON.stringify(await response.json());

    // Even a credential stored inside the profile blob is stripped on the way out.
    expect(raw).not.toContain(TOKEN_FIXTURE);
  });

  it("is never cached", async () => {
    const { POST } = await loadRoute();

    const response = await POST();

    // A cached identity would hand one shopper another shopper's profile.
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("answers a breakage with text that names no backend technology", async () => {
    headers.cookies.mockRejectedValueOnce(new Error("no request scope"));
    const { POST } = await loadRoute();

    const response = await POST();
    const raw = JSON.stringify(await response.json());

    expect(response.status).toBe(500);
    expect(raw).not.toMatch(
      /\b(go|golang|gin|fiber|laravel|php|django|rails|symfony|nest|nestjs)\b/i,
    );
  });
});
