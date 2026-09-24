// @vitest-environment node
//
// The settings server requests (serverRequests/settings/index.ts and the
// request-memoised guard in sellerShopsGuard.ts).
//
//   getOrderStatues  — the order status list from the start-up settings
//   GetSellerShops   — the shops the signed-in user belongs to, with a
//                      `conclusive` flag: only a real answer (200 or 403) may
//                      send a seller away from the dashboard, never a 401 or a
//                      network failure.
//
// The start-up settings read, the authed fetch and the error reporter are
// replaced.
import { beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({
  startingSetting: vi.fn(),
  authedFetch: vi.fn(),
  logServerError: vi.fn(),
}));

vi.mock("serverRequests", () => ({ GetStarttingSetting: io.startingSetting }));
vi.mock("serverRequests/HandleAuthedFetch", () => ({ HandleAuthedFetch: io.authedFetch }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: io.logServerError }));

import { GetSellerShops, getOrderStatues } from "serverRequests/settings";
import { getSellerShopsCached } from "serverRequests/settings/sellerShopsGuard";

const scenario = () => io.logServerError.mock.calls[0]?.[0]?.scenario;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("the order status list (getOrderStatues)", () => {
  it("reads the statuses from the start-up settings, or an empty list", async () => {
    io.startingSetting.mockResolvedValueOnce({ order_group_statuses: [{ id: 1 }] }).mockResolvedValueOnce(null);

    expect(await getOrderStatues({ language: "en", country: "sy" }), "the statuses were not read").toEqual([
      { id: 1 },
    ]);
    expect(await getOrderStatues({ language: "en", country: "sy" }), "missing settings gave statuses").toEqual([]);
    expect(io.startingSetting.mock.calls[0][0], "the settings were not read for the page's locale").toEqual({
      language: "en",
      country: "sy",
    });
  });

  it("answers nothing, and reports it, when the settings read fails", async () => {
    io.startingSetting.mockRejectedValue(new Error("down"));

    expect(await getOrderStatues({ language: "en", country: "sy" }), "a failed read gave statuses").toBeUndefined();
    expect(scenario(), "the failed settings read was not reported").toBe(
      "Error In getOrderStatues in serverRequest/settings",
    );
  });
});

describe("the seller's shops (GetSellerShops)", () => {
  it("lists the shops from a real answer, and passes on the page's locale", async () => {
    io.authedFetch.mockResolvedValue({ status: 200, data: { data: [{ seller_id: 7 }] } });

    expect(await GetSellerShops("sy-en"), "the shops were not read").toEqual({
      shops: [{ seller_id: 7 }],
      hasShops: true,
      conclusive: true,
    });
    expect(io.authedFetch.mock.calls[0][0], "the permissions read is wrong").toMatchObject({
      method: "GET",
      local: "sy-en",
    });
    expect(io.authedFetch.mock.calls[0][0].url, "the permissions path is wrong").toMatch(/\/shop\/auth\/permissions$/);
  });

  it("treats a 403 as a real 'no shops', and a 401 or no answer as not conclusive", async () => {
    io.authedFetch
      .mockResolvedValueOnce({ status: 403, data: {} })
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce(undefined);

    expect(await GetSellerShops(), "a 403 was not a conclusive 'no shops'").toEqual({
      shops: [],
      hasShops: false,
      conclusive: true,
    });
    expect((await GetSellerShops()).conclusive, "a 401 was treated as a real answer").toBe(false);
    expect((await GetSellerShops()).conclusive, "no answer was treated as a real answer").toBe(false);
    expect("local" in io.authedFetch.mock.calls[0][0], "a missing locale was still sent").toBe(false);
  });

  it("answers not conclusive, and reports it, when the read throws", async () => {
    io.authedFetch.mockRejectedValue(new Error("network"));

    expect(await GetSellerShops(), "a failed read was treated as a real answer").toEqual({
      shops: [],
      hasShops: false,
      conclusive: false,
    });
    expect(scenario(), "the failed read was not reported").toBe("Error In GetSellerShops in serverRequest/settings");
  });

  it("the guard's wrapper reads the same shops", async () => {
    io.authedFetch.mockResolvedValue({ status: 200, data: { data: [{ seller_id: 9 }] } });

    expect((await getSellerShopsCached("iq-ar")).shops, "the guard's wrapper did not read the shops").toEqual([
      { seller_id: 9 },
    ]);
  });
});
