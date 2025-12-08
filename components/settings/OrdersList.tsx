import React, { useEffect, useState, useRef } from "react";
import SettingTopBar from "./TopBar";
import SearchHistoryIcon from "public/svg/SearchHistoryIcon";
import {
  OrderItem as OrderItemType,
  OrderDetail,
  OrdersResponse,
} from "../../types/orders";
import { fetchOrders } from "../../services/orders";
import OrderItem from "../Orders/OrderItem"; // Assuming OrderItem component exists and can be reused
import { translateFunction } from "utils/functions"; // Assuming translateFunction exists
import { useAppStore } from "store";
import { useParams, useRouter } from "next/navigation";
import { OrdersListPropsType } from "models/componentType/settingTypes/OrdersListPropsType";
import OrderSkeletons from "./OrderSkeletons";
import { COOKIE_NAMES, getCookie } from "utils/cookies/cookie-manager";

// Helper function to get status display name (replace with actual logic if needed)

function OrdersList({
  swipeToScreen,
  goBack,
  setSelectedOrder,
}: OrdersListPropsType) {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [orders, setOrders] = useState<OrderItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const statusSliderRef = useRef<HTMLDivElement>(null); // Ref for the status slider

  const router = useRouter();
  const reqRef = useRef(null);
  // Function to load orders
  const loadMoreOrders = async (
    reset = false,
    status: string | null = null
  ) => {
    if (loading || (!hasMore && !reset)) return;
    if (reqRef.current) return;
    setLoading(true);
    const currentPage = reset ? 1 : page;
    if (reset) {
      setOrders([]);
    }
    try {
      // TODO: Modify fetchOrders or backend to accept selectedStatus for filtering
      reqRef.current = true;
      const response: OrdersResponse = await fetchOrders(
        currentPage,
        20,
        status === "all" ? null : status
      );
      if (
        response.isSuccessful &&
        response.hasContent &&
        response.data.orders.length > 0
      ) {
        // Group orders by order_group_id - only use the new response data
        const groupedOrders = response.data.orders.reduce(
          (acc: { [key: string]: OrderItemType[] }, curr: OrderItemType) => {
            const groupId = curr.order_group_id;
            if (!acc[groupId]) {
              acc[groupId] = [];
            }
            acc[groupId].push(curr);
            return acc;
          },
          {}
        );

        // Merge orders with the same order_group_id
        const mergedResponseOrders = Object.values(groupedOrders).map(
          (groupOrders: OrderItemType[]) => {
            if (groupOrders.length === 1) {
              return groupOrders[0];
            }

            // Use the first order as the base
            const baseOrder = { ...groupOrders[0] };

            // Merge details and sum order_amount for all orders in the group
            baseOrder.details = groupOrders.reduce(
              (allDetails: OrderDetail[], order: OrderItemType) => [
                ...allDetails,
                ...order.details.map((detail) => ({
                  ...detail,
                  order_status: baseOrder.order_status?.value,
                  order_id: baseOrder.id,
                  original_order_id: detail.order_id,
                })),
              ],
              []
            );

            // Sum order_amount from all orders in the group
            baseOrder.order_amount = groupOrders.reduce(
              (sum, order) => sum + order.order_amount,
              0
            );

            return baseOrder;
          }
        );

        if (reset) {
          // Fresh filter – drop any previously loaded orders
          setOrders(mergedResponseOrders);
        } else {
          // Infinite-scroll / pagination — merge with existing state
          const existingOrdersMap = orders.reduce<
            Record<string, OrderItemType>
          >((acc, order) => {
            acc[order.order_group_id] = order;
            return acc;
          }, {} as Record<string, OrderItemType>);

          const newOrdersMap = mergedResponseOrders.reduce<
            Record<string, OrderItemType>
          >((acc, order) => {
            acc[order.order_group_id] = order;
            return acc;
          }, {} as Record<string, OrderItemType>);

          const finalOrders = Object.values({
            ...existingOrdersMap,
            ...newOrdersMap,
          });

          setOrders(finalOrders);
        }
        setHasMore(response.data.orders.length > 0); // Check if more orders were fetched
        setPage(currentPage + 1);
      } else {
        if (reset) setOrders([]); // Clear orders if reset and no data
        setHasMore(false);
      }
      reqRef.current = null;
      setShouldUpdateOrders(0);
    } catch (error) {
      reqRef.current = null;
      setShouldUpdateOrders(0);
      console.error("Error loading orders:", error);
      if (reset) setOrders([]);
      setHasMore(false); // Stop trying if error occurs
    } finally {
      setLoading(false);
    }
  };
  const {
    settings,
    selectedOrder,
    shouldUpdateOrders,
    setShouldUpdateOrders,
    setLoginOpen,
  } = useAppStore();

  // Initial load and load on status change
  useEffect(() => {
    setOrders([]); // Reset orders when status changes
    setPage(1); // Reset page count
    setHasMore(true); // Assume there are more orders initially
    loadMoreOrders(true, selectedStatus); // Load first page for the new status
  }, [selectedStatus]); // Dependency on selectedStatus
  useEffect(() => {
    if (shouldUpdateOrders > 0) {
      setOrders([]); // Reset orders when status changes
      setPage(1); // Reset page count
      setHasMore(true); // Assume there are more orders initially
      loadMoreOrders(true, selectedStatus); // Load first page for the new status
    }
  }, [shouldUpdateOrders]);
  // Scroll handler for infinite loading
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const scrollThreshold = 50; // Pixels from bottom

      if (
        scrollHeight - scrollTop - clientHeight < scrollThreshold &&
        !loading &&
        hasMore
      ) {
        loadMoreOrders(false, selectedStatus);
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, selectedStatus]); // Dependencies for the scroll listener

  // Mouse drag effect for status slider
  useEffect(() => {
    const slider = statusSliderRef.current;
    if (!slider) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      slider.classList.add("active"); // Add visual feedback if needed
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
      slider.style.cursor = "grabbing"; // Change cursor on drag
    };

    const handleMouseLeave = () => {
      if (!isDown) return;
      isDown = false;
      slider.classList.remove("active");
      slider.style.cursor = "grab"; // Reset cursor
    };

    const handleMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      slider.classList.remove("active");
      slider.style.cursor = "grab"; // Reset cursor
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2; // Adjust scroll speed factor if needed
      slider.scrollLeft = scrollLeft - walk;
    };

    slider.style.cursor = "grab"; // Initial cursor
    slider.addEventListener("mousedown", handleMouseDown);
    slider.addEventListener("mouseleave", handleMouseLeave);
    slider.addEventListener("mouseup", handleMouseUp);
    slider.addEventListener("mousemove", handleMouseMove);

    // Cleanup
    return () => {
      slider.removeEventListener("mousedown", handleMouseDown);
      slider.removeEventListener("mouseleave", handleMouseLeave);
      slider.removeEventListener("mouseup", handleMouseUp);
      slider.removeEventListener("mousemove", handleMouseMove);
    };
  }, []); // Run only once on mount
  const { lang } = useParams();
  const [, language] = (lang as string).split("-");
  useEffect(() => {
    const { setIsNavigating } = useAppStore.getState();
    setIsNavigating(null);
  }, [orders]);
  useEffect(() => {
    if (!selectedOrder) {
      setOrders([]); // Reset orders when status changes
      setPage(1); // Reset page count
      setHasMore(true); // Assume there are more orders initially
      loadMoreOrders(true, selectedStatus);
    }
  }, [selectedOrder]);
  useEffect(() => {
    const user: any = getCookie(COOKIE_NAMES.USER_DATA);

    if (user?.phone === "0" || !user) {
      setLoginOpen(true);
      goBack();
    }
  }, []);
  const isRtl = language === "ar" || language === "ku";

  return (
    <div className="flex-col max-h-full">
      <SettingTopBar
        goBack={() => {
          router.replace(`/${lang}/setting?tab=Orders`);
          goBack();
        }}
        screenName={
          <div className="flex-row items-stretch">
            <OrdersIcon />
            <span className="text-[#1D1D1D] text-[14px] medium mx-[4px]">
              {translateFunction("Orders")}
            </span>
          </div>
        }
        DataCy="order-list-screen"
        Save={null}
      />

      <div className="flex-row justify-center mt-[17px] w-full">
        <div
          className={`${
            isRtl ? "flex-row-reverse" : "flex-row"
          } flex w-full pl-[20px] pr-[17px]  items-center`}
        >
          <div className="flex">
            <SearchHistoryIcon />
          </div>
          <div
            ref={statusSliderRef}
            className={`${loading && "opacity-65"} ${
              isRtl ? "flex-row-reverse mr-[2px]" : "flex-row ml-[2px]"
            } flex-row flex-1  statues-container overflow-x-scroll overflow-y-hidden user-select-none whitespace-nowrap [&::-webkit-scrollbar]:hidden`}
          >
            {[
              { label: "All", value: "all" },
              ...((settings?.["starting-setting"]?.order_group_statuses ??
                []) ||
                []),
            ].map((status) => (
              <div
                onClick={() => {
                  if (loading) return;
                  if (status.value === selectedStatus) return;
                  if (status.value !== "all") setSelectedStatus(status.value);
                  else setSelectedStatus(null);
                  setPage(1);
                  setOrders([]);
                  setHasMore(true);
                  loadMoreOrders(
                    true,
                    status.value === "all" ? null : status.value
                  );
                  setOrders([]);
                }}
                className="flex-row py-[4px] h-[25px] rounded-[10px] bg-[#F8F8F8] px-[11px] ml-[10px] cursor-pointer text-nowrap text-center"
                style={{
                  border:
                    selectedStatus === status?.value && "1px solid #3C8AFF7f",
                }}
                key={status.value}
              >
                <span className="text-[#8D8D8D] text-[12px] regular">
                  {translateFunction(status.label)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 pt-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      >
        {orders.length > 0
          ? orders.map((order) => (
              <OrderItem
                key={order.order_group_id}
                order={order}
                showDetails={() => {
                  let params = new URLSearchParams(window.location.search);
                  params.set("id", order.order_group_id.toString());
                  // @ts-ignore
                  router.replace(`/${lang}/setting?${params.toString()}`, {
                    scroll: false,
                    // @ts-ignore
                    shallow: true,
                  });
                  setSelectedOrder({ ...order, is_from_wallet: false });
                  swipeToScreen(10);
                }}
              />
            ))
          : !loading && (
              <div className="text-center text-gray-500 py-10">
                {translateFunction("No orders found for this status.")}
              </div>
            )}

        {/* Loading Indicator */}
        {loading && <OrderSkeletons />}

        {/* No More Orders Message */}
        {!loading && !hasMore && orders.length > 0 && (
          <div className="text-center text-gray-500 py-4 text-sm">
            {translateFunction("No more orders")}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersList;

export const OrdersIcon = () => {
  return (
    <div className={`flex flex-row`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="23"
        height="18"
        viewBox="0 0 23 18"
      >
        <defs>
          <clipPath id="clip-path2">
            <rect
              id="Rectangle_4609"
              data-name="Rectangle 4609"
              width="18"
              height="18"
              transform="translate(0)"
              fill="none"
            />
          </clipPath>
          <clipPath id="clipPath-22">
            <rect
              id="Rectangle_4561"
              data-name="Rectangle 4561"
              width="11"
              height="11"
              transform="translate(0)"
              fill="none"
            />
          </clipPath>
          <linearGradient
            id="linear-gradient"
            x1="0.5"
            y1="0.955"
            x2="0.5"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0" stopColor="#f53c3c" />
            <stop offset="1" stopColor="#ff9696" />
          </linearGradient>
        </defs>
        <g
          id="Group_13482"
          data-name="Group 13482"
          transform="translate(-17.04 -194)"
        >
          <g
            id="_25x25_Back"
            data-name="25x25 Back"
            transform="translate(22.04 194)"
          >
            <g
              id="Mask_Group_665"
              data-name="Mask Group 665"
              transform="translate(0)"
              clipPath="url(#clip-path2)"
            >
              <g
                id="Group_4033"
                data-name="Group 4033"
                transform="translate(1.306 0)"
              >
                <g
                  id="Group_4032"
                  data-name="Group 4032"
                  transform="translate(0 0)"
                >
                  <path
                    id="Path_15859"
                    data-name="Path 15859"
                    d="M-2.5-1.843H8.253L10.285,9.371s-1.017,1.561-1.6,1.561a113.3,113.3,0,0,1-11.884-.2c-.973-.12-1.312-1.362-1.312-1.362Z"
                    transform="translate(4.841 6.819)"
                    fill="#3c3c3c"
                  />
                  <g id="bag-5">
                    <g id="Group_2946" data-name="Group 2946">
                      <path
                        id="Path_15168"
                        data-name="Path 15168"
                        d="M62.16,44.749H73.228a2.16,2.16,0,0,0,2.16-2.16.231.231,0,0,0,0-.041L73.588,32.4a1.192,1.192,0,0,0-1.183-1.008h-1.3V30.165a3.416,3.416,0,0,0-6.833,0v1.228h-1.3A1.192,1.192,0,0,0,61.8,32.4L60,42.548a.234.234,0,0,0,0,.041,2.16,2.16,0,0,0,2.16,2.16Zm2.592-14.584a2.946,2.946,0,0,1,5.891,0v1.228H64.752Zm-2.485,2.318v0a.72.72,0,0,1,.72-.614h1.3v1.864a.235.235,0,0,0,.471,0V31.865h5.891v1.864a.235.235,0,0,0,.471,0V31.865h1.3a.72.72,0,0,1,.72.614v0l1.786,10.125a1.691,1.691,0,0,1-1.689,1.669H62.16a1.691,1.691,0,0,1-1.689-1.669Z"
                        transform="translate(-59.999 -26.749)"
                        fill="#3c3c3c"
                      />
                    </g>
                  </g>
                </g>
                <path
                  id="Path_15172"
                  data-name="Path 15172"
                  d="M0,0A7.06,7.06,0,0,0,3.91,1.61,8.466,8.466,0,0,0,8.094,0"
                  transform="translate(3.648 11.76)"
                  fill="none"
                  stroke="#fce66e"
                  strokeLinecap="round"
                  strokeWidth="0.6"
                />
              </g>
            </g>
          </g>
          <g
            id="_15x15_photo_back"
            data-name="15x15 photo back"
            transform="translate(17.04 201)"
          >
            <g
              id="Mask_Group_666"
              data-name="Mask Group 666"
              transform="translate(0)"
              clipPath="url(#clipPath-22)"
            >
              <g
                id="Group_4033-2"
                data-name="Group 4033"
                transform="translate(0.783 0)"
              >
                <g
                  id="Group_4032-2"
                  data-name="Group 4032"
                  transform="translate(0)"
                >
                  <path
                    id="Path_15859-2"
                    data-name="Path 15859"
                    d="M-2.819-1.644H3.634l1.22,6.728s-.61.936-.963.935A68.086,68.086,0,0,1-3.238,5.9c-.586-.069-.787-.814-.787-.814Z"
                    transform="translate(4.222 4.63)"
                    fill="url(#linear-gradient)"
                  />
                  <g id="bag-5-2" data-name="bag-5">
                    <g id="Group_2946-2" data-name="Group 2946">
                      <path
                        id="Path_15168-2"
                        data-name="Path 15168"
                        d="M54.821,34.662h6.641a1.3,1.3,0,0,0,1.3-1.3.139.139,0,0,0,0-.024L61.68,27.255a.716.716,0,0,0-.71-.606h-.778v-.737a2.05,2.05,0,0,0-4.1,0v.737h-.777a.716.716,0,0,0-.71.606l-1.08,6.087a.14.14,0,0,0,0,.024,1.3,1.3,0,0,0,1.3,1.3Zm1.553-8.75a1.767,1.767,0,0,1,3.533,0v.737H56.374ZM54.884,27.3h0a.434.434,0,0,1,.431-.369h.78v1.118a.141.141,0,1,0,.283,0V26.931H59.91v1.118a.141.141,0,0,0,.283,0V26.931h.777a.434.434,0,0,1,.431.369h0l1.076,6.075a1.015,1.015,0,0,1-1.014,1H54.821a1.015,1.015,0,0,1-1.014-1Z"
                        transform="translate(-53.525 -23.862)"
                        fill="#3c3c3c"
                      />
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};
