// @vitest-environment node
//
// Tests for the renewal route. AC-9 to AC-12.
//
// This route is a decision, not a mechanism: it works out whether a renewal is
// allowed and which credential pair to renew, then reports the outcome without
// ever putting credential material in the answer. The exchange itself belongs to
// the renewal helper, which has its own test file from an earlier ticket.
//
// So the helper is stood in here. That is deliberate and it is what makes these
// assertions about *this route*: each of the helper's five outcomes is fed in
// directly, and the test checks the answer this route gives back. Driving those
// five outcomes through the real helper would mean rebuilding cookie and network
// states that the helper's own tests already cover, and would re-prove them.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { makeErrorReporterMock } from "../../../../mocks/authGraph";
import { makeMockFetch } from "../../../../mocks/mockFetch";
import { makeNextHeadersMock } from "../../../../mocks/nextHeaders";

const headers = makeNextHeadersMock();
vi.mock("next/headers", () => headers);
vi.mock("utils/serverErrorReporter", () => makeErrorReporterMock());

const refreshMarketSession = vi.fn();
const refreshChatSession = vi.fn();
const refreshStoriesSession = vi.fn();
const refreshCommentsSession = vi.fn();
vi.mock("utils/server/authRefresh", () => ({
  refreshMarketSession,
  refreshChatSession,
  refreshStoriesSession,
  refreshCommentsSession,
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

/** A credential value long enough to be recognisable if it ever leaked. */
const TOKEN_FIXTURE = "test-market-token-1234567890";

let net: ReturnType<typeof makeMockFetch>;

const loadRoute = async () => {
  vi.resetModules();
  return import("app/api/auth/refresh/route");
};

const makeRequest = (body?: unknown) =>
  new NextRequest("https://trydos.test/api/auth/refresh", {
    method: "POST",
    ...(body === undefined
      ? {}
      : {
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        }),
  });

beforeEach(() => {
  headers.__reset();
  Object.entries(ADDRESSES).forEach(([key, value]) => vi.stubEnv(key, value));
  net = makeMockFetch();
  vi.stubGlobal("fetch", net.fetch);
  refreshMarketSession.mockResolvedValue({ status: "refreshed" });
  refreshChatSession.mockResolvedValue({ status: "refreshed" });
  refreshStoriesSession.mockResolvedValue({ status: "refreshed" });
  refreshCommentsSession.mockResolvedValue({ status: "refreshed" });
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

describe("while a logout is in progress (AC-9)", () => {
  it("renews nothing and says a logout is happening", async () => {
    headers.__reset({ cookies: { [COOKIE_NAMES.LOGOUT_GUARD]: "1" } });
    const { POST } = await loadRoute();

    const response = await POST(makeRequest({ url: "/cart/add", server: "market" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      refreshed: false,
      loggingOut: true,
    });
    // The guard exists precisely so a late failure cannot resurrect a session.
    expect(refreshMarketSession).not.toHaveBeenCalled();
  });
});

describe("which services may be renewed here (AC-10)", () => {
  it.each([
    ["market", refreshMarketSession],
    ["market-dashboard", refreshMarketSession],
    ["chat", refreshChatSession],
    ["stories", refreshStoriesSession],
    ["comments", refreshCommentsSession],
  ])("renews a failed %s call with its own exchange", async (server, exchange) => {
    const { POST } = await loadRoute();

    const response = await POST(makeRequest({ url: "/anything", server }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ refreshed: true });
    expect(exchange).toHaveBeenCalledTimes(1);
  });

  it.each(["wallet", "elastic", "made-up"])(
    "answers %s as not eligible, without an exchange",
    async (server) => {
      const { POST } = await loadRoute();

      const response = await POST(makeRequest({ url: "/anything", server }));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ eligible: false });
      expect(refreshMarketSession).not.toHaveBeenCalled();
      expect(refreshChatSession).not.toHaveBeenCalled();
      expect(refreshStoriesSession).not.toHaveBeenCalled();
      expect(refreshCommentsSession).not.toHaveBeenCalled();
    },
  );

  it("renews the comments session with the comments exchange, not another service's", async () => {
    const { POST } = await loadRoute();

    await POST(makeRequest({ url: "/public_comment/comments/create", server: "comments" }));

    expect(
      refreshCommentsSession,
      "a failed comments call did not reach the comments renewal exchange",
    ).toHaveBeenCalledTimes(1);
    expect(refreshMarketSession).not.toHaveBeenCalled();
    expect(refreshChatSession).not.toHaveBeenCalled();
    expect(refreshStoriesSession).not.toHaveBeenCalled();
  });
});

describe("a call with no body (AC-11)", () => {
  it("performs no exchange — renewal only ever answers a real failure", async () => {
    const { POST } = await loadRoute();

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ refreshed: false });
    expect(refreshMarketSession).not.toHaveBeenCalled();
  });

  it("performs no exchange when the body carries neither address nor service", async () => {
    const { POST } = await loadRoute();

    const response = await POST(makeRequest({ something: "else" }));

    await expect(response.json()).resolves.toEqual({ refreshed: false });
    expect(refreshMarketSession).not.toHaveBeenCalled();
  });
});

describe("every outcome maps to its own answer (AC-12)", () => {
  it("reports success without any credential material", async () => {
    refreshMarketSession.mockResolvedValue({
      status: "refreshed",
      token: TOKEN_FIXTURE,
    });
    const { POST } = await loadRoute();

    const response = await POST(makeRequest({ url: "/x", server: "market" }));
    const body = await response.json();

    expect(body).toEqual({ refreshed: true });
    // Even when the helper hands one over, nothing reaches the answer.
    expect(JSON.stringify(body)).not.toContain(TOKEN_FIXTURE);
  });

  it("treats an ineligible outcome as a logout in progress", async () => {
    refreshMarketSession.mockResolvedValue({ status: "ineligible" });
    const { POST } = await loadRoute();

    const response = await POST(makeRequest({ url: "/x", server: "market" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ eligible: false });
  });

  it.each(["no-token", "invalid", "unavailable"])(
    "falls through to the expiry flow on %s",
    async (status) => {
      refreshMarketSession.mockResolvedValue({ status });
      const { POST } = await loadRoute();

      const response = await POST(makeRequest({ url: "/x", server: "market" }));

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ refreshed: false });
    },
  );

  it("falls through rather than throwing when the exchange itself breaks", async () => {
    refreshMarketSession.mockRejectedValue(new Error("exchange exploded"));
    const { POST } = await loadRoute();

    const response = await POST(makeRequest({ url: "/x", server: "market" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ refreshed: false });
  });

  it("never writes a credential into the answer, whatever the outcome", async () => {
    refreshMarketSession.mockResolvedValue({
      status: "refreshed",
      token: TOKEN_FIXTURE,
      refresh_token: `${TOKEN_FIXTURE}-refresh`,
    });
    const { POST } = await loadRoute();

    const response = await POST(makeRequest({ url: "/x", server: "market" }));
    const raw = JSON.stringify(await response.json());

    expect(raw).not.toContain(TOKEN_FIXTURE);
    expect(raw).not.toContain("refresh_token");
  });
});
