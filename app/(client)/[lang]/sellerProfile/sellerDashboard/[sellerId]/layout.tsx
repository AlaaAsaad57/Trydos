import React from "react";
import { lang as langParam } from "next/root-params";
import { redirect } from "next/navigation";
import { getSellerShopsCached } from "serverRequests/settings/sellerShopsGuard";
import ShopInfoLoader from "components/SellerDashboard/ShopInfoLoader";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

async function layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sellerId: string }>;
}) {
  const { sellerId } = await params;
  const lang = await langParam();

  // Per-shop server-side guard: a user may own some shops yet open a `sellerId`
  // they have no access to (e.g. a deep link). Bounce to the homepage before any
  // dashboard HTML is rendered when the backend conclusively omits this shop from
  // the user's permission list. Inconclusive failures (transient 5xx / network)
  // fall through so a legitimate seller is never kicked out on an infra hiccup —
  // mirrors the parent /sellerProfile guard. Wraps both the dashboard and its
  // nested product route.
  const { shops, conclusive } = await getSellerShopsCached(lang);
  const currentShop = shops.find(
    (shop: { seller_id?: number | string }) =>
      String(shop.seller_id) === sellerId,
  );
  if (conclusive && !currentShop) {
    redirect(`/${lang}`);
  }

  // `GET /shop/info` is protected by READ_SHOP_INFO — decide here, from the
  // permission list this guard already fetched, whether it may be called at all.
  // `null` = the list was inconclusive, so the answer is unknown (see loader).
  const shopPermissions: string[] = Array.isArray(currentShop?.permissions)
    ? currentShop.permissions
    : [];
  const canReadShopInfo = currentShop
    ? shopPermissions.includes("READ_SHOP_INFO") ||
      shopPermissions.includes("SUPER_ADMIN")
    : null;

  return (
    <>
      {/* Dashboard-wide shop info (currency) — fetched once per shop. */}
      <ShopInfoLoader sellerId={sellerId} canReadShopInfo={canReadShopInfo} />
      {children}
    </>
  );
}

export default layout;
