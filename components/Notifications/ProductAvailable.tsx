"use client";
import NextLink from "components/global/NextLink";
import { useParams } from "next/navigation";

function ProductAvailable({ data }) {
  const { lang } = useParams();
  return (
    <NextLink
      className="flex-row"
      ariaLabel={`notification Product Available ${data.product_slug}`}
      href={`/${lang}/products/${data.product_slug}`}
      prefetch
    >
      <div className="b-icon">
        <img width={80} height={"auto"} src={data.image} />
      </div>
      <div className="flex-col m-2">
        <div className="regular p-2">{data.description}</div>
      </div>
    </NextLink>
  );
}

export default ProductAvailable;
