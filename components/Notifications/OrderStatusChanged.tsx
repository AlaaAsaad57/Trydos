import NextLink from "components/global/NextLink";
import { useAppStore } from "store";

function OrderStatusChanged({ data }) {
  return (
    <NextLink
      href={`/setting?tab=Orders&id=${data?.order_group_id}`}
      className="flex-row"
      data={{
        is_settings: true,
      }}
    >
      <div className="flex-col m-2">
        <div className="regular p-2">{data.description}</div>
      </div>
    </NextLink>
  );
}

export default OrderStatusChanged;
