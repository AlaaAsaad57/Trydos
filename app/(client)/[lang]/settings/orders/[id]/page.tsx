import { lang as langParam } from "next/root-params";
import OrderDetailsWrapper from "components/setting/orders/OrderDetailsWrapper";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

async function OrderDetailsPage({ params, searchParams }) {
  let [Params, query] = await Promise.all([params, searchParams]);
  const lang = await langParam();
  let [country, language] = lang?.split("-");
  const isRtl = language === "ar" || language === "ku";
  const local = lang;
  const order_group_id = Params.id;
  const pack_id = query.order_id;
  const chat_order_id = query.chat_id;

  return (
    <div className="flex-col w-full pt-[20px] px-[12px] flex setting-screen max-h-full">
      <OrderDetailsWrapper
        order_id={pack_id}
        isRtl={isRtl}
        local={local}
        order_chat_id={chat_order_id}
        order_group_id={order_group_id}
      />
    </div>
  );
}

export default OrderDetailsPage;
