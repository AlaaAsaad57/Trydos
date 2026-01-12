import BackBar from "components/setting/BackBar";
import OrdersListWrapper from "components/setting/orders/OrdersListWrapper";
import { getOrderStatues } from "serverRequests/settings";

async function Orders({ params }) {
  let Params = await params;
  let [country, language] = Params?.lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  let order_group_statuses = await getOrderStatues({ language, country });
  return (
    <div className="flex-col w-full pt-[20px] px-[12px] flex setting-screen max-h-full">
      <BackBar
        isRtl={isRtl}
        local={Params.lang}
        DataCy="order-list-screen"
        preivous_page={`/${Params.lang}/settings`}
      />
      <OrdersListWrapper
        isRtl={isRtl}
        language={language}
        local={Params?.lang}
        order_group_statuses={order_group_statuses}
      />
    </div>
  );
}

export default Orders;
