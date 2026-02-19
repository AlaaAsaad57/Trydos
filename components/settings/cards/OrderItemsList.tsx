import React, { useState } from "react";

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

import RatingOrderItem from "components/Orders/RatingOrderItem";
import RatingStars from "./RatingStars";
import Spinner from "components/global/Spinner";

function OrderItemsList({
  items,
  isExpanded,
  setExpanded,
  order_group_status,
  shouldShowChat,
  showChats,
  getOrderDetails,
  getProductUrl,
  getProductComment,
  owner_id,
  owner_type,
  order_status,
}) {
  const getStatusIcon = (status) => {
    if (status === "pending") return <PendingStatus isActive={false} />;
    if (status === "preparing") return <PreparingStatus isActive={false} />;
    if (status === "shipped" || status.includes("ship"))
      return <ShippedSatus isActive={false} />;
    if (status === "delivered") return <DeliveredStatus isActive={false} />;
    return <PendingStatus isActive={false} />;
  };
  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";
  const isDelevired = (item) => {
    return !item.is_returned && order_status?.value === "delivered";
  };

  const [showCommentModal, setShowCommentModal] = useState<any>(false);
  const [loading, setLoading] = React.useState(false);

  return (
    <div className="w-full flex-col">
      <div
        onClick={(e) => {
          // @ts-ignore
          if (!e.target.closest(".chat-holder")) {
            setExpanded(!isExpanded);
          }
        }}
        className={`${
          isRtl ? "items-end" : "items-start"
        } bg-[#F4F4F4] mt-[8px] ml-[8px] w-full min-h-[74px] h-auto  rounded-[15px] py-[7px] px-[12px] flex-col`}
        style={{
          border: isExpanded && "1px solid #C4C2C27f",
        }}
      >
        <img src="/icons/OrderDetailsIcon.svg" />
        <span className={`text-[#8D8D8D] text-[10px] regular mt-[5px]`}>
          {translateFunction("Order Details")}
        </span>
        <span
          style={{
            direction: isRtl ? "rtl" : "ltr",
          }}
          className={`text-[#1D1D1D] text-[12px] regular`}
        >
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
          isExpanded ? "h-0 pb-0 mt-0" : "pb-[72px] mt-[12px] "
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
            <div className="flex-col text-[10px] regular text-[#1d1d1d]  items-center left-0 right-0 m-[0_auto] mt-[4px]">
              <div className="flex flex-row">
                <span className={`origin-top-left scale-[0.75]`}>
                  {getStatusIcon(order_status?.value?.toLowerCase())}
                </span>

                {!isDelevired(product) && (
                  <OrderStatusIcon status={order_status?.value} isRtl={isRtl} />
                )}
              </div>
              {!isDelevired(product) ? (
                <>
                  <span className=" regular">
                    {
                      product?.variation?.find(
                        (s) => s.id === product?.product_variation_id,
                      )?.color?.name
                    }
                  </span>
                  <span>
                    {
                      product?.variation?.find(
                        (s) => s.id === product?.product_variation_id,
                      )?.size
                    }
                  </span>
                </>
              ) : (
                <span className="capitalize">
                  {translateFunction("delivered")}
                </span>
              )}
              <div className="flex-row mt-[4px]"></div>
            </div>
            {isDelevired(product) && (
              <>
                <div
                  className="flex flex-col items-center justify-center w-full space-y-4"
                  onClick={() => {
                    if (!loading) {
                      setShowCommentModal(product?.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-center rating-star-container">
                    {!loading ? (
                      <RatingStars
                        readOnly={true}
                        initialRating={
                          getProductComment(product?.product_id, product.id)
                            ?.star_rating ?? 0
                        }
                      />
                    ) : (
                      <Spinner />
                    )}
                  </div>
                </div>

                {showCommentModal === product?.id && (
                  <RatingOrderItem
                    owner_id={owner_id}
                    owner_type={owner_type}
                    seller_id={
                      // ActivePacks?.seller_id
                      null
                    }
                    refresh={() => {
                      getOrderDetails();
                    }}
                    key={`${product.id}-${product?.id}-rating-modal`}
                    productId={product?.product_details.id}
                    variant={product?.variant}
                    order_detail_id={product.id}
                    initialRating={
                      getProductComment(product?.product_id, product.id)
                        ?.star_rating
                    }
                    lastComment={
                      getProductComment(product?.product_id, product.id)
                        ?.comment
                    }
                    isRated={
                      getProductComment(product?.product_id, product.id)
                        ?.star_rating
                    }
                    lastRatingId={
                      getProductComment(product?.product_id, product.id)?.id
                    }
                    comments_images_customer={
                      getProductComment(product?.product_id, product.id)
                        ?.comments_images_customer ?? []
                    }
                    setShowCommentModal={() => setShowCommentModal(false)}
                    loading={loading}
                    setLoading={setLoading}
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderItemsList;
