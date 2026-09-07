import { describe, expect, it, vi, beforeEach } from "vitest";
import orderService from "services/order";
import { fetchData } from "utils/fetchData";
import { useAppStore } from "store";
import { LogServerError } from "utils/serverErrorReporter";
import { ORDER_EVENTS, trackOrder } from "utils/orderFunnel";
import { GetCartOreview } from "utils/functions";
import { getCurrency } from "utils/tinyUtils";
import { getCookie, COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { GetWalletBalanceForCountryCurrency } from "services/wallet";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: vi.fn(),
}));

vi.mock("utils/orderFunnel", () => ({
  ORDER_EVENTS: {
    PAYMENT_REDIRECT_OPENED: "payment_redirect_opened",
    ORDER_PLACE_FAILED: "order_place_failed",
  },
  trackOrder: vi.fn(),
}));

vi.mock("utils/functions", () => ({
  GetCartOreview: vi.fn(),
}));

vi.mock("utils/tinyUtils", () => ({
  getCurrency: vi.fn(({ callback }: any) => callback?.({ currency: "USD" })),
}));

vi.mock("utils/cookies/cookie-manager", () => ({
  COOKIE_NAMES: { COUNTRY: "country" },
  getCookie: vi.fn(() => "sy"),
}));

vi.mock("services/wallet", () => ({
  GetWalletBalanceForCountryCurrency: vi.fn(),
}));

vi.mock("utils/UploadUtils", () => ({
  GetTicket: vi.fn().mockResolvedValue("mock-ticket-123"),
}));

vi.mock("services/auth", () => ({
  default: {
    UserID: vi.fn(() => 42),
    User: vi.fn(() => ({ name: "Tester", image: "avatar.jpg", phone: "+123456789" })),
  },
}));

describe("OrderService (services/order.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUploadSubPath", () => {
    it("extracts last path segment from media URL", () => {
      const path = orderService.getUploadSubPath(
        "https://media.example.com/uploads/tickets/doc.pdf?v=1#tag",
      );
      expect(path, "should extract doc.pdf").toBe("doc.pdf");
    });
  });

  describe("PlaceOrder", () => {
    it("posts checkout payload to /customer/order/checkout and sets order data on success", async () => {
      useAppStore.setState({
        addressLists: [{ id: "addr-1", is_default: 1 }],
      });

      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: [{ id: "order-123" }],
      });

      await orderService.PlaceOrder({ pay_by_wallet: false });

      expect(
        fetchData,
        "should post to checkout endpoint",
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/customer/order/checkout"),
          method: "POST",
          server: "market",
        }),
      );
      expect(
        useAppStore.getState().orderData.success,
        "orderData.success should be true",
      ).toBe(true);
    });

    it("posts to custom payment method checkout path and sets pay_by_wallet=1", async () => {
      useAppStore.setState({
        addressLists: [{ id: "addr-1", is_default: 1 }],
      });

      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: [{ id: "order-wallet-pay" }],
      });

      await orderService.PlaceOrder({
        payment_method: "crypto",
        pay_by_wallet: true,
      });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/checkout/crypto?order_note=order note&address_id=addr-1&pay_by_wallet=1",
          method: "POST",
          server: "market",
        }),
      );
    });

    it("handles external payment gateway redirect by tracking event and storing payment info", async () => {
      useAppStore.setState({
        addressLists: [{ id: "addr-1", is_default: 1 }],
      });

      const redirectData = {
        id: "ord-ext",
        url: "https://crypto-gateway.com/pay/123",
      };

      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: [redirectData],
      });

      await orderService.PlaceOrder({
        payment_method: "crypto",
        pay_by_wallet: false,
      });

      expect(trackOrder).toHaveBeenCalledWith(
        ORDER_EVENTS.PAYMENT_REDIRECT_OPENED,
        { payment_method: "crypto" },
      );
      expect(useAppStore.getState().openPayIframe).toBe(true);
      expect(useAppStore.getState().payIframeURL).toBe("https://crypto-gateway.com/pay/123");
      expect(useAppStore.getState().orderLoading).toBe(false);
    });

    it("logs server error, tracks order place failure, and resets orderLoading on error", async () => {
      useAppStore.setState({
        addressLists: [{ id: "addr-1", is_default: 1 }],
      });

      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Insufficient credit",
      });

      await orderService.PlaceOrder({
        payment_method: "card",
        pay_by_wallet: false,
      });

      expect(LogServerError).toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: "Error In PlaceOrder in services/order",
        }),
      );
      expect(trackOrder).toHaveBeenCalledWith(
        ORDER_EVENTS.ORDER_PLACE_FAILED,
        expect.objectContaining({
          payment_method: "card",
          reason: "Insufficient credit",
          stage: "PlaceOrder_service",
        }),
      );
      expect(useAppStore.getState().orderLoading).toBe(false);
    });
  });

  // The half of saving an address that the service owns.
  //
  // AddAddressForm no longer keeps its own copy of a new address, because the
  // service already refreshes the list from the core backend before it returns.
  // These two tests hold that promise in place. The form's side of the same fix
  // is guarded in tests/components/Cart/AddAddressForm.test.tsx.
  describe("AddAddressList", () => {
    const form = {
      address: "New flat",
      address_detail: "Second floor",
      location: { latitude: 1, longitude: 2 },
      Country: { name: "Syria", code: "sy" },
      region_details: { city: "Damascus" },
      contact_info: { contact_person_name: "Ada", phone: "+10000000000" },
    };

    /** Answer each backend call this flow makes by its address. */
    function answerByUrl(replies: Record<string, any>) {
      vi.mocked(fetchData).mockImplementation(async ({ url }: any) => {
        const key = Object.keys(replies).find((part) => url.includes(part));
        return key ? replies[key] : { success: true, data: [] };
      });
    }

    it("refreshes the address list from the core backend before it returns", async () => {
      answerByUrl({
        "/customer/address/add": { success: true, data: { id: 77 } },
        "/customer/address/list": {
          success: true,
          data: [
            { id: 11, address: "Home" },
            { id: 77, address: "New flat" },
          ],
        },
        "/cart/cart_overview": { success: true, data: {} },
      });
      useAppStore.setState({
        addressLists: [{ id: 11, address: "Home" }] as any,
      });

      await orderService.AddAddressList({ address: form, callback: () => {} });

      // This is what lets the form add nothing of its own. If the refresh ever
      // goes away, the form has to be given a new way to show the new address.
      expect(
        useAppStore.getState().addressLists.map((a: any) => a.id),
        "AddAddressList returned without refreshing the list, so the new address would not be on screen",
      ).toEqual([11, 77]);
    });

    it("swallows a refusal from the core backend and leaves the list alone", async () => {
      answerByUrl({
        "/customer/address/add": {
          success: false,
          message: "the phone number is not valid",
        },
      });
      useAppStore.setState({
        addressLists: [{ id: 11, address: "Home" }] as any,
      });

      // No rejection: AddAddressList catches its own throw and never rethrows,
      // so the caller cannot tell a refused save from a saved one. That is why
      // the form must not add anything by itself.
      await expect(
        orderService.AddAddressList({ address: form, callback: () => {} }),
        "AddAddressList rejected on a refusal — the caller can tell the two apart now, so the form may take a shorter route",
      ).resolves.toBeUndefined();
      expect(
        useAppStore.getState().addressLists.map((a: any) => a.address),
        "a refused save changed the address list",
      ).toEqual(["Home"]);
    });
  });

  describe("uploadToMediaServer", () => {
    it("uploads file to gated upload endpoint and returns URL", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: "https://media.example.com/uploads/receipt.pdf" }),
      } as any);

      const mockFile = new File(["data"], "receipt.pdf", { type: "application/pdf" });
      const url = await orderService.uploadToMediaServer(mockFile, "receipts");

      expect(url).toBe("https://media.example.com/uploads/receipt.pdf");
      fetchSpy.mockRestore();
    });

    it("throws when upload response is not ok or missing url", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as any);

      const mockFile = new File(["dummy"], "test.png", { type: "image/png" });
      await expect(
        orderService.uploadToMediaServer(mockFile, "test_folder"),
      ).rejects.toThrow("Media server upload failed");
      fetchSpy.mockRestore();
    });
  });

  describe("Wallet operations", () => {
    it("GetWallet sets currency, balance, and returns wallet data on success", async () => {
      vi.mocked(GetWalletBalanceForCountryCurrency).mockResolvedValueOnce({
        totalAvailable: 250,
        currency: "USD",
        data: { balance: 250 },
      } as any);

      const data = await orderService.GetWallet();

      expect(getCurrency).toHaveBeenCalled();
      expect(getCookie).toHaveBeenCalledWith(COOKIE_NAMES.COUNTRY);
      expect(useAppStore.getState().wallet?.wallet_balance).toBe(250);
      expect(useAppStore.getState().orderLoading).toBe(false);
      expect(data).toEqual({ balance: 250 });
    });

    it("GetWallet handles failure gracefully and logs server error", async () => {
      vi.mocked(GetWalletBalanceForCountryCurrency).mockRejectedValueOnce(
        new Error("Wallet down"),
      );

      const data = await orderService.GetWallet();

      expect(data).toBeUndefined();
      expect(useAppStore.getState().orderLoading).toBe(false);
      expect(LogServerError).toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: "Error In GetWallet in services/order",
        }),
      );
    });

    it("GetWalletBalanceToShow returns success: false when balance fetch throws", async () => {
      vi.mocked(GetWalletBalanceForCountryCurrency).mockRejectedValueOnce(
        new Error("Failed"),
      );

      const result = await orderService.GetWalletBalanceToShow({ country: "sy" });
      expect(result.success).toBe(false);
    });

    it("GetWalletTransactions calls endpoint with pagination and returns data", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: [{ id: "tx-1", amount: 50 }],
      });

      const transactions = await orderService.GetWalletTransactions(5, 2);

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/wallet/list?limit=5&offset=2",
          method: "GET",
          server: "market",
        }),
      );
      expect(transactions).toEqual([{ id: "tx-1", amount: 50 }]);
    });

    it("GetWalletTransactions throws and logs error on failure", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Unauthorized",
      });

      await expect(orderService.GetWalletTransactions()).rejects.toThrow("Unauthorized");
      expect(LogServerError).toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: "Error In GetWalletTransactions in services/order",
        }),
      );
    });
  });

  describe("Address management operations", () => {
    it("GetAddressList calls GetProvinces, fetches addresses, and updates store", async () => {
      vi.mocked(fetchData).mockImplementation(async ({ url }: any) => {
        if (url.includes("/api/addresses/get-provinces-by-iso")) {
          return { success: true, data: [] };
        }
        if (url.includes("/customer/address/list")) {
          return { success: true, data: [{ id: 1, address: "Home" }] };
        }
        return { success: true, data: [] };
      });

      await orderService.GetAddressList();

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/address/list",
          method: "GET",
          server: "market",
        }),
      );
      expect(useAppStore.getState().addressLists).toEqual([{ id: 1, address: "Home" }]);
      expect(useAppStore.getState().orderLoading).toBe(false);
    });

    it("GetAddressList handles failure and resets orderLoading", async () => {
      vi.mocked(fetchData).mockImplementation(async ({ url }: any) => {
        if (url.includes("/customer/address/list")) {
          return { success: false, message: "Server error" };
        }
        return { success: true, data: [] };
      });

      await orderService.GetAddressList();

      expect(LogServerError).toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: "Error In GetAddressList in services/order",
        }),
      );
      expect(useAppStore.getState().orderLoading).toBe(false);
    });

    it("SetDefault posts address_id, refreshes cart overview, and resets loading", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await orderService.SetDefault({ id: 88 });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/address/set-default",
          method: "POST",
          body: JSON.stringify({ address_id: 88 }),
        }),
      );
      expect(GetCartOreview).toHaveBeenCalled();
      expect(useAppStore.getState().orderLoading).toBe(false);
    });

    it("SetDefault logs server error and resets orderLoading when backend fails", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Address not found",
      });

      await orderService.SetDefault({ id: 999 });

      expect(LogServerError).toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: "Error In SetDefault Address in services/order",
        }),
      );
      expect(useAppStore.getState().orderLoading).toBe(false);
    });

    it("UpdateAddressList posts formatted body with region fallbacks and executes callback", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });
      const callback = vi.fn();

      await orderService.UpdateAddressList({
        address: {
          id: 5,
          location: { latitude: 33.5, longitude: 36.3 },
          address: "Old Town",
          address_detail: "Bldg 4",
          Country: { name: "Syria", code: "sy" },
          contact_info: { contact_person_name: "John", phone: "12345" },
        },
        callback,
      });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/address/update",
          method: "POST",
          server: "market",
          body: JSON.stringify({
            id: 5,
            latitude: 33.5,
            longitude: 36.3,
            address: "Old Town",
            address_detail: "Bldg 4",
            country: "Syria",
            iso: "sy",
            city: "Not Entered",
            province: "Not Entered",
            town: "Not Entered",
            street: "Not Entered",
            building: "Not Entered",
            zip: "123123",
            contact_person_name: "John",
            phone: "12345",
            alternative_phone: undefined,
          }),
        }),
      );
      expect(callback).toHaveBeenCalled();
      expect(useAppStore.getState().orderLoading).toBe(false);
    });

    it("DeleteAddressList calls delete endpoint and sets orderLoading false", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await orderService.DeleteAddressList({ address: "addr-99" });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/address/delete?address_id=addr-99",
          method: "POST",
        }),
      );
      expect(useAppStore.getState().orderLoading).toBe(false);
    });

    it("GetProvinces fetches from elastic server and updates store provinces", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: [{ id: 1, name: "Damascus" }],
      });

      await orderService.GetProvinces();

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/api/addresses/get-provinces-by-iso",
          method: "GET",
          server: "elastic",
        }),
      );
      expect(useAppStore.getState().provinces).toEqual([{ id: 1, name: "Damascus" }]);
      expect(useAppStore.getState().orderLoading).toBe(false);
    });
  });

  describe("Order details, cancellation, and visibility", () => {
    it("getOrderDetails queries by order_group_id and returns data", async () => {
      const abortController = new AbortController();
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { id: "grp-1", items: [] },
      });

      const details = await orderService.getOrderDetails("grp-1", abortController.signal);

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/getOrdersByOrderGroupID?order_group_id=grp-1",
          method: "GET",
          signal: abortController.signal,
        }),
      );
      expect(details).toEqual({ id: "grp-1", items: [] });
    });

    it("getOrderDetails returns null and logs error on failure", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Order group not found",
      });

      const details = await orderService.getOrderDetails("unknown-grp");
      expect(details).toBeNull();
      expect(LogServerError).toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: "Error In getOrderDetails in services/order",
        }),
      );
    });

    it("CancelOrder posts order_id and returns response", async () => {
      const mockResp = { isSuccessful: true, message: "Order cancelled" };
      vi.mocked(fetchData).mockResolvedValueOnce(mockResp);

      const resp = await orderService.CancelOrder({ order_id: 101 });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/cancel",
          method: "POST",
          body: JSON.stringify({ order_id: 101 }),
        }),
      );
      expect(resp).toEqual(mockResp);
    });

    it("HideOrder patches visibility with is_hidden default true", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await orderService.HideOrder({ order_id: 202 });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/202/visibility",
          method: "PATCH",
          body: JSON.stringify({ is_hidden: true }),
        }),
      );
    });

    it("HideOrderDetail patches item visibility with is_hidden false when unhiding", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await orderService.HideOrderDetail({ detail_id: 303, is_hidden: false });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/detail/303/visibility",
          method: "PATCH",
          body: JSON.stringify({ is_hidden: false }),
        }),
      );
    });

    it("CancelOrderItem posts order_id, detail_id, and qty", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await orderService.CancelOrderItem({ order_id: 10, item_id: 20, qty: 1 });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/cancel-item",
          method: "POST",
          body: JSON.stringify({ order_id: 10, detail_id: 20, qty: 1 }),
        }),
      );
    });

    it("changeOrderAddress posts order_group_id and new_shipping_address_id", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await orderService.changeOrderAddress({
        order_id: "grp-5",
        address_id: 99,
      });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/change-address",
          method: "POST",
          body: JSON.stringify({
            order_group_id: "grp-5",
            new_shipping_address_id: 99,
          }),
        }),
      );
    });

    it("changeOrderItemVariant posts updated variant details", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await orderService.changeOrderItemVariant({
        color: "Blue",
        choice_1: "XL",
        order_detail_id: 55,
        image: "blue.jpg",
      });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/change-item-variant",
          method: "POST",
          body: JSON.stringify({
            color: "Blue",
            size: "XL",
            order_detail_id: 55,
            image: "blue.jpg",
          }),
        }),
      );
    });
  });

  describe("ReportOrderItem", () => {
    it("posts JSON body when image is not provided", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await orderService.ReportOrderItem({
        order_id: 1,
        order_detail_id: 2,
        product_id: 3,
        order_group_id: "grp-1",
        points: [{ point: "damaged", values: ["broken", "scratched"] }],
        note: "Item arrived broken",
      });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/report",
          method: "POST",
          body: JSON.stringify({
            order_id: 1,
            order_detail_id: 2,
            product_id: 3,
            order_group_id: "grp-1",
            points: [{ point: "damaged", values: ["broken", "scratched"] }],
            note: "Item arrived broken",
          }),
        }),
      );
    });

    it("posts FormData body with bracket notation for points when image is provided", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });
      const mockImage = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });

      await orderService.ReportOrderItem({
        order_id: 1,
        order_detail_id: 2,
        product_id: 3,
        order_group_id: "grp-1",
        points: [{ point: "size", values: ["too_small"] }],
        note: "Wrong fit",
        image: mockImage,
      });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/report",
          method: "POST",
          body: expect.any(FormData),
        }),
      );
    });
  });

  describe("RateOrderWithhComment", () => {
    it("sends PUT update when existing comment id is provided", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await orderService.RateOrderWithhComment({
        id: "comm-123",
        star_rating: 5,
        comment: "Great product",
        order_detail_id: 10,
        productId: 20,
        variant: "v1",
        owner_id: 99,
        owner_type: "seller",
        images: ["img1.jpg"],
      });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/public_comment/comments/comm-123/update",
          method: "PUT",
          server: "comments",
          body: JSON.stringify({
            text: "Great product",
            rating: 5,
            owner_id: "99",
            owner_type: "seller",
            comments_images_customer: ["img1.jpg"],
          }),
        }),
      );
    });

    it("sends POST create with auth User data when comment id is not provided", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await orderService.RateOrderWithhComment({
        star_rating: 4,
        comment: "Good quality",
        order_detail_id: 11,
        productId: 22,
        owner_id: 88,
        owner_type: "store",
        variant: "Red-M",
      });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/public_comment/comments/create",
          method: "POST",
          server: "comments",
          body: JSON.stringify({
            text: "Good quality",
            product_id: "22",
            user_id: "42",
            user_name: "Tester",
            user_avatar: "avatar.jpg",
            user_type: "customer",
            rating: 4,
            owner_id: "88",
            owner_type: "store",
            variant: "Red-M",
            order_details_id: "11",
            phone: "+123456789",
            comments_images_customer: [],
          }),
        }),
      );
    });
  });

  describe("Return request operations", () => {
    it("getReturnReasons calls reasons endpoint and returns response", async () => {
      const reasonsData = { success: true, data: [{ id: 1, reason: "Defective" }] };
      vi.mocked(fetchData).mockResolvedValueOnce(reasonsData);

      const res = await orderService.getReturnReasons();
      expect(res).toEqual(reasonsData);
    });

    it("CreateReturnRequest calls store endpoint and returns return_request_id", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { return_request_id: "rr-77" },
      });

      const id = await orderService.CreateReturnRequest({ order_id: 50 });
      expect(id).toBe("rr-77");
    });

    it("UploadImageForOrderReturn delegates to uploadToMediaServer and returns sub_path", async () => {
      vi.spyOn(orderService, "uploadToMediaServer").mockResolvedValueOnce(
        "https://media.example.com/return_request_products/photo123.jpg",
      );

      const mockFile = new File(["pic"], "photo.jpg");
      const res = await orderService.UploadImageForOrderReturn({ image: mockFile });

      expect(res).toEqual({ sub_path: "photo123.jpg" });
    });

    it("UploadImageForOrderReturn returns null when upload fails", async () => {
      vi.spyOn(orderService, "uploadToMediaServer").mockRejectedValueOnce(
        new Error("Upload failed"),
      );

      const mockFile = new File(["pic"], "photo.jpg");
      const res = await orderService.UploadImageForOrderReturn({ image: mockFile });

      expect(res).toBeNull();
      expect(LogServerError).toHaveBeenCalled();
    });

    it("UploadImageForRating delegates to uploadToMediaServer and returns sub_path", async () => {
      vi.spyOn(orderService, "uploadToMediaServer").mockResolvedValueOnce(
        "https://media.example.com/rating_orders/rating_img.png",
      );

      const mockFile = new File(["pic"], "rating_img.png");
      const res = await orderService.UploadImageForRating({ image: mockFile });

      expect(res).toEqual({ sub_path: "rating_img.png" });
    });

    it("UpdateReturnedProduct posts update payload and returns true", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      const res = await orderService.UpdateReturnedProduct({
        reason_id: { id: 2 },
        quantity: 1,
        images: ["img.jpg"],
        id: 10,
      });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/return_request_products/update",
          method: "POST",
          body: JSON.stringify({
            id: 10,
            quantity: 1,
            images: ["img.jpg"],
            return_request_reason_id: 2,
          }),
        }),
      );
      expect(res).toBe(true);
    });

    it("ReturnProduct creates return request when not provided and stores product", async () => {
      vi.spyOn(orderService, "CreateReturnRequest").mockResolvedValueOnce("auto-rr-99");
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      const reqId = await orderService.ReturnProduct({
        product_id: 1,
        order_detail_id: 2,
        reason_id: { id: 3 },
        quantity: 1,
        images: [],
        order_id: 100,
        return_request_id: null,
      });

      expect(orderService.CreateReturnRequest).toHaveBeenCalledWith({ order_id: 100 });
      expect(reqId).toBe("auto-rr-99");
      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/return_request_products/store",
          method: "POST",
          body: JSON.stringify({
            product_id: 1,
            order_detail_id: 2,
            quantity: 1,
            return_request_id: "auto-rr-99",
            images: [],
            return_request_reason_id: 3,
            is_for_exchange: 0,
            details: "",
          }),
        }),
      );
    });

    it("CancelReturn calls cancel endpoint with return_request_product_id", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({ success: true });

      await orderService.CancelReturn({ return_request_product_id: 44 });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/return_request_products/cancel?return_request_product_id=44",
          method: "GET",
        }),
      );
    });

    it("getReturnRequestDetails creates request if needed and returns details data", async () => {
      vi.spyOn(orderService, "CreateReturnRequest").mockResolvedValueOnce("rr-auto");
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { id: "rr-auto", items: [] },
      });

      const details = await orderService.getReturnRequestDetails({ order_id: 200 });

      expect(orderService.CreateReturnRequest).toHaveBeenCalledWith({ order_id: 200 });
      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/return_requests/order_details?return_request_id=rr-auto",
          method: "GET",
        }),
      );
      expect(details).toEqual({ id: "rr-auto", items: [] });
    });

    it("ConfirmReturnRequest posts return_request_ids and returns data", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { confirmed: true },
      });

      const result = await orderService.ConfirmReturnRequest({ return_request_id: "rr-1" });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/return_requests/confirm_return_request",
          method: "POST",
          body: JSON.stringify({ return_request_ids: "rr-1" }),
        }),
      );
      expect(result).toEqual({ confirmed: true });
    });

    it("CancelReturnRequest posts bulk_cancel with return_request_ids", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: true,
        data: { cancelled: true },
      });

      const result = await orderService.CancelReturnRequest({ return_request_id: "rr-1" });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/return_requests/bulk_cancel",
          method: "POST",
          body: JSON.stringify({ return_request_ids: "rr-1" }),
        }),
      );
      expect(result).toEqual({ cancelled: true });
    });

    it("removeImage calls remove_image endpoint and throws if not successful", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        success: false,
        message: "Image not found",
      });

      await expect(
        orderService.removeImage({
          return_request_product_id: 5,
          img: "test.jpg",
        }),
      ).rejects.toThrow("Image not found");

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/return_request_products/remove_image?return_request_product_id=5&image=test.jpg",
          server: "market",
          method: "GET",
        }),
      );
    });

    it("GetReturnDetailsForOrderGroup requests details with noMessage flag", async () => {
      vi.mocked(fetchData).mockResolvedValueOnce({
        data: { group_id: "grp-10", status: "pending" },
      });

      const res = await orderService.GetReturnDetailsForOrderGroup({
        order_group_id: "grp-10",
      });

      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/customer/order/return_requests/order_details_by_group?order_group_id=grp-10",
          server: "market",
          method: "GET",
          noMessage: true,
        }),
      );
      expect(res).toEqual({ group_id: "grp-10", status: "pending" });
    });
  });
});

