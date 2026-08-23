// @vitest-environment node
//
// Tests for the sign-in route. AC-1 to AC-8, AC-36.
//
// This is the widest route in the app: it verifies the code with the core
// backend, then signs the shopper in to four sub-services at once, and stores a
// credential for each one that answered. What makes it worth this much care is
// that a sub-service can fail on its own and the shopper still ends up signed
// in — so "which credential is stored for which answer" is the behaviour, and a
// count of cookies would prove nothing.
//
// WHY THE GUEST-NAME HELPER IS STOOD IN
// The route imports one pure function from it, but that module's own imports
// reach the shared store, the translations bundle, analytics and the client
// fetch helper — the graph the shared auth mocks exist to cut. The guard's
// behaviour is already proven in tests/utils/tinyUtils.test.ts, so what is left
// for this file is what this ticket is about: that the route *applies* the
// guard. That is AC-6, and it is asserted through the stand-in below.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { makeErrorReporterMock } from "../../../../mocks/authGraph";
import { makeMockFetch, jsonReply } from "../../../../mocks/mockFetch";
import { makeNextHeadersMock } from "../../../../mocks/nextHeaders";

const headers = makeNextHeadersMock();
vi.mock("next/headers", () => headers);
vi.mock("utils/serverErrorReporter", () => makeErrorReporterMock());

const isGuestName = vi.fn((name?: string) => false);
vi.mock("utils/tinyUtils", () => ({ isGuestName }));

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

const MARKET_TOKEN = "test-market-token-1234567890";
const MARKET_REFRESH = "test-market-refresh-1234567890";
const CHAT_ACCESS = "test-chat-access-1234567890";
const CHAT_REFRESH = "test-chat-refresh-1234567890";
const STORIES_ACCESS = "test-stories-access-1234567890";
const STORIES_REFRESH = "test-stories-refresh-1234567890";
const COMMENTS_TOKEN = "test-comments-token-1234567890";
const WALLET_TOKEN = "test-wallet-token-1234567890";

const BACKEND_TECHNOLOGY =
  /\b(go|golang|gin|fiber|laravel|php|django|rails|symfony|nest|nestjs)\b/i;

let net: ReturnType<typeof makeMockFetch>;

const loadRoute = async () => {
  vi.resetModules();
  return import("app/api/auth/login/route");
};

const makeRequest = (
  params: Record<string, string> = { verificationId: "v-1", otp: "999999" },
) => {
  const url = new URL("https://trydos.test/api/auth/login");
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  return new NextRequest(url, { method: "GET" });
};

const writtenProfile = (name: string) => {
  const write = headers.__lastWrite(name);
  return write ? JSON.parse(decodeURIComponent(write.value)) : undefined;
};

/** The core backend's answer to a successful verification. */
const verifyReply = (data: Record<string, unknown> = {}) =>
  jsonReply({
    data: {
      token: MARKET_TOKEN,
      refresh_token: MARKET_REFRESH,
      id_token: "test-id-token-1234567890",
      already_exists: true,
      expires_at: "2026-09-01T00:00:00Z",
      user: { id: 3, name: "Sara", phone: "963900000000", email: "s@x.test" },
      ...data,
    },
  });

const chatReply = () =>
  jsonReply({
    data: { id: 7, access_token: CHAT_ACCESS, refresh_token: CHAT_REFRESH },
  });
const storiesReply = () =>
  jsonReply({
    isSuccessful: true,
    data: {
      id: 9,
      access_token: STORIES_ACCESS,
      refresh_token: STORIES_REFRESH,
    },
  });
const commentsReply = () => jsonReply({ comments_token: COMMENTS_TOKEN });
const walletReply = () =>
  jsonReply({
    accessToken: { token: WALLET_TOKEN },
    user: { id: 11, email: "s@x.test", sessionId: "abc" },
  });

/** The whole happy path: verification, then the four sub-services in order. */
const queueFullSignIn = () => {
  net.queueReply(verifyReply());
  net.queueReply(chatReply());
  net.queueReply(storiesReply());
  net.queueReply(commentsReply());
  net.queueReply(walletReply());
};

beforeEach(() => {
  headers.__reset();
  Object.entries(ADDRESSES).forEach(([key, value]) => vi.stubEnv(key, value));
  net = makeMockFetch();
  vi.stubGlobal("fetch", net.fetch);
  isGuestName.mockReturnValue(false);
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

describe("a call that cannot be a verification (AC-8)", () => {
  it.each([
    ["no code", { verificationId: "v-1" }],
    ["no identifier", { otp: "999999" }],
    ["neither", {}],
  ])("refuses with %s, before any backend is called", async (_label, params) => {
    const { GET } = await loadRoute();

    const response = await GET(makeRequest(params as Record<string, string>));

    expect(response.status).toBe(400);
    // The backend is never troubled with a request that cannot succeed.
    expect(net.callCount).toBe(0);
  });
});

describe("storing what the verification returned (AC-1)", () => {
  it("stores the main credential pair", async () => {
    queueFullSignIn();
    const { GET } = await loadRoute();

    await GET(makeRequest());

    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)?.value).toBe(
      MARKET_TOKEN,
    );
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_REFRESH_TOKEN)?.value).toBe(
      MARKET_REFRESH,
    );
  });

  it("keeps neither half of the pair in the answer", async () => {
    queueFullSignIn();
    const { GET } = await loadRoute();

    const response = await GET(makeRequest());
    const raw = JSON.stringify(await response.json());

    expect(raw).not.toContain(MARKET_TOKEN);
    expect(raw).not.toContain(MARKET_REFRESH);
  });

  it("keeps no sub-service credential in the answer either", async () => {
    queueFullSignIn();
    const { GET } = await loadRoute();

    const response = await GET(makeRequest());
    const raw = JSON.stringify(await response.json());

    [CHAT_ACCESS, CHAT_REFRESH, STORIES_ACCESS, STORIES_REFRESH, WALLET_TOKEN]
      .forEach((credential) => expect(raw).not.toContain(credential));
  });

  it("asks the core backend to verify, carrying the guest credential", async () => {
    headers.__reset({ cookies: { [COOKIE_NAMES.MARKET_TOKEN]: "guest-token-1234567890" } });
    queueFullSignIn();
    const { GET } = await loadRoute();

    await GET(makeRequest());

    expect(net.calls[0].url).toBe(
      `${ADDRESSES.BACKEND_URL}/auth/phone/verify_otp_from_guest`,
    );
    expect(net.calls[0].headers.authorization).toBe(
      "Bearer guest-token-1234567890",
    );
    expect(net.calls[0].body).toMatchObject({
      verificationId: "v-1",
      otp: "999999",
    });
  });
});

describe("one credential per sub-service that answered (AC-2)", () => {
  it("stores every credential when all four answered", async () => {
    queueFullSignIn();
    const { GET } = await loadRoute();

    await GET(makeRequest());

    expect(headers.__lastWrite(COOKIE_NAMES.CHAT_TOKEN)?.value).toBe(CHAT_ACCESS);
    expect(headers.__lastWrite(COOKIE_NAMES.CHAT_REFRESH_TOKEN)?.value).toBe(
      CHAT_REFRESH,
    );
    expect(headers.__lastWrite(COOKIE_NAMES.STORIES_TOKEN)?.value).toBe(
      STORIES_ACCESS,
    );
    expect(headers.__lastWrite(COOKIE_NAMES.STORIES_REFRESH_TOKEN)?.value).toBe(
      STORIES_REFRESH,
    );
    expect(headers.__lastWrite(COOKIE_NAMES.USER_ID_HASH)?.value).toBe(
      COMMENTS_TOKEN,
    );
    expect(headers.__lastWrite(COOKIE_NAMES.WALLET_TOKEN)?.value).toBe(
      WALLET_TOKEN,
    );
  });

  // Four single failures. The count of stored credentials is never asserted —
  // it varies with what came back, which is exactly the point.
  it("stores nothing for chat when chat failed, and still signs the shopper in", async () => {
    net.queueReply(verifyReply());
    net.queueReply(jsonReply({ message: "chat down" }, 503));
    net.queueReply(storiesReply());
    net.queueReply(commentsReply());
    net.queueReply(walletReply());
    const { GET } = await loadRoute();

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    expect(headers.__lastWrite(COOKIE_NAMES.CHAT_TOKEN)).toBeUndefined();
    expect(headers.__lastWrite(COOKIE_NAMES.CHAT_REFRESH_TOKEN)).toBeUndefined();
    // The others are unaffected.
    expect(headers.__lastWrite(COOKIE_NAMES.STORIES_TOKEN)?.value).toBe(
      STORIES_ACCESS,
    );
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)?.value).toBe(
      MARKET_TOKEN,
    );
  });

  it("stores nothing for stories when stories reports it did not succeed", async () => {
    net.queueReply(verifyReply());
    net.queueReply(chatReply());
    // A 200 that says it failed — the stories service answers this way.
    net.queueReply(jsonReply({ isSuccessful: false, data: null }));
    net.queueReply(commentsReply());
    net.queueReply(walletReply());
    const { GET } = await loadRoute();

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    expect(headers.__lastWrite(COOKIE_NAMES.STORIES_TOKEN)).toBeUndefined();
    expect(headers.__lastWrite(COOKIE_NAMES.CHAT_TOKEN)?.value).toBe(CHAT_ACCESS);
  });

  it("stores nothing for comments when comments failed", async () => {
    net.queueReply(verifyReply());
    net.queueReply(chatReply());
    net.queueReply(storiesReply());
    net.queueReply(jsonReply({ message: "comments down" }, 500));
    net.queueReply(walletReply());
    const { GET } = await loadRoute();

    await GET(makeRequest());

    expect(headers.__lastWrite(COOKIE_NAMES.USER_ID_HASH)).toBeUndefined();
    expect(headers.__lastWrite(COOKIE_NAMES.WALLET_TOKEN)?.value).toBe(
      WALLET_TOKEN,
    );
  });

  it("stores nothing for the wallet when the wallet failed", async () => {
    net.queueReply(verifyReply());
    net.queueReply(chatReply());
    net.queueReply(storiesReply());
    net.queueReply(commentsReply());
    net.queueReply(jsonReply({ message: "wallet down" }, 502));
    const { GET } = await loadRoute();

    await GET(makeRequest());

    expect(headers.__lastWrite(COOKIE_NAMES.WALLET_TOKEN)).toBeUndefined();
    expect(headers.__lastWrite(COOKIE_NAMES.WALLET_USER)).toBeUndefined();
  });

  // One case with more than one failing at once. The full sixteen-way
  // cross-product is deliberately not written — see implement.md.
  it("signs the shopper in even when more than one sub-service is down", async () => {
    net.queueReply(verifyReply());
    net.queueReply(jsonReply({ message: "chat down" }, 503));
    net.queueReply(jsonReply({ isSuccessful: false, data: null }));
    net.queueReply(jsonReply({ message: "comments down" }, 500));
    net.queueReply(walletReply());
    const { GET } = await loadRoute();

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)?.value).toBe(
      MARKET_TOKEN,
    );
    expect(headers.__lastWrite(COOKIE_NAMES.WALLET_TOKEN)?.value).toBe(
      WALLET_TOKEN,
    );
  });
});

describe("how long each credential lives (AC-3)", () => {
  it("gives the renewal credentials the long rotating life, not the short one", async () => {
    queueFullSignIn();
    const { GET } = await loadRoute();

    await GET(makeRequest());

    const thirtyDays = 60 * 60 * 24 * 30;
    expect(
      headers.__lastWrite(COOKIE_NAMES.MARKET_REFRESH_TOKEN)?.options,
    ).toMatchObject({ maxAge: thirtyDays });
    expect(
      headers.__lastWrite(COOKIE_NAMES.CHAT_REFRESH_TOKEN)?.options,
    ).toMatchObject({ maxAge: thirtyDays });
    expect(
      headers.__lastWrite(COOKIE_NAMES.STORIES_REFRESH_TOKEN)?.options,
    ).toMatchObject({ maxAge: thirtyDays });
  });

  it("gives the access credentials the short life", async () => {
    queueFullSignIn();
    const { GET } = await loadRoute();

    await GET(makeRequest());

    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)?.options).toMatchObject(
      { maxAge: 60 * 60 * 48 },
    );
    expect(headers.__lastWrite(COOKIE_NAMES.CHAT_TOKEN)?.options).toMatchObject({
      maxAge: 60 * 60 * 48,
    });
  });

  it("hides every credential from the browser and keeps it same-site", async () => {
    queueFullSignIn();
    const { GET } = await loadRoute();

    await GET(makeRequest());

    [
      COOKIE_NAMES.MARKET_TOKEN,
      COOKIE_NAMES.MARKET_REFRESH_TOKEN,
      COOKIE_NAMES.CHAT_TOKEN,
      COOKIE_NAMES.STORIES_TOKEN,
      COOKIE_NAMES.WALLET_TOKEN,
    ].forEach((name) => {
      const options = headers.__lastWrite(name)?.options;
      expect(options).toMatchObject({
        httpOnly: true,
        sameSite: "strict",
        path: "/",
      });
      // Environment-derived, so the value the rule produces here is asserted —
      // not a copy of the rule, which would stay green if the flag were dropped.
      expect(options).toHaveProperty("secure");
      expect(options?.secure).toBe(false);
    });
  });
});

describe("a verification that carries no credential pair (AC-4)", () => {
  it("stores nothing at all and passes the answer through untouched", async () => {
    const legacyBody = {
      data: { id: 42, phone: "963900000000", verified_at: null },
    };
    net.queueReply(jsonReply(legacyBody));
    const { GET } = await loadRoute();

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(legacyBody);
    // No sub-service is contacted and the shopper's stored session is untouched.
    expect(net.callCount).toBe(1);
    expect(headers.__writes).toEqual([]);
  });

  it("does the same when a credential arrives without a shopper", async () => {
    net.queueReply(jsonReply({ data: { token: MARKET_TOKEN } }));
    const { GET } = await loadRoute();

    await GET(makeRequest());

    expect(headers.__writes).toEqual([]);
    expect(net.callCount).toBe(1);
  });
});

describe("telling the caller a sub-service failed (AC-5)", () => {
  it("reports the failure in the answer and records it for support", async () => {
    net.queueReply(verifyReply());
    net.queueReply(jsonReply({ message: "chat down" }, 503));
    net.queueReply(storiesReply());
    net.queueReply(commentsReply());
    net.queueReply(walletReply());
    const { LogServerError } = await import("utils/serverErrorReporter");
    const { GET } = await loadRoute();

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(body.is_failed).toEqual(
      expect.arrayContaining([expect.objectContaining({ endpoint: "CHAT" })]),
    );
    expect(LogServerError).toHaveBeenCalled();
  });

  it("says nothing failed when nothing did", async () => {
    queueFullSignIn();
    const { GET } = await loadRoute();

    const response = await GET(makeRequest());
    const body = await response.json();

    // Absent rather than empty: the field only appears when something failed.
    expect(body).not.toHaveProperty("is_failed");
  });

  it("keeps no credential material in what it records", async () => {
    net.queueReply(verifyReply());
    net.queueReply(jsonReply({ message: "chat down" }, 503));
    net.queueReply(storiesReply());
    net.queueReply(commentsReply());
    net.queueReply(walletReply());
    const { LogServerError } = await import("utils/serverErrorReporter");
    const { GET } = await loadRoute();

    await GET(makeRequest());

    const recorded = JSON.stringify(
      (LogServerError as any).mock.calls.map((call: unknown[]) => call[0]),
    );
    [MARKET_TOKEN, MARKET_REFRESH, WALLET_TOKEN, ADDRESSES.WALLET_PUBLIC_API_KEY]
      .forEach((secret) => expect(recorded).not.toContain(secret));
  });
});

describe("a placeholder name from the backend (AC-6)", () => {
  it("is not passed on as the shopper's name", async () => {
    isGuestName.mockReturnValue(true);
    queueFullSignIn();
    const { GET } = await loadRoute();

    await GET(makeRequest());

    // Blanked, so the app asks for a real name instead of showing "guest".
    expect(writtenProfile(COOKIE_NAMES.USER_DATA)).toMatchObject({ name: "" });
  });

  it("leaves a real name alone", async () => {
    isGuestName.mockReturnValue(false);
    queueFullSignIn();
    const { GET } = await loadRoute();

    await GET(makeRequest());

    expect(writtenProfile(COOKIE_NAMES.USER_DATA)).toMatchObject({
      name: "Sara",
    });
  });

  it("applies the guard to the name the backend sent", async () => {
    queueFullSignIn();
    const { GET } = await loadRoute();

    await GET(makeRequest());

    expect(isGuestName).toHaveBeenCalledWith("Sara");
  });
});

describe("a verification the backend refuses (AC-7)", () => {
  it("passes the refusal's status and body through and stores nothing", async () => {
    net.queueReply(jsonReply({ message: "wrong code" }, 422));
    const { GET } = await loadRoute();

    const response = await GET(makeRequest());

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ message: "wrong code" });
    expect(headers.__writes).toEqual([]);
    expect(net.callCount).toBe(1);
  });

  it("answers a breakage without naming a backend technology (AC-36)", async () => {
    // No reply queued: the fake network raises, which is the transport failure
    // this route reports as a generic server error.
    const { GET } = await loadRoute();

    const response = await GET(makeRequest());
    const raw = JSON.stringify(await response.json());

    expect(response.status).toBe(500);
    expect(raw).not.toMatch(BACKEND_TECHNOLOGY);
  });

  it("names no backend technology in its refusal text either (AC-36)", async () => {
    const { GET } = await loadRoute();

    const response = await GET(makeRequest({ otp: "999999" }));
    const raw = JSON.stringify(await response.json());

    expect(raw).not.toMatch(BACKEND_TECHNOLOGY);
    expect(response.headers.get("x-powered-by")).toBeNull();
  });
});

describe("the profiles it stores", () => {
  it("marks the shopper verified and keeps the stories identity", async () => {
    queueFullSignIn();
    const { GET } = await loadRoute();

    await GET(makeRequest());

    expect(writtenProfile(COOKIE_NAMES.USER_DATA)).toMatchObject({
      id: 3,
      is_verified: true,
      is_phone_verified: 1,
      already_exists: true,
      story_user_id: 9,
    });
  });

  it("strips the sensitive wallet fields before storing the wallet profile", async () => {
    queueFullSignIn();
    const { GET } = await loadRoute();

    await GET(makeRequest());

    const wallet = writtenProfile(COOKIE_NAMES.WALLET_USER);
    expect(wallet).toMatchObject({ id: 11 });
    expect(wallet).not.toHaveProperty("email");
    expect(wallet).not.toHaveProperty("sessionId");
  });
});
