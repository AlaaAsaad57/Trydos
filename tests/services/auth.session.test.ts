// Keeping the session, and losing it.
//
// TWO THINGS MAKE THIS FILE DIFFERENT FROM ITS NEIGHBOURS.
//
// 1. It resets the module registry per test, because the service holds its
//    in-flight exchange and its in-flight expiry at module scope. The reset is
//    the FIRST statement of the loader, and the service, the store AND the
//    stand-ins are all imported AFTER it — `vi.resetModules()` replaces every
//    one of them together. A handle imported at the top of this file would
//    belong to a dead generation: the test would reset a store the service
//    never writes to, and a held-open reply would never release.
//
// 2. It keeps a local gated reply. The shared stand-in
//    (tests/mocks/mockFetch.ts) answers in order and cannot hold a call open,
//    which is what proving "two callers share one exchange" needs. The
//    neighbouring refresh suite keeps its own for the same reason. Like the
//    shared one, this stub RAISES on a call it has no reply for — a quiet
//    success there would let "no exchange was attempted" pass while an exchange
//    was in fact attempted.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("store", async () => {
  const { makeAuthStoreModule } = await import("tests/mocks/authStore");
  return makeAuthStoreModule();
});
vi.mock("serverActions/sendOtp", async () => (await import("tests/mocks/authGraph")).makeSendOtpMock());
vi.mock("utils/functions", async () => (await import("tests/mocks/authGraph")).makeFunctionsMock());
vi.mock("utils/otpLocks", async () => (await import("tests/mocks/authGraph")).makeOtpLocksMock());
vi.mock("utils/fetchData", async () => (await import("tests/mocks/authGraph")).makeFetchDataMock());
vi.mock("utils/authMe", async () => (await import("tests/mocks/authGraph")).makeAuthMeMock());
vi.mock("utils/gtag", async () => (await import("tests/mocks/authGraph")).makeGtagMock());
vi.mock("utils/posthog", async () => (await import("tests/mocks/authGraph")).makePosthogMock());
vi.mock("utils/orderFunnel", async () => (await import("tests/mocks/authGraph")).makeOrderFunnelMock());
vi.mock("utils/GAEvents", async () => (await import("tests/mocks/authGraph")).makeGaEventNamesMock());
vi.mock("utils/Requests", async () => (await import("tests/mocks/authGraph")).makeRequestsMock());
vi.mock("utils/serverErrorReporter", async () => (await import("tests/mocks/authGraph")).makeErrorReporterMock());
vi.mock("utils/UploadUtils", async () => (await import("tests/mocks/authGraph")).makeUploadUtilsMock());
vi.mock("utils/cookies/cookie-manager", async () => (await import("tests/mocks/authGraph")).makeCookieNamesMock());
vi.mock("@/store/notifications/reducer", async () => (await import("tests/mocks/authGraph")).makeNotificationsMock());
vi.mock("store/notifications/reducer", async () => (await import("tests/mocks/authGraph")).makeNotificationsMock());
vi.mock("services/home", async () => (await import("tests/mocks/authGraph")).makeHomeServiceMock());
vi.mock("services/story", async () => (await import("tests/mocks/authGraph")).makeStoryServiceMock());
vi.mock("services/wallet", async () => (await import("tests/mocks/authGraph")).makeWalletMock());

/** One reply for the gated stub: a status + body, a gate to hold it open, or a
 *  failure to throw. */
type GatedReply = { status?: number; body?: any; gated?: boolean; throws?: Error };

/**
 * A `fetch` the test can hold open and release.
 *
 * Same contract as the shared stand-in in every way that matters: every call is
 * recorded, replies come back in order, and a call with no queued reply RAISES
 * naming the address rather than resolving quietly.
 */
function makeGatedFetch() {
  const queue: GatedReply[] = [];
  const gates: Array<() => void> = [];
  const calls: Array<{ url: string; method: string; body: any; headers: any }> = [];

  const fetch = vi.fn(async (input: any, init: any = {}) => {
    const url = String(input);
    calls.push({
      url,
      method: String(init?.method ?? "GET"),
      body: init?.body ? JSON.parse(init.body) : null,
      headers: init?.headers ?? {},
    });

    const next = queue.shift();
    if (!next) {
      throw new Error(
        `gated fetch: no reply queued for ${init?.method ?? "GET"} ${url}. ` +
          `${calls.length} call(s) were made. Queue one, or find out why the ` +
          `code called again.`,
      );
    }
    if (next.gated) await new Promise<void>((resolve) => gates.push(resolve));
    if (next.throws) throw next.throws;

    const status = next.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => next.body ?? {},
    };
  });

  return {
    fetch,
    calls,
    reply: (r: GatedReply) => queue.push(r),
    releaseAll: () => gates.splice(0).forEach((release) => release()),
    get callCount() {
      return fetch.mock.calls.length;
    },
  };
}

/** Everything from ONE generation: reset first, then import. */
async function load(overrides: Record<string, any> = {}) {
  vi.resetModules();
  const store = await import("store");
  (store as any).__resetAuthStore(overrides);
  const auth = (await import("services/auth")).default;
  const home = (await import("services/home")).default;
  return { auth, store, home };
}

let net: ReturnType<typeof makeGatedFetch>;

beforeEach(() => {
  net = makeGatedFetch();
  vi.stubGlobal("fetch", net.fetch);
  // `_getLocale` reads the address bar for the country and language it sends
  // with the expiry request.
  window.history.replaceState({}, "", "/gb-en/cart");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("exchanging a dying session", () => {
  it("attempts nothing at all while a logout is running (AC-13)", async () => {
    const { auth } = await load({ LoggingOut: true });

    const result = await auth.RefreshSession("/cart", "market");

    expect(result).toEqual({ refreshed: false, eligible: false });
    expect(net.callCount).toBe(0);
  });

  it("reports a refresh only when the server answers successfully AND says it refreshed (AC-14)", async () => {
    const { auth } = await load();
    net.reply({ status: 200, body: { refreshed: true } });

    await expect(auth.RefreshSession("/cart", "market")).resolves.toEqual({
      refreshed: true,
      eligible: true,
    });
  });

  it("does not report a refresh when the server answers successfully but says nothing (AC-14)", async () => {
    const { auth } = await load();
    net.reply({ status: 200, body: {} });

    await expect(auth.RefreshSession("/cart", "market")).resolves.toEqual({
      refreshed: false,
      eligible: true,
    });
  });

  it("passes on the server's own \"not eligible\" (AC-14)", async () => {
    const { auth } = await load();
    net.reply({ status: 200, body: { eligible: false } });

    await expect(auth.RefreshSession("/cart", "market")).resolves.toEqual({
      refreshed: false,
      eligible: false,
    });
  });

  it("treats a network failure as eligible-but-not-refreshed, so the caller falls through to the expiry flow (AC-15)", async () => {
    const { auth } = await load();
    net.reply({ throws: new Error("network down") });

    await expect(auth.RefreshSession("/cart", "market")).resolves.toEqual({
      refreshed: false,
      eligible: true,
    });
  });

  it("asks for a plain exchange when it is given no request to name (AC-16)", async () => {
    const { auth } = await load();
    net.reply({ status: 200, body: { refreshed: true } });

    await auth.RefreshSession();

    expect(net.calls[0].url).toBe("/api/auth/refresh");
    expect(net.calls[0].body).toEqual({});
  });

  it("names the request when it is given one (AC-16)", async () => {
    const { auth } = await load();
    net.reply({ status: 200, body: { refreshed: true } });

    await auth.RefreshSession("/stories/feed", "stories");

    expect(net.calls[0].body).toEqual({ url: "/stories/feed", server: "stories" });
  });
});

describe("the expiry cycle, when the session survives", () => {
  it("ends the cycle without cancelling what the renewal just saved, and releases waiters (AC-17)", async () => {
    const { auth, store } = await load({
      user: { id: 7, is_verified: 1 },
      userProfile: { id: 7, phone: "+905551112233", is_verified: 1 },
    });
    net.reply({ status: 200, body: { renewed: true } });

    const outcome = await auth.ExpiredUser();

    expect(outcome).toEqual({ renewed: true, wasVerified: false });
    const s = store.useAppStore.getState();
    expect(s.reAuthResult).toBe("success");
    // Nothing was cancelled — the shopper stays exactly as the renewal left them.
    expect(s.user).toMatchObject({ id: 7, is_verified: 1 });
    expect(s.shouldAuthinticated).toBeNull();
  });

  it("does NOT release a re-verification that is already on screen (AC-18)", async () => {
    // A concurrent 401 can arm the verify widget while the expiry request is in
    // flight. Releasing it here would tell a waiting caller the session is fine
    // while the shopper is still typing a code.
    const { auth, store } = await load({ shouldAuthinticated: "open chat", reAuthResult: "pending" });
    net.reply({ status: 200, body: { renewed: true } });

    await auth.ExpiredUser();

    expect(store.useAppStore.getState().reAuthResult).toBe("pending");
  });

  it("sends the shopper's country and language with the request (AC-17)", async () => {
    const { auth } = await load();
    net.reply({ status: 200, body: { renewed: true } });

    await auth.ExpiredUser();

    expect(net.calls[0].url).toBe("/api/auth/expire");
    expect(net.calls[0].headers["x-country"]).toBe("gb");
    expect(net.calls[0].headers["x-language"]).toBe("en");
  });
});

describe("the expiry cycle, when the session is gone", () => {
  it("arms the log-in-again prompt and keeps the phone for it (AC-19)", async () => {
    const { auth, store } = await load({
      user: { id: 7, is_verified: 1 },
      userProfile: { id: 7, phone: "+905551112233", is_verified: 1 },
    });
    net.reply({ status: 200, body: { renewed: false, wasVerified: true } });

    const outcome = await auth.ExpiredUser();

    expect(outcome).toEqual({ renewed: false, wasVerified: true });
    const s = store.useAppStore.getState();
    // The phone is read BEFORE the cancellation, which is the only reason it
    // still exists to be kept.
    expect(s.expiredSessionPhone).toBe("+905551112233");
    expect(s.reAuthResult).toBe("pending");
    expect(s.shouldAuthinticated).toBe("expired");
    // Cancelled as an expiry: the record survives, marked unverified.
    expect(s.userProfile).toMatchObject({ id: 7, is_verified: 0, is_phone_verified: 0 });
  });

  it("does not keep a placeholder phone (AC-19)", async () => {
    const { auth, store } = await load({
      user: { id: 7 },
      userProfile: { id: 7, phone: "0" },
    });
    net.reply({ status: 200, body: { renewed: false, wasVerified: true } });

    await auth.ExpiredUser();

    expect(store.useAppStore.getState().expiredSessionPhone).toBeNull();
    // The prompt is still armed — only the phone shortcut is missing.
    expect(store.useAppStore.getState().shouldAuthinticated).toBe("expired");
  });

  it("cancels a guest session silently, with no prompt (AC-20)", async () => {
    const { auth, store } = await load({ user: { id: 2 }, userProfile: { id: 2 } });
    net.reply({ status: 200, body: { renewed: false, wasVerified: false } });

    const outcome = await auth.ExpiredUser();

    expect(outcome).toEqual({ renewed: false, wasVerified: false });
    const s = store.useAppStore.getState();
    expect(s.reAuthResult).toBe("cancelled");
    expect(s.shouldAuthinticated).toBeNull();
    expect(s.expiredSessionPhone).toBeNull();
  });

  it("never replaces a re-verification that is already armed (AC-21)", async () => {
    const { auth, store } = await load({
      shouldAuthinticated: "open chat",
      reAuthResult: "pending",
      user: { id: 7 },
      userProfile: { id: 7, phone: "+905551112233" },
    });
    net.reply({ status: 200, body: { renewed: false, wasVerified: true } });

    await auth.ExpiredUser();

    const s = store.useAppStore.getState();
    // Whoever armed first keeps the screen: swapping it would yank an OTP form
    // away mid-entry.
    expect(s.shouldAuthinticated).toBe("open chat");
    expect(s.reAuthResult).toBe("pending");
  });

  it("skips the request entirely when asked to (AC-20)", async () => {
    const { auth, store } = await load({ user: { id: 2 }, userProfile: { id: 2 } });

    await auth.ExpiredUser(true);

    expect(net.callCount).toBe(0);
    expect(store.useAppStore.getState().reAuthResult).toBe("cancelled");
  });
});

describe("concurrent expiry (AC-22)", () => {
  it("shares one cycle and hands both callers the same outcome", async () => {
    const { auth } = await load({ user: { id: 7 }, userProfile: { id: 7, phone: "+90555" } });
    // One reply only: a second exchange would raise "no reply queued".
    net.reply({ status: 200, body: { renewed: false, wasVerified: true }, gated: true });

    const first = auth.ExpiredUser();
    const second = auth.ExpiredUser();
    await Promise.resolve();
    net.releaseAll();
    const [a, b] = await Promise.all([first, second]);

    expect(net.callCount).toBe(1);
    expect(a).toEqual({ renewed: false, wasVerified: true });
    // The waiter learns `wasVerified` too — it shares the outcome, it does not
    // get a hollow one.
    expect(b).toEqual(a);
  });

  it("releases the cycle so a later expiry can run again", async () => {
    const { auth } = await load({ user: { id: 7 }, userProfile: { id: 7 } });
    net.reply({ status: 200, body: { renewed: false, wasVerified: false } });
    await auth.ExpiredUser();

    net.reply({ status: 200, body: { renewed: false, wasVerified: false } });
    await auth.ExpiredUser();

    expect(net.callCount).toBe(2);
  });

  it("restores the registering flag whichever way the cycle ends", async () => {
    const { auth, store } = await load({ user: { id: 7 }, userProfile: { id: 7 } });
    net.reply({ status: 200, body: { renewed: false, wasVerified: false } });

    await auth.ExpiredUser();

    expect(store.useAppStore.getState().isRegisteringReady).toBe(true);
  });

  it("attempts nothing while a logout is running (AC-13)", async () => {
    const { auth } = await load({ LoggingOut: true });

    const outcome = await auth.ExpiredUser();

    expect(outcome).toEqual({ renewed: false, wasVerified: false });
    expect(net.callCount).toBe(0);
  });
});
