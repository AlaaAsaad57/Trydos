// `ShopInfoLoader` — the invisible piece that fetches GET /shop/info once per
// shop and keeps the answer in the store for every dashboard section to read.
//
// It draws nothing, so the only thing to check is the record it writes. That
// record has to tell three different outcomes apart, because the product editor
// behaves differently for each:
//
//   not written yet        - still loading, the editor waits
//   available: false       - the call failed, the editor shows its error state
//   permitted: false       - the seller has no READ_SHOP_INFO, so the call was
//                            never made; the editor must say the permission is
//                            missing instead of offering a retry that can only
//                            ever return 403
//
// `canReadShopInfo: null` is a fourth case: the permission list itself did not
// load. Unknown must not lock a real seller out, so the call still goes out and
// the backend decides.
import { beforeEach, describe, expect, it, vi } from "vitest";

const getShopInfo = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: { getShopInfo: (...a: unknown[]) => getShopInfo(...a) },
}));

import ShopInfoLoader from "components/SellerDashboard/ShopInfoLoader";
import { useAppStore } from "store";

import { renderWithProviders, waitFor } from "../../render";

const SELLER_ID = "77";

/** What GET /shop/info answers with when everything is fine. */
const shopInfoAnswer = (over: Record<string, unknown> = {}) => ({
  success: true,
  data: {
    currency: { code: "SYP", name: "Syrian Pound" },
    is_new_products_approval: 1,
    ...over,
  },
});

/** Mount the loader and wait until it has written its record. */
async function mountAndSettle(
  canReadShopInfo: boolean | null,
  /** A record already in the store when the loader mounts. */
  seeded: Record<string, unknown> | null = null,
) {
  await renderWithProviders(
    <ShopInfoLoader sellerId={SELLER_ID} canReadShopInfo={canReadShopInfo} />,
    { store: { dashboardShopInfo: seeded } },
  );
  await waitFor(() => {
    const info = useAppStore.getState().dashboardShopInfo;
    if (!info || info.sellerId !== SELLER_ID) {
      throw new Error(`the loader has not written a record for shop ${SELLER_ID} yet`);
    }
  });
  return useAppStore.getState().dashboardShopInfo!;
}

beforeEach(() => {
  getShopInfo.mockReset();
  getShopInfo.mockResolvedValue(shopInfoAnswer());
});

describe("ShopInfoLoader — the shop answers", () => {
  it("asks the shop backend for the shop it was given", async () => {
    await mountAndSettle(true);
    expect(
      getShopInfo,
      "the loader should ask /shop/info for this seller id",
    ).toHaveBeenCalledWith(SELLER_ID);
  });

  it("stores the shop's currency for the rest of the dashboard", async () => {
    const info = await mountAndSettle(true);
    expect(
      info.currency,
      "the currency from /shop/info should be kept for every section to read",
    ).toEqual({ code: "SYP", name: "Syrian Pound" });
  });

  it("records the shop id it resolved, so another shop is fetched fresh", async () => {
    const info = await mountAndSettle(true);
    expect(
      info.sellerId,
      "the record must name the shop it belongs to",
    ).toBe(SELLER_ID);
  });

  it("marks the answer as available", async () => {
    const info = await mountAndSettle(true);
    expect(
      info.available,
      "a successful /shop/info answer must be marked available",
    ).toBe(true);
  });

  it("restricts new products when the shop needs approval", async () => {
    getShopInfo.mockResolvedValue(
      shopInfoAnswer({ is_new_products_approval: 0 }),
    );
    const info = await mountAndSettle(true);
    expect(
      info.newProductsApproval,
      "is_new_products_approval 0 means new products need approval first",
    ).toBe(false);
  });

  it("does not restrict when the backend says nothing about approval", async () => {
    getShopInfo.mockResolvedValue(
      shopInfoAnswer({ is_new_products_approval: null }),
    );
    const info = await mountAndSettle(true);
    expect(
      info.newProductsApproval,
      "an absent approval flag means the shop is not gated, not that it is",
    ).toBe(true);
  });

  it("reads the approval flag when the backend sends it as a string", async () => {
    getShopInfo.mockResolvedValue(
      shopInfoAnswer({ is_new_products_approval: "0" }),
    );
    const info = await mountAndSettle(true);
    expect(
      info.newProductsApproval,
      'the string "0" is still a refusal, not a truthy value',
    ).toBe(false);
  });

  it("leaves the currency empty when the answer carries none", async () => {
    getShopInfo.mockResolvedValue(shopInfoAnswer({ currency: undefined }));
    const info = await mountAndSettle(true);
    expect(
      info.currency,
      "a missing currency should degrade to an empty one, not crash the dashboard",
    ).toEqual({ code: "", name: "" });
  });
});

describe("ShopInfoLoader — the shop backend refuses", () => {
  it("still records a settled outcome, so the editor does not wait forever", async () => {
    getShopInfo.mockResolvedValue({ success: false, message: "500" });
    const info = await mountAndSettle(true);
    expect(
      info.available,
      "a failed /shop/info must be recorded as not available, not left unwritten",
    ).toBe(false);
  });

  it("records a settled outcome when the request throws", async () => {
    getShopInfo.mockRejectedValue(new Error("network down"));
    const info = await mountAndSettle(true);
    expect(
      info.available,
      "a thrown request must land on the same not-available record",
    ).toBe(false);
  });

  it("does not restrict new products just because the call failed", async () => {
    getShopInfo.mockResolvedValue({ success: false });
    const info = await mountAndSettle(true);
    expect(
      info.newProductsApproval,
      "an unknown approval standing must not block a seller from adding products",
    ).toBe(true);
  });

  it("says the failure was not a permission problem", async () => {
    getShopInfo.mockResolvedValue({ success: false });
    const info = await mountAndSettle(true);
    expect(
      info.permitted,
      "a failed call is a failure to retry, not a missing permission",
    ).toBe(true);
  });
});

describe("ShopInfoLoader — the READ_SHOP_INFO gate", () => {
  it("never calls /shop/info without the permission", async () => {
    await mountAndSettle(false);
    expect(
      getShopInfo,
      "without READ_SHOP_INFO the call could only return 403, so it must not be made",
    ).not.toHaveBeenCalled();
  });

  it("records that the permission, not the backend, is missing", async () => {
    const info = await mountAndSettle(false);
    expect(
      info.permitted,
      "the record must say the seller lacks READ_SHOP_INFO",
    ).toBe(false);
    expect(
      info.available,
      "with no permission there is no shop info to use",
    ).toBe(false);
  });

  it("still calls the backend when the permission list itself did not load", async () => {
    const info = await mountAndSettle(null);
    expect(
      getShopInfo,
      "an unknown permission list must not lock a legitimate seller out",
    ).toHaveBeenCalledWith(SELLER_ID);
    expect(
      info.available,
      "with the backend answering, the shop info should be available as usual",
    ).toBe(true);
  });
});

describe("ShopInfoLoader — fetching once per shop", () => {
  it("does not fetch again when a record for this shop already exists", async () => {
    await renderWithProviders(
      <ShopInfoLoader sellerId={SELLER_ID} canReadShopInfo={true} />,
      {
        store: {
          dashboardShopInfo: {
            sellerId: SELLER_ID,
            currency: { code: "SYP", name: "Syrian Pound" },
            newProductsApproval: true,
            available: true,
            permitted: true,
          },
        },
      },
    );

    expect(
      getShopInfo,
      "the dashboard should read the stored answer instead of asking again",
    ).not.toHaveBeenCalled();
  });

  it("does not retry a failed record on its own", async () => {
    await renderWithProviders(
      <ShopInfoLoader sellerId={SELLER_ID} canReadShopInfo={true} />,
      {
        store: {
          dashboardShopInfo: {
            sellerId: SELLER_ID,
            currency: { code: "", name: "" },
            newProductsApproval: true,
            available: false,
            permitted: true,
          },
        },
      },
    );

    expect(
      getShopInfo,
      "retrying a failed record on its own would re-fetch on every render — recovery is the seller's action",
    ).not.toHaveBeenCalled();
  });

  it("fetches when the stored record belongs to a different shop", async () => {
    const info = await mountAndSettle(true, {
      sellerId: "99",
      currency: { code: "IQD", name: "Iraqi Dinar" },
      newProductsApproval: true,
      available: true,
      permitted: true,
    });
    expect(
      getShopInfo,
      "shop 99's answer says nothing about shop 77, so 77 must be fetched",
    ).toHaveBeenCalledWith(SELLER_ID);
    expect(
      info.sellerId,
      "the stored record should now belong to the shop on screen",
    ).toBe(SELLER_ID);
  });
});
