// @vitest-environment node
//
// Tests for the wallet credential read. AC-28.
//
// This route is the one deliberate exception to "credentials never reach the
// browser": the banking widget needs the raw value. That makes the refusal path
// the important one — with nothing stored it must refuse rather than answer with
// an empty success that the widget would then treat as a working session.
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

const WALLET_TOKEN_FIXTURE = "test-wallet-token-1234567890";

let net: ReturnType<typeof makeMockFetch>;

const loadRoute = async () => {
  vi.resetModules();
  return import("app/api/auth/wallet-token/route");
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

describe("reading the wallet credential (AC-28)", () => {
  it("refuses as unauthorised when nothing is stored", async () => {
    const { GET } = await loadRoute();

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ token: null });
  });

  it("hands the widget its credential when one is stored", async () => {
    headers.__reset({
      cookies: { [COOKIE_NAMES.WALLET_TOKEN]: WALLET_TOKEN_FIXTURE },
    });
    const { GET } = await loadRoute();

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      token: WALLET_TOKEN_FIXTURE,
    });
  });

  it("reads only the wallet credential, never another service's", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.MARKET_TOKEN]: "test-market-token-1234567890",
        [COOKIE_NAMES.CHAT_TOKEN]: "test-chat-token-1234567890",
      },
    });
    const { GET } = await loadRoute();

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ token: null });
  });
});
