import { describe, expect, it, vi, beforeEach } from "vitest";
import homeService from "services/home";
import { fetchData } from "utils/fetchData";
import { useAppStore } from "store";
import { LogServerError } from "utils/serverErrorReporter";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: vi.fn(),
}));

vi.mock("utils/functions", () => ({
  WaitForCondition: vi.fn(async () => true),
  _isStoreLastJson: vi.fn(),
  getCart: vi.fn(),
  LogError: vi.fn(),
  translateFunction: vi.fn(),
}));

describe("Home Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GetFireBaseSettings", () => {
    it("fetches firebase settings and updates store state", async () => {
      const mockSettings = { apiKey: "test-key", appId: "1:123:web:abc" };
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { firebase_settings: mockSettings },
      });

      let storeFirebaseSettings: any = null;
      useAppStore.setState({
        getFirebaseSettings: (settings: any) => {
          storeFirebaseSettings = settings;
        },
      } as any);

      await homeService.GetFireBaseSettings();

      expect(fetchData, "should call fetchData for firebase settings").toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          server: "market",
        }),
      );
      expect(storeFirebaseSettings, "store should be updated with firebase settings").toEqual(mockSettings);
    });

    it("resets firebase settings to null when response is unsuccessful", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Settings error",
      });

      let storeFirebaseSettings: any = "initial";
      useAppStore.setState({
        getFirebaseSettings: (settings: any) => {
          storeFirebaseSettings = settings;
        },
      } as any);

      await homeService.GetFireBaseSettings();
      expect(storeFirebaseSettings, "store firebase settings should be reset to null").toBeNull();
    });
  });

  describe("getCustomerInfo", () => {
    /** The profile write goes to the app's own route with a bare `fetch`. */
    const userDataWrites = (spy: ReturnType<typeof vi.fn>) =>
      spy.mock.calls
        .filter(([url]) => String(url).includes("/api/auth/update-user"))
        .map(([, init]) => JSON.parse(String(init?.body)).updates[0].value);

    beforeEach(() => {
      vi.unstubAllGlobals();
    });

    // E2E run 35845377516, SCRIPT-12: the page's first load sent customer/info
    // as guest 33618, the sign-in as 18081 finished while it was in flight, and
    // the guest answer then replaced the signed-in profile.
    it("does not put the guest back when the sign-in lands while the guest's customer/info is in flight", async () => {
      let answer!: (value: unknown) => void;
      vi.mocked(fetchData).mockReturnValueOnce(
        new Promise((resolve) => {
          answer = resolve;
        }) as any,
      );
      const fetchSpy = vi.fn(async () => new Response("{}"));
      vi.stubGlobal("fetch", fetchSpy);
      useAppStore.setState({
        userProfile: { id: 33618, name: "", is_phone_verified: 0 },
      } as any);

      const pending = homeService.getCustomerInfo();
      await vi.waitFor(() => expect(fetchData).toHaveBeenCalled());

      // The sign-in finishes before the guest's answer arrives.
      useAppStore
        .getState()
        .loginSuccess({ id: 18081, name: "Shopper", is_verified: 1, is_phone_verified: 1 });

      answer({
        success: true,
        data: { customer_info: { id: 33618, name: "guest", is_phone_verified: 0 } },
      });
      await pending;

      expect(
        useAppStore.getState().userProfile?.id,
        "a guest answer that arrived after the sign-in replaced the signed-in shopper in the store",
      ).toBe(18081);
      expect(
        userDataWrites(fetchSpy).map((profile) => profile.id),
        "a guest answer that arrived after the sign-in was written into the User-Data cookie, so /api/auth/me now says guest",
      ).not.toContain(33618);
    });

    it("still saves the answer when it belongs to the shopper who is signed in", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { customer_info: { id: 18081, name: "Shopper", is_phone_verified: 1 } },
      } as any);
      const fetchSpy = vi.fn(async () => new Response("{}"));
      vi.stubGlobal("fetch", fetchSpy);
      useAppStore.setState({
        userProfile: { id: 18081, name: "Shopper", is_phone_verified: 1 },
      } as any);

      await homeService.getCustomerInfo();

      expect(
        userDataWrites(fetchSpy).map((profile) => profile.id),
        "the signed-in shopper's own customer/info answer was not written into the User-Data cookie",
      ).toEqual([18081]);
    });
  });

  describe("hideOldCart", () => {
    beforeEach(() => {
      useAppStore.setState({ rdbLock: null });
    });

    it("records the lock when an RDB payment request holds the cart, and does not treat it as an error", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        httpStatus: 409,
        message:
          "Your cart is locked until the pending RDB payment is completed or cancelled.",
        data: {
          rdb_request_reference: "ref-1",
          expires_at: "2026-09-15T14:30:00+00:00",
        },
      } as any);

      await homeService.hideOldCart({ id: 42 });

      expect(
        useAppStore.getState().rdbLock?.reference,
        "the core backend's locked-cart answer on /old-cart/hide did not reach the store — this is the only one of the six lock call sites with no test",
      ).toBe("ref-1");
      expect(
        LogServerError,
        "a locked cart is normal behaviour and must not be logged as an error",
      ).not.toHaveBeenCalled();
    });
  });
});
