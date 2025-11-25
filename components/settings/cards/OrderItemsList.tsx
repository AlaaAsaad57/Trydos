import React from "react";
import { OrdersIcon } from "../OrdersList";
import { getConfiguredImage, translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import NextLink from "components/global/NextLink";
import OrderStatusIcon from "./OrderStatusIcon";
import {
  PendingStatus,
  DeliveredStatus,
  PreparingStatus,
  ShippedSatus,
} from "./OrderStatusCartsIcon";
import { GetImageUrl } from "utils/tinyUtils";
import { OrderItemsListPropsType } from "models/componentType/settingTypes/OrderItemsListPropsType";
import { useAppStore } from "store";
import RatingOrderItem from "components/Orders/RatingOrderItem";

function OrderItemsList({
  items,
  isExpanded,
  setExpanded,
  order_group_status,
  shouldShowChat,
  showChats,
  getOrderDetails,
  getProductUrl,
}: OrderItemsListPropsType) {
  const { ActivePacks } = useAppStore();
  const getStatusIcon = (status) => {
    if (status === "pending") return <PendingStatus />;
    if (status === "preparing") return <PreparingStatus />;
    if (status === "shipped") return <ShippedSatus />;
    if (status === "delivered") return <DeliveredStatus />;
    return <PendingStatus />;
  };
  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";
  const isDelevired = (item) => {
    return (
      !item.is_returned && ActivePacks?.order_status?.value === "delivered"
    );
  };
  return (
    <div className="w-full flex-col">
      <div
        onClick={(e) => {
          // @ts-ignore
          if (!e.target.closest(".chat-holder")) {
            setExpanded(!isExpanded);
            document.querySelector("#OrderDetails").scrollTop = 0;
          }
        }}
        className={`${
          isRtl ? "items-end" : "items-start"
        } bg-[#F4F4F4] mt-[8px] ml-[8px] w-full min-h-[74px] h-auto  rounded-[15px] py-[7px] px-[12px] flex-col`}
        style={{
          border: isExpanded && "1px solid #C4C2C27f",
        }}
      >
        <OrdersIcon />
        <span className={`text-[#8D8D8D] text-[10px] regular mt-[5px]`}>
          {translateFunction("Order Details")}
        </span>
        <span className={`text-[#1D1D1D] text-[12px] regular`}>
          <span
            className={`bold ${isRtl ? " text-right dir-rtl" : " "}`}
            data-cy="order-products-count"
          >
            {items.length}
          </span>{" "}
          {translateFunction("Items")}
        </span>
        {shouldShowChat() && (
          <div
            className={`${
              isRtl ? "left-[10px]" : "right-[10px]"
            } chat-holder flex-row absolute  top-[30px]`}
          >
            {showChats()}
          </div>
        )}
      </div>
      <div
        className={` ${
          isExpanded ? "h-0 pb-[0px] mt-[0px]" : "pb-[72px] mt-[12px] "
        }   ${
          isRtl ? "flex-row-reverse" : "flex-row"
        }  items-center pl-[12px] flex whitespace-nowrap overflow-x-scroll overflow-y-hidden [&::-webkit-scrollbar]:hidden`}
      >
        {items.map((product) => (
          <div className="relative flex-col" key={product.id}>
            <NextLink
              key={product.product_details.id}
              href={getProductUrl(product)}
              data={{
                is_product: true,
                ...product.product_details,
                href: getProductUrl(product),
              }}
              className="flex-row cursor-pointer items-center relative min-w-[91px] w-[91px] h-[125px] ml-[5px]"
            >
              <img
                className="w-full h-full object-contain bg-white rounded-[15px]"
                src={getConfiguredImage({
                  src: GetImageUrl(product.image),
                  width: 100,
                  height: 100,
                  q: 75,
                })}
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
            <div className="flex-col text-[10px] regular text-[#1d1d1d]  items-center left-0 right-0 mx-[0_auto] mt-[4px]">
              <div className="flex flex-row">
                <span className={`origin-top-left scale-[0.75]`}>
                  {getStatusIcon(order_group_status?.value?.toLowerCase())}
                </span>

                {!isDelevired(product) && (
                  <OrderStatusIcon
                    status={order_group_status?.value}
                    isRtl={isRtl}
                  />
                )}
              </div>
              {!isDelevired(product) ? (
                <>
                  <span className=" regular">
                    {product?.variation?.[0]?.color}
                  </span>
                  <span>{product?.variation?.[0]?.Size}</span>
                </>
              ) : (
                <span className="capitalize">
                  {translateFunction("delivered")}
                </span>
              )}
              <div className="flex-row mt-[4px]"></div>
            </div>
            {isDelevired(product) && (
              <RatingOrderItem
                seller_id={
                  // ActivePacks?.seller_id
                  null
                }
                refresh={() => {
                  getOrderDetails();
                }}
                productId={product?.product_details.id}
                variant={product?.variant}
                order_detail_id={product.id}
                initialRating={
                  product.comments &&
                  product.comments?.[product?.comments.length - 1]?.star_rating
                }
                lastComment={
                  product.comments &&
                  product.comments?.[product?.comments.length - 1]?.comment
                }
                isRated={
                  product.comments &&
                  product.comments?.[product?.comments.length - 1]?.star_rating
                }
                lastRatingId={
                  product.comments &&
                  product.comments?.[product?.comments.length - 1]?.id
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderItemsList;
