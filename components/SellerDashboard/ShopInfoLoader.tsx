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
 * not — because the product editor (both create and edit) must tell "still
 * loading" apart from "could not be determined": it blocks on the latter. A
 * null slice therefore means only "not resolved yet". Other currency consumers
 * are unaffected: `currency` is always written (empty when unavailable), so a
 * failed fetch still degrades to no currency overlay exactly as before.
 *
 * `fetchData` does not throw on a failed request — it resolves with
 * `success: false` — so failure is detected in the `.then` branch. The `.catch`
 * remains for genuine network/parse throws and converges on the same record.
 *
 * The effect deliberately returns early whenever ANY record exists for the
 * current sellerId, failure records included. Skipping failure records instead
 * would re-fetch on every render, because writing the record re-triggers the
 * effect that wrote it. Recovery is an explicit user action that clears the
 * record (see ProductEditor's retry).
 *
 * `GET /shop/info` is protected by READ_SHOP_INFO, so it is NEVER issued when
 * the shop's permission list says the user does not hold it — that call would
 * only ever return 403. The record is still written (with `permitted: false`)
 * so consumers can tell the truth ("you need this permission") instead of
 * waiting forever or offering a retry that cannot succeed.
 * `canReadShopInfo: null` means the permission list itself was unavailable
 * (transient guard failure) — unknown must not lock a legitimate seller out, so
 * the fetch proceeds exactly as before and the backend decides.
 */
export default function ShopInfoLoader({
  sellerId,
  canReadShopInfo,
}: {
  sellerId: string;
  canReadShopInfo: boolean | null;
}) {
  const dashboardShopInfo = useAppStore((s) => s.dashboardShopInfo);
  const setDashboardShopInfo = useAppStore((s) => s.setDashboardShopInfo);

  useEffect(() => {
    if (!sellerId || dashboardShopInfo?.sellerId === sellerId) return;
    let cancelled = false;

    const unavailable = (permitted = true): DashboardShopInfo => ({
      sellerId,
      currency: { code: "", name: "" },
      // Unknown standing must never restrict — the editor gates on
      // `available` and shows its error state instead.
      newProductsApproval: true,
      available: false,
      permitted,
    });

    // No READ_SHOP_INFO → do not call the endpoint at all.
    if (canReadShopInfo === false) {
      setDashboardShopInfo(unavailable(false));
      return;
    }

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
          permitted: true,
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
  }, [sellerId, canReadShopInfo, dashboardShopInfo, setDashboardShopInfo]);

  return null;
}
