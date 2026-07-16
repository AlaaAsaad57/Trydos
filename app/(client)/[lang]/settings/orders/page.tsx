import OrdersView from "components/setting/orders/OrdersView";
import { getOrderStatues } from "serverRequests/settings";

async function Orders({ params }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  let order_group_statuses = await getOrderStatues({ language, country });
  return (
    <OrdersView
      isRtl={isRtl}
      language={language}
      local={Params?.lang}
      order_group_statuses={order_group_statuses}
    />
  );
}

export default Orders;
