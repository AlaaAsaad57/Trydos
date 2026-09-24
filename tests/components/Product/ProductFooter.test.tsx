// The server part of the product page footer. It reads the social numbers and
// the rating, works out whether the shopper already used this product's luck
// window (the redemed_ids cookie), and hands everything to the client footer.
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetSocialInfoForProduct = vi.fn();
const GetProductGeneralData = vi.fn();
const getCookieServer = vi.fn();

vi.mock("serverRequests/product", () => ({
  GetSocialInfoForProduct: (...args: any[]) => GetSocialInfoForProduct(...args),
  GetProductGeneralData: (...args: any[]) => GetProductGeneralData(...args),
}));
vi.mock("utils/cookies/server-cookie-manager", () => ({
  getCookieServer: (...args: any[]) => getCookieServer(...args),
}));
vi.mock("components/Product/ProductFooterClient", () => ({ default: () => null }));
vi.mock("serverRequests/meta/StructuredData/ProductStructuredData", () => ({ default: () => null }));

import ProductFooter from "components/Product/ProductFooter";

async function runFooter({
  qty = { id: 9, is_luck: 1 },
  redeemed = null as any,
  setting = { shipping_duration_days: 4 } as any,
} = {}) {
  getCookieServer.mockImplementation(async (name: string) =>
    name === "redemed_ids" ? redeemed : { id: "42" },
  );
  const tree: any = await ProductFooter({
    GlobalData: Promise.resolve({ id: 9, name: "Shoe" }),
    language: "en",
    QtyPricesData: Promise.resolve(qty),
    currency: Promise.resolve({ symbol: "$" }),
    isRtl: false,
    Params: { lang: "sy-en" },
    color: "red",
    Size: "M",
    StarttingSettingPromise: Promise.resolve(setting),
  });
  const [structured, client] = tree.props.children;
  return { structured: structured.props, client: client.props };
}

describe("the product footer (server part)", () => {
  beforeEach(() => {
    GetSocialInfoForProduct.mockReset().mockResolvedValue({ total_likes: 3 });
    GetProductGeneralData.mockReset().mockResolvedValue({ final_rating: 4.5, total_buyers: 8 });
  });

  it("reads the social numbers for the signed-in shopper and the rating for the structured data", async () => {
    const { structured, client } = await runFooter();
    expect(GetSocialInfoForProduct, "the social numbers must be read for this product and user").toHaveBeenCalledWith({
      productId: 9,
      userId: "42",
    });
    expect(structured.rating, "the structured data should carry the real rating").toBe(4.5);
    expect(structured.reviewCount, "the structured data should carry the review count").toBe(8);
    expect(client.shippingDays, "the country's shipping days should reach the footer").toBe(4);
    expect(client.socialData, "the social numbers should reach the footer").toEqual({ total_likes: 3 });
  });

  it("keeps the luck window open for a luck product the shopper has not used", async () => {
    const { client } = await runFooter({ redeemed: [{ id: 1 }] });
    expect(client.redeemed_status, "an unused luck product should still offer luck").toBe(true);
  });

  it("closes the luck window for a product the shopper already used", async () => {
    const { client } = await runFooter({ redeemed: [{ id: "9" }] });
    expect(client.redeemed_status, "a used luck product must not offer luck again").toBe(false);
  });

  it("offers no luck for a normal product, and zero shipping days when the setting has none", async () => {
    const { client } = await runFooter({ qty: { id: 9, is_luck: 0 } as any, setting: null });
    expect(client.redeemed_status, "a normal product has no luck").toBe(false);
    expect(client.shippingDays, "a missing setting should count as zero days").toBe(0);
  });
});
