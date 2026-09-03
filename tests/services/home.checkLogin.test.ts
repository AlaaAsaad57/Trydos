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

import { describe, expect, it, vi, beforeEach } from "vitest";
import homeService from "services/home";
import { fetchAuthMe } from "utils/authMe";
import { useAppStore } from "store";

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
