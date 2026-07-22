"use client";
import { useEffect } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { LogError } from "utils/functions";
import { useAppStore } from "store";

/**
 * Invisible dashboard-wide loader: fetches GET /shop/info once per shop and
 * keeps its currency in the store so every dashboard route (products add/edit,
 * boutiques, …) can read it without refetching. Failures are silent — consumers
 * simply render without a currency overlay.
 */
export default function ShopInfoLoader({ sellerId }: { sellerId: string }) {
  const dashboardShopInfo = useAppStore((s) => s.dashboardShopInfo);
  const setDashboardShopInfo = useAppStore((s) => s.setDashboardShopInfo);

  useEffect(() => {
    if (!sellerId || dashboardShopInfo?.sellerId === sellerId) return;
    let cancelled = false;
    SellerDashboardService.getShopInfo(sellerId)
      .then((res: any) => {
        const currency = res?.data?.currency;
        if (!cancelled && res?.success && currency?.code) {
          setDashboardShopInfo({
            sellerId,
            currency: { code: currency.code, name: currency.name ?? "" },
          });
        }
      })
      .catch((error: any) =>
        LogError({
          scenario: "ShopInfoLoader.getShopInfo",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    return () => {
      cancelled = true;
    };
  }, [sellerId, dashboardShopInfo, setDashboardShopInfo]);

  return null;
}
