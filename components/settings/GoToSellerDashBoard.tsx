"use client";
import Spinner from "components/global/Spinner";
import { useParams } from "next/navigation";
import React from "react";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction } from "utils/functions";
import BecomeSellerModal from "./BecomeSellerModal";
function GoToSellerDashBoard({ language }: { language: string }) {
  const { lang } = useParams();
  const [shouldShow, setShouldShow] = React.useState(true);
  const [openSellerModal, setOpenSellerModal] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    getPermission();
  }, []);
  const getPermission = async () => {
    setLoading(true);
    try {
      let res = await SellerDashboardService.getShopes(true);
      if (res.data && res.data.length > 0) {
        setShouldShow(true);
      } else {
        setShouldShow(false);
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      setShouldShow(false);
    }
  };
  if (!shouldShow) {
    return (
      <>
        <button
          onClick={() => setOpenSellerModal(true)}
          className="h-[50px] cursor-pointer w-full rounded-[15px] text-[#1d1d1d]  bg-[#f8f8f8] border border-gray-100 flex justify-center items-center my-[12px]"
        >
          {translateFunction("Become A Seller At Trydos", language)}
        </button>
        {openSellerModal && (
          <BecomeSellerModal onClose={() => setOpenSellerModal(false)} />
        )}
      </>
    );
  }
  if (loading) {
    return (
      <div className="h-[50px] w-full rounded-[15px]  bg-[#f8f8f8] border border-gray-100 flex justify-center items-center my-[12px]">
        <Spinner />
      </div>
    );
  }
  return (
    <>
      <button
        onClick={() => setOpenSellerModal(true)}
        className="h-[50px] cursor-pointer w-full rounded-[15px]  bg-[#f8f8f8] border border-gray-100 flex justify-center items-center my-[12px] text-[#1d1d1d]"
      >
        {translateFunction("Become A Seller At Trydos", language)}
      </button>
      {openSellerModal && (
        <BecomeSellerModal onClose={() => setOpenSellerModal(false)} />
      )}
      <div
        onClick={() => {
          window.location.href = `/${lang}/sellerProfile`;
        }}
        className="h-[50px] cursor-pointer w-full rounded-[15px]  bg-[#f8f8f8] border border-gray-100 flex justify-center items-center my-[12px]"
      >
        {translateFunction("Go to Seller Dashboard", language)}
      </div>
    </>
  );
  return;
}

export default GoToSellerDashBoard;
