import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeMockAuthModule } from "tests/mocks/auth";
import {
  makeCookieManagerMock,
  COOKIE_NAMES as MOCK_COOKIE_NAMES,
} from "tests/mocks/cookieManager";
import { failureReply, jsonReply, makeMockFetch } from "tests/mocks/mockFetch";
import type { QueuedReply } from "tests/mocks/mockFetch";
import { makeStoreMock } from "tests/mocks/store";
import { makeToastsMock } from "tests/mocks/ToastMock";

vi.mock("store", () => makeStoreMock({ LoggingOut: true }));
vi.mock("services/auth", () => makeMockAuthModule());
vi.mock("components/global/AddToCartMessage", () => makeToastsMock());
vi.mock("utils/functions", () => ({
  _isStoreLastJson: vi.fn(),
  LogError: vi.fn(),
}));
vi.mock("store/notifications/reducer", () => ({
  showErrorNotification: vi.fn(),
  showSuccessNotification: vi.fn(),
}));
vi.mock("utils/cookies/cookie-manager", () => makeCookieManagerMock());
vi.mock("utils/serviceTokens", () => ({
  toServiceToken: vi.fn((name: string) => `test-service-token-${name}`),
}));

const typeErrorReply = (message = "Failed to fetch"): QueuedReply => ({
  kind: "failure",
  error: new TypeError(message),
});

const setLocationPathname = (pathname: string) => {
  const href = `http://localhost${pathname}`;
  vi.stubGlobal("window", {
    location: {
      pathname,
      href,
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
  });
};

const baseParams = {
  method: "GET" as const,
  server: "chat" as const,
  url: "/test",
  reqTitle: { code: 1, reqTitle: "base" },
};

const makeSignalAwareMockFetch = (replies: QueuedReply[]) => {
  const net = makeMockFetch(replies);
  const fetch = vi.fn(async (input: any, init: any = {}) => {
    if (init?.signal?.aborted) {
      throw new DOMException("The user aborted a request.", "AbortError");
    }
    return net.fetch(input, init);
  });
  return { net, fetch };
};

async function setup(state: Record<string, any> = {}) {
  vi.resetModules();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.useRealTimers();

  const store = await import("store");
  const cookieManager = await import("utils/cookies/cookie-manager");
  const jar = (cookieManager as any).__jar;
  if (jar) {
    Object.keys(jar).forEach((key) => delete jar[key]);
  }

  store.useAppStore.setState({
    LoggingOut: false,
    isRegisteringReady: true,
    reAuthResult: null,
    shouldAuthinticated: false,
    ...state,
  });

  // Arm the setter functions so that calls from fetchData actually update state,
  // while still letting tests spy on them.
  const setShouldAuthinticated = vi.fn((value: any) => {
    store.useAppStore.setState((prev) => ({ ...prev, shouldAuthinticated: value }));
  });
  const setReAuthResult = vi.fn((value: any) => {
    store.useAppStore.setState((prev) => ({ ...prev, reAuthResult: value }));
  });
  const setIsRegisteringReady = vi.fn((value: any) => {
    store.useAppStore.setState((prev) => ({ ...prev, isRegisteringReady: value }));
  });
  store.useAppStore.setState({ setShouldAuthinticated, setReAuthResult, setIsRegisteringReady });

  const auth = await import("services/auth");
  const notifications = await import("store/notifications/reducer");
  const toasts = await import("components/global/AddToCartMessage");
  const functions = await import("utils/functions");
  const serviceTokens = await import("utils/serviceTokens");

  (auth.default.UserID as any).mockReturnValue(42);

  return { store, auth, notifications, toasts, functions, cookieManager, serviceTokens };
}

async function loadFetchData() {
  const mod = await import("utils/fetchData");
  return {
    fetchData: mod.fetchData,
    abortInFlightForLogout: mod.abortInFlightForLogout,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("fetchData module basics", () => {
  it("returns an empty object and does not fetch while logging out", async () => {
    const { store } = await setup();
    store.useAppStore.setState({ LoggingOut: true });
    const net = makeMockFetch([]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData(baseParams);

    expect(result).toEqual({});
    expect(net.callCount).toBe(0);
  });

  it("returns success for a basic GET", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({ data: [] }, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData(baseParams);

    expect(result).toEqual({ data: [], success: true, httpStatus: 200 });
    expect(net.callCount).toBe(1);
    expect(net.calls[0].url).toBe("/api/proxy");
    expect(net.calls[0].headers["x-proxy-server"]).toBe("test-service-token-chat");
  });

  it("waits for registration to be ready before fetching", async () => {
    const { store } = await setup({ isRegisteringReady: false });
    const net = makeMockFetch([jsonReply({ data: [] }, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const promise = fetchData({ ...baseParams, server: "chat" });
    await new Promise((r) => setTimeout(r, 50));
    expect(net.callCount).toBe(0);
    store.useAppStore.setState({ isRegisteringReady: true });
    const result = await promise;

    expect(result.success).toBe(true);
    expect(net.callCount).toBe(1);
  });

  it("deduplicates identical concurrent requests", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({ data: [] }, 200, 50)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();
    await import("store"); // warm the dynamic import so the first call registers promptly

    const first = fetchData(baseParams);
    await new Promise((r) => setTimeout(r, 0));
    const second = fetchData(baseParams);
    const [result1, result2] = await Promise.all([first, second]);

    expect(result1).toEqual(result2);
    expect(net.callCount).toBe(1);
  });

  it("shares an in-flight request with a second caller signal", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({ data: [] }, 200, 50)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();
    await import("store");
    const controller1 = new AbortController();
    const controller2 = new AbortController();

    const first = fetchData({ ...baseParams, signal: controller1.signal });
    await new Promise((r) => setTimeout(r, 0));
    const second = fetchData({ ...baseParams, signal: controller2.signal });
    const [result1, result2] = await Promise.all([first, second]);

    expect(result1).toEqual(result2);
    expect(net.callCount).toBe(1);
  });

  it("rejects a deduped caller when its own signal is already aborted", async () => {
    await setup();
    const { net, fetch } = makeSignalAwareMockFetch([jsonReply({ data: [] }, 200, 50)]);
    vi.stubGlobal("fetch", fetch);
    const { fetchData } = await loadFetchData();
    await import("store");

    const first = fetchData(baseParams);
    await new Promise((r) => setTimeout(r, 0));
    const controller = new AbortController();
    controller.abort();

    await expect(
      fetchData({ ...baseParams, signal: controller.signal }),
    ).rejects.toThrow("The user aborted a request.");
    await first;
    expect(net.callCount).toBe(1);
  });

  it("rejects a deduped caller when its signal aborts mid-flight", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({ data: [] }, 200, 50)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();
    await import("store");

    const first = fetchData(baseParams);
    await new Promise((r) => setTimeout(r, 0));
    const controller = new AbortController();
    const second = fetchData({ ...baseParams, signal: controller.signal });
    setTimeout(() => controller.abort(), 10);

    await expect(second).rejects.toThrow("The user aborted a request.");
    await first;
  });

  it("returns cached result when useCached is true", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({ data: [] }, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result1 = await fetchData({ ...baseParams, useCached: true });
    const result2 = await fetchData({ ...baseParams, useCached: true });

    expect(result1).toEqual({ data: [], success: true, httpStatus: 200 });
    expect(result2).toEqual({ data: [], success: true });
    expect(net.callCount).toBe(1);
  });

  it("aborts new requests after abortInFlightForLogout is called", async () => {
    await setup();
    const { net, fetch } = makeSignalAwareMockFetch([jsonReply({ data: [] }, 200, 50)]);
    vi.stubGlobal("fetch", fetch);
    const { fetchData, abortInFlightForLogout } = await loadFetchData();

    const first = fetchData(baseParams);
    const firstResult = await first;
    expect(firstResult.success).toBe(true);

    abortInFlightForLogout();
    const second = fetchData(baseParams);
    const secondResult = await second;
    expect(secondResult.success).toBe(false);
    expect(net.callCount).toBe(1);
  });

  it("rejects when the caller signal is already aborted", async () => {
    await setup();
    const { fetch } = makeSignalAwareMockFetch([jsonReply({ data: [] }, 200)]);
    vi.stubGlobal("fetch", fetch);
    const { fetchData } = await loadFetchData();
    const controller = new AbortController();
    controller.abort();

    const result = await fetchData({ ...baseParams, signal: controller.signal });
    expect(result.success).toBe(false);
  });
});

describe("locale detection", () => {
  it("uses the country and language from the URL path", async () => {
    await setup();
    setLocationPathname("/gb-en/shop");
    const net = makeMockFetch([jsonReply({}, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData(baseParams);

    expect(net.calls[0].headers["x-country"]).toBe("gb");
    expect(net.calls[0].headers["x-language"]).toBe("en");
  });

  it("falls back to cookies when the path has no locale", async () => {
    const { cookieManager } = await setup();
    const jar = (cookieManager as any).__jar;
    jar.country = "sy";
    jar.language = "ar";
    const net = makeMockFetch([jsonReply({}, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData(baseParams);

    expect(net.calls[0].headers["x-country"]).toBe("sy");
    expect(net.calls[0].headers["x-language"]).toBe("ar");
  });
});

describe("request routing", () => {
  it("upload story server fetches the URL directly", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({ story: 1 }, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "upload story",
      url: "/upload",
      method: "POST",
      body: { file: "x" },
    });

    expect(net.calls[0].url).toBe("/upload");
    expect(net.calls[0].method).toBe("POST");
    expect(net.calls[0].headers).not.toHaveProperty("content-type");
    expect(result.success).toBe(true);
  });

  it("upload story GET omits the body", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({}, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "upload story",
      url: "/upload",
      method: "GET",
      body: { file: "x" },
    });

    expect(net.calls[0].body).toBeNull();
  });

  it("local server sends a same-origin request with a JSON body", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({}, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "local",
      url: "/api/local",
      method: "POST",
      body: { a: 1 },
    });

    expect(net.calls[0].url).toBe("/api/local");
    expect(net.calls[0].headers["content-type"]).toBe("application/json");
    expect(result.success).toBe(true);
  });

  it("local server with FormData omits Content-Type", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({}, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();
    const form = new FormData();
    form.append("a", "1");

    await fetchData({
      ...baseParams,
      server: "local",
      url: "/api/local",
      method: "POST",
      body: form,
    });

    expect(net.calls[0].headers).not.toHaveProperty("content-type");
  });

  it("local server GET omits the body", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({}, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "local",
      url: "/api/local",
      method: "GET",
      body: { a: 1 },
    });

    expect(net.calls[0].body).toBeNull();
  });

  it("proxy server passes sellerId and a string body", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({}, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "market",
      url: "/item",
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      sellerId: "7",
    });

    expect(net.calls[0].url).toBe("/api/proxy");
    expect(net.calls[0].headers["x-seller-id"]).toBe("7");
    expect(net.calls[0].headers["content-type"]).toBe("application/json");
    expect(net.calls[0].body).toEqual({ a: 1 });
  });

  it("proxy server serializes an object body as JSON", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({}, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "market",
      url: "/item",
      method: "POST",
      body: { a: 1 },
    });

    expect(net.calls[0].headers["content-type"]).toBe("application/json");
    expect(net.calls[0].body).toEqual({ a: 1 });
  });

  it("proxy server with FormData body", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({}, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();
    const form = new FormData();
    form.append("a", "1");

    await fetchData({
      ...baseParams,
      server: "market",
      url: "/item",
      method: "POST",
      body: form,
    });

    expect(net.calls[0].body).toBeInstanceOf(FormData);
    expect(net.calls[0].headers).not.toHaveProperty("content-type");
  });

  it("proxy server GET sends no body", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({}, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "market",
      url: "/item",
      method: "GET",
    });

    expect(net.calls[0].body).toBeNull();
  });

  it("proxy server encodes the target URL", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({}, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "market",
      url: "/item?a=1 b",
      method: "GET",
    });

    expect(net.calls[0].headers["x-proxy-url"]).toBe("/item?a=1%20b");
  });

  it("handles a response whose JSON cannot be parsed", async () => {
    await setup();
    const fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => {
        throw new Error("bad json");
      },
      text: async () => "",
    }));
    vi.stubGlobal("fetch", fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData(baseParams);

    expect(result.success).toBe(true);
    expect(result.httpStatus).toBe(200);
  });
});

describe("response status and message handling", () => {
  it("redirects a seller to home on a non-200 market GET", async () => {
    await setup();
    setLocationPathname("/seller/orders");
    const net = makeMockFetch([jsonReply({ message: "Forbidden" }, 403)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "market",
      sellerId: "9",
    });

    expect(window.location.href).toBe("/");
    expect(result.success).toBe(false);
    expect(result.httpStatus).toBe(403);
  });

  it("does not redirect when a re-auth is already in progress", async () => {
    const { store } = await setup({ shouldAuthinticated: true });
    setLocationPathname("/seller/orders");
    const net = makeMockFetch([jsonReply({ message: "Forbidden" }, 403)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "market",
      sellerId: "9",
    });

    expect(window.location.href).not.toBe("/");
    expect(result.success).toBe(false);
    expect(store.useAppStore.getState().setShouldAuthinticated).not.toHaveBeenCalled();
  });

  it("throws and reports a non-OK response", async () => {
    const { notifications, functions } = await setup();
    const net = makeMockFetch([jsonReply({ message: "Server down" }, 500)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({ ...baseParams, server: "market" });

    expect(result.success).toBe(false);
    expect(result.httpStatus).toBe(500);
    expect(notifications.showErrorNotification).toHaveBeenCalledWith(
      "Server down",
      5000,
      null,
      null,
      1,
    );
    expect(functions.LogError).toHaveBeenCalled();
  });

  it("apply coupon success shows a success toast", async () => {
    const { toasts } = await setup();
    const net = makeMockFetch([
      jsonReply({ data: { status: 1 }, message: "Coupon applied" }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "market",
      url: "/coupon",
      reqTitle: { code: 2, reqTitle: "apply coupon" },
    });

    expect(result.success).toBe(true);
    expect(toasts.showSuccessMessage).toHaveBeenCalledWith("Coupon applied");
  });

  it("apply coupon failure shows an error toast", async () => {
    const { toasts, functions } = await setup();
    const net = makeMockFetch([
      jsonReply({ data: { status: 0 }, message: "Bad coupon" }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "market",
      url: "/coupon",
      reqTitle: { code: 2, reqTitle: "apply coupon" },
    });

    expect(result.success).toBe(false);
    expect(toasts.showErrorMessage).toHaveBeenCalledWith("Bad coupon");
  });

  it("cart widget /cart/remove success shows a success toast", async () => {
    const { toasts } = await setup();
    const net = makeMockFetch([jsonReply({ message: "Removed" }, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "market",
      url: "/cart/remove/1",
      reqTitle: { code: 3, reqTitle: "cart widget" },
    });

    expect(toasts.showSuccessMessage).toHaveBeenCalledWith("Removed");
  });

  it("cart widget status 1 shows a success toast", async () => {
    const { toasts } = await setup();
    const net = makeMockFetch([
      jsonReply({ data: { status: 1 }, message: "Updated" }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "market",
      url: "/cart/list",
      reqTitle: { code: 3, reqTitle: "cart widget" },
    });

    expect(toasts.showSuccessMessage).toHaveBeenCalledWith("Updated");
  });

  it("cart widget error shows an error toast", async () => {
    const { toasts, functions } = await setup();
    const net = makeMockFetch([
      jsonReply({ data: { status: 0 }, message: "Bad" }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "market",
      url: "/cart/list",
      reqTitle: { code: 3, reqTitle: "cart widget" },
    });

    expect(result.success).toBe(false);
    expect(toasts.showErrorMessage).toHaveBeenCalledWith("Bad");
  });

  it("cart/update status 0 shows an error toast", async () => {
    const { toasts } = await setup();
    const net = makeMockFetch([
      jsonReply({ data: { status: 0 }, message: "Bad update" }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "market",
      url: "cart/update",
      reqTitle: { code: 4, reqTitle: "update" },
    });

    expect(result.success).toBe(false);
    expect(toasts.showErrorMessage).toHaveBeenCalledWith("Bad update");
  });

  it("cart/update status 1 shows a success notification", async () => {
    const { notifications } = await setup();
    const net = makeMockFetch([
      jsonReply({ data: { status: 1 }, message: "Updated" }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "market",
      url: "cart/update",
      reqTitle: { code: 4, reqTitle: "update" },
    });

    expect(result.success).toBe(true);
    expect(notifications.showSuccessNotification).toHaveBeenCalledWith("Updated");
  });

  it("cart/update 200 error returns success false without logging", async () => {
    const { toasts, functions } = await setup();
    const net = makeMockFetch([
      jsonReply({ data: { status: 0 }, message: "Bad" }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "market",
      url: "cart/update",
      reqTitle: { code: 4, reqTitle: "update" },
    });

    expect(result.success).toBe(false);
    expect(toasts.showErrorMessage).toHaveBeenCalledWith("Bad");
    expect(functions.LogError).not.toHaveBeenCalled();
  });

  it("cart/update non-200 error is logged", async () => {
    const { functions } = await setup();
    const net = makeMockFetch([jsonReply({ message: "Bad" }, 500)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "market",
      url: "cart/update",
      reqTitle: { code: 4, reqTitle: "update" },
    });

    expect(functions.LogError).toHaveBeenCalled();
  });

  it("generic success response shows a success notification", async () => {
    const { notifications } = await setup();
    const net = makeMockFetch([jsonReply({ message: "Done" }, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "market",
      reqTitle: { code: 5, reqTitle: "generic" },
    });

    expect(notifications.showSuccessNotification).toHaveBeenCalledWith("Done");
  });

  it("noMessage suppresses the success notification", async () => {
    const { notifications } = await setup();
    const net = makeMockFetch([jsonReply({ message: "Done" }, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "market",
      reqTitle: { code: 5, reqTitle: "generic" },
      noMessage: true,
    });

    expect(notifications.showSuccessNotification).not.toHaveBeenCalled();
  });

  it("ignored messages do not trigger a notification", async () => {
    const { notifications } = await setup();
    const net = makeMockFetch([jsonReply({ message: "Success" }, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "market",
      reqTitle: { code: 5, reqTitle: "generic" },
    });

    expect(notifications.showSuccessNotification).not.toHaveBeenCalled();
  });
});

describe("error handling and retries", () => {
  it("GET retries on network failures then succeeds", async () => {
    await setup();
    const net = makeMockFetch([
      typeErrorReply("Failed to fetch"),
      typeErrorReply("Failed to fetch"),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData(baseParams);

    expect(result.success).toBe(true);
    expect(net.callCount).toBe(3);
  });

  it("GET gives up after exhausting retries", async () => {
    const { functions } = await setup();
    const net = makeMockFetch([
      typeErrorReply("Failed to fetch"),
      typeErrorReply("Failed to fetch"),
      typeErrorReply("Failed to fetch"),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData(baseParams);

    expect(result.success).toBe(false);
    expect(net.callCount).toBe(3);
    expect(functions.LogError).toHaveBeenCalled();
  });

  it("GET retries on retryable status codes then succeeds", async () => {
    await setup();
    const net = makeMockFetch([
      jsonReply({}, 502),
      jsonReply({}, 502),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData(baseParams);

    expect(result.success).toBe(true);
    expect(net.callCount).toBe(3);
  });

  it("POST network failures are not retried", async () => {
    const { functions } = await setup();
    const net = makeMockFetch([typeErrorReply("Failed to fetch")]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "market",
      method: "POST",
    });

    expect(result.success).toBe(false);
    expect(net.callCount).toBe(1);
    expect(functions.LogError).toHaveBeenCalled();
  });

  it("treats a missing method as non-mutating and retryable", async () => {
    await setup();
    const net = makeMockFetch([
      typeErrorReply("Failed to fetch"),
      jsonReply({}, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({ ...baseParams, method: undefined as any });

    expect(result.success).toBe(true);
    expect(net.callCount).toBe(2);
  });

  it("Add to cart widget errors show the cart error toast", async () => {
    const { toasts } = await setup();
    const net = makeMockFetch([jsonReply({ message: "Bad" }, 500)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "market",
      url: "/cart/add",
      method: "POST",
      reqTitle: { code: 6, reqTitle: "Add to cart widget" },
    });

    expect(toasts.showErrorMessage).toHaveBeenCalledWith("Bad");
  });

  it("ignored error messages do not show notifications", async () => {
    const { notifications } = await setup();
    const net = makeMockFetch([failureReply("Too many attempts")]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData(baseParams);

    expect(notifications.showErrorNotification).not.toHaveBeenCalled();
  });

  it("aborted errors are not logged", async () => {
    const { functions } = await setup();
    const net = makeMockFetch([typeErrorReply("Fetch is aborted")]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData(baseParams);

    expect(result.success).toBe(false);
    expect(functions.LogError).not.toHaveBeenCalled();
  });

  it("noMessage suppresses the error notification", async () => {
    const { notifications } = await setup();
    const net = makeMockFetch([jsonReply({ message: "Bad" }, 500)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "market",
      noMessage: true,
    });

    expect(notifications.showErrorNotification).not.toHaveBeenCalled();
  });

  it("calls retryActionIfUnAuth on a 401 retry", async () => {
    const { auth } = await setup();
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: true });
    const retryAction = vi.fn();
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "market",
      retryActionIfUnAuth: retryAction,
    });

    expect(retryAction).toHaveBeenCalled();
  });
});

describe("401 recovery", () => {
  it("elastic 401 always retries", async () => {
    await setup();
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({ ...baseParams, server: "elastic" });

    expect(result.success).toBe(true);
    expect(net.callCount).toBe(2);
  });

  it("chat 401 refresh succeeds", async () => {
    const { auth } = await setup();
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: true });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({ ...baseParams, server: "chat" });

    expect(result.success).toBe(true);
    expect(auth.default.RefreshSession).toHaveBeenCalledOnce();
  });

  it("chat 401 refresh ineligible falls through to need_auth", async () => {
    const { auth, store } = await setup();
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: false });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: null }, 200),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const promise = fetchData({ ...baseParams, server: "chat" });
    await new Promise((r) => setTimeout(r, 2100));
    expect(store.useAppStore.getState().setShouldAuthinticated).toHaveBeenCalledWith(true);
    expect(store.useAppStore.getState().setReAuthResult).toHaveBeenCalledWith("pending");
    store.useAppStore.setState({ reAuthResult: "success" });
    const result = await promise;

    expect(result.success).toBe(true);
  });

  it("chat 401 on retry skips refresh and uses need_auth", async () => {
    const { auth, store } = await setup();
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: true });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: null }, 401),
      jsonReply({ data: null }, 200),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const promise = fetchData({ ...baseParams, server: "chat" });
    await new Promise((r) => setTimeout(r, 2100));
    store.useAppStore.setState({ reAuthResult: "success" });
    const result = await promise;

    expect(result.success).toBe(true);
    expect(auth.default.RefreshSession).toHaveBeenCalledOnce();
  });

  it("market 401 refresh succeeds", async () => {
    const { auth } = await setup();
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: true });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({ ...baseParams, server: "market" });

    expect(result.success).toBe(true);
    expect(auth.default.RefreshSession).toHaveBeenCalledOnce();
  });

  it("market-dashboard 401 refresh succeeds", async () => {
    const { auth } = await setup();
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: true });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "market-dashboard",
      sellerId: "8",
    });

    expect(result.success).toBe(true);
    expect(auth.default.RefreshSession).toHaveBeenCalledOnce();
  });

  it("market 401 waits for an existing re-auth to succeed", async () => {
    const { store } = await setup({ shouldAuthinticated: true });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const promise = fetchData({ ...baseParams, server: "market" });
    await new Promise((r) => setTimeout(r, 200));
    store.useAppStore.setState({ reAuthResult: "success" });
    const result = await promise;

    expect(result.success).toBe(true);
  });

  it("market 401 returns false when re-auth is cancelled", async () => {
    const { store } = await setup({ shouldAuthinticated: true });
    const net = makeMockFetch([jsonReply({ data: null }, 401)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const promise = fetchData({ ...baseParams, server: "market" });
    await new Promise((r) => setTimeout(r, 200));
    store.useAppStore.setState({ reAuthResult: "success" });
    const result = await promise;

    expect(result.success).toBe(false);
  });

  it("market 401 waits for registration to be ready", async () => {
    const { store } = await setup();
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const promise = fetchData({
      ...baseParams,
      server: "market",
      url: "/auth/register-guest",
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(store.useAppStore.getState().isRegisteringReady).toBe(false);
    store.useAppStore.setState({ isRegisteringReady: true });
    const result = await promise;

    expect(result.success).toBe(true);
  });

  it("market 401 seller shows expired widget and waits for re-auth", async () => {
    const { auth, store } = await setup();
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: false });
    (auth.default.ExpiredUser as any).mockResolvedValue({
      renewed: false,
      wasVerified: false,
    });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const promise = fetchData({
      ...baseParams,
      server: "market",
      sellerId: "9",
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(store.useAppStore.getState().setReAuthResult).toHaveBeenCalledWith("pending");
    expect(store.useAppStore.getState().setShouldAuthinticated).toHaveBeenCalledWith("expired");
    store.useAppStore.setState({ reAuthResult: "success" });
    const result = await promise;

    expect(result.success).toBe(true);
  });

  it("market 401 verified shopper waits for re-auth", async () => {
    const { auth, store } = await setup();
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: false });
    (auth.default.ExpiredUser as any).mockResolvedValue({
      renewed: false,
      wasVerified: true,
    });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const promise = fetchData({ ...baseParams, server: "market" });
    await new Promise((r) => setTimeout(r, 50));
    store.useAppStore.setState({ reAuthResult: "success" });
    const result = await promise;

    expect(result.success).toBe(true);
  });

  it("market 401 guest continues as a fresh guest", async () => {
    const { auth } = await setup();
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: false });
    (auth.default.ExpiredUser as any).mockResolvedValue({
      renewed: false,
      wasVerified: false,
    });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({ ...baseParams, server: "market" });

    expect(result.success).toBe(true);
    expect(auth.default.ExpiredUser).toHaveBeenCalled();
  });

  it("waitForReAuthSuccess times out after 5 minutes", async () => {
    const { store } = await setup({ shouldAuthinticated: true });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();
    vi.useFakeTimers();

    const promise = fetchData({ ...baseParams, server: "market" });
    await vi.advanceTimersByTimeAsync(300_000);
    const result = await promise;

    expect(result.success).toBe(false);
    vi.useRealTimers();
  });

  it("local /api/auth/login 401 renews and retries", async () => {
    const { auth } = await setup();
    (auth.default.ExpiredUser as any).mockResolvedValue({ renewed: true });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "local",
      url: "/api/auth/login",
    });

    expect(result.success).toBe(true);
    expect(auth.default.ExpiredUser).toHaveBeenCalled();
  });

  it("local /api/ticket with query 401 renews and retries", async () => {
    const { auth } = await setup();
    (auth.default.ExpiredUser as any).mockResolvedValue({ renewed: true });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "local",
      url: "/api/ticket?x=1",
    });

    expect(result.success).toBe(true);
  });

  it("local route outside authed list 401 throws Authentication required", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({ data: null }, 401)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "local",
      url: "/api/other",
    });

    expect(result.success).toBe(false);
    expect(result.httpStatus).toBe(401);
  });

  it("stories 401 refresh succeeds", async () => {
    const { auth } = await setup();
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: true });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({ ...baseParams, server: "stories" });

    expect(result.success).toBe(true);
    expect(auth.default.RefreshSession).toHaveBeenCalledOnce();
  });

  it("stories 401 refresh ineligible falls through to need_auth", async () => {
    const { auth, store } = await setup();
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: false });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: null }, 200),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const promise = fetchData({ ...baseParams, server: "stories" });
    await new Promise((r) => setTimeout(r, 2100));
    expect(store.useAppStore.getState().setShouldAuthinticated).toHaveBeenCalledWith(true);
    expect(store.useAppStore.getState().setReAuthResult).toHaveBeenCalledWith("pending");
    store.useAppStore.setState({ reAuthResult: "success" });
    const result = await promise;

    expect(result.success).toBe(true);
  });

  it("stories 401 reuses an existing armed flow", async () => {
    const { auth, store } = await setup({ shouldAuthinticated: true });
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: false });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: null }, 200),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();
    vi.useFakeTimers();

    const promise = fetchData({ ...baseParams, server: "stories" });
    await vi.advanceTimersByTimeAsync(2000); // pass the stories refresh delay
    expect(store.useAppStore.getState().setShouldAuthinticated).not.toHaveBeenCalled();
    store.useAppStore.setState({ reAuthResult: "success" });
    await vi.advanceTimersByTimeAsync(500);
    const result = await promise;

    expect(result.success).toBe(true);
    vi.useRealTimers();
  });

  it("stories 401 need_auth cancelled resolves false", async () => {
    const { auth, store } = await setup();
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: false });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: null }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();
    vi.useFakeTimers();

    const promise = fetchData({ ...baseParams, server: "stories" });
    await vi.advanceTimersByTimeAsync(2000); // pass the stories refresh delay
    store.useAppStore.setState({ reAuthResult: "cancelled" });
    await vi.advanceTimersByTimeAsync(500);
    const result = await promise;

    expect(result.success).toBe(false);
    vi.useRealTimers();
  });

  it("stories 401 need_auth times out", async () => {
    const { auth, store } = await setup();
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: false });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: null }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();
    vi.useFakeTimers();

    const promise = fetchData({ ...baseParams, server: "stories" });
    await vi.advanceTimersByTimeAsync(2000); // pass the stories refresh delay
    store.useAppStore.setState({ shouldAuthinticated: true });
    await vi.advanceTimersByTimeAsync(300_000);
    const result = await promise;

    expect(result.success).toBe(false);
    vi.useRealTimers();
  });

  it("comments 401 need_auth succeeds", async () => {
    const { store } = await setup();
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: null }, 200),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const promise = fetchData({ ...baseParams, server: "comments" });
    await new Promise((r) => setTimeout(r, 50));
    store.useAppStore.setState({ reAuthResult: "success" });
    const result = await promise;

    expect(result.success).toBe(true);
  });

  it("wallet 401 need_auth succeeds", async () => {
    const { store } = await setup();
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: null }, 200),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const promise = fetchData({ ...baseParams, server: "wallet" });
    await new Promise((r) => setTimeout(r, 50));
    store.useAppStore.setState({ reAuthResult: "success" });
    const result = await promise;

    expect(result.success).toBe(true);
  });

  // Regression: the four sub-service arms of handleUnauthorized share one exit
  // path through a `switch` fall-through, and the clear-tokens body used to be
  // hardcoded to the STORIES pair. A chat / wallet / comments 401 therefore
  // deleted the stories token AND its refresh token, killing an unrelated,
  // still-valid session. Each service must clear only its own credentials.
  describe.each([
    {
      server: "chat" as const,
      expected: [MOCK_COOKIE_NAMES.CHAT_TOKEN, MOCK_COOKIE_NAMES.CHAT_REFRESH_TOKEN],
    },
    {
      server: "stories" as const,
      expected: [
        MOCK_COOKIE_NAMES.STORIES_TOKEN,
        MOCK_COOKIE_NAMES.STORIES_REFRESH_TOKEN,
      ],
    },
    { server: "comments" as const, expected: [MOCK_COOKIE_NAMES.USER_ID_HASH] },
    { server: "wallet" as const, expected: [MOCK_COOKIE_NAMES.WALLET_TOKEN] },
  ])("$server 401 clear-tokens scope", ({ server, expected }) => {
    it(`clears only the ${server} credentials`, async () => {
      const { auth, store } = await setup();
      (auth.default.RefreshSession as any).mockResolvedValue({
        eligible: false,
      });
      const net = makeMockFetch([
        jsonReply({ data: null }, 401),
        jsonReply({ data: null }, 200), // /api/auth/clear-tokens
        jsonReply({ data: [] }, 200), // retry after re-auth
      ]);
      vi.stubGlobal("fetch", net.fetch);
      const { fetchData } = await loadFetchData();

      const promise = fetchData({ ...baseParams, server });
      // chat/stories wait out their 2s post-refresh settle before falling through
      await new Promise((r) => setTimeout(r, 2100));
      store.useAppStore.setState({ reAuthResult: "success" });
      await promise;

      const clearCall = net.calls.find(
        (c) => c.url === "/api/auth/clear-tokens",
      );
      expect(clearCall?.body?.tokens).toEqual(expected);
    });
  });

  it("401 handling bails out when LoggingOut becomes true", async () => {
    const { store } = await setup();
    const net = makeMockFetch([jsonReply({ data: null }, 401, 100)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const promise = fetchData({ ...baseParams, server: "stories" });
    await new Promise((r) => setTimeout(r, 50));
    store.useAppStore.setState({ LoggingOut: true });
    await new Promise((r) => setTimeout(r, 200));
    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.httpStatus).toBe(401);
  });

  it("401 on an unhandled server throws Authentication required", async () => {
    await setup();
    const net = makeMockFetch([jsonReply({ data: null }, 401)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({
      ...baseParams,
      server: "upload story",
      url: "/upload",
    });

    expect(result.success).toBe(false);
    expect(result.httpStatus).toBe(401);
  });

  it("treats /seller paths as seller requests", async () => {
    const { auth } = await setup();
    setLocationPathname("/seller/dashboard");
    (auth.default.RefreshSession as any).mockResolvedValue({ eligible: false });
    (auth.default.ExpiredUser as any).mockResolvedValue({ renewed: true });
    const net = makeMockFetch([
      jsonReply({ data: null }, 401),
      jsonReply({ data: [] }, 200),
    ]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    const result = await fetchData({ ...baseParams, server: "market" });

    expect(result.success).toBe(true);
  });
});

describe("register-guest flag", () => {
  it("sets isRegisteringReady false for /auth/register-guest", async () => {
    const { store } = await setup();
    const net = makeMockFetch([jsonReply({}, 200)]);
    vi.stubGlobal("fetch", net.fetch);
    const { fetchData } = await loadFetchData();

    await fetchData({
      ...baseParams,
      server: "market",
      url: "/auth/register-guest",
    });

    expect(store.useAppStore.getState().isRegisteringReady).toBe(false);
  });
});
