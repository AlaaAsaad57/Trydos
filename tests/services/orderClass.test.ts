import { describe, expect, it, vi, beforeEach } from "vitest";
import orderService from "services/order";
import { fetchData } from "utils/fetchData";
import { useAppStore } from "store";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: vi.fn(),
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
});
