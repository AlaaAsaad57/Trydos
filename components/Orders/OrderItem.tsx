import {
  translateFunction,
  RoundPrice,
  getConfiguredImage,
} from "utils/functions";
import { useParams } from "next/navigation";

import { useAppStore } from "store";
import OrderStatusIcon, {
  BagStatusIcon,
} from "components/settings/cards/OrderStatusIcon";
import Image from "next/image";
import { GetImageUrl, ShowNotificationSign } from "utils/tinyUtils";
import NextLink from "components/global/NextLink";
import {
  ModifiedOrderInterface,
  OrderInterface,
} from "utils/types/OrderInterface";
import OrderItemTime from "components/setting/orders/OrderItemTime";
import OrderItemId from "components/setting/orders/OrderItemId";
import OrderStatus from "components/setting/orders/OrderStatus";
import OrderInvoice from "components/setting/orders/OrderInvoice";
import OrderProductSlider from "components/setting/orders/OrderProductSlider";

const OrderItem = ({
  order,
  local,
  isRtl,
}: {
  order: ModifiedOrderInterface | OrderInterface;
  local: string;
  isRtl: boolean;
}) => {
  return (
    <NextLink
      isFromSetting={true}
      href={`/${local}/settings/orders/${order?.order_group_id}`}
      className="bg-[#f8f8f8] relative w-full cursor-pointer pt-[7px] pb-[12px] pl-[12px] pr-[10px] rounded-[15px] h-[200px] mt-[10px] flex-col"
    >
      {ShowNotificationSign({
        order_group_id: order.order_group_id.toString(),
      }) && (
        <span className="absolute left-[initial] w-[10px] h-[10px] bg-[#f64f64] rounded-full top-[-2px] right-[-2px] animate-pulse z-20"></span>
      )}
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
      <OrderProductSlider products={order?.details} isRtl={isRtl} />
    </NextLink>
  );
};

export default OrderItem;
