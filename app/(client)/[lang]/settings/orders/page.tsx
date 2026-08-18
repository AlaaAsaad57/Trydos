import { lang as langParam } from "next/root-params";
import OrdersView from "components/setting/orders/OrdersView";
import { getOrderStatues } from "serverRequests/settings";

async function Orders() {
  const lang = await langParam();
  let [country, language] = lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  let order_group_statuses = await getOrderStatues({ language, country });
  return (
    <OrdersView
      isRtl={isRtl}
      language={language}
      local={lang}
      order_group_statuses={order_group_statuses}
    />
  );
}

export default Orders;
