"use client";

import { useEffect, useState } from "react";
import { useSellerProfile } from "./SellerProfileContext"; // Import the context
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import BackBar from "components/setting/BackBar";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DashIcon } from "components/SellerDashboard/ui/icons";
import { Monogram, DashButton, EmptyState } from "components/SellerDashboard/ui";

function Page() {
  const [, setActiveTab] = useState(null);
  const { lang } = useParams();
  let [, language] = lang?.toString()?.split("-");
  const isRtl = language === "ar" || language === "ku";
  const { setLoading, loading, shopes, setShopes } = useSellerProfile(); // Use the context

  // Leave shop confirmation state
  const [leaveConfirmShopId, setLeaveConfirmShopId] = useState<
    string | number | null
  >(null);
  const [leaveProcessing, setLeaveProcessing] = useState<boolean>(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const getInitialData = async () => {
    try {
      setLoading(true);
      let res = await SellerDashboardService.getShopes();
      // fetchData returns { success: false } instead of throwing — treat that as
      // a failure so it flows into the catch and gets logged.
      if (!res?.success) {
        throw new Error(res?.message || "Failed to fetch seller shops");
      }
      setShopes(res.data || []);
    } catch (error) {
      LogError({
        scenario: "sellerProfile.getInitialData",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };
  const confirmLeaveShop = async () => {
    if (!leaveConfirmShopId) return;
    try {
      setLeaveProcessing(true);
      setLeaveError(null);
      const res = await SellerDashboardService.leaveShop(
        String(leaveConfirmShopId),
      );
      if (!res?.success) {
        throw new Error(res?.message || "Failed to leave shop");
      }
      // remove from local list
      setShopes((prev: any[]) =>
        prev.filter(
          (s: any) => String(s.seller_id) !== String(leaveConfirmShopId),
        ),
      );
      setLeaveConfirmShopId(null);
    } catch (error: any) {
      LogError({
        scenario: "sellerProfile.confirmLeaveShop",
        error: error instanceof Error ? error.message : String(error),
      });
      setLeaveError(
        error?.message || translateFunction("Failed to leave shop", language),
      );
    } finally {
      setLeaveProcessing(false);
    }
  };

  useEffect(() => {
    getInitialData();
  }, []);

  const leavingShop = shopes.find(
    (s: any) => String(s.seller_id) === String(leaveConfirmShopId),
  );

  const isSuperAdmin = (shop: any) =>
    Array.isArray(shop.permissions) &&
    shop.permissions.includes("SUPER_ADMIN");

  return (
    <div className="w-full max-w-[1366px] mx-auto setting-screen">
      <div className="mb-3">
        <BackBar
          isRtl={isRtl}
          local={lang?.toString()}
          name={translateFunction("Select Shop", language)}
          preivous_page={`/${lang}`}
          DataCy="seller-profile-screen"
        />
      </div>

      {/* Intro */}
      <div className="px-1 mb-5">
        <h1 className="text-[22px] bold text-[#1d1d1d]">
          {translateFunction("Your Shops", language)}
        </h1>
        <p className="text-[14px] text-[#8e8e8e] mt-1">
          {translateFunction(
            "Pick a shop to open its dashboard.",
            language,
          )}
        </p>
      </div>

      {/* Loading skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-[15px] p-5 animate-pulse"
              style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-[52px] h-[52px] rounded-[15px] bg-[#f0f0f0]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 rounded-full bg-[#f0f0f0]" />
                  <div className="h-3 w-1/3 rounded-full bg-[#f4f4f4]" />
                </div>
              </div>
              <div className="h-[44px] mt-5 rounded-[12px] bg-[#f4f4f4]" />
            </div>
          ))}
        </div>
      ) : shopes.length === 0 ? (
        <div
          className="bg-white rounded-[15px]"
          style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
        >
          <EmptyState
            icon="shopInfo"
            title={translateFunction("No shops available", language)}
            subtitle={translateFunction(
              "Shops you can manage will appear here.",
              language,
            )}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-[60px]">
          {shopes.map((shop: any) => {
            const admin = isSuperAdmin(shop);
            const permCount = Array.isArray(shop.permissions)
              ? shop.permissions.length
              : 0;
            return (
              <div
                key={shop.seller_id}
                className="group relative bg-white rounded-[15px] p-5 transition-all hover:-translate-y-0.5"
                style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
              >
                {/* Identity row */}
                <div className="flex items-center gap-3.5">
                  <Monogram name={shop.shop_name} size={52} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[16px] bold text-[#1d1d1d] truncate">
                      {shop.shop_name}
                    </h3>
                    <p className="text-[12px] text-[#8e8e8e] mt-0.5">
                      {translateFunction("Seller ID", language)} ·{" "}
                      <span className="medium text-[#505050]">
                        {shop.seller_id}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Role + access meta */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] semibold ${
                      admin
                        ? "bg-[#5d5d5d]/10 text-[#5d5d5d]"
                        : "bg-[#f4f4f4] text-[#505050]"
                    }`}
                  >
                    <DashIcon name={admin ? "star" : "role"} size={13} />
                    {admin
                      ? translateFunction("Super Admin", language)
                      : shop.shop_role || translateFunction("Member", language)}
                  </span>
                  {!admin && permCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] medium bg-[#388CFF]/[0.08] text-[#388CFF]">
                      <DashIcon name="permissions" size={13} />
                      {permCount} {translateFunction("permissions", language)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-5">
                  <Link
                    href={`/${lang}/sellerProfile/sellerDashboard/${shop.seller_id}`}
                    onClick={() => {
                      setLoading(true);
                      setActiveTab(shop.seller_id);
                    }}
                    className="flex-1"
                  >
                    <DashButton
                      fullWidth
                      iconRight={isRtl ? "chevronLeft" : "chevronRight"}
                    >
                      {translateFunction("Enter Dashboard", language)}
                    </DashButton>
                  </Link>
                  <button
                    onClick={() => setLeaveConfirmShopId(shop.seller_id)}
                    title={translateFunction("Leave shop", language)}
                    aria-label={translateFunction("Leave shop", language)}
                    className="h-[44px] w-[44px] shrink-0 inline-flex items-center justify-center rounded-[12px] bg-[#fff1f1] text-[#f85555] hover:bg-[#ffe6e6] transition-all active:scale-[0.98]"
                  >
                    <DashIcon name="logout" size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm leave — destructive confirmation dialog */}
      {leaveConfirmShopId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => !leaveProcessing && setLeaveConfirmShopId(null)}
          />
          <div
            className="relative bg-white rounded-[20px] p-6 z-10 w-full max-w-sm text-center"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#fff1f1] text-[#f85555] flex items-center justify-center">
              <DashIcon name="logout" size={24} />
            </div>
            <h3 className="text-[17px] bold text-[#1d1d1d] mb-1.5">
              {translateFunction("Leave", language)}{" "}
              {leavingShop?.shop_name || translateFunction("this shop", language)}?
            </h3>
            <p className="text-[14px] text-[#8e8e8e] mb-5">
              {translateFunction(
                "This will remove your access to the shop dashboard. You can be re-invited later.",
                language,
              )}
            </p>
            {leaveError && (
              <p className="text-[13px] text-[#f85555] mb-4">{leaveError}</p>
            )}
            <div className="flex gap-3">
              <DashButton
                variant="ghost"
                fullWidth
                onClick={() => setLeaveConfirmShopId(null)}
                disabled={leaveProcessing}
              >
                {translateFunction("Cancel", language)}
              </DashButton>
              <button
                onClick={confirmLeaveShop}
                disabled={leaveProcessing}
                className="flex-1 h-[44px] rounded-[12px] bg-[#f85555] text-white medium text-[14px] hover:bg-[#e84444] disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {leaveProcessing
                  ? translateFunction("Leaving...", language)
                  : translateFunction("Leave", language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Page;
