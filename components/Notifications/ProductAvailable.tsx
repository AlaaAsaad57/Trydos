import NextLink from "Hooks/NextLink";
import React from "react";

function ProductAvailable({ data }) {
  return (
    <NextLink
      className="flex-col"
      href={`/products/${data.product_slug}`}
      prefetch
    >
      <div className="regular p-2">{data.description}</div>
      <div className="flex-row items-center">
        <div className="b-icon">
          <img width={20} height={20} src={data.image} />
        </div>
        <div className={`regular flex ml-2 boutique-desc-notification`}>
          {data.product_name}
        </div>
      </div>
    </NextLink>
  );
}

export default ProductAvailable;
