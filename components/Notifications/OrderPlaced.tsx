"use client";
import NextLink from "components/global/NextLink";
import { useParams } from "next/navigation";
function OrderPlaced({ data }) {
  const { lang } = useParams();
  return (
    <NextLink
      data={{
        is_settings: true,
        ...data,
        href: `/${lang}/setting?tab=Orders&id=${data?.order_group_id}`,
      }}
      ariaLabel={`notification Order Placed ${data.order_group_id} ${lang}`}
      className="flex-row"
      href={`/${lang}/setting?tab=Orders&id=${data?.order_group_id}`}
      prefetch
    >
      <div className="flex-col m-2">
        <div className="regular p-2 color-[#1d1d1e]">{data.description}</div>
      </div>
    </NextLink>
  );
}

export default OrderPlaced;
