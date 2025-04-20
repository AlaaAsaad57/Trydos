"use client";
import NextLink from "components/global/NextLink";
import { useParams } from "next/navigation";
function OrderPlaced({ data }) {
  const { lang } = useParams();
  return (
    <NextLink
      ariaLabel={`notification Order Placed ${data.order_id} ${lang}`}
      className="flex-row"
      href={`/${lang}`}
      prefetch
    >
      <div className="flex-col m-2">
        <div className="regular p-2 color-[#1d1d1e]">{data.description}</div>
      </div>
    </NextLink>
  );
}

export default OrderPlaced;
