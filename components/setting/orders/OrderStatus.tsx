import OrderStatusIcon, {
  BagStatusIcon,
} from "components/settings/cards/OrderStatusIcon";
const OrderStatus = ({
  status,
  isRtl,
}: {
  status: { label: string; value: string };
  isRtl: boolean;
}) => {
  return (
    <div
      className={`${
        isRtl ? "flex-row-reverse" : "flex-row"
      } gap-[4px] flex items-center`}
    >
      <BagStatusIcon status={status?.value} />
      <span
        className="text-[#1D1D1D] text-[12px] regular"
        data-pw="order-status"
        data-status={status?.value}
      >
        {status.label}
      </span>
      <span className="mx-[3px]">
        <OrderStatusIcon status={status?.value} isRtl={isRtl} />
      </span>
    </div>
  );
};

export default OrderStatus;
