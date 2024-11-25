import NextLink from "Hooks/NextLink";
import React from "react";

function ProductAvailable({ data }) {
  return (
    <NextLink
      className="flex-row"
      href={`/products/${data.product_slug}`}
      prefetch
    >
      <div className="b-icon">
        <img width={80} height={"auto"} src={data.image} />
      </div>
      <div className="flex-col m-2">
        <div className="regular p-2">{data.description}</div>
        <div className="flex-row items-center">
          <div className={`regular flex ml-2 boutique-desc-notification`}>
            {data.product_name}
          </div>
        </div>
      </div>
    </NextLink>
  );
}

export default ProductAvailable;
