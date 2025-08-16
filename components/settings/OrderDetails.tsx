import React, { useEffect, useState, useRef } from "react";
import { OrdersIcon } from "./OrdersList";
import SettingTopBar from "./TopBar";
import OrderDetailsSkeleton from "components/skeleton/loaders/OrderDetailsSkeleton";
import { OrderDateCard, OrderInvoiceCard, OrderNumberCard } from "./cards";

import OrderExpectedDeliveryCard from "./cards/OrderExpectedDeliveryCard";
import OrderStatusCard from "./cards/OrderStatusCard";
import OrderAddressCard from "./cards/OrderAddressCard";
import OrderItemsList from "./cards/OrderItemsList";
import { OrderItem } from "types/orders";
import {
  getConfiguredImage,
  getUserChat,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import { useAppStore } from "store";
import NextLink from "components/global/NextLink";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import OrderStatusCartsIcon from "./cards/OrderStatusCartsIcon";
import OrderStatusIcon from "./cards/OrderStatusIcon";
import RateOrderButton from "./cards/RateOrderButton";
import Order from "services/order";
import OrderChatIcon from "./OrderChatIcon";
import { Channel } from "models/Genaral/Channel";
import ReturnedOrderStatusIcon from "public/svg/ReturnedOrderStatusIcon.svg";
const ChatWidget = dynamic(() => import("components/Chat/ChatWidget"), {
  ssr: false,
  loading: () => <LandingPage afterLoad={true} />,
});
import OptionsIcon from "public/svg/OptionsIcon.svg";
import OrderRetailsReturnInfo from "components/Orders/OrderRetailsReturnInfo";
import CanceledOrderStatusIcon from "public/svg/CanceledOrderStatusIcon.svg";
import {
  DisableScroll,
  EnableScroll,
  GetImageUrl,
  totalAmount,
} from "utils/tinyUtils";
import { OrderDetailsPropsType } from "models/componentType/settingTypes/OrderDetailsPropsType";
import { ProductCardPropsType } from "models/componentType/settingTypes/ProductCardPropsType";
import { fetchData } from "utils/fetchData";
import auth from "services/auth";
import { REQUESTS_DATA } from "utils/Requests";
import dynamic from "node_modules/next/dynamic";
import LandingPage from "components/Home/LandingPage";
import Spinner from "components/global/Spinner";
function OrderDetails({
  resetOrderDetails,
  goBack,
  setShouldConfirmReturn,
}: OrderDetailsPropsType) {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("order_id_chat")) {
      let order_id = searchParams.get("order_id_chat");
      let selected_pack = selectedOrder.details?.find(
        (det) => det.id === parseInt(order_id)
      );
      getChatWithShipping(parseInt(order_id));
    }
  }, []);

  const {
    setOrderDetails,
    selectedOrder,
    openChat,
    ActivePacks,
    setActivePacks,
    orderPageLoading: loading,
    setOrderPageLoading: setLoading,
  } = useAppStore();
  const fetchedOrderIdRef = useRef<string | number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { lang } = useParams();

  const getOrderDetails = async () => {
    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      let data = await Order.getOrderDetails(
        selectedOrder.order_group_id,
        abortControllerRef.current.signal
      );
      let returned_req_ids = data?.map((s) => {
        if (s.return_request_id !== null && s.return_request_id !== undefined)
          return s.return_request_id;
      });
      returned_req_ids = returned_req_ids?.filter((s) => s !== undefined);
      let returnRequests = undefined;
      if (returned_req_ids?.length > 0) {
        try {
          returnRequests = await Promise.all(
            returned_req_ids.map(async (id) => {
              const details = await Order.getReturnRequestDetails({
                return_request_id: id,
              });
              return { id, details };
            })
          );

          // Update data with the fetched details
          data = data.map((order) => {
            const match = returnRequests.find(
              (req) => req.id === order.return_request_id
            );
            return match
              ? {
                  ...order,
                  return_details: { ...match },
                  returned_data: returnRequests,
                }
              : { ...order, returned_data: returnRequests };
          });
        } catch (error) {
          console.error(error);
        }
      }
      let orderData = {
        ...data?.[0],
        order_amount: totalAmount(data),
        details: data,
        returned_data: returnRequests,
      };

      if (data.find((s) => s.id === ActivePacks?.id)) {
        setActivePacks(data.find((s) => s.id === ActivePacks?.id));
      } else setActivePacks(data[0]);

      setOrderDetails(orderData);
    } catch (error) {
      // Don't handle error if it's an abort error
      if (error.name === "AbortError") {
        return;
      }

      let params = new URLSearchParams(window.location.search);
      params.delete("id");
      params.delete("order_id_chat");
      // @ts-ignore
      router.replace(`/${lang}/setting?${params.toString()}`, {
        scroll: false,
        // @ts-ignore
        shallow: true,
      });
      resetOrder();
    }

    setLoading(false);
  };
  const resetOrder = () => {
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
      chatAbortControllerRef.current = null;
    }

    setOrderDetails(null);
    setActivePacks(null);
    fetchedOrderIdRef.current = null;
    goBack();
    setIsExpanded(false);
  };
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInfo, setChatInfo] = useState<Channel | null>(null);
  const shouldShowChatIcon = (pack) => {
    // Out for Delivery
    if (pack && pack?.order_status?.value === "out_for_delivery")
      return selectedOrder.order_group_id;
    return false;
  };
  const [isGettingChat, setIsGettingChat] = useState(false);
  const chatAbortControllerRef = useRef<AbortController | null>(null);

  const getChatWithShipping = async (id) => {
    // Abort any previous chat request
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
    }

    // Create new AbortController for chat
    chatAbortControllerRef.current = new AbortController();

    setIsGettingChat(true);
    try {
      let response = await fetchData({
        url: "/api/v1/order-chat-participants/get-recipient",
        reqTitle: REQUESTS_DATA.GET_CHAT_WITH_DELEIVERY,
        method: "POST",
        server: "chat",
        body: JSON.stringify({
          original_user_id: auth.UserID(),
          order_id: id,
        }),
        signal: chatAbortControllerRef.current.signal,
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      DisableScroll();

      document.querySelector("#OrderDetails").scrollTop = 0;
      document.querySelector("#OrderDetails").classList.add("overflow-hidden");
      document.querySelector("#OrderDetails").classList.remove("overflow-auto");
      if (response.data.channel) {
        setChatInfo({
          ...response.data.channel,
          channel_members: [
            {
              user: getUserChat(),
              ...response.data.channel.channel_members.find(
                (s) => s.user_id === getUserChat().id
              ),
            },
            {
              user: {
                id: response.data.recipient.id,
                name: "Deleivery Worker",
                mobile_phone: "",
                username: "Deleivery Worker",
              },
              ...response.data.channel.channel_members.find(
                (s) => s.user_id !== getUserChat().id
              ),
            },
          ],
        });
        openChat({
          ...response.data.channel,
          channel_members: [
            {
              user: getUserChat(),
              ...response.data.channel.channel_members.find(
                (s) => s.user_id === getUserChat().id
              ),
            },
            {
              user: {
                id: response.data.recipient.id,
                name: "Deleivery Worker",
                mobile_phone: "",
                username: "Deleivery Worker",
              },
              ...response.data.channel.channel_members.find(
                (s) => s.user_id !== getUserChat().id
              ),
            },
          ],
          messages:
            response.data.channel.messages?.sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            ) || [],
        });
      } else {
        setChatInfo({
          channel_members: [
            {
              id: getUserChat()?.id,
              user: getUserChat(),
              user_id: getUserChat().id,
            },
            {
              id: response.data.recipient.id,
              user_id: response.data.recipient.id,
              user: {
                id: response.data.recipient.id,
                name: "Deleivery Worker",
                mobile_phone: "",
                username: "Deleivery Worker",
              },
            },
          ],
          channel_name: "Deleivery Worker",
          photo_path: null,
          messages: [],
          id: "ch-" + response.data.recipient.id,
          mid: "ch-" + response.data.recipient.id,
        });
        openChat({
          channel_members: [
            {
              id: getUserChat()?.id,
              user: getUserChat(),
              user_id: getUserChat().id,
            },
            {
              id: response.data.recipient.id,
              user_id: response.data.recipient.id,
              user: {
                id: response.data.recipient.id,
                name: "Deleivery Worker",
                mobile_phone: "",
                username: "Deleivery Worker",
              },
            },
          ],
          channel_name: "Deleivery Worker",
          photo_path: null,
          messages: [],
          id: "ch-" + response.data.recipient.id,
          mid: "ch-" + response.data.recipient.id,
        });
      }
      setIsChatOpen(true);
      setIsGettingChat(false);
    } catch (error) {
      // Don't handle error if it's an abort error
      if (error.name === "AbortError") {
        return;
      }

      EnableScroll();
      document.documentElement.scrollTop = 0;
      document.querySelector("#OrderDetails").scrollTop = 0;
      document.querySelector("#OrderDetails").classList.add("overflow-auto");
      document
        .querySelector("#OrderDetails")
        .classList.remove("overflow-hidden");
      setIsChatOpen(false);
      setIsGettingChat(false);
      setIsGettingChat(false);
    }
  };
  const ShowChats = () => {
    if (shouldShowChatIcon(ActivePacks) && ActivePacks?.order_status) {
      let arr = [];
      arr.push(ActivePacks.id);
      return arr.map((s) => {
        return (
          <OrderChatIcon
            key={s}
            isGettingChat={isGettingChat}
            setIsGettingChat={setIsGettingChat}
            getChatWithShipping={() => getChatWithShipping(s)}
            id={s}
          />
        );
      });
    }
  };
  const closeChat = () => {
    // Abort any ongoing chat request
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
      chatAbortControllerRef.current = null;
    }

    let params = new URLSearchParams(window.location.search);
    params.delete("order_id_chat");
    router.replace(`/${lang}/setting?${params.toString()}`, {
      scroll: false,
      // @ts-ignore
      shallow: true,
    });
    EnableScroll();
    setChatInfo(null);
    document.querySelector("#OrderDetails").classList.remove("overflow-hidden");
    document.querySelector("#OrderDetails").classList.add("overflow-auto");
    setIsChatOpen(false);
  };
  useEffect(() => {
    if (!selectedOrder?.order_group_id) {
      setIsExpanded(false);
      return;
    }
    // if (fetchedOrderIdRef.current === selectedOrder.order_group_id) return;
    fetchedOrderIdRef.current = selectedOrder.order_group_id;
    getOrderDetails();
  }, [selectedOrder?.order_group_id]);

  // Cleanup: abort any ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (chatAbortControllerRef.current) {
        chatAbortControllerRef.current.abort();
      }
    };
  }, []);
  const shouldShowRatingBadge = () => {
    if (
      ActivePacks.details.filter((s) => !s.comments || s.comments?.length === 0)
        .length === 0
    )
      return false;
    if (isExpanded) return false;
    if (ActivePacks?.order_status?.value === "delivered") return true;
    else return false;
  };
  if (!selectedOrder?.id) return null;

  return (
    <>
      {chatInfo && (
        <ChatWidget
          isOpen={isChatOpen}
          onClose={() => {
            closeChat();
          }}
        />
      )}
      <div className="flex-col h-[calc(128vh)]">
        <SettingTopBar
          goBack={() => {
            setIsExpanded(false);
            let params = new URLSearchParams(window.location.search);
            params.delete("id");
            params.delete("order_id_chat");
            // @ts-ignore
            router.replace(`/${lang}/setting?${params.toString()}`, {
              scroll: false,
              // @ts-ignore
              shallow: true,
            });
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
          hasChat={shouldShowChatIcon(ActivePacks)}
        />

        {loading || !ActivePacks?.order_status ? (
          <OrderDetailsSkeleton />
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
              {selectedOrder?.details?.[0]?.order_group_status && (
                <div className="flex-row justify-between items-center w-full mt-[8px]">
                  <OrderStatusCard
                    fullWidth={true}
                    status={selectedOrder?.details?.[0]?.order_group_status}
                  />
                </div>
              )}
              <div className="flex-row justify-center  items-center h-[50px] w-full bg-[#ececec] rounded-[20px]">
                {selectedOrder.details?.map((s, i) => (
                  <div
                    className={`${
                      s.id === ActivePacks.id
                        ? "bold border-[1px] border-[#402cdd]"
                        : "regular"
                    } text-[#1d1d1d] h-[50px] rounded-[20px]  cursor-pointer text-[12px] flex-1 px-[5px] items-center justify-center flex-row basis-0`}
                    key={i}
                    onClick={() => {
                      setActivePacks(s);
                    }}
                  >
                    <span className="mx-1 bold">{s.id}</span>
                    {translateFunction("Pack")}{" "}
                  </div>
                ))}
              </div>
              <div className="flex-row justify-between items-center w-full mt-[8px]">
                <OrderExpectedDeliveryCard
                  time={
                    selectedOrder?.details?.find(
                      (s) => s.id === ActivePacks?.id
                    )?.created_at
                  }
                />
                <OrderStatusCard
                  status={
                    selectedOrder?.details?.find(
                      (s) => s.id === ActivePacks?.id
                    )?.order_status
                  }
                />
              </div>
              <OrderAddressCard
                address={
                  selectedOrder?.details?.find((s) => s.id === ActivePacks?.id)
                    ?.shipping_address_data
                }
              />
            </div>
            {shouldShowRatingBadge() && <RateOrderButton />}
            <div className="flex flex-col justify-start  w-full bg-[#F8F8F8] px-[12px] h-full relative">
              <OrderItemsList
                getOrderDetails={() => {
                  getOrderDetails();
                }}
                shouldShowChat={() => shouldShowChatIcon(ActivePacks)}
                showChats={() => ShowChats()}
                order_group_status={
                  selectedOrder?.details?.find((s) => s.id === ActivePacks?.id)
                    ?.order_status
                }
                setExpanded={setIsExpanded}
                isExpanded={isExpanded}
                items={
                  selectedOrder?.details?.find((s) => s.id === ActivePacks?.id)
                    ?.details
                }
              />
              {isExpanded && (
                <OrderExpandedDetails
                  setShouldConfirmReturn={setShouldConfirmReturn}
                  getOrderDetails={() => getOrderDetails()}
                  order={selectedOrder?.details?.find(
                    (s) => s.id === ActivePacks?.id
                  )}
                />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default OrderDetails;
const OrderExpandedDetails = ({
  order,
  getOrderDetails,
  setShouldConfirmReturn,
}: {
  order: OrderItem;
  getOrderDetails: () => void;
  setShouldConfirmReturn: (e: any) => void;
}) => {
  const { currency, selectedOrder, setOrderOptions } = useAppStore();
  const [cancelling, setCancelling] = useState(false);
  const CancelReturnRequest = async () => {
    if (Array.isArray(isThereAReturnedProduct()))
      try {
        setCancelling(true);
        await Promise.all(
          // @ts-ignore
          isThereAReturnedProduct()?.map(async (s) => {
            await Order.CancelReturnRequest({
              return_request_id: s,
            });
          })
        );
        getOrderDetails();
        setCancelling(false);
      } catch (error) {
        setCancelling(false);
      }
  };
  const isThereAReturnedProduct = () => {
    let arr = [];
    selectedOrder.returned_data?.map((s) => {
      s.details?.order_details?.map((req) => {
        if (req.already_return) {
          arr.push(req?.return_request_id);
        }
      });
    });
    console.log(selectedOrder);
    if (arr.length > 0) return arr;
    return false;
  };
  const shouldShowConfirmReturn = () => {
    return (
      selectedOrder?.returned_data?.filter(
        (s) => s.details?.status === "draft return request"
      )?.length > 0 && isThereAReturnedProduct()
    );
  };
  const getProductWithReturn = (product) => {
    let return_item = order?.return_details?.details?.order_details?.find(
      (s) => s.detail_id === product.id
    ) ?? { already_return: false };
    return { ...product, return: return_item };
  };
  const confirmOrderReturn = async () => {
    try {
      setCancelling(true);
      await Promise.all(
        // @ts-ignore
        isThereAReturnedProduct()?.map(async (s) => {
          await Order.ConfirmReturnRequest({
            return_request_id: s,
          });
        })
      );

      setCancelling(false);
      getOrderDetails();
    } catch (error) {
      setCancelling(false);
    }
  };
  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";
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
          <div
            className={`flex flex-row items-end ${
              isRtl ? "flex-row-reverse" : " "
            }`}
          >
            <OrderStatusCartsIcon
              status={order?.order_group_status?.value}
              isRtl={isRtl}
            />
          </div>
          <span className="text-[#8D8D8D] regular text-[10px] mt-[5px] text-right">
            {translateFunction("Order Status")}
          </span>
          <div className="text-[#1D1D1D] flex-row text-[12px] regular mt-[3px]">
            <span>{order?.order_group_status?.label}</span>
            <span className="ml-[11px]">
              <OrderStatusIcon
                status={order?.order_group_status?.value}
                isRtl={isRtl}
              />
            </span>
          </div>
        </div>
      </div>
      <div className="flex-col w-full mt-[12px] pb-[50px]">
        {shouldShowConfirmReturn() && (
          <div
            className={`w-full h-[50px] mt-[31px] items-center justify-center  flex cursor-pointer ${"bg-[#402CDD] "} rounded-[15px] text-[16px] text-[#fff] medium`}
            onClick={() => {
              // confirmOrderReturn();
              setShouldConfirmReturn(true);
              setOrderOptions(true);
            }}
          >
            {cancelling ? (
              <Spinner />
            ) : (
              translateFunction("Confirm Returning Items")
            )}
          </div>
        )}
        {isThereAReturnedProduct() &&
          // order.edit_return_request &&
          (cancelling ? (
            <div
              className={`w-full h-[50px] mt-[31px] items-center justify-center  flex cursor-pointer ${"bg-[#fb7070] "} rounded-[15px] text-[16px] text-[#fff] medium`}
            >
              <Spinner />
            </div>
          ) : (
            <div
              className={`w-full h-[50px] mt-[31px] items-center justify-center  flex cursor-pointer ${"bg-[#fb7070] "} rounded-[15px] text-[16px] text-[#fff] medium cursor-pointer`}
              onClick={() => {
                CancelReturnRequest();
              }}
            >
              {translateFunction("Cancel Return Request")}
            </div>
          ))}
        {order.details.map((Product) => (
          <ProductCard
            status={order?.order_status}
            getOrderDetails={() => getOrderDetails()}
            product={getProductWithReturn(Product)}
            key={Product.id}
            order={order}
          />
        ))}
      </div>
    </div>
  );
};
const ProductCard = ({
  product,
  status,
  getOrderDetails,
  order,
}: ProductCardPropsType) => {
  const { currency, setSelectedOrderItem, ActivePacks } = useAppStore();
  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";
  return (
    <>
      <div className={`relative w-full flex-col`}>
        <span
          className="absolute top-[22px] right-[0px]"
          onClick={() => {
            DisableScroll();

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
          href={`/${lang}/products/${
            product.product_slug || product?.product_details?.slug
          }`}
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
              className="w-[104px] h-[144px] rounded-[15px] object-cover object-center"
              src={getConfiguredImage({
                src: GetImageUrl(product.image),
                width: 104,
                height: 144,
                q: 100,
              })}
              alt={product.product_details?.name}
            />
          </div>
          <div className="flex  flex-col items-start mt-[10px] ml-[12px] regular text-[12px] text-[#8D8D8D]">
            <span className="w-[70px] h-[10px] bg-[#C4C2C27f]"></span>
            <span className="text-[#505050] text-[12px] regular mt-[3px]">
              {product.product_details?.name}
            </span>
            <div className="flex-row justify-between w-full">
              {product?.variation?.[0]?.color && (
                <div className="flex-row">
                  <span className="text-[10px] regular">
                    {translateFunction("Color")}:
                  </span>
                  <span className="text-[#505050] text-[10px] medium ml-[2px]">
                    {product?.variation?.[0]?.color}
                  </span>
                </div>
              )}
              {product?.variation?.[0]?.Size && (
                <div className="flex-row ml-[40px]">
                  <span className="text-[10px] regular">
                    {translateFunction("Size")}:
                  </span>
                  <span className="text-[#505050] text-[10px] medium ml-[2px]">
                    {product?.variation?.[0]?.Size}
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
                  {product?.order_status ?? status?.label}
                </span>
                <span className="ml-[12px]">
                  <OrderStatusIcon
                    status={product?.order_status?.value ?? status?.value}
                    isRtl={isRtl}
                  />
                </span>
              </div>
            </div>
            {product.is_returned && (
              <div className="flex-row justify-between w-full mt-[6px]">
                <div className="flex-row">
                  <span className="text-[#FFB16F] text-[10px] medium ">
                    {translateFunction("Return Requested")}
                  </span>
                  <span className="ml-[12px]">
                    <ReturnedOrderStatusIcon
                      status={product?.order_status ?? status}
                    />
                  </span>
                </div>
              </div>
            )}
            {product.qty === 0 && (
              <div className="flex-row justify-between w-full mt-[6px]">
                <div className="flex-row">
                  <span className="text-[#505050] text-[10px] medium ">
                    {translateFunction("Canceled")}
                  </span>
                  <span className="ml-[12px]">
                    <CanceledOrderStatusIcon />
                  </span>
                </div>
              </div>
            )}
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
              {(product.is_canceled || product.is_returned) && (
                <div className="text-[#388CFF] text-[10px] regular ml-[7px]">
                  {translateFunction("Back to your wallet")}
                </div>
              )}
            </div>
          </div>
        </NextLink>

        {product.return.already_return &&
          (ActivePacks?.return_details ? (
            <OrderRetailsReturnInfo
              product={{
                ...product,
                return_status: ActivePacks.return_details?.details?.status,
              }}
              callback={() => {
                getOrderDetails();
              }}
              return_request_id={product?.return?.return_request_product_id}
            />
          ) : (
            <div
              className="underline text-[14px] text-[#5d5d5d] medium w-full text-center flex items-center justify-center p-2 cursor-pointer"
              onClick={() => {
                getOrderDetails();
              }}
            >
              {translateFunction("Failed To Load Return Details Try again")}
            </div>
          ))}
      </div>
    </>
  );
};
