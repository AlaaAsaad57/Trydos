import React from "react";
import { OrdersIcon } from "../OrdersList";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import NextLink from "components/global/NextLink";
import RatingStars from "./RatingStars";
import OrderStatusIcon from "./OrderStatusIcon";
import {
  PendingStatus,
  DeliveredStatus,
  PreparingStatus,
  ShippedSatus,
} from "./OrderStatusCartsIcon";

function OrderItemsList({
  items,
  isExpanded,
  setExpanded,
  order_group_status,
}: {
  items: any;
  isExpanded: boolean;
  setExpanded: (s: boolean) => void;
  order_group_status: any;
}) {
  const getStatusIcon = (status) => {
    if (status === "pending") return <PendingStatus />;
    if (status === "preparing") return <PreparingStatus />;
    if (status === "shipped") return <ShippedSatus />;
    if (status === "delivered") return <DeliveredStatus />;
    return <PendingStatus />;
  };
  const { lang } = useParams();

  return (
    <div className="w-full flex-col">
      <div
        onClick={() => {
          setExpanded(!isExpanded);
        }}
        className="bg-[#F4F4F4] mt-[8px] ml-[8px] w-full min-h-[74px] h-auto  rounded-[15px] py-[7px] px-[12px] flex-col"
        style={{
          border: isExpanded && "1px solid #C4C2C27f",
        }}
      >
        <OrdersIcon />
        <span className="text-[#8D8D8D] text-[10px] regular mt-[5px]">
          {translateFunction("Order Details")}
        </span>
        <span className="text-[#1D1D1D] text-[12px] regular ">
          <span className="bold"> {items.length}</span>{" "}
          {translateFunction("Items")}
        </span>
      </div>
      <div
        className={` ${
          isExpanded ? "h-0 pb-[0px] mt-[0px]" : "pb-[72px] mt-[12px] "
        } flex-row    items-center pl-[12px]  whitespace-nowrap overflow-x-scroll overflow-y-hidden [&::-webkit-scrollbar]:hidden`}
      >
        {items.map((product) => (
          <div className="relative flex-col" key={product.product_details.id}>
            <NextLink
              key={product.product_details.id}
              href={`/${lang}/products/${product.product_slug}`}
              data={{
                is_product: true,
                ...product.product_details,
                href: `/${lang}/products/${product.product_slug}`,
              }}
              className="flex-row cursor-pointer items-center relative w-[91px] h-[125px] ml-[5px]"
            >
              <img
                className="w-full h-full object-contain bg-white rounded-[15px]"
                src={product.image}
                alt={product.product_details.name}
                width={100}
                height={100}
                style={{
                  border: "1px solid #FFFFFF7F",
                }}
              />

              <div
                className="absolute z-10 top-0 left-0 w-full h-full "
                style={{
                  boxShadow: "inset 0px 3px 6px rgba(255, 255, 255, 0.5)",
                }}
              />
            </NextLink>
            <div className="flex-col text-[10px] regular text-[#1d1d1d] absolute bottom-[-69px] items-center left-0 right-0 mx-[0_auto]">
              <div className="flex flex-row">
                <span className="origin-top-left scale-[0.75]">
                  {getStatusIcon(order_group_status?.toLowerCase())}
                </span>
                <OrderStatusIcon status={order_group_status} />
              </div>
              <span className=" regular">{product?.variation?.color}</span>
              <span>{product?.variation?.Size}</span>
              <div className="flex-row mt-[4px]">
                <RatingStars initialRating={1.5} onRatingChange={(e) => {}} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderItemsList;
