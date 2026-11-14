// @vitest-environment node
//
// Tests for the QR login routes under app/api/qr-login. The contract is in
// docs/qr-login-tasks.md, sections 1 (the market backend) and 3 (these routes).
//
// - Direction A: the signed-out browser makes a QR (create), asks for the
//   status, and after the app approves it collects its own tokens (complete).
//   complete then signs in to chat, stories and comments with qr_id_token.
// - Direction B: the signed-in browser makes a QR for a phone (device/create),
//   asks who claimed it (device/status) and approves or denies the phone.
//
// The market backend is the core backend (BACKEND_URL). The routes never
// refresh the token: a 401 goes back to the browser, which refreshes it.
import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { makeErrorReporterMock } from "../../../mocks/authGraph";
import { makeMockFetch, jsonReply } from "../../../mocks/mockFetch";
import { makeNextHeadersMock } from "../../../mocks/nextHeaders";

const headers = makeNextHeadersMock();
vi.mock("next/headers", () => headers);
vi.mock("utils/serverErrorReporter", () => makeErrorReporterMock());
vi.mock("utils/tinyUtils", () => ({ isGuestName: () => false }));

const refreshMarketSession = vi.fn();
vi.mock("utils/server/authRefresh", () => ({ refreshMarketSession }));

const ADDRESSES = {
  BACKEND_URL: "https://core.invalid/api/v1",
  NEXT_PUBLIC_CHAT_BACKEND_URL: "https://chat.invalid",
  STORIES_BACKEND_URL: "https://stories.invalid",
  COMMENT_BACKEND_URL: "https://comments.invalid",
  WALLET_BACKEND_URL: "https://wallet.invalid",
};

const REQUEST_ID = "3f1c2a7e-8b4d-4c1a-9e2f-6a7b8c9d0e1f";
const GUEST_TOKEN = "test-guest-token-1234567890";
const MARKET_TOKEN = "test-market-token-1234567890";
const MARKET_REFRESH = "test-market-refresh-1234567890";
const QR_ID_TOKEN = "test-qr-id-token-1234567890";
const CHAT_ACCESS = "test-chat-access-1234567890";
const STORIES_ACCESS = "test-stories-access-1234567890";
const COMMENTS_TOKEN = "test-comments-token-1234567890";
const SECRET = "test-secret-abcdefghijklmnopqrstuvwxyz012345";
const SECRET_COOKIE = "QR-LOGIN-SECRET";

let net: ReturnType<typeof makeMockFetch>;

const makeRequest = (
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
) =>
  new NextRequest(new URL(`https://trydos.test${path}`), {
    method: init.method ?? "GET",
    headers: init.headers,
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
  });

const ok = (data: unknown, status = 200) =>
  jsonReply({ isSuccessful: true, message: "ok", data }, status);

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

beforeEach(() => {
  headers.__reset({ cookies: { [COOKIE_NAMES.MARKET_TOKEN]: GUEST_TOKEN } });
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

describe("POST /api/qr-login/create (Direction A)", () => {
  const CF_HEADERS = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "cf-connecting-ip": "65.0.21.24",
    "cf-ipcountry": "IN",
    "cf-ipcity": "Mumbai",
    "cf-region": "Maharashtra",
    // The Vercel headers describe a Cloudflare server, so they must be ignored.
    "x-vercel-ip-city": "Frankfurt",
  };

  const create = async (requestHeaders = CF_HEADERS) => {
    net.queueReply(
      ok(
        {
          request_id: REQUEST_ID,
          qr_payload: `trydos://qr/web/${REQUEST_ID}`,
          expires_at: "2026-11-14T10:01:00Z",
        },
        201,
      ),
    );
    const { POST } = await import("app/api/qr-login/create/route");
    return POST(makeRequest("/api/qr-login/create", { method: "POST", headers: requestHeaders }));
  };

  it("calls the core backend's web/create with the guest token", async () => {
    await create();
    expect(net.calls[0]?.url, "create did not call the core backend's web/create").toBe(
      `${ADDRESSES.BACKEND_URL}/qr-login/web/create`,
    );
    expect(net.calls[0]?.headers.authorization, "web/create was not sent the guest token").toBe(
      `Bearer ${GUEST_TOKEN}`,
    );
  });

  it("sends the browser, system and the Cloudflare location, never the Vercel one", async () => {
    await create();
    const body = net.calls[0]?.body;
    expect(body?.browser, "the browser name did not reach the core backend").toBe("Chrome");
    expect(body?.os, "the system name did not reach the core backend").toBe("Windows");
    expect(body?.ip, "the IP from cf-connecting-ip did not reach the core backend").toBe("65.0.21.24");
    expect(body?.country, "the country from cf-ipcountry did not reach the core backend").toBe("IN");
    expect(body?.city, "the city must come from cf-ipcity, not from x-vercel-ip-city").toBe("Mumbai");
    expect(body?.region, "the region from cf-region did not reach the core backend").toBe("Maharashtra");
  });

  it.each(["XX", "T1"])("sends no country when Cloudflare says %s", async (code) => {
    await create({ ...CF_HEADERS, "cf-ipcountry": code });
    expect(net.calls[0]?.body?.country, `${code} is not a country, so country must be null`).toBeNull();
  });

  it("sends only the secret's hash, and keeps the secret in an HttpOnly cookie for /api/qr-login", async () => {
    await create();
    const cookie = headers.__lastWrite(SECRET_COOKIE);
    expect(cookie, "create did not store the secret cookie").toBeDefined();
    const [id, secret] = String(cookie?.value).split(".");
    expect(id, "the secret cookie is not tied to this request ID").toBe(REQUEST_ID);
    expect(secret?.length, "the secret is not 32 random bytes in base64url").toBe(43);
    expect(net.calls[0]?.body?.secret_hash, "web/create was not sent the SHA-256 hex of the secret").toBe(
      sha256(secret),
    );
    expect(JSON.stringify(net.calls[0]?.body), "the secret itself must never leave at create").not.toContain(secret);
    expect(cookie?.options.httpOnly, "page scripts could read the secret cookie").toBe(true);
    expect(cookie?.options.path, "the secret cookie would go with every request").toBe("/api/qr-login");
    expect(cookie?.options.maxAge, "the secret cookie should live 90 seconds").toBe(90);
  });

  it("answers with camelCase fields and the expiry in epoch milliseconds", async () => {
    const response = await create();
    expect(await response.json(), "create answered in the wrong shape").toEqual({
      requestId: REQUEST_ID,
      qrPayload: `trydos://qr/web/${REQUEST_ID}`,
      expiresAt: Date.parse("2026-11-14T10:01:00Z"),
    });
  });

  // The refresh token is single-use. The browser (services/qrLogin) owns the
  // refresh, so a route that also spent it could lose the session.
  it("passes a 401 to the browser and never spends the refresh token itself", async () => {
    net.queueReply(jsonReply({ isSuccessful: false, message: "Unauthenticated." }, 401));
    const { POST } = await import("app/api/qr-login/create/route");
    const response = await POST(makeRequest("/api/qr-login/create", { method: "POST" }));
    expect(refreshMarketSession, "create spent the market refresh token on the server").not.toHaveBeenCalled();
    expect(net.callCount, "create sent web/create to the core backend again after a 401").toBe(1);
    expect(response.status, "the core backend's 401 did not reach the browser").toBe(401);
  });

  it("passes on the backend's error code with a plain error word, never its message", async () => {
    net.queueReply(jsonReply({ isSuccessful: false, message: "Too many attempts from 65.0.21.24" }, 429));
    const { POST } = await import("app/api/qr-login/create/route");
    const response = await POST(makeRequest("/api/qr-login/create", { method: "POST" }));
    expect(response.status, "the core backend's 429 did not reach the browser").toBe(429);
    expect(await response.json(), "the error answer is not the plain error word").toEqual({
      error: "too_many_requests",
    });
    expect(headers.__lastWrite(SECRET_COOKIE), "a failed create must not store a secret").toBeUndefined();
  });
});

describe("GET /api/qr-login/status (Direction A)", () => {
  const status = async () => {
    const { GET } = await import("app/api/qr-login/status/route");
    return GET(makeRequest(`/api/qr-login/status?id=${REQUEST_ID}`));
  };

  it("refuses a browser that did not make this QR, before any backend call", async () => {
    headers.__cookieJar[SECRET_COOKIE] = `another-id.${SECRET}`;
    const response = await status();
    expect(response.status, "a browser without this QR's secret was not refused").toBe(403);
    expect(net.callCount, "the core backend was called for a browser without the secret").toBe(0);
  });

  it("sends the secret's hash in X-QR-Secret-Hash and answers the status", async () => {
    headers.__cookieJar[SECRET_COOKIE] = `${REQUEST_ID}.${SECRET}`;
    net.queueReply(ok({ status: "scanned" }));
    const response = await status();
    expect(net.calls[0]?.url, "status did not call the core backend's web/status").toBe(
      `${ADDRESSES.BACKEND_URL}/qr-login/web/${REQUEST_ID}/status`,
    );
    expect(net.calls[0]?.headers["x-qr-secret-hash"], "web/status was not sent the secret's hash").toBe(
      sha256(SECRET),
    );
    expect(await response.json(), "status answered the wrong status").toEqual({ status: "scanned" });
  });

  it("passes on 410 when the session expired", async () => {
    headers.__cookieJar[SECRET_COOKIE] = `${REQUEST_ID}.${SECRET}`;
    net.queueReply(jsonReply({ isSuccessful: false, message: "The session expired." }, 410));
    const response = await status();
    expect(response.status, "an expired session did not answer 410").toBe(410);
  });
});

describe("POST /api/qr-login/complete (Direction A)", () => {
  const collectReply = () =>
    ok({
      token: MARKET_TOKEN,
      refresh_token: MARKET_REFRESH,
      qr_id_token: QR_ID_TOKEN,
      user: { id: 1234, name: "Alaa", phone: "+963900000000", email: null, is_phone_verified: 1 },
    });

  const complete = async () => {
    const { POST } = await import("app/api/qr-login/complete/route");
    return POST(
      makeRequest("/api/qr-login/complete", { method: "POST", body: { requestId: REQUEST_ID } }),
    );
  };

  const queueFullSignIn = () => {
    net.queueReply(collectReply());
    net.queueReply(jsonReply({ data: { id: 7, access_token: CHAT_ACCESS, refresh_token: "r" } }));
    net.queueReply(
      jsonReply({ isSuccessful: true, data: { id: 9, access_token: STORIES_ACCESS, refresh_token: "r" } }),
    );
    net.queueReply(jsonReply({ isSuccessful: true, data: { token: COMMENTS_TOKEN, refresh_token: "r" } }));
  };

  beforeEach(() => {
    headers.__cookieJar[SECRET_COOKIE] = `${REQUEST_ID}.${SECRET}`;
  });

  it("collects with the secret and the guest token, so the guest bag merges", async () => {
    queueFullSignIn();
    await complete();
    expect(net.calls[0]?.url, "complete did not call the core backend's web/collect").toBe(
      `${ADDRESSES.BACKEND_URL}/qr-login/web/${REQUEST_ID}/collect`,
    );
    expect(net.calls[0]?.body, "web/collect was not sent the secret").toEqual({ secret: SECRET });
    expect(net.calls[0]?.headers.authorization, "web/collect was not sent the guest token").toBe(
      `Bearer ${GUEST_TOKEN}`,
    );
  });

  it.each([
    ["chat", `${ADDRESSES.NEXT_PUBLIC_CHAT_BACKEND_URL}/api/v1/users/login-qr`],
    ["stories", `${ADDRESSES.STORIES_BACKEND_URL}/api/v1/users/login-qr`],
    ["comments", `${ADDRESSES.COMMENT_BACKEND_URL}/public_comment/auth/exchange_qr_token`],
  ])("signs in to %s through its QR endpoint with only qr_id_token", async (service, url) => {
    queueFullSignIn();
    await complete();
    const call = net.calls.find((c) => c.url === url);
    expect(call, `the ${service} QR login endpoint was not called`).toBeDefined();
    expect(call?.body, `the ${service} QR login was not sent only qr_id_token`).toEqual({
      qr_id_token: QR_ID_TOKEN,
    });
  });

  it("does not sign in to the wallet, which is not part of QR login", async () => {
    queueFullSignIn();
    await complete();
    expect(
      net.calls.some((c) => c.url.startsWith(ADDRESSES.WALLET_BACKEND_URL)),
      "QR login called the wallet",
    ).toBe(false);
  });

  it.each([
    ["the market token", COOKIE_NAMES.MARKET_TOKEN, MARKET_TOKEN],
    ["the market refresh token", COOKIE_NAMES.MARKET_REFRESH_TOKEN, MARKET_REFRESH],
    ["the chat token", COOKIE_NAMES.CHAT_TOKEN, CHAT_ACCESS],
    ["the stories token", COOKIE_NAMES.STORIES_TOKEN, STORIES_ACCESS],
    ["the comments token", COOKIE_NAMES.USER_ID_HASH, COMMENTS_TOKEN],
  ])("stores %s as a cookie", async (label, name, value) => {
    queueFullSignIn();
    await complete();
    expect(headers.__lastWrite(name)?.value, `${label} was not stored after QR login`).toBe(value);
  });

  it("answers with the full user and no token", async () => {
    queueFullSignIn();
    const response = await complete();
    const body = await response.json();
    expect(body?.data?.user?.id, "complete did not answer the user from collect").toBe(1234);
    const raw = JSON.stringify(body);
    for (const [label, token] of [
      ["market token", MARKET_TOKEN],
      ["market refresh token", MARKET_REFRESH],
      ["qr_id_token", QR_ID_TOKEN],
      ["chat token", CHAT_ACCESS],
    ]) {
      expect(raw.includes(token), `the ${label} reached the browser`).toBe(false);
    }
  });

  it("deletes the secret cookie after collect", async () => {
    queueFullSignIn();
    await complete();
    expect(headers.__lastWrite(SECRET_COOKIE)?.options.maxAge, "the secret cookie was not deleted").toBe(0);
  });

  it("passes on 409 when the tokens were already collected, and signs in to nothing", async () => {
    net.queueReply(jsonReply({ isSuccessful: false, message: "Already collected." }, 409));
    const response = await complete();
    expect(response.status, "a second collect did not answer 409").toBe(409);
    expect(net.callCount, "a refused collect still called a service").toBe(1);
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN), "a refused collect stored a token").toBeUndefined();
  });

  // Without a new refresh token, the guest's old refresh cookie would stay next
  // to the user's access token. The next refresh would then fail, and the user
  // would become a guest again about 60 seconds after signing in.
  it("refuses a collect answer with no refresh_token, and stores no token", async () => {
    net.queueReply(
      ok({
        token: MARKET_TOKEN,
        qr_id_token: QR_ID_TOKEN,
        user: { id: 1234, name: "Alaa", phone: "+963900000000" },
      }),
    );
    const response = await complete();
    expect(response.status, "a collect answer from the core backend with no refresh_token was accepted").toBe(502);
    expect(
      headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN),
      "the market token was stored without its refresh token",
    ).toBeUndefined();
    expect(net.callCount, "chat, stories or comments was called after a bad collect answer").toBe(1);
  });

  it("refuses without the secret cookie, before any backend call", async () => {
    delete headers.__cookieJar[SECRET_COOKIE];
    const response = await complete();
    expect(response.status, "complete without the secret was not refused").toBe(403);
    expect(net.callCount, "the core backend was called without the secret").toBe(0);
  });
});

describe("Direction B routes (the signed-in web signs in a phone)", () => {
  beforeEach(() => {
    headers.__reset({ cookies: { [COOKIE_NAMES.MARKET_TOKEN]: MARKET_TOKEN } });
  });

  it("device/create calls app/create with the user token", async () => {
    net.queueReply(
      ok(
        { request_id: REQUEST_ID, qr_payload: `trydos://qr/app/${REQUEST_ID}`, expires_at: "2026-11-14T10:01:00Z" },
        201,
      ),
    );
    const { POST } = await import("app/api/qr-login/device/create/route");
    const response = await POST(makeRequest("/api/qr-login/device/create", { method: "POST" }));
    expect(net.calls[0]?.url, "device/create did not call the core backend's app/create").toBe(
      `${ADDRESSES.BACKEND_URL}/qr-login/app/create`,
    );
    expect(net.calls[0]?.headers.authorization, "app/create was not sent the user token").toBe(
      `Bearer ${MARKET_TOKEN}`,
    );
    expect((await response.json())?.qrPayload, "device/create did not answer the app link").toBe(
      `trydos://qr/app/${REQUEST_ID}`,
    );
  });

  it("device/create passes on 403 for a guest", async () => {
    net.queueReply(jsonReply({ isSuccessful: false, message: "Guests cannot." }, 403));
    const { POST } = await import("app/api/qr-login/device/create/route");
    const response = await POST(makeRequest("/api/qr-login/device/create", { method: "POST" }));
    expect(response.status, "a guest was not refused by device/create").toBe(403);
  });

  it("device/status answers the device name and platform in camelCase", async () => {
    net.queueReply(ok({ status: "claimed", device_name: "Alaa's iPhone", platform: "ios" }));
    const { GET } = await import("app/api/qr-login/device/status/route");
    const response = await GET(makeRequest(`/api/qr-login/device/status?id=${REQUEST_ID}`));
    expect(net.calls[0]?.url, "device/status did not call the core backend's app/status").toBe(
      `${ADDRESSES.BACKEND_URL}/qr-login/app/${REQUEST_ID}/status`,
    );
    expect(await response.json(), "device/status answered the wrong shape").toEqual({
      status: "claimed",
      deviceName: "Alaa's iPhone",
      platform: "ios",
    });
  });

  // The settings sheet polls every 2 seconds for a signed-in user. If this route
  // spent the refresh token and the answer was lost (reload, closed tab), the
  // user would be signed out.
  it("device/status passes a 401 to the browser and never spends the refresh token itself", async () => {
    net.queueReply(jsonReply({ isSuccessful: false, message: "Unauthenticated." }, 401));
    const { GET } = await import("app/api/qr-login/device/status/route");
    const response = await GET(makeRequest(`/api/qr-login/device/status?id=${REQUEST_ID}`));
    expect(refreshMarketSession, "device/status spent the market refresh token on the server").not.toHaveBeenCalled();
    expect(response.status, "the core backend's 401 did not reach the browser").toBe(401);
  });

  it.each([
    ["approve", "approved"],
    ["deny", "denied"],
  ])("device/%s calls the core backend's app/%s", async (answer, status) => {
    net.queueReply(ok({ status }));
    const { POST } = await import(`app/api/qr-login/device/${answer}/route`);
    const response = await POST(
      makeRequest(`/api/qr-login/device/${answer}`, { method: "POST", body: { requestId: REQUEST_ID } }),
    );
    expect(net.calls[0]?.url, `device/${answer} called the wrong core backend path`).toBe(
      `${ADDRESSES.BACKEND_URL}/qr-login/app/${REQUEST_ID}/${answer}`,
    );
    expect(await response.json(), `device/${answer} answered the wrong status`).toEqual({ status });
  });

  it("refuses a request ID that is not a plain ID, before any backend call", async () => {
    const { POST } = await import("app/api/qr-login/device/approve/route");
    const response = await POST(
      makeRequest("/api/qr-login/device/approve", { method: "POST", body: { requestId: "../../admin" } }),
    );
    expect(response.status, "a path in the request ID was not refused").toBe(400);
    expect(net.callCount, "the core backend was called with a bad request ID").toBe(0);
  });
});
