"use client";

import { useEffect, useState } from "react";
import {
  SellerProfileProvider,
  useSellerProfile,
} from "./SellerProfileContext"; // Import the context
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction } from "utils/functions";

import Link from "next/link";
import { useParams } from "next/navigation";
import Spinner from "components/global/Spinner";
function Page() {
  const [activeTab, setActiveTab] = useState(null);
  const { lang } = useParams();
  const { sellerData, setLoading, loading, shopes, setShopes } =
    useSellerProfile(); // Use the context

  const getInitialData = async () => {
    try {
      setLoading(true);
      let res = await SellerDashboardService.getShopes();
      console.log(res);
      setShopes(res.data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getInitialData();
  }, []);

  return (
    <div className="w-full max-w-2xl flex flex-col items-start bg-white p-6 rounded-lg shadow-md">
      <span>{translateFunction("please Select a shop")}</span>
      <div className="flex flex-row p-3 gap-[5px]">
        {loading && (
          <div className="flex-row flex gap-2">
            <Spinner /> Loading...
          </div>
        )}
        {shopes.map((shop) => (
          <Link
            href={`/${lang}/sellerProfile/sellerDashboard/${shop.seller_id}`}
            key={shop.seller_id}
            className={`px-4 py-2 rounded-lg cursor-pointer border ${
              activeTab === shop.seller_id
                ? "bg-blue-500 text-white"
                : "bg-white text-black"
            }`}
            onClick={() => {
              setLoading(true);
              setActiveTab(shop.seller_id);
            }}
          >
            {shop.shop_name}
          </Link>
        ))}
      </div>
    </div>
  );
}
export default Page;
