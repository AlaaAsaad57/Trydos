"use client";
import { useEffect } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { LogError } from "utils/functions";
import { useAppStore, type DashboardShopInfo } from "store";

/**
 * Invisible dashboard-wide loader: fetches GET /shop/info once per shop and
 * keeps the result in the store so every dashboard route (products add/edit,
 * boutiques, …) can read it without refetching.
 *
 * It always records a SETTLED outcome for the requested sellerId — success or
 * not — because the product create screen must tell "still loading" apart from
 * "could not be determined". A null slice therefore means only "not resolved
 * yet". Currency consumers are unaffected: `currency` is always written (empty
 * when unavailable), so a failed fetch still degrades to no currency overlay
 * exactly as before.
 *
 * `fetchData` does not throw on a failed request — it resolves with
 * `success: false` — so failure is detected in the `.then` branch. The `.catch`
 * remains for genuine network/parse throws and converges on the same record.
 *
 * The effect deliberately returns early whenever ANY record exists for the
 * current sellerId, failure records included. Skipping failure records instead
 * would re-fetch on every render, because writing the record re-triggers the
 * effect that wrote it. Recovery is an explicit user action that clears the
 * record (see ProductEditor's create-path retry).
 */
export default function ShopInfoLoader({ sellerId }: { sellerId: string }) {
  const dashboardShopInfo = useAppStore((s) => s.dashboardShopInfo);
  const setDashboardShopInfo = useAppStore((s) => s.setDashboardShopInfo);

  useEffect(() => {
    if (!sellerId || dashboardShopInfo?.sellerId === sellerId) return;
    let cancelled = false;

    const unavailable = (): DashboardShopInfo => ({
      sellerId,
      currency: { code: "", name: "" },
      // Unknown standing must never restrict — the create path gates on
      // `available` and shows its error state instead.
      newProductsApproval: true,
      available: false,
    });

    SellerDashboardService.getShopInfo(sellerId)
      .then((res: any) => {
        if (cancelled) return;
        if (!res?.success) {
          setDashboardShopInfo(unavailable());
          return;
        }
        const currency = res?.data?.currency;
        const rawApproval = res?.data?.is_new_products_approval;
        setDashboardShopInfo({
          sellerId,
          currency: { code: currency?.code ?? "", name: currency?.name ?? "" },
          // Restrict ONLY on an explicit falsy value (false / 0, incl. string
          // forms). Absent or null means the backend does not gate this seller.
          newProductsApproval:
            rawApproval === undefined || rawApproval === null
              ? true
              : Boolean(Number(rawApproval)),
          available: true,
        });
      })
      .catch((error: any) => {
        LogError({
          scenario: "ShopInfoLoader.getShopInfo",
          error: error instanceof Error ? error.message : String(error),
        });
        if (!cancelled) setDashboardShopInfo(unavailable());
      });

    return () => {
      cancelled = true;
    };
  }, [sellerId, dashboardShopInfo, setDashboardShopInfo]);

  return null;
}
