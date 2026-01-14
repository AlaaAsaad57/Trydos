import NextLink from "components/global/NextLink";
import { GetOrders } from "serverRequests/settings";
import { translateFunction } from "utils/server";
import OrderNotified from "./OrderNotified";

async function OrdersLinkCard({ isRtl, user, local, language }) {
  const totalOrders = await GetOrders({
    page: 1,
    pageSize: 1,
  });

  return (
    <NextLink
      isFromSetting={true}
      className={`${
        isRtl && "items-end"
      } flex-col w-1/2 h-[94px] bg-[#F8F8F8] relative rounded-[12px] p-[12px] cursor-pointer`}
      data-cy="orders-page-button"
      href={user.phone !== "0" && user ? `/${local}/settings/orders` : "#login"}
    >
      <OrderNotified />
      <img className="w-[32px] h-[25px]" src="/svg/OrdersIcon.svg" />
      <span className="text-[#1D1D1D] text-[14px] regular mt-[4px]">
        {translateFunction("Orders", language)}
      </span>
      <span className="text-[#8D8D8D] text-[12px] regular">
        {totalOrders?.data?.total ?? 0} {translateFunction("Action", language)}
      </span>
    </NextLink>
  );
}

export default OrdersLinkCard;
