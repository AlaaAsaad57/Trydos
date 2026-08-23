import { afterEach, describe, expect, it, vi } from "vitest";
import { makeStoreMock } from "tests/mocks/store";

// services/auth pulls in the whole client stack (analytics, other services,
// server actions). None of it is exercised by RefreshSession, so it is all
// stubbed out — this file covers the refresh dedup only.
// The stand-in bodies come from tests/mocks/authGraph.ts, shared with the other
// three auth suites. They used to be written out again here, and the two lists
// drifted apart every time services/auth.ts gained an import.
vi.mock("store", () => makeStoreMock({ LoggingOut: false }));
vi.mock("@/store/notifications/reducer", async () => (await import("tests/mocks/authGraph")).makeNotificationsMock());
vi.mock("store/notifications/reducer", async () => (await import("tests/mocks/authGraph")).makeNotificationsMock());
vi.mock("utils/posthog", async () => (await import("tests/mocks/authGraph")).makePosthogMock());
vi.mock("utils/functions", async () => (await import("tests/mocks/authGraph")).makeFunctionsMock());
vi.mock("serverActions/sendOtp", async () => (await import("tests/mocks/authGraph")).makeSendOtpMock());
vi.mock("utils/otpLocks", async () => (await import("tests/mocks/authGraph")).makeOtpLocksMock());
vi.mock("services/story", async () => (await import("tests/mocks/authGraph")).makeStoryServiceMock());
vi.mock("services/home", async () => (await import("tests/mocks/authGraph")).makeHomeServiceMock());
vi.mock("utils/gtag", async () => (await import("tests/mocks/authGraph")).makeGtagMock());
vi.mock("utils/orderFunnel", async () => (await import("tests/mocks/authGraph")).makeOrderFunnelMock());
vi.mock("utils/fetchData", async () => (await import("tests/mocks/authGraph")).makeFetchDataMock());
vi.mock("utils/authMe", async () => (await import("tests/mocks/authGraph")).makeAuthMeMock());
vi.mock("utils/GAEvents", async () => (await import("tests/mocks/authGraph")).makeGaEventNamesMock());
vi.mock("utils/Requests", async () => (await import("tests/mocks/authGraph")).makeRequestsMock());
vi.mock("utils/serverErrorReporter", async () => (await import("tests/mocks/authGraph")).makeErrorReporterMock());
vi.mock("utils/cookies/cookie-manager", async () => (await import("tests/mocks/authGraph")).makeCookieNamesMock());
vi.mock("services/wallet", async () => (await import("tests/mocks/authGraph")).makeWalletMock());
vi.mock("utils/UploadUtils", async () => (await import("tests/mocks/authGraph")).makeUploadUtilsMock());

async function loadAuth(state: Record<string, any> = {}) {
  vi.resetModules();
  vi.unstubAllGlobals();
  vi.clearAllMocks();

  const store = await import("store");
  store.useAppStore.setState({ LoggingOut: false, ...state });
  const auth = (await import("services/auth")).default;
  return { auth, store };
}

/** A fetch that never settles until the test releases it. */
function makeGatedFetch() {
  const gates: Array<() => void> = [];
  const bodies: any[] = [];
  const fetch = vi.fn(async (_url: any, init: any = {}) => {
    bodies.push(JSON.parse(init.body || "{}"));
    await new Promise<void>((resolve) => gates.push(resolve));
    return {
      ok: true,
      status: 200,
      json: async () => ({ refreshed: true }),
    };
  });
  return {
    fetch,
    bodies,
    get callCount() {
      return fetch.mock.calls.length;
    },
    releaseAll: () => gates.splice(0).forEach((g) => g()),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RefreshSession dedup", () => {
  it("shares one round trip for concurrent 401s on the SAME service", async () => {
    const { auth } = await loadAuth();
    const net = makeGatedFetch();
    vi.stubGlobal("fetch", net.fetch);

    const a = auth.RefreshSession("/stories/a", "stories");
    const b = auth.RefreshSession("/stories/b", "stories");
    await Promise.resolve();
    net.releaseAll();
    await Promise.all([a, b]);

    expect(net.callCount).toBe(1);
  });

  // Regression: the dedup used to be a single module-level promise for every
  // service. Each service owns its OWN token pair and /api/auth/refresh only
  // exchanges the pair named in the body, so a stories 401 arriving during a
  // market refresh got `{eligible: true}` back without any stories exchange —
  // it then retried with the same dead token and fell through to the OTP
  // prompt. Different services must never share an exchange.
  it.each([
    ["market", "stories"],
    ["market", "chat"],
    ["chat", "stories"],
  ])("does NOT share a %s refresh with a %s refresh", async (first, second) => {
    const { auth } = await loadAuth();
    const net = makeGatedFetch();
    vi.stubGlobal("fetch", net.fetch);

    const a = auth.RefreshSession("/first", first);
    const b = auth.RefreshSession("/second", second);
    await Promise.resolve();
    net.releaseAll();
    await Promise.all([a, b]);

    expect(net.callCount).toBe(2);
    expect(net.bodies.map((x) => x.server).sort()).toEqual(
      [first, second].sort(),
    );
  });

  it("market and market-dashboard share one exchange (same token pair)", async () => {
    const { auth } = await loadAuth();
    const net = makeGatedFetch();
    vi.stubGlobal("fetch", net.fetch);

    const a = auth.RefreshSession("/cart", "market");
    const b = auth.RefreshSession("/seller/orders", "market-dashboard");
    await Promise.resolve();
    net.releaseAll();
    await Promise.all([a, b]);

    expect(net.callCount).toBe(1);
  });

  it("releases the key so a later 401 on the same service can refresh again", async () => {
    const { auth } = await loadAuth();
    const net = makeGatedFetch();
    vi.stubGlobal("fetch", net.fetch);

    const first = auth.RefreshSession("/stories/a", "stories");
    await Promise.resolve();
    net.releaseAll();
    await first;

    const second = auth.RefreshSession("/stories/b", "stories");
    await Promise.resolve();
    net.releaseAll();
    await second;

    expect(net.callCount).toBe(2);
  });

  it("never refreshes while logging out", async () => {
    const { auth } = await loadAuth({ LoggingOut: true });
    const net = makeGatedFetch();
    vi.stubGlobal("fetch", net.fetch);

    const result = await auth.RefreshSession("/stories/a", "stories");

    expect(result).toEqual({ refreshed: false, eligible: false });
    expect(net.callCount).toBe(0);
  });
});
