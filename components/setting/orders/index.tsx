"use client";
import NextLink from "components/global/NextLink";

import { translateFunction } from "utils/server";
import OrderNotified from "./OrderNotified";
import { useAppStore } from "store";
import { usePathname } from "node_modules/next/navigation";

function OrdersLinkCard({ isRtl, user, local, language, totalOrders }) {
  const { setLoginOpen, userProfile: userObj } = useAppStore();

  const isNotLogeedIn = () => {
    let userData = userObj || user;
    return (
      userData.phone === "0" ||
      userData.phone === 0 ||
      !userData?.phone ||
      !userData ||
      userData?.phone?.length < 3
    );
  };
  const pathname = usePathname();
  return (
    <div
      className="w-1/2 flex"
      onClick={() => {
        if (isNotLogeedIn()) {
          setLoginOpen(true);
        }
      }}
    >
      <NextLink
        isFromSetting={!isNotLogeedIn()}
        className={`${isNotLogeedIn() && "opacity-65 "}
        ${
          isRtl && "items-end"
        } flex-col w-full h-[94px] bg-[#F8F8F8] relative rounded-[12px] p-[12px] cursor-pointer`}
        data-cy="orders-page-button"
        href={!isNotLogeedIn() ? `/${local}/settings/orders` : pathname}
      >
        <OrderNotified />
        <img className="w-[32px] h-[25px]" src="/icons/OrdersIcon.svg" />
        <span className="text-[#1D1D1D] text-[14px] regular mt-[4px]">
          {translateFunction("Orders", language)}
        </span>
        <span className="text-[#8D8D8D] text-[12px] regular">
          {totalOrders?.data?.total ?? 0}{" "}
          {translateFunction("Action", language)}
        </span>
      </NextLink>
    </div>
  );
}

export default OrdersLinkCard;
