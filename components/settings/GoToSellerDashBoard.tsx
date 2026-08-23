"use client";
import Spinner from "components/global/Spinner";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import SellerDashboardService from "services/sellerDashboard";
import { translateFunction, LogError } from "utils/functions";
import BecomeSellerModal from "./BecomeSellerModal";
import GoToSellerDashBoardIcon from "public/icons/goToSeller";
import { useAppStore } from "store";

const hasValidPhone = (phone: any) => {
  if (
    phone === null ||
    phone === undefined ||
    phone === 0 ||
    phone === "0" ||
    phone === "null" ||
    phone === "undefined"
  ) {
    return false;
  }
  const str = String(phone).trim();
  return str.length > 3;
};

function GoToSellerDashBoard({
  language,
  isAuthed = false,
}: {
  language: string;
  isAuthed?: boolean;
}) {
  const { lang } = useParams();
  const [viewState, setViewState] = React.useState<
    "loading" | "sales" | "become_seller" | "error"
  >(isAuthed ? "loading" : "become_seller");
  const [openSellerModal, setOpenSellerModal] = React.useState(false);
  const { userProfile } = useAppStore();

  // Logged-in per the server cookie (isAuthed) or once the client store hydrates
  // a real profile with a valid phone number. Guests (neither) see nothing at all.
  const authenticated =
    isAuthed || hasValidPhone(userProfile?.phone);

  const getPermission = async () => {
    setViewState("loading");
    try {
      let res = await SellerDashboardService.getShopes(true);

      // 1. Explicit 204 No Content -> User is authenticated, but confirmed to have no shops/permissions
      if (res?.httpStatus === 204) {
        setViewState("become_seller");
        return;
      }

      // 2. Fetch returned failure (500, network error, 503, unhandled 401, etc.) -> Error & Retry UI
      if (!res?.success) {
        setViewState("error");
        return;
      }

      // 3. 200 OK: check data for shop permissions
      const shops = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];

      if (shops && shops.length > 0) {
        setViewState("sales");
      } else {
        // 200 OK with empty shops list -> Become seller
        setViewState("become_seller");
      }
    } catch (error) {
      LogError({
        scenario: "GoToSellerDashBoard.getPermission",
        error: error instanceof Error ? error.message : String(error),
      });
      setViewState("error");
    }
  };

  useEffect(() => {
    if (hasValidPhone(userProfile?.phone)) {
      getPermission();
    } else if (isAuthed) {
      getPermission();
    } else {
      setViewState("become_seller");
    }
  }, [userProfile, isAuthed]);

  // Not logged in (guest without phone) -> show nothing.
  if (!authenticated) {
    return null;
  }

  const isRtl = language === "ar" || language === "ku";

  if (viewState === "loading") {
    return (
      <div className="h-[50px] w-full rounded-[15px] bg-[#f8f8f8] border border-gray-100 flex justify-center items-center my-[12px]">
        <Spinner />
      </div>
    );
  }

  if (viewState === "error") {
    return (
      <div
        data-pw="seller-permissions-error"
        className={`w-full min-h-[50px] rounded-[15px] bg-[#f8f8f8] border border-gray-100 flex ${
          isRtl ? "flex-row-reverse" : "flex-row"
        } items-center justify-between px-[16px] py-[10px] my-[12px]`}
      >
        <span className="text-[#e53e3e] text-[13px] regular">
          {translateFunction("Failed to load permissions", language)}
        </span>
        <button
          type="button"
          data-pw="retry-permissions-btn"
          onClick={getPermission}
          className={`flex items-center gap-[6px] px-[12px] py-[6px] bg-[#ffffff] border border-gray-200 hover:border-gray-300 rounded-[10px] text-[#1d1d1d] text-[12px] medium transition-all duration-150 cursor-pointer shadow-xs ${
            isRtl ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <svg
            className="w-[14px] h-[14px] text-[#1d1d1d]"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.5 4.5C6.84315 2.15685 10.3431 2.15685 12.6863 4.5C13.8579 5.67157 14.5 7.25736 14.5 8.84315M14.5 3.5V8.5H9.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15.5 15.5C13.1569 17.8431 9.65685 17.8431 7.31371 15.5C6.14214 14.3284 5.5 12.7426 5.5 11.1569M5.5 16.5V11.5H10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{translateFunction("Retry", language)}</span>
        </button>
      </div>
    );
  }

  if (viewState === "become_seller") {
    return (
      <>
        <button
          data-pw="become-seller-btn"
          onClick={() => setOpenSellerModal(true)}
          className="h-[50px] cursor-pointer w-full rounded-[15px] text-[#1d1d1d] bg-[#f8f8f8] border border-gray-100 flex justify-center items-center my-[12px]"
        >
          {translateFunction("Become A Seller At Trydos", language)}
        </button>
        {openSellerModal && (
          <BecomeSellerModal onClose={() => setOpenSellerModal(false)} />
        )}
      </>
    );
  }

  // viewState === "sales"
  return (
    <div
      data-pw="seller-sales"
      onClick={() => {
        window.location.href = `/${lang}/sellerProfile`;
      }}
      className={`${
        isRtl && "items-end"
      } flex-col w-full h-[94px] bg-[#1D1D1D] relative rounded-[12px] p-[12px] cursor-pointer my-[12px]`}
    >
      <GoToSellerDashBoardIcon />
      <span className="text-[#FCFCFC] text-[14px] regular mt-[4px]">
        {translateFunction("Sales", language)}
      </span>
      <span className="text-[#FCFCFC] text-[12px] regular">
        {0} {translateFunction("Action")}
      </span>
    </div>
  );
}

export default GoToSellerDashBoard;
