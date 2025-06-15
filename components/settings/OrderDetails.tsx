import React, { useEffect, useState } from "react";
import { OrdersIcon } from "./OrdersList";
import SettingTopBar from "./TopBar";

import { OrderDateCard, OrderInvoiceCard, OrderNumberCard } from "./cards";

import OrderExpectedDeliveryCard from "./cards/OrderExpectedDeliveryCard";
import OrderStatusCard from "./cards/OrderStatusCard";
import OrderAddressCard from "./cards/OrderAddressCard";
import OrderItemsList from "./cards/OrderItemsList";
import { OrderDetail, OrderItem } from "types/orders";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import { useAppStore } from "store";
import NextLink from "components/global/NextLink";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import OrderStatusCartsIcon from "./cards/OrderStatusCartsIcon";
import OrderStatusIcon from "./cards/OrderStatusIcon";
import RateOrderButton from "./cards/RateOrderButton";
import Spinner from "components/global/Spinner";
import order from "services/order";
import OrderChatIcon from "./OrderChatIcon";
import { usePathname } from "next/navigation";
import { Channel } from "models/Genaral/Channel";
import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("components/Chat/ChatWidget"), {
  ssr: false,
});
import OptionsIcon from "public/svg/OptionsIcon.svg";
import OrderRetailsReturnInfo from "components/Orders/OrderRetailsReturnInfo";
import RatingOrderItem from "components/Orders/RatingOrderItem";

function OrderDetails({
  resetOrderDetails,
  goBack,
}: {
  resetOrderDetails: () => void;
  goBack: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const totalAmount = (arr) => {
    let total = 0;
    arr?.map((s) => {
      total += s.order_amount;
    });
    return total;
  };
  const totalItems = (arr) => {
    let arr_of_products = [];
    arr.map((s) => {
      s.details.map((d) => {
        arr_of_products.push({ ...d, order_status: s.order_status?.label });
      });
    });

    return arr_of_products;
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const getOrderDetails = async () => {
    setLoading(true);
    let data = await order.getOrderDetails(selectedOrder.order_group_id);

    let orderData = {
      ...data?.[0],
      order_amount: totalAmount(data),
      details: totalItems(data),
    };

    setOrderDetails(orderData);
    let params = new URLSearchParams(searchParams);
    params.delete("id");
    // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
    router.push(`${pathname}?${params.toString()}`, { shallow: true });
    setLoading(false);
  };
  const { setOrderDetails, selectedOrder } = useAppStore();

  const resetOrder = () => {
    setOrderDetails(null);
    goBack();
    let params = new URLSearchParams(searchParams);
    params.delete("id");
    // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
    router.push(`${pathname}?${params.toString()}`, { shallow: true });
  };
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReturnOrderOpen, setIsReturnOrderOpen] = useState<
    boolean | OrderDetail
  >(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInfo, setChatInfo] = useState<Channel | null>(null);
  useEffect(() => {
    if (selectedOrder?.id) getOrderDetails();
  }, [selectedOrder?.id]);
  if (!selectedOrder?.id) return null;
  const shouldShowChatIcon = () => {
    // Out for Delivery
    if (selectedOrder.order_status.label === "Out for Delivery")
      return selectedOrder.order_group_id;
    if (
      selectedOrder.details?.find((s) => s.order_status === "Out for Delivery")
    )
      return selectedOrder.order_group_id;
    return false;
  };

  const ShowChats = () => {
    if (shouldShowChatIcon()) {
      let arr = [];
      selectedOrder.details.map((s) => {
        if (s.order_status === "Out for Delivery") {
          if (!arr.includes(s.order_id)) {
            arr.push(s.order_id);
          }
        }
      });

      return arr.map((s) => {
        return (
          <OrderChatIcon
            isChatOpen={isChatOpen}
            setChatInfo={setChatInfo}
            setIsChatOpen={setIsChatOpen}
            key={s}
            id={s}
          />
        );
      });
    }
  };

  return (
    <>
      {chatInfo && (
        <ChatWidget
          isOpen={isChatOpen}
          onClose={() => {
            document.documentElement.style.overflow = "auto";
            setChatInfo(null);
            document
              .querySelector("#OrderDetails")
              .classList.remove("overflow-hidden");
            document
              .querySelector("#OrderDetails")
              .classList.add("overflow-auto");
            setIsChatOpen(false);
          }}
        />
      )}
      <div className="flex-col h-[calc(128vh)]">
        <SettingTopBar
          goBack={() => {
            resetOrder();
          }}
          screenName={
            <div className="flex-row items-stretch">
              <OrdersIcon />
              <span className="text-[#1D1D1D] text-[14px] medium ml-[4px]">
                {translateFunction("Orders Details")}
              </span>
            </div>
          }
          Save={null}
          hasOptions={true}
          hasChat={shouldShowChatIcon()}
        />

        {loading ? (
          <div className="flex w-full pt-8 justify-center items-center">
            <span className="scale-[4]">
              <Spinner />
            </span>
          </div>
        ) : (
          <>
            <div
              className={`pt-[12px] px-[12px] ${
                isExpanded && "h-0 pt-0 overflow-hidden"
              } flex-col justify-start  w-full bg-[#F8F8F8] `}
            >
              <div className="flex-row justify-between items-center w-full">
                <OrderNumberCard number={selectedOrder.order_group_id} />
                <OrderDateCard time={selectedOrder.created_at} />
                <OrderInvoiceCard
                  amount={selectedOrder.order_amount}
                  payments={selectedOrder.payment_method}
                />
              </div>
              <div className="flex-row justify-between items-center w-full mt-[8px]">
                <OrderExpectedDeliveryCard time={selectedOrder.created_at} />
                <OrderStatusCard
                  status={selectedOrder.order_group_status.label}
                />
              </div>
              <OrderAddressCard address={selectedOrder.shipping_address_data} />
            </div>
            <RateOrderButton />
            <div className="flex flex-col justify-start  w-full bg-[#F8F8F8] px-[12px] h-full relative">
              <OrderItemsList
                shouldShowChat={shouldShowChatIcon}
                showChats={() => ShowChats()}
                order_group_status={selectedOrder.order_status.label}
                setExpanded={setIsExpanded}
                isExpanded={isExpanded}
                items={selectedOrder.details}
              />
              {isExpanded && <OrderExpandedDetails order={selectedOrder} />}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default OrderDetails;
const OrderExpandedDetails = ({ order }: { order: OrderItem }) => {
  const { currency, settings } = useAppStore();

  return (
    <div className="bg-[#fff] mt-[20px] rounded-[10px] w-full h-auto p-[12px] flex-col flex items-start">
      <span className="w-[70px] h-[10px] bg-[#C4C2C27f]"></span>
      <div className="flex-row justify-between items-center w-full">
        <div className="flex text-[#505050] regular text-[12px] mt-[5px] items-center">
          {translateFunction("Buying")}{" "}
          <span className="bold mx-[2px]"> {order.details.length}</span>{" "}
          {translateFunction("Items")} .{" "}
          <span className="bold mx-[2px]">
            {RoundPrice({ num: order.order_amount })} {currency?.symbol}
          </span>
        </div>
      </div>
      <div className="flex-row justify-between items-end  w-full mt-[8px]">
        <div className=" relative w-auto min-h-[60px] h-auto  px-[12px] flex-col">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="20"
            height="20"
            viewBox="0 0 20 20"
          >
            <defs>
              <clipPath id="clip-path734">
                <rect
                  id="Rectangle_4612"
                  data-name="Rectangle 4612"
                  width="20"
                  height="20"
                  transform="translate(0.223)"
                  fill="none"
                />
              </clipPath>
            </defs>
            <g
              id="Group_13617"
              data-name="Group 13617"
              transform="translate(-0.223)"
            >
              <g
                id="Mask_Group_380"
                data-name="Mask Group 380"
                transform="translate(0)"
                clipPath="url(#clip-path734)"
              >
                <g id="delivery_location" transform="translate(1.792 -0.04)">
                  <g id="Group_11335" data-name="Group 11335">
                    <g
                      id="Group_11333"
                      data-name="Group 11333"
                      transform="translate(0 5.333)"
                    >
                      <path
                        id="Path_21554"
                        data-name="Path 21554"
                        d="M14.014,16.2H7.307a.242.242,0,0,1-.242-.259.252.252,0,0,1,.242-.259h6.707a2.283,2.283,0,0,0,2.343-2.343,2.278,2.278,0,0,0-.582-1.438,2.317,2.317,0,0,0-1.762-.76H9.8a2.747,2.747,0,1,1,0-5.495h3.442a.242.242,0,0,1,.242.259.23.23,0,0,1-.259.226H9.8a2.255,2.255,0,0,0,0,4.509h4.218a2.781,2.781,0,0,1,2.844,2.683A2.816,2.816,0,0,1,14.014,16.2Z"
                        transform="translate(-1.602 -5.645)"
                        fill="#8d8d8d"
                      />
                      <g
                        id="Group_11332"
                        data-name="Group 11332"
                        transform="translate(0 7.014)"
                      >
                        <ellipse
                          id="Ellipse_269"
                          data-name="Ellipse 269"
                          cx="1.083"
                          cy="1.099"
                          rx="1.083"
                          ry="1.099"
                          transform="translate(1.891 1.875)"
                          fill="#8d8d8d"
                        />
                        <path
                          id="Path_21555"
                          data-name="Path 21555"
                          d="M4.587,12.645a2.939,2.939,0,0,0-2.974,2.893,2.738,2.738,0,0,0,.566,1.681v.016L4.36,20.241a.253.253,0,0,0,.194.1.23.23,0,0,0,.194-.1l2.214-3.006a.016.016,0,0,1,.016-.016,2.807,2.807,0,0,0,.566-1.681A2.915,2.915,0,0,0,4.587,12.645Zm0,4.558A1.6,1.6,0,1,1,6.17,15.6,1.59,1.59,0,0,1,4.587,17.2Z"
                          transform="translate(-1.613 -12.645)"
                          fill="#8d8d8d"
                        />
                      </g>
                    </g>
                    <g
                      id="Group_11334"
                      data-name="Group 11334"
                      transform="translate(10.731)"
                    >
                      <path
                        id="Path_21556"
                        data-name="Path 21556"
                        d="M12.323,3.636h6.723L15.684.323Z"
                        transform="translate(-12.323 -0.323)"
                        fill="#8d8d8d"
                      />
                      <path
                        id="Path_21557"
                        data-name="Path 21557"
                        d="M12.984,8.4H14.5v-2a.252.252,0,0,1,.242-.259H16.62a.242.242,0,0,1,.242.259v2h1.519V4.129h-5.4Z"
                        transform="translate(-12.321 -0.315)"
                        fill="#8d8d8d"
                      />
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </svg>

          <span className="text-[#8D8D8D] regular text-[10px] mt-[5px]">
            {translateFunction("Expected Delivery Date")}
          </span>
          <span className="text-[#1D1D1D] text-[12px] regular mt-[3px]">
            Monday{" "}
            <span className="bold text-[#1D1D1D] text-[12px]  mx-[1px]">
              2.Jun
            </span>{" "}
            | 3 {translateFunction("Work Days")}
          </span>
        </div>
        <div className="w-auto min-h-[60px] h-auto  px-[12px] flex-col">
          <div className="flex flex-row items-end">
            <OrderStatusCartsIcon status={order?.order_group_status?.label} />
          </div>
          <span className="text-[#8D8D8D] regular text-[10px] mt-[5px]">
            {translateFunction("Order Status")}
          </span>
          <div className="text-[#1D1D1D] flex-row text-[12px] regular mt-[3px]">
            <span>{order?.order_group_status?.label}</span>
            <span className="ml-[11px]">
              <OrderStatusIcon status={order?.order_group_status?.label} />
            </span>
          </div>
        </div>
      </div>
      <div className="flex-col w-full mt-[12px] pb-[50px]">
        {order.details.map((Product) => (
          <ProductCard
            status={order?.order_status?.label}
            product={Product}
            key={Product.id}
          />
        ))}
      </div>
    </div>
  );
};
const ProductCard = ({
  product,
  status,
}: {
  product: OrderDetail;
  status: string;
}) => {
  const { currency, setSelectedOrderItem } = useAppStore();
  const { lang } = useParams();

  return (
    <>
      <div className={`relative w-full flex-col`}>
        <span
          className="absolute top-[22px] right-[0px]"
          onClick={() => {
            document.documentElement.style.overflow = "hidden";
            document.documentElement.scrollTop = 0;
            document.querySelector("#OrderDetails").scrollTop = 0;
            document
              .querySelector("#OrderDetails")
              .classList.add("overflow-hidden");
            document
              .querySelector("#OrderDetails")
              .classList.remove("overflow-auto");
            setSelectedOrderItem(product);
          }}
        >
          <OptionsIcon />
        </span>

        <NextLink
          href={`/${lang}/products/${product.product_slug}`}
          data={{ is_product: true, ...product.product_details }}
          className="flex-row  w-full border-t border-[#C4C2C27f] py-[12px]"
        >
          <div className="flex-row  relative">
            <div
              className="absolute top-0 z-10 right-0 w-full h-full "
              style={{
                boxShadow: "inset 0px 3px 6px rgba(255, 255, 255, 0.5)",
              }}
            />
            <img
              className="w-[104px] h-[144px] rounded-[15px]"
              src={getConfiguredImage({
                src: product.image,
                width: 104,
                height: 144,
                q: 100,
              })}
              alt={product.product_details.name}
            />
          </div>
          <div className="flex  flex-col items-start mt-[10px] ml-[12px] regular text-[12px] text-[#8D8D8D]">
            <span className="w-[70px] h-[10px] bg-[#C4C2C27f]"></span>
            <span className="text-[#505050] text-[12px] regular mt-[3px]">
              {product.product_details.name}
            </span>
            <div className="flex-row justify-between w-full">
              {product?.variation?.color && (
                <div className="flex-row">
                  <span className="text-[10px] regular">
                    {translateFunction("Color")}:
                  </span>
                  <span className="text-[#505050] text-[10px] medium ml-[2px]">
                    {product.variation?.color}
                  </span>
                </div>
              )}
              {product?.variation?.Size && (
                <div className="flex-row ml-[40px]">
                  <span className="text-[10px] regular">
                    {translateFunction("Size")}:
                  </span>
                  <span className="text-[#505050] text-[10px] medium ml-[2px]">
                    {product.variation?.Size}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-row justify-between w-full">
              <div className="flex-row">
                <span className="text-[10px] regular">
                  {translateFunction("Composed Of")}:
                </span>
                <span className="text-[#505050] text-[10px] medium ml-[2px]">
                  {product?.product_details?.count_of_pieces}{" "}
                  {translateFunction("Pieces")}
                </span>
              </div>

              <div className="flex-row ml-[40px]">
                <span className="text-[10px] regular">
                  {translateFunction("Item")}:
                </span>
                <span className="text-[#505050] text-[10px] medium ml-[2px]">
                  {product.qty}
                </span>
              </div>
            </div>
            <div className="flex-row justify-between w-full">
              <div className="flex-row">
                <span className="text-[10px] regular">
                  {translateFunction("Item Status")}:
                </span>
                <span className="text-[#505050] text-[10px] medium ml-[2px]">
                  {product?.order_status ?? status}
                </span>
                <span className="ml-[12px]">
                  <OrderStatusIcon status={product?.order_status ?? status} />
                </span>
              </div>
            </div>
            <div className="flex-row  items-center">
              {product.price_after_discount >= 0 && (
                <div className="line-through text-[#C4C2C2] regular text-[12px]  line-through-[#C4C2C2]">
                  {RoundPrice({ num: product.price })}
                </div>
              )}
              <div className="text-[#1D1D1D] text-[12px] ml-[4px] bold">
                {RoundPrice({ num: product.price_after_discount })}
              </div>
              <span className="text-[#1D1D1D] light text-[10px] ml-[4px]">
                {currency?.symbol}
              </span>
            </div>
          </div>
        </NextLink>
        {!product.is_returned && <RatingOrderItem />}
        {product.is_returned && <OrderRetailsReturnInfo product={product} />}
      </div>
    </>
  );
};
