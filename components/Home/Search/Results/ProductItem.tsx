import { dispatchRouteChangeEvent } from "utils/events";
import NextLink from "components/global/NextLink";
import React from "react";
import { getConfiguredImage, Sendevent } from "utils/functions";

function ProductItem({ product, onClick }) {
  return (
    <NextLink
      suppressHydrationWarning
      // @ts-ignore
      onClick={(e, bool = false) => {
        /* @ts-ignore*/
        onClick(product.name);
        Sendevent({
          event: "button_clicked",
          value: "choose_product_button",
        });
        dispatchRouteChangeEvent("start", { to: "products" });
        document.documentElement.style.overflow = "hidden";
        document.documentElement.scrollTop = 0;
      }}
      href={`/products/${product.slug}`}
    >
      <div className="result-product flex-row">
        <div className="image-result">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="34"
            height="50"
            viewBox="0 0 34 50"
          >
            <g
              id="Rectangle_5686"
              data-name="Rectangle 5686"
              fill="none"
              stroke="#388cff"
              strokeWidth="0.3"
            >
              <path
                d="M15,0H29a5,5,0,0,1,5,5V45a5,5,0,0,1-5,5H15A15,15,0,0,1,0,35V15A15,15,0,0,1,15,0Z"
                stroke="none"
              />
              <path
                d="M15,.15H29A4.85,4.85,0,0,1,33.85,5V45A4.85,4.85,0,0,1,29,49.85H15A14.85,14.85,0,0,1,.15,35V15A14.85,14.85,0,0,1,15,.15Z"
                fill="none"
              />
            </g>
          </svg>

          <img
            src={getConfiguredImage({
              src:
                product?.thumbnail?.file_path ||
                (product?.images && product?.images[0]?.file_path) ||
                product?.sync_color_images?.images[0]?.file_path,
              width: 100,
              height: 100,
            })}
          />
        </div>
        <div className="result-product-text">{product.name}</div>
      </div>
    </NextLink>
  );
}

export default ProductItem;
