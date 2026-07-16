"use client";
import { useEffect, useState } from "react";
import OrderSkeletons from "components/settings/OrderSkeletons";
import HiddenOrderItem, {
  HiddenOrderCard,
} from "components/Orders/HiddenOrderItem";
import { fetchHiddenOrders } from "services/orders";
import { LogError, translateFunction } from "utils/functions";
import { ORDER_MGMT_EVENTS, trackOrderMgmt } from "utils/orderFunnel";
import { OrderInterface } from "utils/types/OrderInterface";

// Collapses the flat getHiddenOrders list into one card per order group:
//   • pack_ids       — every constituent pack (needed to restore a whole group);
//   • is_fully_hidden — true only when every pack in the group is itself hidden
//     (order-level hide); otherwise the group is shown normally with just its
//     hidden product tiles dimmed;
//   • details        — all packs' product lines, each keeping its own is_hidden.
const groupHiddenOrders = (orders: OrderInterface[]): HiddenOrderCard[] => {
  const grouped = orders.reduce<Record<string, OrderInterface[]>>(
    (acc, curr) => {
      const groupId = curr.order_group_id;
      if (!acc[groupId]) acc[groupId] = [];
      acc[groupId].push(curr);
      return acc;
    },
    {},
  );

  return Object.values(grouped).map((group) => {
    const base = group[0];
    return {
      order_group_id: base.order_group_id,
      order_group_status: base.order_group_status,
      created_at: base.created_at,
      order_amount: group.reduce((sum, o) => sum + (o.order_amount || 0), 0),
      details: group.flatMap((o) => o.details),
      pack_ids: [...new Set(group.map((o) => o.id))],
      is_fully_hidden: group.every((o) => o.is_hidden === true),
    };
  });
};

function HiddenOrdersWidget({ isRtl }: { isRtl: boolean }) {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<HiddenOrderCard[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const response = await fetchHiddenOrders();
      const rawOrders: OrderInterface[] = response?.data || [];
      setCards(groupHiddenOrders(rawOrders));
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In load in HiddenOrdersWidget",
      });
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    trackOrderMgmt(ORDER_MGMT_EVENTS.HIDDEN_ORDERS_OPENED);
    load();
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Persistent intro banner — always shown, no dismiss control. */}
      <div className="px-4 mt-4 w-full">
        <div
          className="bg-[#F8F8F8] min-h-[50px] flex-row items-center pl-[16px] pr-[12px] py-[10px] rounded-[12px]"
          style={{ border: "1px solid rgb(211 211 211 / 51%)" }}
          data-cy="hidden-orders-info"
        >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="shrink-0"
            >
              <path
                d="M177.808,126.993h-.043a1.474,1.474,0,0,0,0,2.948h.043a1.474,1.474,0,0,0,0-2.948Z"
                transform="translate(-170.81 -123.113)"
                fill="#388cff"
              />
              <path
                d="M178.962,237.18H176.61a.319.319,0,0,0-.319.319v5.833a.319.319,0,0,0,.319.319h2.352a.319.319,0,0,0,.319-.319V237.5A.319.319,0,0,0,178.962,237.18Z"
                transform="translate(-170.81 -229.781)"
                fill="#388cff"
              />
              <path
                d="M6.933,60.315A6.8,6.8,0,0,0,2.03,62.4a7.262,7.262,0,0,0,.21,10.283l-.111,1.308a.323.323,0,0,0,.118.279.305.305,0,0,0,.293.051L3.9,73.848a6.706,6.706,0,0,0,3.034.717,6.8,6.8,0,0,0,4.9-2.087,7.265,7.265,0,0,0,0-10.076A6.8,6.8,0,0,0,6.933,60.315Zm0,13.611a6.105,6.105,0,0,1-2.869-.708.3.3,0,0,0-.243-.018l-1.03.36.083-.979a.324.324,0,0,0-.1-.267A6.57,6.57,0,0,1,.623,67.44a6.407,6.407,0,0,1,6.311-6.486,6.489,6.489,0,0,1,0,12.973Z"
                transform="translate(0 -58.565)"
                fill="#388cff"
              />
            </svg>
            <div
              className={`regular text-[10px] flex-1 text-[#8D8D8D] ${
                isRtl ? "mr-[8px] text-right" : "ml-[8px]"
              }`}
            >
            {translateFunction(
              "These are orders and products you hid from your history. Tap the eye to restore any of them back to your list.",
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-full px-3 mt-2 w-full pb-[40px]">
        {loading ? (
          <OrderSkeletons />
        ) : cards.length === 0 ? (
          <div
            className="text-center text-gray-400 py-10"
            data-cy="hidden-orders-empty"
          >
            {translateFunction("You have no hidden orders.")}
          </div>
        ) : (
          cards.map((card) => (
            <HiddenOrderItem
              key={card.order_group_id}
              order={card}
              isRtl={isRtl}
              onRestored={load}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default HiddenOrdersWidget;
