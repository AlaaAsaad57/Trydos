"use client";
import NextLink from "components/global/NextLink";

import { translateFunction } from "utils/functions";
import OrderNotified from "./OrderNotified";
import { useAppStore } from "store";
import { usePathname } from "node_modules/next/navigation";
import { useEffect, useState } from "react";
import { fetchOrdersCount } from "services/orders";

function OrdersLinkCard({ isRtl, user, local, language }) {
  const { setLoginOpen, userProfile: userObj } = useAppStore();
  const [ordersCount, setOrdersCount] = useState<number | null>(null);

  const isNotLogeedIn = () => {
    let userData = userObj || user;
    if (!userData) return true;
    return (
      userData.phone === "0" ||
      userData.phone === 0 ||
      userData.phone === null ||
      userData.phone === undefined ||
      String(userData.phone).trim() === "" ||
      String(userData.phone).length < 3
    );
  };
  const pathname = usePathname();
  const isLoggedIn = !isNotLogeedIn();

  // The count is fetched from the browser (proxy injects the token) instead of
  // on the server, so the settings page renders without waiting on the orders
  // API. Guests have no orders to count — skip the request entirely.
  useEffect(() => {
    if (!isLoggedIn) {
      setOrdersCount(null);
      return;
    }
    let cancelled = false;
    fetchOrdersCount().then((count) => {
      if (!cancelled && count !== null) setOrdersCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

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
          {ordersCount ?? 0}{" "}
          {translateFunction("Action", language)}
        </span>
      </NextLink>
    </div>
  );
}

export default OrdersLinkCard;
