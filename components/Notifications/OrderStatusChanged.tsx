"use client";
import NextLink from "components/global/NextLink";
import { useParams } from "next/navigation";

function OrderStatusChanged({ data }) {
  const { lang } = useParams();
  return (
    <NextLink
      href={`/setting?tab=Orders&id=${data?.order_group_id}`}
      className="flex-row"
      data={{
        is_settings: true,
        href: `/${lang}/setting?tab=Orders&id=${data?.order_group_id}`,
      }}
    >
      <div className="flex-col m-2">
        <div className="regular p-2">{data.description}</div>
      </div>
    </NextLink>
  );
}

export default OrderStatusChanged;
