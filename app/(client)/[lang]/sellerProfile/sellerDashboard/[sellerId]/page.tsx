"use client";
import { useParams } from "node_modules/next/navigation";
import React, { useEffect } from "react";
import { useSellerProfile } from "../../SellerProfileContext";
import Spinner from "components/global/Spinner";
import SellerDashboardService from "services/sellerDashboard";
import { LogError } from "utils/functions";
function SellerDashBoard() {
  const params = useParams();
  const { loading, setLoading, sellerProducts, setSellerProducts } =
    useSellerProfile();
  const getSellerProducts = async () => {
    try {
      setLoading(true);
      let res = await SellerDashboardService.getSellerProducts(
        params.sellerId as string
      );
      setSellerProducts(res.data || []);
    } catch (error) {
      // LogError(error);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getSellerProducts();
  }, []);
  return (
    <div className="p-6 text-black">SellerDashBoard {params.sellerId}</div>
  );
}

export default SellerDashBoard;
