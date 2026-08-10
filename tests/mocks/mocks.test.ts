// Checks the parts of the kit that could quietly be wrong (AC-7, AC-8, AC-10,
// AC-11).
//
// Three things are proved here rather than assumed:
//   1. The cookie names copied into tests/mocks/cookieManager.ts still match the
//      real module. This is the price of copying them instead of importing
//      them, and it is paid in one place.
//   2. The store stand-in really does reach a module that loads the store at
//      the moment it is used, not only one that loads it at the top of the
//      file. utils/fetchData.ts is that module, so the proof goes through the
//      real thing.
//   3. The fake network queues replies, hands back failures, records every
//      call, and raises a clear error when it runs out.
import { afterEach, describe, expect, it, vi } from "vitest";

import { makeCookieManagerMock } from "./cookieManager";
import { failureReply, jsonReply, makeMockFetch } from "./mockFetch";
import { makeStoreMock } from "./store";

// ─── The store stand-in, against the module that loads the store late ──────
//
// utils/fetchData.ts reads the store with `await import("../store")` inside the
// function, not at the top of the file. This test registers the stand-in under
// the name "store" — a DIFFERENT text from the "../store" fetchData writes — and
// then lets the real fetchData run. If the test runner keyed replacements by the
// text of the import rather than by the file it resolves to, the real store
// would load and this test would fail.
//
// Everything else fetchData imports is replaced here too, so the test loads no
// more than it has to. These are local to this file: the kit does not stand in
// for our own wrappers.
vi.mock("store", () => makeStoreMock({ LoggingOut: true }));
vi.mock("utils/cookies/cookie-manager", () => makeCookieManagerMock());
vi.mock("components/global/AddToCartMessage", () => ({
  showErrorMessage: vi.fn(),
  showSuccessMessage: vi.fn(),
}));
vi.mock("utils/functions", () => ({
  _isStoreLastJson: vi.fn(),
  LogError: vi.fn(),
}));
vi.mock("store/notifications/reducer", () => ({
  showErrorNotification: vi.fn(),
  showSuccessNotification: vi.fn(),
}));
vi.mock("services/auth", () => ({ default: {} }));
vi.mock("utils/serviceTokens", () => ({
  toServiceToken: vi.fn((name: string) => `test-service-token-${name}`),
}));

describe("store stand-in — a module that loads the store late", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reaches utils/fetchData.ts, which imports the store inside the call", async () => {
    // If the stand-in did NOT reach fetchData, the real store would load and
    // `LoggingOut` would be false, so fetchData would carry on and try to make
    // a real request. This fake network is here to catch that: it has no
    // replies queued, so any call at all fails the test loudly.
    const net = makeMockFetch([]);
    vi.stubGlobal("fetch", net.fetch);

    const { fetchData } = await import("utils/fetchData");
    const result = await fetchData({ url: "/anything", method: "GET" } as any);

    // fetchData returns an empty object the moment it sees LoggingOut, which it
    // can only have read from the stand-in.
    expect(result).toEqual({});
    expect(net.callCount).toBe(0);
  });

  it("gives each call its own state, so nothing leaks between tests", () => {
    const first = makeStoreMock({ language: "ar" });
    const second = makeStoreMock();

    first.useAppStore.setState({ language: "tr" });

    expect(first.useAppStore.getState().language).toBe("tr");
    expect(second.useAppStore.getState().language).toBe("en");
  });

  it("holds no state the real store does not have", () => {
    const { useAppStore } = makeStoreMock();

    // store/notifications/reducer.ts is NOT combined into store/index.ts, so
    // the real store has no notifications state. Inventing it here would let a
    // later test pass against something that does not exist.
    expect(useAppStore.getState()).not.toHaveProperty("notifications");
  });
});

// ─── The copied cookie names, against the real module ──────────────────────
describe("cookie stand-in — the copied names", () => {
  it("still matches every name in the real cookie manager", async () => {
    // The ONLY place in the kit that loads the real cookie module. It needs the
    // browser-like (jsdom) environment: without a browser window the real
    // module reaches for server-side request reading.
    const real = await vi.importActual<
      typeof import("utils/cookies/cookie-manager")
    >("utils/cookies/cookie-manager");

    const copy = makeCookieManagerMock().COOKIE_NAMES;

    // Same names, same values, and nothing missing in either direction.
    expect(Object.keys(copy).sort()).toEqual(
      Object.keys(real.COOKIE_NAMES).sort(),
    );
    expect(copy).toEqual(real.COOKIE_NAMES);
    expect([...makeCookieManagerMock().HTTPONLY_COOKIE_NAMES].sort()).toEqual(
      [...real.HTTPONLY_COOKIE_NAMES].sort(),
    );
  });

  it("reads and writes its own jar instead of a real cookie store", () => {
    const cookies = makeCookieManagerMock({ [""]: "" });
    const { COOKIE_NAMES } = cookies;

    expect(cookies.getCookie(COOKIE_NAMES.LANG)).toBeNull();

    cookies.setCookie(COOKIE_NAMES.LANG, "ar");
    expect(cookies.getCookie(COOKIE_NAMES.LANG)).toBe("ar");

    cookies.deleteCookie(COOKIE_NAMES.LANG);
    expect(cookies.getCookie(COOKIE_NAMES.LANG)).toBeNull();
  });
});

// ─── The fake network ──────────────────────────────────────────────────────
describe("fake network", () => {
  it("hands back queued replies in order", async () => {
    const net = makeMockFetch([jsonReply({ step: 1 }), jsonReply({ step: 2 })]);

    expect(await (await net.fetch("/first")).json()).toEqual({ step: 1 });
    expect(await (await net.fetch("/second")).json()).toEqual({ step: 2 });
  });

  it("hands back a failure as well as a success", async () => {
    const net = makeMockFetch([
      failureReply("Network down"),
      jsonReply({ ok: true }),
    ]);

    await expect(net.fetch("/first")).rejects.toThrow("Network down");
    // The failed call is still recorded.
    expect(net.callCount).toBe(1);

    const second = await net.fetch("/second");
    expect(second.ok).toBe(true);
  });

  it("records the count, address, method and body of every call", async () => {
    const net = makeMockFetch([jsonReply({}), jsonReply({})]);

    await net.fetch("/auth/register-guest", {
      method: "POST",
      body: JSON.stringify({ phone: "+10000000000" }),
      headers: { "Content-Type": "application/json" },
    });
    await net.fetch("/auth/me");

    expect(net.callCount).toBe(2);
    expect(net.calls[0]).toEqual({
      url: "/auth/register-guest",
      method: "POST",
      body: { phone: "+10000000000" },
      headers: { "content-type": "application/json" },
    });
    expect(net.calls[1].url).toBe("/auth/me");
    expect(net.calls[1].method).toBe("GET");
    expect(net.calls[1].body).toBeNull();
  });

  it("raises a clear error naming the address when the queue runs out", async () => {
    const net = makeMockFetch([jsonReply({})]);

    await net.fetch("/first");

    // No empty result and no hang — a loud, specific failure.
    await expect(net.fetch("/second", { method: "PUT" })).rejects.toThrow(
      /no reply left for PUT \/second/,
    );
    // The call that ran out is still recorded, so the count stays true.
    expect(net.callCount).toBe(2);
  });

  it("lets a test add a reply while it is running", async () => {
    const net = makeMockFetch([]);

    net.queueReply(jsonReply({ late: true }));
    expect(await (await net.fetch("/late")).json()).toEqual({ late: true });
    expect(net.repliesLeft).toBe(0);
  });
});
