"use client";
import OrderItem from "components/Orders/OrderItem";
import OrderSkeletons from "components/settings/OrderSkeletons";
import { useEffect, useRef, useState, useCallback } from "react";
import { fetchOrders } from "services/orders";
import { useAppStore } from "store";
import { LogError, translateFunction } from "utils/functions";
import {
  ModifiedOrderInterface,
  OrderInterface,
} from "utils/types/OrderInterface";

const PAGE_LIMIT = 10;

function OrdersListWrapper({ isRtl, language, order_group_statuses, local }) {
  const { setShouldUpdateOrders, shouldUpdateOrders } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<ModifiedOrderInterface[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Observer ref for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore],
  );

  // Main Fetch Logic
  const handleFetch = async (currentPage: number, isReset: boolean) => {
    try {
      setLoading(true);
      const statusParam = selectedStatus === "all" ? null : selectedStatus;

      const response = await fetchOrders(currentPage, PAGE_LIMIT, statusParam);

      if (response?.isSuccessful && response?.data) {
        const rawOrders = response.data.orders || [];
        const totalAvailable = response.data.total || 0;

        // Grouping & Merging Logic
        const mergedBatch = processOrders(rawOrders);

        setOrders((prev) => {
          if (isReset) return mergedBatch;

          // Prevent duplicates by group ID during merge
          const existingIds = new Set(prev.map((o) => o.order_group_id));
          const filteredNew = mergedBatch.filter(
            (o) => !existingIds.has(o.order_group_id),
          );
          return [...prev, ...filteredNew];
        });

        // hasMore is true if we haven't reached the total count yet
        // We use response.data.orders.length to check if the current page returned items
        setHasMore(
          rawOrders.length > 0 && currentPage * PAGE_LIMIT < totalAvailable,
        );
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.log("Error fetching orders:", error);
      LogError({
        error: error,
        scenario: "Error In handleFetchOrders in OrderListWrapper",
      });
      setHasMore(false);
    } finally {
      setLoading(false);
      setShouldUpdateOrders(0);
    }
  };

  // Effect: Handle Page Changes (Infinite Scroll)
  useEffect(() => {
    if (page > 1) {
      handleFetch(page, false);
    }
  }, [page]);

  // Effect: Handle Status Change or Force Refresh
  useEffect(() => {
    setOrders([]);
    setPage(1);
    setHasMore(true);
    handleFetch(1, true);
  }, [selectedStatus, shouldUpdateOrders]);

  // Helper: Process and Merge Orders
  const processOrders = (
    rawOrders: OrderInterface[],
  ): ModifiedOrderInterface[] => {
    const grouped = rawOrders.reduce((acc: any, curr: any) => {
      const groupId = curr.order_group_id;
      if (!acc[groupId]) acc[groupId] = [];
      acc[groupId].push(curr);
      return acc;
    }, {});

    return Object.values(grouped).map((group: any[]) => {
      const base = { ...group[0] };
      if (group.length === 1) return base;

      base.details = group.flatMap((order) =>
        order.details.map((detail: any) => ({
          ...detail,
          order_status: base.order_status?.value,
          order_id: base.id,
          original_order_id: detail.order_id,
        })),
      );
      base.order_amount = group.reduce(
        (sum, o) => sum + (o.order_amount || 0),
        0,
      );
      return base;
    });
  };

  return (
    <div className="flex flex-col h-full w-full" key={selectedStatus}>
      {/* Status Tabs */}
      <div className="flex justify-center mt-4 w-full px-4">
        <div
          className={`flex items-center w-full ${
            isRtl ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <img
            className="w-5 h-5"
            src="/icons/SearchHistoryIcon.svg"
            alt="search"
          />
          <div
            className={`flex-1 flex overflow-x-auto no-scrollbar gap-2 ${
              isRtl ? "flex-row-reverse mr-2" : "ml-2"
            }`}
          >
            {[
              { label: "All", value: "all" },
              ...(order_group_statuses ?? []),
            ].map((status) => (
              <button
                key={status.value}
                disabled={loading}
                onClick={() => setSelectedStatus(status.value)}
                className={`px-3 py-1 rounded-xl text-xs whitespace-nowrap transition-all ${
                  selectedStatus === status.value
                    ? "bg-blue-50 border border-blue-400 text-blue-600"
                    : "bg-gray-100 text-gray-500 border border-transparent"
                }`}
              >
                {translateFunction(status.label, language)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto max-h-full px-3 mt-4 w-full pb-[40px]">
        {orders.map((order, index) => (
          <OrderItem
            key={`${order.order_group_id}-${index}`}
            isRtl={isRtl}
            local={local}
            order={order}
          />
        ))}

        {/* Infinite Scroll Trigger */}
        {orders.length > 0 && !loading && (
          <div ref={lastElementRef} className="h-4" />
        )}

        {loading && <OrderSkeletons />}

        {!loading && orders.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            {translateFunction("No orders found for this status.")}
          </div>
        )}

        {!hasMore && orders.length > 0 && (
          <div className="text-center text-gray-400 py-6 text-sm">
            {translateFunction("No more orders")}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersListWrapper;
