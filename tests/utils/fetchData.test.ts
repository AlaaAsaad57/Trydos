import { makeMockAuthModule } from "tests/mocks/auth";
import { jsonReply, makeMockFetch } from "tests/mocks/mockFetch";
import { makeStoreMock } from "tests/mocks/store";
import { makeToastsMock } from "tests/mocks/ToastMock";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("store", () => makeStoreMock({ LoggingOut: true }));
vi.mock("services/auth", () => makeMockAuthModule());
vi.mock("@/components/global/AddToCartMessage", () => makeToastsMock());
beforeEach(() => {
  vi.resetModules();
});

describe("it should load the fetchData with the mocked modules", () => {
  it("returns an empty object and does not fetch while logging out", async () => {
    // Arrange
    const net = makeMockFetch([]);

    vi.stubGlobal("fetch", net.fetch);

    // Import a fresh fetchData module
    const { fetchData } = await import("utils/fetchData");

    // Act
    const result = await fetchData({
      method: "GET",
      server: "chat",
      url: "/sd",
      reqTitle: { code: 2, reqTitle: "s" },
    });

    // Assert
    expect(result).toEqual({});
    expect(net.callCount).toBe(0);
  });
  it("returns success object and do  fetch one time", async () => {
    // Arrange
    const store = await import("store");
    store.useAppStore.setState({
      LoggingOut: false,
    });
    const net = makeMockFetch([jsonReply({ data: [] }, 200)]);

    vi.stubGlobal("fetch", net.fetch);

    const { fetchData } = await import("utils/fetchData");

    // Act
    const result = await fetchData({
      method: "GET",
      server: "chat",
      url: "/sd",
      reqTitle: { code: 2, reqTitle: "s" },
    });

    // Assert
    expect(result.success).toEqual(true);
    expect(net.callCount).toBe(1);
    expect(result.httpStatus).toBe(200);
  });
  it("if two fetch accure in the same time it should be called once", async () => {
    // Arrange
    const store = await import("store");
    store.useAppStore.setState({
      LoggingOut: false,
    });
    const net = makeMockFetch([
      jsonReply({ data: [] }, 200, 1000),
      jsonReply({ data: [] }, 200, 1000),
    ]);

    vi.stubGlobal("fetch", net.fetch);

    const { fetchData } = await import("utils/fetchData");

    // Act
    const [result1, result2] = await Promise.all([
      fetchData({
        method: "GET",
        server: "chat",
        url: "/sd",
        reqTitle: { code: 2, reqTitle: "s" },
      }),
      fetchData({
        method: "GET",
        server: "chat",
        url: "/sd",
        reqTitle: { code: 2, reqTitle: "s" },
      }),
    ]);

    // Assert

    expect(result1.success).toEqual(result2.success);
    expect(net.callCount).toBe(1);
    expect(result1.httpStatus).toBe(result2.httpStatus);
  });
  it("should abort a call when abortInFlightForLogout called", async () => {
    const { fetchData, abortInFlightForLogout } =
      await import("utils/fetchData");
    const store = await import("store");
    store.useAppStore.setState({
      LoggingOut: false,
    });
    const SuccessResult = fetchData({
      method: "GET",
      server: "market",
      url: "/customer/info",
      reqTitle: { code: 2, reqTitle: "s" },
    });

    let SucccessData = await SuccessResult.then((v) => v);
    expect(SucccessData.success).toEqual(true);
    // aborted
    const AbortedResult = fetchData({
      method: "GET",
      server: "market",
      url: "/customer/info",
      reqTitle: { code: 2, reqTitle: "s" },
    });
    abortInFlightForLogout();
    let AbortedData = await AbortedResult.then((v) => v);

    expect(AbortedData.success).toEqual(false);
  });
});
describe("fetchData waiting for guest registration", () => {
  let store;
  let fetchData;

  beforeEach(async () => {
    vi.useFakeTimers();

    // Reset the store to a clean state before each test
    store = await import("store");
    store.useAppStore.setState({
      LoggingOut: false,
      isRegisteringReady: false, // always start with false
    });

    // Import fetchData after store is reset
    const module = await import("utils/fetchData");
    fetchData = module.fetchData;
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  it("resolves immediately if isRegisteringReady is already true", async () => {
    const store = await import("store");
    store.useAppStore.setState({ isRegisteringReady: true });

    const { fetchData } = await import("utils/fetchData");
    const promise = fetchData({
      method: "GET",
      server: "market",
      url: "/customer/info",
      reqTitle: { code: 2, reqTitle: "s" },
    });

    // No timers need to run; it should resolve synchronously.
    await vi.runAllTimersAsync(); // just in case
    await expect(promise).resolves.toBeDefined();
  });
  it("resolves when isRegisteringReady becomes true before the timeout", async () => {
    let resolved = false;
    const store = await import("store");
    store.useAppStore.setState({ isRegisteringReady: false });

    const { fetchData } = await import("utils/fetchData");
    fetchData({
      method: "GET",
      server: "market",
      url: "/customer/info",
      reqTitle: { code: 2, reqTitle: "s" },
    }).then(() => {
      resolved = true;
    });

    // Advance just enough for the first interval to schedule, but not the 5-min timeout.
    await vi.advanceTimersByTimeAsync(500);
    expect(resolved).toBe(false);

    // Now set the flag
    store.useAppStore.setState({ isRegisteringReady: true });

    // Advance past the interval period (300ms) so the check runs
    await vi.advanceTimersByTimeAsync(300);

    // Promise should resolve
    expect(resolved).toBe(true);
  });
  it("clears the interval after 5 minutes if flag never becomes true", async () => {
    const store = await import("store");
    store.useAppStore.setState({ isRegisteringReady: false });

    // Spy on clearInterval to verify it gets called
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");

    const { fetchData } = await import("utils/fetchData");
    const promise = fetchData({
      method: "GET",
      server: "market",
      url: "/customer/info",
      reqTitle: { code: 2, reqTitle: "s" },
    });

    // Advance 5 minutes + a bit
    await vi.advanceTimersByTimeAsync(300_000 + 100);

    // The interval should have been cleared
    expect(clearIntervalSpy).toHaveBeenCalled();

    // The promise never resolves (it remains pending)
    // We can check that it hasn't resolved yet
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });
    await vi.advanceTimersByTimeAsync(1000); // give extra time
    expect(resolved).toBe(false);

    clearIntervalSpy.mockRestore();
  });
});
describe("fetchData re-auth flow", () => {
  let store;
  let fetchData;

  beforeEach(async () => {
    // Reset the store to a clean state before each test
    store = await import("store");
    store.useAppStore.setState({
      LoggingOut: false,
      isRegisteringReady: true, // always start with false
    });

    // Import fetchData after store is reset
    const module = await import("utils/fetchData");
    fetchData = module.fetchData;
  });
  afterEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });
  it("should call chat api and fails 401 then refresh token and retry", async () => {
    const net = makeMockFetch([
      jsonReply({ data: null }, 401, 0),
      jsonReply({ data: null }, 200, 0),
    ]);

    vi.stubGlobal("fetch", net.fetch);

    // Import a fresh fetchData module
    const { fetchData } = await import("utils/fetchData");
    const authModule = await import("services/auth");
    vi.mocked(authModule.default.RefreshSession).mockResolvedValueOnce({
      eligible: true,
      refreshed: true,
    });
    // Act
    const result = await fetchData({
      method: "GET",
      server: "chat",
      url: "/sd",
      reqTitle: { code: 2, reqTitle: "s" },
    });

    expect(authModule.default.RefreshSession).toHaveBeenCalledOnce();
  });
  it("should call market/market-dashboard api and fails 401 then refresh token and retry", async () => {
    const net = makeMockFetch([
      jsonReply({ data: null }, 401, 0),
      jsonReply({ data: null }, 200, 0),
    ]);

    vi.stubGlobal("fetch", net.fetch);

    // Import a fresh fetchData module
    const { fetchData } = await import("utils/fetchData");
    const authModule = await import("services/auth");
    vi.mocked(authModule.default.RefreshSession).mockResolvedValueOnce({
      eligible: true,
      refreshed: true,
    });
    // Act
    const result = await fetchData({
      method: "GET",
      server: "market-dashboard",
      url: "/sd",
      sellerId: "8",
      reqTitle: { code: 2, reqTitle: "s" },
    });

    expect(authModule.default.RefreshSession).toHaveBeenCalledOnce();
  });
  it("should call stories api and fails 401 then refresh token and retry", async () => {
    vi.useFakeTimers();

    const setShouldAuthinticated = vi.fn();
    const setReAuthResult = vi.fn();

    // Three replies: main 401, clear‑tokens 200, retry 200
    const net = makeMockFetch([
      jsonReply({ data: null }, 401, 0),
      jsonReply({ data: null }, 200, 0),
      jsonReply({ data: null }, 200, 0),
    ]);
    vi.stubGlobal("fetch", net.fetch);

    const store = await import("store");
    store.useAppStore.setState({
      LoggingOut: false,
      setShouldAuthinticated,
      setReAuthResult,
      isRegisteringReady: true,
      reAuthResult: null,
      shouldAuthinticated: false,
    });

    const { fetchData } = await import("utils/fetchData");

    const promise = fetchData({
      method: "GET",
      server: "stories",
      url: "/sd",
      reqTitle: { code: 2, reqTitle: "s" },
    });

    // Process the fetch responses (setTimeout(0) tasks)
    await vi.advanceTimersByTimeAsync(0);

    // Now the 401 handling has run and spies were called
    expect(setShouldAuthinticated).toHaveBeenCalledWith(true);
    expect(setReAuthResult).toHaveBeenCalledWith("pending");

    // Simulate successful re‑auth
    store.useAppStore.setState({ reAuthResult: "success" });

    // Run the interval check (500ms)
    await vi.advanceTimersByTimeAsync(500);

    // Process the retry fetch (setTimeout(0) again)
    await vi.advanceTimersByTimeAsync(0);

    const result = await promise;
    expect(result.success).toBe(true);

    vi.useRealTimers();
  });
  it("should when inflight refresh the api call must wait till the refresh success", async () => {
    vi.useFakeTimers();

    const setShouldAuthinticated = vi.fn();
    const setReAuthResult = vi.fn();

    const net = makeMockFetch([
      jsonReply({ data: null }, 401, 0), // main 401
      jsonReply({ data: null }, 200, 0), // clear-tokens
      jsonReply({ data: null }, 401, 0), // second 401
      jsonReply({ data: null }, 200, 0), // clear-tokens
      jsonReply({ data: { d: 2 } }, 200, 0), // retry
    ]);
    vi.stubGlobal("fetch", net.fetch);

    const store = await import("store");
    store.useAppStore.setState({
      LoggingOut: false,
      setShouldAuthinticated,
      setReAuthResult,
      isRegisteringReady: true,
      reAuthResult: null,
      shouldAuthinticated: false,
    });

    const { fetchData } = await import("utils/fetchData");

    // Start both requests synchronously
    const promise1 = fetchData({
      method: "GET",
      server: "stories",
      url: "/sd",
      reqTitle: { code: 2, reqTitle: "s" },
    });

    // Resolve the first fetch (401) and the clear-tokens request
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    // Spies are now called
    expect(setShouldAuthinticated).toHaveBeenCalledWith(true);
    expect(setReAuthResult).toHaveBeenCalledWith("pending");
    store.useAppStore.setState({
      LoggingOut: false,
      setShouldAuthinticated,
      setReAuthResult,
      isRegisteringReady: true,
      reAuthResult: null,
      shouldAuthinticated: true,
    });
    const promise2 = fetchData({
      method: "GET",
      server: "stories",
      url: "/sd",
      reqTitle: { code: 2, reqTitle: "s" },
    });
    // Simulate successful re-auth
    store.useAppStore.setState({ reAuthResult: "success" });

    // Run all pending timers – this covers the 500ms interval, microtasks,
    // and the retry fetch, all in one go.
    await vi.runAllTimersAsync();

    // Both promises should now resolve successfully
    const result1 = await promise1;
    const result2 = await promise2;
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(net.calls.filter((s) => s.url === "/api/proxy").length).toBe(3); 

    vi.useRealTimers();
  });
  it("should while there is inflight refresh and the user close the refresh widget",async()=>{
    vi.useFakeTimers();

    const setShouldAuthinticated = vi.fn();
    const setReAuthResult = vi.fn();

    const net = makeMockFetch([
      jsonReply({ data: { d: 1 } }, 401, 0), // main 401
      jsonReply({ data: { d: 3 } }, 200, 0), // clear-tokens
      jsonReply({ data: { d: 4 } }, 200, 0), //mobile error log
      jsonReply({ data: { d: 1 } }, 401, 0), // secpnd 401
      
    ]);
    vi.stubGlobal("fetch", net.fetch);

    const store = await import("store");
    store.useAppStore.setState({
      LoggingOut: false,
      setShouldAuthinticated,
      setReAuthResult,
      isRegisteringReady: true,
      reAuthResult: null,
      shouldAuthinticated: false,
    });

    const { fetchData } = await import("utils/fetchData");

    // Start both requests synchronously
    const promise1 = fetchData({
      method: "GET",
      server: "stories",
      url: "/sd",
      reqTitle: { code: 2, reqTitle: "s" },
    });

    // Resolve the first fetch (401) and the clear-tokens request
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    // Spies are now called
    expect(setShouldAuthinticated).toHaveBeenCalledWith(true);
    expect(setReAuthResult).toHaveBeenCalledWith("pending");
    store.useAppStore.setState({
      LoggingOut: false,
      setShouldAuthinticated,
      setReAuthResult,
      isRegisteringReady: true,
      reAuthResult: "cancelled" ,
      shouldAuthinticated: true,
    });
    const promise2 = fetchData({
      method: "GET",
      server: "stories",
      url: "/sd",
      reqTitle: { code: 2, reqTitle: "s" },
    });
    // Simulate successful re-auth
    store.useAppStore.setState({ reAuthResult: "cancelled" });
    await vi.advanceTimersByTime(300000);
    // Run all pending timers – this covers the 500ms interval, microtasks,
    // and the retry fetch, all in one go.
    await vi.runAllTimersAsync();

    // Both promises should now resolve successfully
    const result1 = await promise1;
    const result2 = await promise2;
    console.log(result1,result2,net.calls);
    expect(result1.success).toBe(false);
    expect(result2.success).toBe(false);
    expect(net.calls.filter((s) => s.url === "/api/proxy").length).toBe(2); 

    vi.useRealTimers();
  })
});
