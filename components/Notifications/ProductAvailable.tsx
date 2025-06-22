"use client";
import NextLink from "components/global/NextLink";
import { useParams } from "next/navigation";
import { GetImageUrl } from "utils/tinyUtils";

function ProductAvailable({ data }) {
  const { lang } = useParams();
  return (
    <NextLink
      data={{
        is_product: true,
        ...data,
        href: `/${lang}/products/${data.product_slug}`,
      }}
      className="flex-row"
      ariaLabel={`notification Product Available ${data.product_slug}`}
      href={`/${lang}/products/${data.product_slug}`}
      prefetch
    >
      <div className="b-icon">
        <img width={80} height={"auto"} src={GetImageUrl(data.image)} />
      </div>
      <div className="flex-col m-2">
        <div className="regular p-2">{data.description}</div>
      </div>
    </NextLink>
  );
}

export default ProductAvailable;
