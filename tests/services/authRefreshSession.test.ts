import { afterEach, describe, expect, it, vi } from "vitest";
import { makeStoreMock } from "tests/mocks/store";

// services/auth pulls in the whole client stack (analytics, other services,
// server actions). None of it is exercised by RefreshSession, so it is all
// stubbed out — this file covers the refresh dedup only.
vi.mock("store", () => makeStoreMock({ LoggingOut: false }));
vi.mock("@/store/notifications/reducer", () => ({
  showErrorNotification: vi.fn(),
}));
vi.mock("store/notifications/reducer", () => ({
  showErrorNotification: vi.fn(),
}));
vi.mock("utils/posthog", () => ({ posthogIdentify: vi.fn() }));
vi.mock("utils/functions", () => ({
  _isStoreLastJson: vi.fn(),
  LogError: vi.fn(),
  translateFunction: vi.fn((k: string) => k),
}));
vi.mock("serverActions/sendOtp", () => ({ sendOtpAction: vi.fn() }));
vi.mock("utils/otpLocks", () => ({
  lockNumber: vi.fn(),
  recordSessionNumber: vi.fn(),
}));
vi.mock("services/story", () => ({ default: {} }));
vi.mock("services/home", () => ({ default: {} }));
vi.mock("./home", () => ({ default: {} }));
vi.mock("utils/gtag", () => ({ GAevent: vi.fn(), SetGAUser: vi.fn() }));
vi.mock("utils/orderFunnel", () => ({
  ORDER_EVENTS: {},
  resolveVerifyFlowSource: vi.fn(),
  trackOrder: vi.fn(),
}));
vi.mock("utils/fetchData", () => ({ fetchData: vi.fn() }));
vi.mock("utils/authMe", () => ({ fetchAuthMe: vi.fn() }));
vi.mock("utils/GAEvents", () => ({ GA_EVENT_NAMES: {} }));
vi.mock("utils/Requests", () => ({ REQUESTS_DATA: {} }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: vi.fn() }));
vi.mock("services/wallet", () => ({ checkWallet: vi.fn() }));
vi.mock("./wallet", () => ({ checkWallet: vi.fn() }));
vi.mock("utils/UploadUtils", () => ({ GetTicket: vi.fn() }));

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
