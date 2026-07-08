"use client";
import Spinner from "components/global/Spinner";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
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
      // fetchData returns { success: false } instead of throwing — treat that as
      // a failure so it flows into the catch and gets logged, not as "no shops".
      if (!res?.success) {
        throw new Error(res?.message || "Failed to fetch seller shops");
      }
      if (res.data && res.data.length > 0) {
        setShouldShow(true);
      } else {
        setShouldShow(false);
      }

      setLoading(false);
    } catch (error) {
      LogError({
        scenario: "GoToSellerDashBoard.getPermission",
        error: error instanceof Error ? error.message : String(error),
      });
      setLoading(false);
      setShouldShow(false);
    } finally{
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile && userProfile?.phone?.length > 3) {
      getPermission();
    }else{
      setLoading(false);
    }
  }, [userProfile]);
  if (!shouldShow) {
    return (
      <>
        <button
          data-cy="become-seller-btn"
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
        data-cy="seller-sales"
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
