// The two server layouts that guard the seller area:
//   - app/(client)/[lang]/sellerProfile/layout.tsx — no shops at all → home.
//   - .../sellerDashboard/[sellerId]/layout.tsx   — no access to THIS shop → home,
//     and it decides whether GET /shop/info may be called (READ_SHOP_INFO).
//
// Both read the shop list through getSellerShopsCached (the core backend's
// permissions list). Both must bounce only on a CONCLUSIVE answer, so a
// transient backend failure never throws a real seller out.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { navigationSpies } from "../../mocks/nextNavigation";

const getSellerShopsCached = vi.fn();

vi.mock("next/root-params", () => ({ lang: async () => "sy-en" }));
vi.mock("serverRequests/settings/sellerShopsGuard", () => ({
  getSellerShopsCached: (...a: unknown[]) => getSellerShopsCached(...a),
}));
vi.mock("components/SellerDashboard/ShopInfoLoader", () => ({
  default: ({ sellerId, canReadShopInfo }: any) => (
    <i data-loader={`${sellerId}:${String(canReadShopInfo)}`} />
  ),
}));
vi.mock("app/(client)/[lang]/sellerProfile/SellerProfileContext", () => ({
  SellerProfileProvider: ({ children }: any) => (
    <section data-provider="yes">{children}</section>
  ),
}));

import ProfileLayout, {
  instant as profileInstant,
} from "app/(client)/[lang]/sellerProfile/layout";
import DashboardLayout, {
  instant as dashboardInstant,
} from "app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/layout";

beforeEach(() => {
  getSellerShopsCached.mockReset();
});

describe("the /sellerProfile layout guard", () => {
  it("opts out of instant navigation", () => {
    expect(profileInstant, "the layout no longer exports instant = false").toBe(false);
  });

  it("sends a user with conclusively zero shops to the home page", async () => {
    getSellerShopsCached.mockResolvedValue({ hasShops: false, conclusive: true });

    await expect(
      ProfileLayout({ children: <p>child</p> }),
      "the layout rendered the seller area for a user the core backend says has no shops",
    ).rejects.toThrow(/redirect/);
    expect(
      navigationSpies.redirect.mock.calls[0]?.[0],
      "the no-shops user was not sent to the home page of their locale",
    ).toBe("/sy-en");
    expect(getSellerShopsCached.mock.calls[0]?.[0], "the guard did not pass the locale").toBe("sy-en");
  });

  it("renders the page inside the provider when the answer is inconclusive", async () => {
    getSellerShopsCached.mockResolvedValue({ hasShops: false, conclusive: false });

    const html = renderToStaticMarkup(await ProfileLayout({ children: <p>child</p> }));

    expect(
      html.includes('data-provider="yes"') && html.includes("child"),
      "an inconclusive shops answer should let the seller through, wrapped in SellerProfileProvider",
    ).toBe(true);
    expect(navigationSpies.redirect, "an inconclusive answer must not redirect").not.toHaveBeenCalled();
  });
});

describe("the /sellerDashboard/[sellerId] layout guard", () => {
  const run = (sellerId: string) =>
    DashboardLayout({ children: <p>dash</p>, params: Promise.resolve({ sellerId }) });

  it("opts out of instant navigation", () => {
    expect(dashboardInstant, "the layout no longer exports instant = false").toBe(false);
  });

  it("sends the user home when the shop is conclusively not theirs", async () => {
    getSellerShopsCached.mockResolvedValue({
      conclusive: true,
      shops: [{ seller_id: 1, permissions: ["SUPER_ADMIN"] }],
    });

    await expect(
      run("99"),
      "the dashboard rendered for a shop the core backend does not list for this user",
    ).rejects.toThrow(/redirect/);
    expect(navigationSpies.redirect.mock.calls[0]?.[0], "the user was not sent home").toBe("/sy-en");
  });

  it("allows GET /shop/info when the shop grants READ_SHOP_INFO", async () => {
    getSellerShopsCached.mockResolvedValue({
      conclusive: true,
      shops: [{ seller_id: 7, permissions: ["READ_SHOP_INFO"] }],
    });

    const html = renderToStaticMarkup(await run("7"));

    expect(html, "the loader was not told it may read the shop info").toContain('data-loader="7:true"');
    expect(html, "the dashboard children were not rendered").toContain("dash");
  });

  it("allows GET /shop/info for a Super Admin", async () => {
    getSellerShopsCached.mockResolvedValue({
      conclusive: true,
      shops: [{ seller_id: "7", permissions: ["SUPER_ADMIN"] }],
    });

    const html = renderToStaticMarkup(await run("7"));

    expect(html, "a Super Admin was not allowed to read the shop info").toContain('data-loader="7:true"');
  });

  it("forbids GET /shop/info when the shop has no permission list", async () => {
    getSellerShopsCached.mockResolvedValue({
      conclusive: true,
      shops: [{ seller_id: 7 }],
    });

    const html = renderToStaticMarkup(await run("7"));

    expect(html, "a shop with no permissions was allowed to read the shop info").toContain('data-loader="7:false"');
  });

  it("leaves the answer unknown (null) when the list is inconclusive", async () => {
    getSellerShopsCached.mockResolvedValue({ conclusive: false, shops: [] });

    const html = renderToStaticMarkup(await run("7"));

    expect(html, "an inconclusive list should pass canReadShopInfo = null").toContain('data-loader="7:null"');
    expect(navigationSpies.redirect, "an inconclusive list must not redirect").not.toHaveBeenCalled();
  });
});
