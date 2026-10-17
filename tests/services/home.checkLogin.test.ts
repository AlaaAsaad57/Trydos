// `CheckLogin` — the app-load auth bootstrap (`services/home.ts`).
//
// It reads `/api/auth/me` once, then decides whether the visitor needs a guest
// credential. The decision is made from two local variables (`userData` and
// `hasMarketToken`) that are read **before** any registration runs and are
// never re-read after one, so a test here has to count the registrations, not
// only check that one happened.
//
// A first visit must create exactly one guest. Creating a second one throws the
// first away: its cart, its wishlist and its identity are gone, and the extra
// registration keeps `isRegisteringReady` false for longer, which makes the 401
// recovery in `utils/fetchData.ts` skip the refresh path (see the comment on
// `!isRegisteringReady` there) and ride the new guest instead.

import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import homeService from "services/home";
import { fetchAuthMe } from "utils/authMe";
import { useAppStore } from "store";
import { posthogIdentify } from "utils/posthog";
import { LogServerError } from "utils/serverErrorReporter";

vi.mock("utils/authMe", () => ({ fetchAuthMe: vi.fn() }));
vi.mock("utils/fetchData", () => ({ fetchData: vi.fn() }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: vi.fn() }));
vi.mock("utils/gtag", () => ({ GAevent: vi.fn(), SetGAUser: vi.fn() }));
vi.mock("utils/posthog", () => ({ posthogIdentify: vi.fn() }));
vi.mock("utils/functions", () => ({
  WaitForCondition: vi.fn(async () => true),
  _isStoreLastJson: vi.fn(),
  getCart: vi.fn(),
  LogError: vi.fn(),
  translateFunction: vi.fn((key: string) => key),
}));

/** Every guest the run minted, newest last. One entry per POST that the code
 *  actually sent — which is the whole point of these cases. */
const registrations: number[] = [];

/** Stand in for `/api/auth/register-device`, handing back a new guest id each
 *  time. Distinct ids are what let a case say *which* guest survived, rather
 *  than only that somebody registered. */
const stubRegisterDevice = () => {
  registrations.length = 0;
  let nextId = 1000;
  global.fetch = vi.fn(async (url: any) => {
    if (String(url).includes("/api/auth/register-device")) {
      const id = ++nextId;
      registrations.push(id);
      return {
        ok: true,
        json: async () => ({
          data: { user: { id, name: "Guest" }, expires_at: 0 },
        }),
      } as any;
    }
    throw new Error(`unexpected fetch to ${String(url)} during CheckLogin`);
  }) as any;
};

describe("CheckLogin — the app-load auth bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubRegisterDevice();
    useAppStore.setState({
      isRegisteringReady: true,
      LoggingOut: false,
    } as any);
    // The app reads the country and language off the path.
    window.history.pushState({}, "", "/sy-en/");
  });

  it("registers exactly one guest for a visitor arriving with no credential", async () => {
    // What a first visit looks like to `/api/auth/me`: nobody, and no token.
    vi.mocked(fetchAuthMe).mockResolvedValue({
      user: null,
      chatUser: null,
      storiesUser: null,
      walletUser: null,
      hasMarketToken: false,
    } as any);

    await homeService.CheckLogin();
    // The second registration is fired without `await`, so let the microtask
    // queue drain before counting. Without this the case would pass by looking
    // too early rather than because the app behaved.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      registrations,
      `a first visit registered ${registrations.length} guests (ids ${registrations.join(", ")}). ` +
        `Every guest after the first throws the previous one away — its cart and identity go with it.`,
    ).toHaveLength(1);
  });

  it("registers no guest at all when the visitor already holds a credential", async () => {
    vi.mocked(fetchAuthMe).mockResolvedValue({
      user: { id: 77, name: "Guest", is_phone_verified: 0 },
      chatUser: null,
      storiesUser: null,
      walletUser: null,
      hasMarketToken: true,
    } as any);

    await homeService.CheckLogin();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      registrations,
      `a visitor who already had a credential was registered again (ids ${registrations.join(", ")}), ` +
        `which replaces the guest the app was already talking to`,
    ).toHaveLength(0);
  });
});

describe("CheckLogin — signing the stored visitor back in", () => {
  const me = (overrides: Record<string, unknown>) =>
    vi.mocked(fetchAuthMe).mockResolvedValue({
      user: null,
      chatUser: null,
      storiesUser: null,
      walletUser: null,
      hasMarketToken: true,
      ...overrides,
    } as any);

  beforeEach(() => {
    vi.clearAllMocks();
    stubRegisterDevice();
    vi.stubEnv("NODE_ENV", "production");
    useAppStore.setState({
      isRegisteringReady: true,
      LoggingOut: false,
      userProfile: null,
      userChat: null,
      userStories: null,
      userWallet: null,
    } as any);
    window.history.pushState({}, "", "/sy-en/");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("signs a verified shopper into the market, chat, stories and wallet", async () => {
    me({
      user: { id: 18081, name: "Shopper", is_phone_verified: 1, mobilePhone: "x" },
      chatUser: { id: 1 },
      storiesUser: { id: 2 },
      walletUser: { id: 3 },
    });

    await homeService.CheckLogin();

    const state: any = useAppStore.getState();
    expect(state.userProfile?.id, "the verified shopper was not signed in").toBe(18081);
    expect(state.userChat?.id, "the chat account was not signed in").toBe(1);
    expect(state.userStories?.id, "the stories account was not signed in").toBe(2);
    expect(state.userWallet?.id, "the wallet account was not signed in").toBe(3);
    expect(posthogIdentify, "the verified shopper was not identified to analytics").toHaveBeenCalledWith(
      18081,
      expect.objectContaining({ name: "Shopper" }),
    );
  });

  it("signs a verified shopper in without the side accounts they do not have", async () => {
    me({ user: { id: 18081, name: "Shopper", is_phone_verified: 1 } });

    await homeService.CheckLogin();

    expect(useAppStore.getState().userChat, "a chat account appeared from nowhere").toBeNull();
  });

  it("signs an unverified visitor back in with their stories account", async () => {
    me({ user: { id: 77, name: "Guest", is_phone_verified: 0 }, storiesUser: { id: 4 } });

    await homeService.CheckLogin();

    const state: any = useAppStore.getState();
    expect(state.userProfile?.id, "the unverified visitor was not signed back in").toBe(77);
    expect(state.userStories?.id, "the unverified visitor lost their stories account").toBe(4);
    expect(posthogIdentify, "the unverified visitor was not identified to analytics").toHaveBeenCalledWith(
      77,
      expect.objectContaining({ name: "Guest" }),
    );
  });

  it("registers a guest when a token exists but no visitor came back with it", async () => {
    me({});

    await homeService.CheckLogin();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(registrations, "a token with no visitor did not get a guest").toHaveLength(1);
    expect(posthogIdentify, "the new guest was not identified to analytics").toHaveBeenCalledWith(
      1001,
      { name: "Guest", phone: "guest" },
    );
  });

  it("reports a refused guest registration and frees the lock", async () => {
    global.fetch = vi.fn(async () => ({ ok: false, json: async () => ({ message: "refused" }) })) as any;
    me({ hasMarketToken: false });

    await homeService.CheckLogin();

    expect(
      vi.mocked(LogServerError).mock.calls.map((call: any[]) => call[0]?.scenario),
      "the refused guest registration was not reported",
    ).toContain("Error In RegisterDevice in services/home");
    expect(useAppStore.getState().isRegisteringReady, "the registration lock was left on").toBe(true);
  });
});

// A verified shopper who stays away for 48 hours comes back with no market
// token: the browser drops `MARKET-TOKEN` after `TOKEN_COOKIE_MAX_AGE` (48 h),
// but `User-Data` (1 year) still says "verified". `CheckLogin` used to register
// a guest at once for any visitor with no token, so the shopper became an
// anonymous guest and the "session expired" prompt never appeared. That prompt
// is armed only by `/api/auth/expire` (`ExpiredUser`), which the boot never
// called.
describe("CheckLogin — a verified shopper whose market cookie expired", () => {
  /** Every call the run sent to `/api/auth/expire`. */
  let expireCalls = 0;

  /** Stand in for `/api/auth/expire` (with `answer` as its body) and for
   *  `/api/auth/register-device`, so a case can say which of the two ran. */
  const stubExpire = (answer: Record<string, unknown>) => {
    stubRegisterDevice();
    expireCalls = 0;
    const registerDevice = global.fetch as any;
    global.fetch = vi.fn(async (url: any, init?: any) => {
      if (String(url).includes("/api/auth/expire")) {
        expireCalls++;
        return { ok: true, json: async () => answer } as any;
      }
      return registerDevice(url, init);
    }) as any;
  };

  const verifiedShopperWithNoToken = () =>
    vi.mocked(fetchAuthMe).mockResolvedValue({
      user: { id: 18081, name: "Shopper", is_phone_verified: 1, phone: "100" },
      chatUser: { id: 1 },
      storiesUser: { id: 2 },
      walletUser: { id: 3 },
      hasMarketToken: false,
    } as any);

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      isRegisteringReady: true,
      LoggingOut: false,
      shouldAuthinticated: false,
      reAuthResult: null,
      userProfile: null,
      user: null,
      userChat: null,
      userStories: null,
      userWallet: null,
    } as any);
    window.history.pushState({}, "", "/sy-en/");
  });

  it("shows the session-expired prompt when the refresh cookie is dead too", async () => {
    stubExpire({ expired: true, wasVerified: true });
    verifiedShopperWithNoToken();

    await homeService.CheckLogin();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const state: any = useAppStore.getState();
    expect(
      expireCalls,
      "the boot never asked /api/auth/expire about the dead session, so nothing could arm the prompt",
    ).toBeGreaterThan(0);
    expect(
      state.shouldAuthinticated,
      `the session-expired prompt was not armed (shouldAuthinticated = ${JSON.stringify(state.shouldAuthinticated)})`,
    ).toBe("expired");
    expect(
      registrations,
      `the boot registered its own guest (ids ${registrations.join(", ")}) on top of the one /api/auth/expire makes`,
    ).toEqual([]);
    expect(
      state.userProfile?.is_phone_verified,
      "the store still shows the expired shopper as verified behind the prompt",
    ).not.toBe(1);
  });

  it("keeps the shopper signed in when the refresh cookie still renews the session", async () => {
    stubExpire({ renewed: true, expired: false });
    verifiedShopperWithNoToken();

    await homeService.CheckLogin();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const state: any = useAppStore.getState();
    expect(
      registrations,
      `a shopper whose session renewed was replaced by a guest (ids ${registrations.join(", ")})`,
    ).toEqual([]);
    expect(
      state.shouldAuthinticated,
      "the session-expired prompt was shown for a session that renewed",
    ).toBeFalsy();
    expect(state.userProfile?.is_phone_verified, "the renewed shopper was not signed in as verified").toBe(1);
    expect(state.userChat?.id, "the renewed shopper's chat account was not signed in").toBe(1);
  });

  it("still registers a guest silently for an unverified visitor with no token", async () => {
    stubExpire({ expired: true, wasVerified: false });
    vi.mocked(fetchAuthMe).mockResolvedValue({
      user: { id: 77, name: "Guest", is_phone_verified: 0 },
      chatUser: null,
      storiesUser: null,
      walletUser: null,
      hasMarketToken: false,
    } as any);

    await homeService.CheckLogin();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(expireCalls, "an unverified visitor was sent down the session-expired path").toBe(0);
    expect(registrations, "an unverified visitor with no token got no guest").toEqual([1001]);
    expect(useAppStore.getState().shouldAuthinticated, "an unverified visitor was shown a prompt").toBeFalsy();
  });
});
