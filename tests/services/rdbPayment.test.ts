import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchData } from "utils/fetchData";
import {
  StartRdbPayment,
  GetRdbRequest,
  CancelRdbRequest,
  readRdbLock,
} from "services/rdbPayment";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

const requestBody = {
  request_reference: "ref-1",
  status: "awaiting_payment",
  rdb_request_id: "rdb-1",
  request_code: "REQ8F3K2M1Q",
  short_code: "12345678",
  deep_link: "rdb://pay/REQ8F3K2M1Q",
  qr_payload: "https://pay.rdb.example/r/v1/REQ8F3K2M1Q",
  amount: "100.00",
  currency: "USD",
  expires_at: "2026-09-15T14:30:00+00:00",
  paid_at: null,
  receipt_number: null,
  failure_reason: null,
  order_ids: [],
};

describe("StartRdbPayment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("posts the default address to the core backend and returns the created request", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      httpStatus: 200,
      data: requestBody,
    } as any);

    const result = await StartRdbPayment({ addressId: 77, orderNote: "leave at door" });

    expect(fetchData, "the core backend checkout/rdb call was not made").toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/customer/order/checkout/rdb",
        method: "POST",
        server: "market",
        body: JSON.stringify({ address_id: 77, order_note: "leave at door" }),
      }),
    );
    expect(result.kind, "a 200 from the core backend must read as created").toBe("created");
    expect(
      result.kind === "created" && result.request.short_code,
      "the short code the shopper types into the RDB app was dropped",
    ).toBe("12345678");
  });

  it("never sends pay_by_wallet", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      httpStatus: 200,
      data: requestBody,
    } as any);

    await StartRdbPayment({ addressId: 77 });

    const sentBody = vi.mocked(fetchData).mock.calls[0][0].body as string;
    expect(sentBody, "pay_by_wallet must not be sent with rdb").not.toContain("pay_by_wallet");
  });

  it("reads a 409 as an existing pending request instead of an error", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: false,
      httpStatus: 409,
      message: "You already have a pending RDB payment. Complete or cancel it first.",
      data: { rdb_request_reference: "ref-9" },
    } as any);

    const result = await StartRdbPayment({ addressId: 77 });

    expect(result.kind, "a 409 from the core backend means a request is already open").toBe(
      "already_pending",
    );
    expect(
      result.kind === "already_pending" && result.reference,
      "the pending reference must be carried out of the 409",
    ).toBe("ref-9");
  });

  it("reports a 403 from the core backend with the backend's own words", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: false,
      httpStatus: 403,
      message: "Cart is not available",
    } as any);

    const result = await StartRdbPayment({ addressId: 77 });

    expect(result.kind, "a 403 from the core backend is a refusal").toBe("refused");
    expect(
      result.kind === "refused" && result.message,
      "the core backend's reason must reach the screen",
    ).toBe("Cart is not available");
  });
});

describe("GetRdbRequest", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the request by reference from the core backend", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      httpStatus: 200,
      data: { ...requestBody, status: "paid", order_ids: [501] },
    } as any);

    const result = await GetRdbRequest("ref-1");

    expect(fetchData, "the status poll did not address the reference").toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/customer/order/rdb-request/ref-1",
        method: "GET",
        server: "market",
      }),
    );
    expect(result?.status, "a paid request must read as paid").toBe("paid");
  });

  it("answers null when the core backend does not know the reference", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: false,
      httpStatus: 404,
      message: "Not found",
    } as any);

    const result = await GetRdbRequest("ref-gone");

    expect(result, "an unknown reference must not look like a payment").toBeNull();
  });
});

describe("CancelRdbRequest", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cancels through the core backend", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      httpStatus: 200,
      data: { ...requestBody, status: "cancelled" },
    } as any);

    const result = await CancelRdbRequest("ref-1");

    expect(fetchData, "the cancel call did not address the reference").toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/customer/order/rdb-request/ref-1/cancel",
        method: "POST",
        server: "market",
      }),
    );
    expect(result.ok, "a 200 from the core backend means the request was cancelled").toBe(true);
  });

  it("says the request was already paid when the core backend answers 409", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: false,
      httpStatus: 409,
      message: "Already paid",
    } as any);

    const result = await CancelRdbRequest("ref-1");

    expect(result.ok, "a paid request cannot be cancelled").toBe(false);
    expect(
      result.alreadyPaid,
      "the screen must be told the money already landed, not that cancel failed",
    ).toBe(true);
  });
});

describe("readRdbLock", () => {
  it("recognises the cart lock answer", () => {
    const lock = readRdbLock({
      success: false,
      httpStatus: 409,
      data: { rdb_request_reference: "ref-1", expires_at: "2026-09-15T14:30:00+00:00" },
    });

    expect(lock?.reference, "the locked cart must name the pending request").toBe("ref-1");
    expect(lock?.expires_at, "the lock must carry when it lifts").toBe(
      "2026-09-15T14:30:00+00:00",
    );
  });

  it("ignores a 409 that is not a cart lock", () => {
    const lock = readRdbLock({ success: false, httpStatus: 409, message: "Already paid" });

    expect(lock, "only a 409 carrying a pending reference is a cart lock").toBeNull();
  });

  it("ignores an ordinary failure", () => {
    const lock = readRdbLock({ success: false, httpStatus: 500, message: "boom" });

    expect(lock, "a 500 is not a cart lock").toBeNull();
  });
});
