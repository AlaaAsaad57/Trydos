"use client";

import { useEffect, useState } from "react";
import {
  SellerProfileProvider,
  useSellerProfile,
} from "./SellerProfileContext"; // Import the context
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction } from "utils/functions";
import BackBar from "components/setting/BackBar";

import Link from "next/link";
import { useParams } from "next/navigation";
import Spinner from "components/global/Spinner";
function Page() {
  const [activeTab, setActiveTab] = useState(null);
  const { lang } = useParams();
  let [country, language] = lang?.toString()?.split("-");
  const isRtl = language === "ar" || language === "ku";
  const { sellerData, setLoading, loading, shopes, setShopes } =
    useSellerProfile(); // Use the context

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

      setShopes(res.data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const confirmLeaveShop = async () => {
    if (!leaveConfirmShopId) return;
    try {
      setLeaveProcessing(true);
      setLeaveError(null);
      await SellerDashboardService.leaveShop(String(leaveConfirmShopId));
      // remove from local list
      setShopes((prev: any[]) =>
        prev.filter(
          (s: any) => String(s.seller_id) !== String(leaveConfirmShopId),
        ),
      );
      setLeaveConfirmShopId(null);
    } catch (error: any) {
      console.error("Error leaving shop:", error);
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

  return (
    <div className="w-full max-w-[1365px] flex flex-col items-start bg-white p-6 rounded-lg shadow-md setting-screen">
      <div className="w-full mb-3">
        <BackBar
          isRtl={isRtl}
          local={lang?.toString()}
          name={translateFunction("Select Shop", language)}
          preivous_page={`/${lang}`}
          DataCy="seller-profile-screen"
        />
      </div>
      <span>
        {translateFunction("please Select a shop to continue", language)}
      </span>
      <div className="p-3">
        {loading && (
          <div className="flex-row flex gap-2">
            <Spinner /> {translateFunction("Loading...", language)}
          </div>
        )}

        {shopes.length === 0 && !loading ? (
          <p className="text-[14px] text-[#8D8D8D]">
            {translateFunction("No shops available", language)}
          </p>
        ) : (
          <div className="overflow-auto mb-[100px]">
            <table className="w-full text-left mb-[300px]">
              <thead>
                <tr>
                  <th className="py-2 px-3">
                    {translateFunction("Shop Name", language)}
                  </th>
                  <th className="py-2 px-3">
                    {translateFunction("Seller ID", language)}
                  </th>
                  <th className="py-2 px-3">
                    {translateFunction("Actions", language)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {shopes.map((shop: any) => (
                  <tr key={shop.seller_id} className="border-t">
                    <td className="py-3 px-3">{shop.shop_name}</td>
                    <td className="py-3 px-3">{shop.seller_id}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${lang}/sellerProfile/sellerDashboard/${shop.seller_id}`}
                          onClick={() => {
                            setLoading(true);
                            setActiveTab(shop.seller_id);
                          }}
                        >
                          <button className="px-3 py-1 bg-blue-500 text-white rounded-sm">
                            {translateFunction("Enter", language)}
                          </button>
                        </Link>

                        <button
                          onClick={() => setLeaveConfirmShopId(shop.seller_id)}
                          className="px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-sm disabled:opacity-50"
                        >
                          {translateFunction("Leave", language)}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Confirm modal */}
        {leaveConfirmShopId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black opacity-40"
              onClick={() => setLeaveConfirmShopId(null)}
            />
            <div className="bg-white p-6 rounded-sm shadow-lg z-10 w-full max-w-md">
              <h3 className="text-[16px] font-bold mb-2">
                {translateFunction("Confirm leave shop", language)}
              </h3>
              <p className="text-[14px] text-[#333]">
                {translateFunction(
                  "Are you sure you want to leave this shop? This will remove your access to the shop dashboard.",
                  language,
                )}
              </p>
              {leaveError && <p className="text-red-500 mt-3">{leaveError}</p>}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-4 py-2 bg-gray-100 rounded-sm"
                  onClick={() => setLeaveConfirmShopId(null)}
                  disabled={leaveProcessing}
                >
                  {translateFunction("Cancel", language)}
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-sm"
                  onClick={confirmLeaveShop}
                  disabled={leaveProcessing}
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
    </div>
  );
}
export default Page;
