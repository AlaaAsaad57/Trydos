// @vitest-environment node
//
// What happens when a shopper's token is rejected. AC-1 to AC-10.
//
// There are five ways this can go, and telling them apart is the whole point of
// the file — three of them exist to stop a specific bug that has happened
// before: a signed-out session coming back to life, a real account being
// quietly downgraded to a guest, and a single-use credential being spent in a
// place that cannot store its replacement.
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

import { makeNextHeadersMock } from "../mocks/nextHeaders";
import { server } from "../msw/server";

vi.setConfig({ testTimeout: 5000, hookTimeout: 5000 });

const headers = makeNextHeadersMock();
vi.mock("next/headers", () => headers);

// Stood in because it belongs to a later ticket. What matters here is what the
// recovery does with each answer, not how the exchange itself works.
const refreshMarketSession = vi.fn();
vi.mock("utils/server/authRefresh", () => ({
  refreshMarketSession: () => refreshMarketSession(),
}));

// Two reporters sit on these paths, and both have to be stood in.
//
//  - the transport layer's reporter fires its own outbound request that two
//    catch blocks swallow, so the fake network cannot fail a test on it;
//  - the recovery's own catch calls LogError, which drags the whole shared store
//    into a server-only file.
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: vi.fn(async () => undefined),
  default: vi.fn(async () => undefined),
}));
const LogError = vi.fn();
vi.mock("utils/functions", () => ({
  LogError: (...args: unknown[]) => LogError(...(args as [])),
}));

// Reserved names that cannot resolve anywhere, so a request that escapes a
// stand-in dies on this machine rather than leaving it.
const CORE = "https://core.invalid";
const GATEWAY = "https://gateway.invalid";
const TARGET = `${CORE}/orders`;
const REGISTER = `${GATEWAY}/auth/register-guest`;

/** How many times the original request was made, and with which credential. */
let attempts: string[] = [];
/** How many times a guest identity was asked for. */
let registrations = 0;

/** Answer the original call: reject the first attempt, accept any retry. */
const rejectThenAccept = () =>
  server.use(
    http.get(TARGET, ({ request }) => {
      attempts.push(request.headers.get("authorization") ?? "");
      return attempts.length === 1
        ? new HttpResponse("no", { status: 401 })
        : HttpResponse.json({ orders: [] });
    }),
  );

/** Answer the original call with a rejection every time, retry included. */
const rejectAlways = () =>
  server.use(
    http.get(TARGET, ({ request }) => {
      attempts.push(request.headers.get("authorization") ?? "");
      return new HttpResponse("no", { status: 401 });
    }),
  );

const registerReturns = (body: unknown, status = 200) =>
  server.use(
    http.post(REGISTER, () => {
      registrations += 1;
      return HttpResponse.json(body as any, { status });
    }),
  );

const guestPayload = {
  data: {
    token: "fresh-guest-token",
    refresh_token: "fresh-guest-refresh",
    user: { id: 7, name: "Guest" },
    expires_at: "2027-01-01",
  },
};

const call = async () => {
  const { HandleAuthedFetch } = await import(
    "serverRequests/HandleAuthedFetch"
  );
  return HandleAuthedFetch({ url: TARGET });
};

beforeEach(() => {
  attempts = [];
  registrations = 0;
  headers.__reset();
  refreshMarketSession.mockReset();
  LogError.mockReset();
  vi.stubEnv("BACKEND_URL", CORE);
  vi.stubEnv("GO_BACKEND_URL", GATEWAY);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("a request that works (AC-1, AC-2)", () => {
  it("carries the shopper's token and hands the answer back untouched", async () => {
    headers.__reset({ cookies: { [COOKIE_NAMES.MARKET_TOKEN]: "good-token" } });
    server.use(http.get(TARGET, ({ request }) => {
      attempts.push(request.headers.get("authorization") ?? "");
      return HttpResponse.json({ orders: [1] });
    }));

    const result = await call();

    expect(attempts).toEqual(["Bearer good-token"]);
    expect(result).toMatchObject({ status: 200, data: { orders: [1] } });
    expect(registrations).toBe(0);
  });

  it("still sends the request when there is no token, without an identity header", async () => {
    server.use(http.get(TARGET, ({ request }) => {
      attempts.push(request.headers.get("authorization") ?? "");
      return HttpResponse.json({ orders: [] });
    }));

    const result = await call();

    expect(attempts).toEqual([""]);
    expect(result.status).toBe(200);
  });
});

describe("a rejection while signing out (AC-3)", () => {
  it("hands the rejection back and mints nothing at all", async () => {
    // The bug this prevents: a request already in flight when sign-out cleared
    // the cookies comes back rejected, registers a fresh guest, and the shopper
    // is signed in again a second after asking to leave.
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.MARKET_TOKEN]: "old-token",
        [COOKIE_NAMES.LOGOUT_GUARD]: "1",
      },
    });
    rejectAlways();
    registerReturns(guestPayload);

    const result = await call();

    expect(result.status).toBe(401);
    expect(registrations).toBe(0);
    expect(refreshMarketSession).not.toHaveBeenCalled();
    expect(headers.__writes).toEqual([]);
    expect(headers.__deletes).toEqual([]);
    expect(attempts).toHaveLength(1);
  });
});

describe("a rejection where cookies cannot be written (AC-4)", () => {
  it("hands the rejection back and spends nothing single-use", async () => {
    // During a plain page render the framework refuses cookie writes. The
    // recovery probes for that BEFORE using the refresh credential, because that
    // credential is good once and its replacement would have nowhere to live.
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.MARKET_TOKEN]: "old-token",
        [COOKIE_NAMES.MARKET_REFRESH_TOKEN]: "refresh-value",
      },
      failWrites: true,
    });
    rejectAlways();
    registerReturns(guestPayload);

    const result = await call();

    expect(result.status).toBe(401);
    expect(refreshMarketSession).not.toHaveBeenCalled();
    expect(registrations).toBe(0);
    expect(headers.__writes).toEqual([]);
    expect(attempts).toHaveLength(1);
  });
});

describe("a rejection with a refresh credential (AC-5, AC-6)", () => {
  it("exchanges it exactly once and retries exactly once", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.MARKET_TOKEN]: "stale-token",
        [COOKIE_NAMES.MARKET_REFRESH_TOKEN]: "refresh-value",
      },
    });
    rejectThenAccept();
    registerReturns(guestPayload);
    refreshMarketSession.mockResolvedValue({
      status: "refreshed",
      token: "rotated-token",
    });

    const result = await call();

    expect(refreshMarketSession).toHaveBeenCalledTimes(1);
    expect(attempts).toEqual(["Bearer stale-token", "Bearer rotated-token"]);
    expect(result).toMatchObject({ status: 200 });
    // The whole point of this branch: no guest identity is created.
    expect(registrations).toBe(0);
  });

  it("gives the rejection back when the exchange does not succeed, and does not fall through to a guest", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.MARKET_TOKEN]: "stale-token",
        [COOKIE_NAMES.MARKET_REFRESH_TOKEN]: "refresh-value",
      },
    });
    rejectAlways();
    registerReturns(guestPayload);
    refreshMarketSession.mockResolvedValue({ status: "invalid" });

    const result = await call();

    expect(refreshMarketSession).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(401);
    expect(registrations).toBe(0);
    expect(attempts).toHaveLength(1);
  });
});

describe("a rejection for a verified shopper with no refresh credential (AC-7)", () => {
  it("gives the rejection back rather than replacing the account with a guest", async () => {
    // The bug this prevents: a shopper whose session predates refresh
    // credentials hits a rejection and is silently turned into a guest,
    // server-side, losing their account until they verify again.
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.MARKET_TOKEN]: "stale-token",
        [COOKIE_NAMES.USER_DATA]: encodeURIComponent(
          JSON.stringify({ id: 1, phone: "+441234567890" }),
        ),
      },
    });
    rejectAlways();
    registerReturns(guestPayload);

    const result = await call();

    expect(result.status).toBe(401);
    expect(registrations).toBe(0);
    expect(refreshMarketSession).not.toHaveBeenCalled();
  });
});

describe("a rejection for a guest with no refresh credential (AC-8, AC-9, AC-10)", () => {
  it("creates one guest identity, clears the old one, and retries once", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.MARKET_TOKEN]: "stale-token",
        [COOKIE_NAMES.CHAT_TOKEN]: "old-chat",
        [COOKIE_NAMES.STORIES_TOKEN]: "old-stories",
        [COOKIE_NAMES.WALLET_TOKEN]: "old-wallet",
      },
    });
    rejectThenAccept();
    registerReturns(guestPayload);

    const result = await call();

    expect(registrations).toBe(1);
    expect(attempts).toEqual(["Bearer stale-token", "Bearer fresh-guest-token"]);
    expect(result).toMatchObject({ status: 200 });

    // The previous shopper is gone, so their other credentials must not survive
    // — a leftover one keeps authenticating that service as the person before.
    expect(headers.__deletes).toEqual(
      expect.arrayContaining([
        COOKIE_NAMES.CHAT_TOKEN,
        COOKIE_NAMES.CHAT_REFRESH_TOKEN,
        COOKIE_NAMES.STORIES_TOKEN,
        COOKIE_NAMES.STORIES_REFRESH_TOKEN,
        COOKIE_NAMES.WALLET_TOKEN,
        COOKIE_NAMES.USER_ID_HASH,
        COOKIE_NAMES.USER_CHAT,
        COOKIE_NAMES.USER_STORIES,
        COOKIE_NAMES.WALLET_USER,
      ]),
    );
  });

  it("stores the new pair hidden from the browser, with the refresh cookie living longer", async () => {
    headers.__reset({
      cookies: { [COOKIE_NAMES.MARKET_TOKEN]: "stale-token" },
    });
    rejectThenAccept();
    registerReturns(guestPayload);

    await call();

    const token = headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN);
    const refresh = headers.__lastWrite(COOKIE_NAMES.MARKET_REFRESH_TOKEN);
    const profile = headers.__lastWrite(COOKIE_NAMES.USER_DATA);

    expect(token).toMatchObject({
      value: "fresh-guest-token",
      options: { httpOnly: true, sameSite: "strict" },
    });
    expect(refresh).toMatchObject({
      value: "fresh-guest-refresh",
      options: { httpOnly: true },
    });
    expect(
      (refresh!.options as any).maxAge,
    ).toBeGreaterThan((token!.options as any).maxAge);

    // The profile is stored with the expiry the backend reported.
    expect(JSON.parse(decodeURIComponent(profile!.value))).toMatchObject({
      id: 7,
      expired_at: "2027-01-01",
    });
  });

  it("stops after one retry when the retry is rejected too (AC-9)", async () => {
    headers.__reset({
      cookies: { [COOKIE_NAMES.MARKET_TOKEN]: "stale-token" },
    });
    rejectAlways();
    registerReturns(guestPayload);

    const result = await call();

    // One guest identity, two attempts, then it stops. No recursion.
    expect(registrations).toBe(1);
    expect(attempts).toHaveLength(2);
    expect(result.status).toBe(401);
  });

  it("leaves every existing cookie alone when creating a guest fails (AC-10)", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.MARKET_TOKEN]: "stale-token",
        [COOKIE_NAMES.CHAT_TOKEN]: "old-chat",
      },
    });
    rejectAlways();
    registerReturns({ message: "no" }, 500);

    const result = await call();

    expect(result.status).toBe(401);
    expect(headers.__deletes).toEqual([]);
    // Only the writability probe wrote, and it wrote the value already there.
    expect(headers.__cookieJar[COOKIE_NAMES.MARKET_TOKEN]).toBe("stale-token");
    expect(headers.__cookieJar[COOKIE_NAMES.CHAT_TOKEN]).toBe("old-chat");
    expect(attempts).toHaveLength(1);
  });

  it("leaves every existing cookie alone when creating a guest returns no credential (AC-10)", async () => {
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.MARKET_TOKEN]: "stale-token",
        [COOKIE_NAMES.CHAT_TOKEN]: "old-chat",
      },
    });
    rejectAlways();
    registerReturns({ data: { user: { id: 9 } } });

    const result = await call();

    expect(result.status).toBe(401);
    expect(headers.__deletes).toEqual([]);
    expect(headers.__cookieJar[COOKIE_NAMES.CHAT_TOKEN]).toBe("old-chat");
  });

  it("stores only what a sparse guest reply actually carries", async () => {
    // A token on its own is a usable identity. The refresh credential and the
    // profile are each written only if they came, so a short reply does not
    // leave an empty cookie standing in for either.
    headers.__reset({
      cookies: { [COOKIE_NAMES.MARKET_TOKEN]: "stale-token" },
    });
    rejectThenAccept();
    registerReturns({ data: { token: "token-only" } });

    const result = await call();

    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_TOKEN)).toMatchObject({
      value: "token-only",
    });
    expect(headers.__lastWrite(COOKIE_NAMES.MARKET_REFRESH_TOKEN)).toBeUndefined();
    expect(headers.__lastWrite(COOKIE_NAMES.USER_DATA)).toBeUndefined();
    expect(attempts).toEqual(["Bearer stale-token", "Bearer token-only"]);
    expect(result).toMatchObject({ status: 200 });
  });

  it("probes with a throwaway cookie when there is no token to re-write", async () => {
    // The probe asks "can this context store a cookie at all?" by re-writing the
    // token it already has. With no token there is nothing to re-write, so it
    // writes an already-expired one instead — same question, nothing destroyed.
    headers.__reset();
    rejectThenAccept();
    registerReturns(guestPayload);

    const result = await call();

    const probe = headers.__writes[0];
    expect(probe).toMatchObject({ name: COOKIE_NAMES.MARKET_TOKEN, value: "" });
    expect((probe.options as any).maxAge).toBe(0);
    // The probe passed, so the recovery ran to the end as normal.
    expect(registrations).toBe(1);
    expect(result).toMatchObject({ status: 200 });
  });
});

describe("a recovery that breaks unexpectedly", () => {
  it("reports the fault and hands back the original rejection", async () => {
    // Anything thrown inside the recovery is caught. The shopper gets the
    // rejection the backend actually sent, not a crashed page, and the fault is
    // reported so it is not lost.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    headers.__reset({
      cookies: {
        [COOKIE_NAMES.MARKET_TOKEN]: "stale-token",
        [COOKIE_NAMES.MARKET_REFRESH_TOKEN]: "refresh-value",
      },
    });
    rejectAlways();
    registerReturns(guestPayload);
    refreshMarketSession.mockRejectedValue(new Error("exchange exploded"));

    const result = await call();

    expect(result.status).toBe(401);
    expect(LogError).toHaveBeenCalledTimes(1);
    // No guest is minted on the way out of a fault.
    expect(registrations).toBe(0);
    expect(attempts).toHaveLength(1);

    consoleError.mockRestore();
  });
});
