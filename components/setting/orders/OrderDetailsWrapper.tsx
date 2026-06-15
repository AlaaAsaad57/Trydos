"use client";
import ChatWidget from "components/Chat/ChatWidget";
import { useEffect, useRef, useState } from "react";
import BackBar from "../BackBar";
import OrderDetailsSkeleton from "components/skeleton/loaders/OrderDetailsSkeleton";
import {
  OrderDateCard,
  OrderInvoiceCard,
  OrderNumberCard,
} from "components/settings/cards";
import OrderStatusCard from "components/settings/cards/OrderStatusCard";
import OrderExpectedDeliveryCard from "components/settings/cards/OrderExpectedDeliveryCard";
import OrderAddressCard from "components/settings/cards/OrderAddressCard";
import RateOrderButton from "components/settings/cards/RateOrderButton";
import OrderItemsList from "components/settings/cards/OrderItemsList";
import {
  getConfiguredImage,
  getUserChat,
  LogError,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import { DisableScroll, EnableScroll, GetImageUrl } from "utils/tinyUtils";
import NextLink from "components/global/NextLink";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAppStore } from "store";
import Spinner from "components/global/Spinner";
import OrderStatusIcon from "components/settings/cards/OrderStatusIcon";
import OrderStatusCartsIcon from "components/settings/cards/OrderStatusCartsIcon";
import {
  orderChatDetails,
  OrderInterface,
  OrderRatingData,
  returnDetails,
} from "utils/types/OrderInterface";
import Order from "services/order";
import { ORDER_MGMT_EVENTS, trackOrderMgmt } from "utils/orderFunnel";
import OrderChatIcon from "components/settings/OrderChatIcon";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import auth from "services/auth";
import OrderOptionsMenu from "./OrderOptionsMenu";
import OrderItemOptions from "./OrderItemOptions";
import OrderRetailsReturnInfo from "components/Orders/OrderRetailsReturnInfo";
import OrderItemReturnConfirmationWindow from "./confirmations/OrderItemReturnConfirmationWindow";
import { createPortal } from "react-dom";

function OrderDetailsWrapper({
  order_id,
  isRtl,
  local,
  order_group_id,
  order_chat_id,
}) {
  const [, language] = local.split("-");
  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInfo, setChatInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderInterface[]>([]);
  const [ActivePack, setActivePack] = useState<OrderInterface>(null);
  const [returnData, setReturnData] = useState<returnDetails | null>(null);
  const [ratingDetails, setRatingDetails] = useState<OrderRatingData[]>([]);
  const [isGettingChat, setIsGettingChat] = useState(false);
  const [shouldShowConfirmReturn, setShouldConfirmReturn] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<
    OrderInterface["details"][0] | null
  >(null);
  const [showOrderOptions, setShowOrderOption] =
    useState<OrderInterface | null>(null);
  // getOrderDetails re-runs on every post-action refresh; only count the first
  // load as a "details viewed".
  const hasTrackedView = useRef(false);
  const {
    setShouldUpdateOrders,
    shouldUpdateOrders,
    showNotificationIndicator,
    showNotificaionCircle,
    setShouldAuthinticated,
    setIsNavigating,
    openChat,
    user,
  } = useAppStore();

  const getOrderDetails = async () => {
    setLoading(true);
    try {
      let data: OrderInterface[] = await Order.getOrderDetails(order_group_id);

      // Ratings and return-details both depend only on `data`, not on each other —
      // fire them together. Each is guarded by its own condition (null when not
      // needed) so we never issue a fetch that isn't required.
      let shouldGetRatingValues = data.find(
        (order) => order?.order_status?.value === "delivered",
      );
      const ratingsPromise = shouldGetRatingValues
        ? fetchData({
            url: "/api/products/comments/order_rating",
            method: "POST",
            body: JSON.stringify({
              order_detail_ids: data.flatMap((order) =>
                order.details.map((d) => d.id),
              ),
              user_id: auth.UserID(),
            }),
            server: "local",
            reqTitle: REQUESTS_DATA.GET_ORDER_RATING,
          })
        : null;
      const returnPromise = data.filter((s) => s.return_request_id)?.length
        ? Order.GetReturnDetailsForOrderGroup({
            order_group_id: order_group_id,
          })
        : null;

      let order_item = data?.find(
        (order) =>
          String(order.id) === String(order_chat_id) ||
          String(order.return_request_id) === String(order_chat_id),
      );

      setOrderData(data);
      let active_order =
        data?.find((order) => String(order.id) === String(order_id)) ??
        data?.[0];

      setActivePack(active_order);

      if (!hasTrackedView.current && active_order) {
        hasTrackedView.current = true;
        trackOrderMgmt(ORDER_MGMT_EVENTS.ORDER_DETAILS_VIEWED, {
          order_id: active_order.id,
          order_group_id: active_order.order_group_id,
          order_status: active_order.order_status?.value,
          item_count: active_order.details?.length,
        });
      }

      const [order_ratings, returnRequests]: [any, any] = await Promise.all([
        ratingsPromise,
        returnPromise,
      ]);

      if (order_ratings) {
        let order_rating_data = order_ratings.data?.comments ?? [];
        setRatingDetails(order_rating_data);
      }

      if (returnRequests) {
        setReturnData(returnRequests);
      }

      if (
        order_chat_id &&
        (order_item?.order_status?.value === "out_for_delivery" ||
          returnRequests?.return_requests_data?.find(
            (return_item) =>
              String(return_item.order_id) === String(order_id) ||
              String(order_item?.return_request_id) === String(order_chat_id),
          )?.status?.value === "out_for_return")
      ) {
        safeGetChatWithShipping({
          is_return: order_item?.return_request_id,
          order_id: order_item?.return_request_id,
          parent_order_id: order_item?.id,
        });
      }
      setShouldUpdateOrders(0);
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In getOrderDetails in OrderDetailsWrapper",
      });
      setShouldUpdateOrders(0);
    }

    setLoading(false);
  };
  useEffect(() => {
    if (shouldUpdateOrders > 0) {
      getOrderDetails();
    }
  }, [shouldUpdateOrders]);
  useEffect(() => {
    getOrderDetails();
  }, []);
  const getProductUrl = (product) => {
    let pathname = `/${local}/products/${
      product.product_slug || product?.product_details?.slug
    }`;
    if (product.variation?.length > 0) {
      let newParams = new URLSearchParams();
      if (
        product?.variation?.find((s) => s.id === product?.product_variation_id)
          ?.color?.name
      ) {
        newParams.set(
          "color",
          product?.variation?.find(
            (s) => s.id === product?.product_variation_id,
          )?.color?.name,
        );
      }
      if (
        product?.variation?.find((s) => s.id === product?.product_variation_id)
          ?.size
      ) {
        newParams.set(
          "size",
          product?.variation?.find(
            (s) => s.id === product?.product_variation_id,
          )?.size,
        );
      }

      return pathname + `?${newParams?.toString()}`;
    }
    return pathname;
  };
  const shouldShowRatingBadge = () => {
    if (ActivePack?.order_status?.value === "delivered") return true;
    else return false;
  };
  const router = useRouter();
  const pathname = usePathname();

  const handleClear = () => {
    // This replaces the URL with just the path, effectively deleting params
    router.replace(pathname);
  };
  const shouldShowChatIcon = (pack) => {
    // Out for Delivery
    if (pack && pack?.order_status?.value === "out_for_delivery")
      return ActivePack?.id;
    if (
      returnData?.return_requests_data?.find(
        (s) => s.order_id === ActivePack.id,
      )?.status?.value === "out_for_return"
    ) {
      return ActivePack?.return_request_id;
    }
    return false;
  };
  const getChatWithShipping = async ({
    order_id,
    parent_order_id,
    is_return,
  }) => {
    setIsGettingChat(true);
    showNotificationIndicator([
      ...showNotificaionCircle?.filter(
        (s) =>
          s?.order_id !== shouldShowChatIcon(ActivePack) &&
          s?.order_group_id !== order_group_id,
      ),
    ]);
    try {
      let response: orderChatDetails = await fetchData({
        url: "/api/v1/channels/orderChatParticipant/get-recipient",
        reqTitle: REQUESTS_DATA.GET_CHAT_WITH_DELEIVERY,
        method: "POST",
        server: "chat",
        body: JSON.stringify({
          original_user_id: auth.UserID(),
          order_id: order_id,
          ...(is_return ? { parent_order_id: parent_order_id } : {}),
        }),
      });
      if (
        !response.success ||
        (!response?.data?.channel && !response.data?.recipient)
      ) {
        throw new Error(response.message);
      }
      DisableScroll();
      if (response.data.channel) {
        let chat = {
          ...response.data.channel,
          order_chat_participant_id: response?.data.chat_participant?.id,
          channel_members: response.data.channel.channel_members.map((s) =>
            String(s.user_id) === String(getUserChat()?.id)
              ? s
              : {
                  ...s,
                  user: { ...s.user, name: "Deleivery Worker", phone: "" },
                },
          ),
          messages:
            response.data.channel.messages?.sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime(),
            ) || [],
        };
        setChatInfo(chat);
        openChat(chat);
        setIsNavigating(false);
      } else {
        let chat = {
          order_chat_participant_id: response?.data.chat_participant?.id,
          id: `ch-${response?.data.chat_participant?.id}`,
          channel_members: [
            {
              ...getUserChat(),
              user: getUserChat(),
              user_id: getUserChat()?.id,
            },
            {
              user_id: response?.data?.recipient?.id,
              name: "Deleivery Worker",
              phone: "",
              user: {
                id: response?.data.recipient?.id,
                name: "Deleivery Worker",
                phone: "",
              },
            },
          ],
          messages: [],
        };

        setChatInfo(chat);
        openChat(chat);
        setIsNavigating(false);
      }
      setIsChatOpen(true);
      setIsGettingChat(false);
      handleClear();
    } catch (error) {
      // Don't handle error if it's an abort error
      if (error.name === "AbortError") {
        return;
      }
      LogError({
        error: error,
        scenario: "Error In getChatWithShipping in OrderDetailsWrapper",
      });
      setIsGettingChat(false);

      EnableScroll();
    }
  };

  const safeGetChatWithShipping = async ({
    order_id,
    parent_order_id,
    is_return,
  }) => {
    await getChatWithShipping({
      order_id,
      parent_order_id,
      is_return,
    });
  };
  const ShowChats = () => {
    if (shouldShowChatIcon(ActivePack) && ActivePack?.order_status) {
      let arr = [];
      arr.push(ActivePack?.id);
      return arr.map((s) => {
        return (
          <OrderChatIcon
            order_group_id={order_group_id}
            key={s}
            isGettingChat={isGettingChat}
            setIsGettingChat={setIsGettingChat}
            getChatWithShipping={() => {
              safeGetChatWithShipping({
                order_id: ActivePack?.return_request_id ?? ActivePack?.id,
                parent_order_id: ActivePack?.id,
                is_return: ActivePack?.return_request_id,
              });
            }}
            id={shouldShowChatIcon(ActivePack)}
          />
        );
      });
    }
  };
  

const IsThereADescriptionMessage = () => {
  let descriptions = [];
  if(!returnData) return descriptions;
  returnData?.return_requests_data?.forEach((item) => {
    if (!item || typeof item !== "object") return;

    Object.entries(item).forEach(([key, value]) => {
      if (
        key.toLowerCase().includes("description") &&
        typeof value === "string"
      ) {
        descriptions.push(value);
      }
    });
  });

  return descriptions;
};
const isNotDraft=()=>{

  let ActiveOrder=returnData?.return_requests_data?.find((s)=>s.order_id===ActivePack.id);
  if(!ActiveOrder)
  return false;
    let bool=  ActiveOrder?.status?.name?.includes("draft");
    return !bool;
  
}
  return (
    <>
      {shouldShowConfirmReturn &&
        createPortal(
          <>
            <div
              className="fixed top-0   left-0 min-w-screen z-99999999998 min-h-screen opacity-40 bg-[black]"
              onClick={() => {
                setShouldConfirmReturn(false);
              }}
            />

            <OrderItemReturnConfirmationWindow
              callback={async () => {
                await getOrderDetails();
                setShouldConfirmReturn(null);
                setSelectedOrderItem(null);
              }}
              close={() => {
                setShouldConfirmReturn(null);
              }}
              confirmationData={shouldShowConfirmReturn}
              orderData={orderData}
              orderItem={ActivePack}
              returnDetails={returnData}
              setShouldConfirmReturn={setShouldConfirmReturn}
            />
          </>,
          document.body,
        )}
      {chatInfo && (
        <ChatWidget
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
          }}
        />
      )}
      {showOrderOptions && (
        <OrderOptionsMenu
          update={async () => await getOrderDetails()}
          isRtl={isRtl}
          order={showOrderOptions}
          close={() => {
            setShowOrderOption(null);
          }}
        />
      )}
      {selectedOrderItem && (
        <OrderItemOptions
          orderData={orderData}
          shouldShowConfirmReturn={shouldShowConfirmReturn}
          setShouldConfirmReturn={setShouldConfirmReturn}
          close={() => setSelectedOrderItem(null)}
          isRtl={isRtl}
          orderItem={selectedOrderItem}
          parentOrder={ActivePack}
          returnDetails={returnData}
          setActivePack={setActivePack}
          update={async () => await getOrderDetails()}
        />
      )}
      <div
        className="flex-col w-full max-h-full setting-screen"
        key="order-details-setting-page"
      >
        <BackBar
          isRtl={isRtl}
          local={local}
          DataCy="order-details-screen"
          name={translateFunction("Orders Details", language)}
          Icon={"/icons/OrderDetailsIcon.svg"}
          options={() => {

            if (ActivePack) setShowOrderOption(ActivePack);
          }}
          onBackIntercept={() => {
            if (isExpanded) {
              setIsExpanded(false);
              return true;
            }
            return false;
          }}
          preivous_page={`/${local}/settings/orders`}
        />
        {loading ? (
          <OrderDetailsSkeleton />
        ) : (
          <>
            <div className="flex flex-col max-h-full overflow-y-auto">
              <div
                className={`pt-[12px] px-[12px] ${
                  isExpanded && "h-0 pt-0 overflow-hidden"
                } flex-col justify-start  w-full bg-[#F8F8F8] `}
              >
                <div
                  className="flex-row justify-between items-center w-full"
                  style={{
                    direction: isRtl ? "rtl" : "ltr",
                  }}
                >
                  <OrderNumberCard number={ActivePack?.order_group_id} />
                  <OrderDateCard time={ActivePack?.created_at} />
                  <OrderInvoiceCard
                    amount={ActivePack?.order_amount}
                    payments={ActivePack?.payment_method}
                  />
                </div>
                {ActivePack.order_group_status && (
                  <div
                    className="flex-row justify-between items-center w-full mt-[8px]"
                    style={{
                      direction: isRtl ? "rtl" : "ltr",
                    }}
                  >
                    <OrderStatusCard
                      contact_person_name={
                        ActivePack?.shipping_address_data?.contact_person_name
                      }
                      fullWidth={true}
                      status={ActivePack?.order_group_status}
                    />
                  </div>
                )}
                <div className="flex-row justify-center  items-center h-[50px] w-full bg-[#ececec] rounded-[20px]">
                  {orderData?.map((s, i) => (
                    <div
                      className={`${
                        s.id === ActivePack?.id
                          ? "bold border border-[#402cdd]"
                          : "regular"
                      } text-[#1d1d1d] h-[50px] rounded-[20px]  cursor-pointer text-[12px] flex-1 px-[5px] items-center justify-center flex-row basis-0`}
                      key={i}
                      onClick={() => {
                        setActivePack(s);
                      }}
                    >
                      <span className="mx-1 bold">{s.id}</span>
                      {translateFunction("Pack")}{" "}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    direction: isRtl ? "rtl" : "ltr",
                  }}
                  className="flex-row justify-between items-center w-full mt-[8px]"
                >
                  <OrderExpectedDeliveryCard
                    status={ActivePack.order_status.value}
                    time={ActivePack.created_at}
                    productsShippingDays={ActivePack?.details?.map(
                      (item) => item?.product_details?.shipping_days,
                    )}
                  />
                  <OrderStatusCard
                    fullWidth={false}
                    contact_person_name={
                      ActivePack?.shipping_address_data?.contact_person_name
                    }
                    status={ActivePack.order_status}
                  />
                </div>
                {!shouldShowRatingBadge() && (
                  <OrderAddressCard
                    address={ActivePack?.shipping_address_data}
                  />
                )}
              </div>
              {shouldShowRatingBadge() && !isExpanded && (
                <RateOrderButton setExpanded={() => setIsExpanded(false)} />
              )}
              <div className="flex flex-col justify-start  w-full bg-[#F8F8F8] px-[12px] h-full relative">
                <OrderItemsList
                  order_status={ActivePack.order_status}
                  owner_id={ActivePack.owner_id}
                  owner_type={ActivePack.owner_type}
                  getProductComment={(product_id, order_detail_id) => {
                    return ratingDetails?.find(
                      (s) =>
                        String(s.product_id) === String(product_id) &&
                        String(s?.order_details_id) === String(order_detail_id),
                    );
                  }}
                  getOrderDetails={() => {
                    getOrderDetails();
                  }}
                  getProductUrl={(e) => getProductUrl(e)}
                  shouldShowChat={() => shouldShowChatIcon(ActivePack)}
                  showChats={() => ShowChats()}
                  order_group_status={ActivePack.order_status}
                  setExpanded={setIsExpanded}
                  isExpanded={isExpanded}
                  items={ActivePack?.details || []}
                />
               {/* {isNotDraft()&& isExpanded&&IsThereADescriptionMessage()?.length>0? 
               <div className="p-2 flex flex-col items-center gap-3">
              {IsThereADescriptionMessage().map((message, index) => (
                <div
                  key={index}
                  className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-amber-500">
                      ⚠️
                    </div>
                    <div>

                      <p className="text-sm text-amber-700">
                       <div dangerouslySetInnerHTML={{__html:message}}>

                       </div>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>:<></>} */}
                {isExpanded && (
                  <OrderExpandedDetails
                    orderData={orderData}
                    returnDetails={returnData}
                    setSelectedOrderItem={setSelectedOrderItem}
                    getProductUrl={(e) => getProductUrl(e)}
                    setShouldConfirmReturn={setShouldConfirmReturn}
                    getOrderDetails={() => getOrderDetails()}
                    order={ActivePack}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default OrderDetailsWrapper;

const OrderExpandedDetails = ({
  order,
  orderData,
  getOrderDetails,
  setShouldConfirmReturn,
  returnDetails,
  getProductUrl,
  setSelectedOrderItem,
}: {
  order: OrderInterface;
  orderData: OrderInterface[];
  getOrderDetails: () => void;
  setShouldConfirmReturn: (e: any) => void;
  returnDetails: returnDetails;
  getProductUrl: any;
  setSelectedOrderItem: any;
}) => {
  const { currency, user, settings } = useAppStore();

  const getSafeNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const orderMaxShippingDays = (order?.details || []).reduce(
    (maxDays, detail) =>
      Math.max(maxDays, getSafeNumber(detail?.product_details?.shipping_days)),
    0,
  );

  const shippingDurationFromSettings = getSafeNumber(
    settings?.["starting_setting"]?.shipping_duration_days,
  );

  const expectedWorkDays = orderMaxShippingDays + shippingDurationFromSettings;

  const baseDate = order?.created_at ? new Date(order.created_at) : new Date();
  const safeBaseDate = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
  const expectedDate = new Date(
    safeBaseDate.getTime() + expectedWorkDays * 24 * 60 * 60 * 1000,
  );

  const [cancelling, setCancelling] = useState(false);
  const CancelReturnRequest = async () => {
    try {
      if (Array.isArray(isThereAReturnedProductForCancel())) {
        setCancelling(true);
        await Order.CancelReturnRequest({
          return_request_id: isThereAReturnedProductForCancel(),
        });
        getOrderDetails();
        setCancelling(false);
      }
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In CancelReturnRequest in OrderDetailsWrapper",
      });
      setCancelling(false);
    }
  };
  const isAllPreventEdit = () => {
    return (
      orderData?.filter((s) => s.edit_return_request === false)?.length ===
      orderData?.length
    );
  };

  const isThereAReturnedProduct = () => {
    let arr = [];
    if (isAllPreventEdit()) return false;
    returnDetails.return_requests_data.map((s) => {
      s.order_details.map((d) => {
        if (d.already_return && d.return_request_id) {
          arr.push(d.return_request_id);
        }
      });
    });
    let set = new Set(arr);
    arr = [...set];
    if (arr.length > 0) return arr;
    return false;
  };
  const isThereAReturnedProductForCancel = () => {
    let arr = [];
    returnDetails.return_requests_data.map((s) => {
      s.order_details.map((d) => {
        if (d.return_request_id) {
          arr.push(d.return_request_id);
        }
      });
    });
    let set = new Set(arr);
    arr = [...set];
    if (arr.length > 0) return arr;
    return false;
  };
  const shouldShowConfirmReturn = () => {
    return (
      returnDetails?.return_requests_data?.filter(
        (s) =>
          s?.status?.value === null &&
          s.order_details.find((d) => d.already_return),
      )?.length > 0 && isThereAReturnedProduct()
    );
  };
  const shouldShowCancelReturn = () => {
    return (
      order?.edit_return_request &&
      order.order_has_return_request &&
      returnDetails?.return_requests_data?.find((s) => s.order_id === order.id)
        ?.status?.value !== "cancelled"
    );
  };

  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      className="bg-white mt-[20px] rounded-[10px] w-full h-auto p-[12px] flex-col flex items-start"
      style={{
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      <span className="w-[70px] h-[10px] bg-[#C4C2C27f]"></span>
      <div className="flex-row justify-between items-center w-full">
        <div className="flex text-[#505050] regular text-[12px] mt-[5px] items-center">
          {translateFunction("Buying")}{" "}
          <span className="bold mx-[2px]"> {order?.details?.length}</span>{" "}
          {translateFunction("Items")} .{" "}
          <span className="bold mx-[2px]">
            {RoundPrice({
              num: order.order_amount,
              language: language,
              returnNumber: true,
            })}{" "}
            {currency?.symbol}
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
          <span
            style={{
              direction: isRtl ? "rtl" : "ltr",
            }}
            className="text-[#1D1D1D] flex flex-row text-[12px] regular mt-[3px] gap-[3px]"
          >
            <span>
              {expectedDate.toLocaleDateString(language || "en-US", {
                weekday: "long",
              })}
            </span>
            <span className="bold text-[#1D1D1D] text-[12px]  mx-px">
              {expectedDate.toLocaleDateString(language || "en-US", {
                day: "numeric",
                month: "short",
              })}
            </span>
            <span>
              | {expectedWorkDays} {translateFunction("Work Days")}
            </span>
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
          <div className="text-[#1D1D1D] flex-row text-[12px] regular mt-[3px] gap-[6px] items-center flex">
            <span>{order?.order_group_status?.label}</span>

            <OrderStatusIcon
              status={order?.order_group_status?.value}
              isRtl={isRtl}
            />
          </div>
        </div>
      </div>
      <div className="flex-col w-full mt-[12px] pb-[50px] items-center justify-center">
        {shouldShowCancelReturn() &&
          // order.edit_return_request &&
          (cancelling ? (
            <div
              className={` h-[50px] mt-[31px] items-center justify-center  flex cursor-pointer ${"bg-white "} rounded-[15px] text-[16px] text-[#fb7070] medium`}
            >
              <Spinner />
            </div>
          ) : (
            <div
              className={`flex-row mt-[11px] items-center justify-center underline text-[#fb7070] text-[12px] regular cursor-pointer`}
              onClick={() => {
                CancelReturnRequest();
              }}
            >
              {translateFunction("Cancel Return Request")}
            </div>
          ))}
        {shouldShowConfirmReturn() && (
          <div
            className={` underline h-[30px] mt-[31px] items-center justify-center  flex cursor-pointer bg-white  rounded-[15px] text-[12px] text-green-500 medium`}
            onClick={() => {
              setSelectedOrderItem();
              setShouldConfirmReturn(true);
            }}
          >
            {cancelling ? (
              <Spinner />
            ) : (
              translateFunction("Confirm Return Request")
            )}
          </div>
        )}
        {order.details.map((Product) => (
          <ProductCard
            returnDetails={returnDetails}
            setSelectedOrderItem={setSelectedOrderItem}
            getProductUrl={(e) => getProductUrl(e)}
            status={order?.order_status}
            product={Product}
            key={Product.id}
            order={order}
            getOrderDetails={getOrderDetails}
          />
        ))}
      </div>
    </div>
  );
};
const ProductCard = ({
  product,
  status,
  returnDetails,
  order,
  getProductUrl,
  setSelectedOrderItem,
  getOrderDetails,
}: {
  product: OrderInterface["details"][0];
  order: OrderInterface;
  returnDetails: returnDetails;
  [key: string]: any;
  setSelectedOrderItem: (e: any) => void;
}) => {
  type ReturnItem =
    (typeof returnDetails)["return_requests_data"][number]["order_details"][number];

  // 2. The function return type is the product AND the return item merged
  const getProductWithReturn = (
    product: OrderInterface["details"][0],
  ): OrderInterface["details"][0] & Partial<ReturnItem> => {
    const return_item = returnDetails?.return_requests_data
      ?.find((s) => s.order_id === order.id)
      ?.order_details?.find((s) => s.detail_id === product.id);

    return {
      ...product,
      already_return: false, // ensures the flag exists
      ...return_item,
    };
  };
  const { currency } = useAppStore();
  const { lang } = useParams();
  // @ts-ignore
  const language = lang.split("-")[1];
  const isRtl = language === "ar" || language === "ku";

  // A returned item (whose return request is past the "draft" stage) should
  // surface the returned quantity beside its "Item: qty" line. Draft returns
  // are still being composed by the user and aren't shown — same draft check
  // used in OrderItemReturnConfirmationWindow.
  const productReturnInfo = getProductWithReturn(product);
  const returnRequestStatus = returnDetails?.return_requests_data?.find(
    (s) => s.order_id === order.id,
  )?.status;
  const returnedQty = Number(
    productReturnInfo?.return_request_product_quantity,
  );
  const showReturnedQty =
    productReturnInfo?.already_return &&
    !!returnRequestStatus?.value &&
    !returnRequestStatus?.name?.toLowerCase()?.includes("draft") &&
    returnedQty > 0;

  return (
    <>
      <div className={`relative w-full flex-col`}>
        <span
          className="absolute top-[22px]  p-5 cursor-pointer"
          style={{
            right: isRtl ? "initial" : "0px",
            left: isRtl ? "0px" : "initial",
          }}
          data-cy="order-item-options"
          onClick={() => {
            DisableScroll();
            setSelectedOrderItem(product);
          }}
        >
          <img className="w-[20px] h-[20px]" src="/icons/OptionsIcon.svg" />
        </span>

        <NextLink
          href={getProductUrl(product)}
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
                q: 70,
              })}
              alt={product.product_details?.name}
            />
          </div>
          <div className="flex  flex-col items-start mt-[10px] mx-[12px] regular text-[12px] text-[#8D8D8D]">
            <span className="w-[70px] h-[10px] bg-[#C4C2C27f]"></span>
            <span className="text-[#505050] text-[12px] regular mt-[3px] pr-[20px]">
              {product.product_details?.name}
            </span>
            <div className="flex-row justify-between w-full gap-[40px]">
              {product?.variation?.find(
                (s) => s.id === product?.product_variation_id,
              )?.color?.name && (
                <div className="flex-row">
                  <span className="text-[10px] regular">
                    {translateFunction("Color")}:
                  </span>
                  <span className="text-[#505050] text-[10px] medium mx-[2px]">
                    {
                      product?.variation?.find(
                        (s) => s.id === product?.product_variation_id,
                      )?.color?.name
                    }
                  </span>
                </div>
              )}
              {product?.variation?.find(
                (s) => s.id === product?.product_variation_id,
              )?.size && (
                <div className="flex-row">
                  <span className="text-[10px] regular">
                    {translateFunction("Size")}:
                  </span>
                  <span className="text-[#505050] text-[10px] medium mx-[2px]">
                    {
                      product?.variation?.find(
                        (s) => s.id === product?.product_variation_id,
                      )?.size
                    }
                  </span>
                </div>
              )}
            </div>
            <div className="flex-row justify-between w-full">
              <div className="flex-row">
                <span className="text-[10px] regular">
                  {translateFunction("Composed Of")}:
                </span>
                <span className="text-[#505050] text-[10px] medium mx-[2px]">
                  {product?.product_details?.count_of_pieces}{" "}
                  {translateFunction("Pieces")}
                </span>
              </div>

              <div className="flex-row items-center mx-[40px]">
                <span className="text-[10px] regular">
                  {translateFunction("Item")}:
                </span>
                <span className="text-[#505050] text-[10px] medium mx-[2px]">
                  {product?.qty?.toFixed(1)}
                </span>
                {showReturnedQty && (
                  <span className="bg-[#FFF3C4] text-[#946C00] text-[9px] medium rounded-[6px] px-[5px] py-[1px] mx-[4px] whitespace-nowrap">
                    {translateFunction("Returned")}: {returnedQty}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-row justify-between w-full">
              <div className="flex-row">
                <span className="text-[10px] regular">
                  {translateFunction("Item Status")}:
                </span>
                <span className="text-[#505050] text-[10px] medium mx-[2px]">
                  {order?.order_status.label ?? status?.label}
                </span>
                <span className="mx-[12px]">
                  <OrderStatusIcon
                    status={order?.order_status?.value ?? status?.value}
                    isRtl={isRtl}
                  />
                </span>
              </div>
            </div>
            {/* {product.is_returned && (
              <div className="flex-row justify-between w-full mt-[6px]">
                <div className="flex-row">
                  <span className="text-[#FFB16F] text-[10px] medium ">
                    {translateFunction("Return Requested")}
                  </span>
                  <span className="mx-[12px]">
                    <img
                      className="w-[13px] h-[13px]"
                      src="/icons/ReturnedOrderStatusIcon.svg"
                    />
                  </span>
                </div>
              </div>
            )} */}
            {product.qty === 0 && (
              <div className="flex-row justify-between w-full mt-[6px]">
                <div className="flex-row">
                  <span className="text-[#505050] text-[10px] medium ">
                    {translateFunction("Canceled")}
                  </span>
                  <span className="mx-[12px]">
                    <img
                      className="w-[13px] h-[13px]"
                      src="/icons/CanceledOrderStatusIcon.svg"
                    />
                  </span>
                </div>
              </div>
            )}
            <div className="flex-row  items-center gap-[5px]">
              {product.offer_price >= 0 && (
                <div
                  className="line-through text-[#C4C2C2] regular text-[12px]  line-through-[#C4C2C2]"
                  data-cy="order-product-offer-price"
                >
                  {/* {RoundPrice({ num: product.price, language: language })} */}
                  {RoundPrice({
                    num: product?.price,
                    language: language,
                    returnNumber: true,
                  })}
                </div>
              )}
              <div
                className="text-[#1D1D1D] text-[12px] bold"
                data-cy="order-product-price"
              >
                {/* {RoundPrice({
                  num: product.price_after_discount,
                  language: language,
                })} */}
                {RoundPrice({
                  num: product?.offer_price,
                  language: language,
                  returnNumber: true,
                })}
              </div>
              <span className="text-[#1D1D1D] light text-[10px] ">
                {currency?.symbol}
              </span>
              {product.qty === 0 /*|| product.is_returned*/ &&
                // COD orders are never paid up-front, so a cancellation has
                // nothing to refund to the wallet — hide the badge for them.
                order?.payment_method?.value?.toLowerCase() !==
                  "cash_on_delivery" && (
                  <div className="text-[#388CFF] text-[10px] regular mx-[7px]">
                    {translateFunction("Back to your wallet")}
                  </div>
                )}
            </div>
          </div>
        </NextLink>

        {getProductWithReturn(product).already_return &&
          (returnDetails ? (
            <OrderRetailsReturnInfo
              product={{
                ...product,
                return_status: returnDetails.return_requests_data.find(
                  (s) => s.order_id === order.id,
                )?.status,
              }}
              price={RoundPrice({
                num:
                  (product?.offer_price / product?.qty) *
                  Number(
                    getProductWithReturn(product)
                      ?.return_request_product_quantity,
                  ),
                language: language,
                returnNumber: true,
              })}
              callback={() => {
                getOrderDetails();
              }}
              return_request_id={
                getProductWithReturn(product)?.return_request_product_id
              }
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
