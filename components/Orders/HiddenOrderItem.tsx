"use client";
import { useState } from "react";
import OrderItemTime from "components/setting/orders/OrderItemTime";
import OrderItemId from "components/setting/orders/OrderItemId";
import OrderStatus from "components/setting/orders/OrderStatus";
import OrderInvoice from "components/setting/orders/OrderInvoice";
import OrderProductSlider from "components/setting/orders/OrderProductSlider";
import { ConfirmModal } from "components/global/ConfirmModal";
import Order from "services/order";
import { LogError } from "utils/functions";
import { ORDER_MGMT_EVENTS, trackOrderMgmt } from "utils/orderFunnel";

// A hidden-order card. It reuses the exact sub-components of the real order card
// (time / id / status / invoice / product slider) so it looks identical, then
// layers restore affordances on top:
//   • fully-hidden pack  → the whole card is dimmed with one central eye that
//     restores every constituent pack (`packIds`);
//   • otherwise-visible pack with hidden products → the card looks normal and
//     only the hidden tiles are dimmed, each with its own eye to restore that
//     single product.
// Unlike the live order card this is NOT a link — the only actions are restore.
export type HiddenOrderCard = {
  order_group_id: string;
  order_group_status: { value: string; label: string };
  created_at: string;
  order_amount: number;
  details: any[];
  // Every pack (order id) that makes up this group in the hidden response.
  pack_ids: number[];
  // True only when every constituent pack is itself hidden.
  is_fully_hidden: boolean;
};

const HiddenOrderItem = ({
  order,
  isRtl,
  onRestored,
}: {
  order: HiddenOrderCard;
  isRtl: boolean;
  // Called after a successful restore so the parent can refetch the list.
  onRestored: () => void;
}) => {
  // `null` = closed; otherwise the pending restore we're confirming.
  const [confirm, setConfirm] = useState<
    | { level: "order"; ids: number[] }
    | { level: "product"; detailId: number }
    | null
  >(null);
  const [restoring, setRestoring] = useState(false);

  const hiddenDetailIds = new Set<number>(
    order.details.filter((d) => d?.is_hidden).map((d) => d.id),
  );

  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      setRestoring(true);
      if (confirm.level === "order") {
        // Restore every hidden pack in the group (unhide = same endpoint, flag off).
        await Promise.all(
          confirm.ids.map((id) =>
            Order.HideOrder({ order_id: id, is_hidden: false }),
          ),
        );
        trackOrderMgmt(ORDER_MGMT_EVENTS.ORDER_RESTORED, {
          order_group_id: order.order_group_id,
          pack_count: confirm.ids.length,
        });
      } else {
        await Order.HideOrderDetail({
          detail_id: confirm.detailId,
          is_hidden: false,
        });
        trackOrderMgmt(ORDER_MGMT_EVENTS.ORDER_ITEM_RESTORED, {
          order_group_id: order.order_group_id,
          detail_id: confirm.detailId,
        });
      }
      setRestoring(false);
      setConfirm(null);
      onRestored();
    } catch (error) {
      setRestoring(false);
      setConfirm(null);
      LogError({
        error: error,
        scenario: "Error In handleConfirm restore in HiddenOrderItem",
      });
    }
  };

  return (
    <div className="relative w-full">
      <div
        className={`bg-[#f8f8f8] relative w-full pt-[7px] pb-[12px] pl-[12px] pr-[10px] rounded-[15px] h-[200px] mt-[10px] flex-col ${
          order.is_fully_hidden ? "opacity-40" : ""
        }`}
        data-pw="hidden-order-card"
      >
        <div
          className={`${
            isRtl ? "flex-row-reverse" : "flex-row"
          } flex w-full justify-between items-start`}
        >
          <OrderItemTime isRtl={isRtl} time={order.created_at} />
          <OrderItemId isRtl={isRtl} id={order.order_group_id.toString()} />
        </div>
        <div
          className={`${
            isRtl ? "flex-row-reverse" : "flex-row"
          } flex w-full justify-between items-start mt-[11px]`}
        >
          <OrderStatus isRtl={isRtl} status={order.order_group_status} />
          <OrderInvoice
            isRtl={isRtl}
            invoice={{
              items: order.details.length,
              total: order.order_amount,
            }}
          />
        </div>
        <OrderProductSlider
          products={order.details}
          isRtl={isRtl}
          // Per-tile restore only matters for partially-hidden packs; a fully
          // hidden card exposes a single order-level eye instead.
          hiddenDetailIds={order.is_fully_hidden ? undefined : hiddenDetailIds}
          onRestoreProduct={
            order.is_fully_hidden
              ? undefined
              : (detailId) => setConfirm({ level: "product", detailId })
          }
        />
      </div>

      {/* Order-level restore: one eye over the whole dimmed card. */}
      {order.is_fully_hidden && (
        <button
          type="button"
          data-pw="restore-hidden-order"
          aria-label="Restore hidden order"
          onClick={() => setConfirm({ level: "order", ids: order.pack_ids })}
          className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-[52px] h-[52px] rounded-full bg-white shadow-lg"
        >
          <img className="w-[26px] h-[26px]" src="/icons/EyeIcon.svg" alt="" />
        </button>
      )}

      {confirm && (
        <ConfirmModal
          showModal={!!confirm}
          loading={restoring}
          type={"Restore"}
          confirmTilte={
            confirm.level === "order"
              ? "Restore This Order"
              : "Restore This Product"
          }
          confirmMessage={
            confirm.level === "order"
              ? "Are you sure you want to restore this order to your list?"
              : "Are you sure you want to restore this product to your list?"
          }
          onCancel={() => setConfirm(null)}
          onConfirm={handleConfirm}
          dataCy="confirm-restore"
        />
      )}
    </div>
  );
};

export default HiddenOrderItem;
