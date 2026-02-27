"use client";
import Spinner from "components/global/Spinner";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction } from "utils/functions";
import BecomeSellerModal from "./BecomeSellerModal";
import GoToSellerDashBoardIcon from "public/icons/goToSeller";
import { useAppStore } from "store";
function GoToSellerDashBoard({ language }: { language: string }) {
  const { lang } = useParams();
  const [shouldShow, setShouldShow] = React.useState(true);
  const [openSellerModal, setOpenSellerModal] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const { userProfile } = useAppStore();

  const getPermission = async () => {
    setLoading(true);
    try {
      let res = await SellerDashboardService.getShopes(true);
      console.log(res);
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

  useEffect(() => {
    if (userProfile && userProfile?.phone?.length > 3) {
      getPermission();
    }
  }, [userProfile]);
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
  const isRtl = language === "ar" || language === "ku";
  return (
    <>
      {/* <button
        onClick={() => setOpenSellerModal(true)}
        className="h-[50px] cursor-pointer w-full rounded-[15px]  bg-[#f8f8f8] border border-gray-100 flex justify-center items-center my-[12px] text-[#1d1d1d]"
      >
        {translateFunction("Become A Seller At Trydos", language)}
      </button>
      {openSellerModal && (
        <BecomeSellerModal onClose={() => setOpenSellerModal(false)} />
      )} */}

      <div
        onClick={() => {
          window.location.href = `/${lang}/sellerProfile`;
        }}
        className={`${
          isRtl && "items-end"
        } flex-col w-full h-[94px] bg-[#1D1D1D] relative rounded-[12px] p-[12px] cursor-pointer`}
      >
        <GoToSellerDashBoardIcon />
        <span className="text-[#FCFCFC] text-[14px] regular mt-[4px]">
          {translateFunction("Sales", language)}
        </span>
        <span className="text-[#FCFCFC] text-[12px] regular">
          {0} {translateFunction("Action")}
        </span>
      </div>
    </>
  );
  return;
}

export default GoToSellerDashBoard;
