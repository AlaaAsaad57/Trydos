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
