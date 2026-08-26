import OrderItemTime from "./OrderItemTime";
import OrderItemId from "./OrderItemId";
import OrderStatus from "./OrderStatus";
import OrderInvoice from "./OrderInvoice";
import OrderProductSlider from "./OrderProductSlider";

function OrderItemBanner({ isRtl, order }) {
  return (
    <div className="bg-[#f8f8f8] relative w-full cursor-pointer pt-[7px] pb-[12px] pl-[12px] pr-[10px] rounded-[15px] h-[200px] mt-[10px] flex-col">
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
      <OrderProductSlider isRtl={isRtl} products={order?.details} />
    </div>
  );
}

export default OrderItemBanner;
