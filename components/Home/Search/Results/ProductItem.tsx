import { dispatchRouteChangeEvent } from "utils/events";
import NextLink from "components/global/NextLink";
import React from "react";
import { getConfiguredImage } from "utils/functions";
import { useParams } from "next/navigation";
import Image from "next/image";
import { GetImageUrl } from "utils/tinyUtils";

function ProductItem({ product, onClick }) {
  const { lang } = useParams();
  return (
    <NextLink
      data={{
        is_product: true,
        ...product,
        href: `/${lang}/products/${product.slug}`,
      }}
      ariaLabel={`Product ${product.slug} ${lang}`}
      suppressHydrationWarning
      // @ts-ignore
      onClick={(e, bool = false) => {
        /* @ts-ignore*/
        onClick(product.name);

        dispatchRouteChangeEvent("start", { to: "products" });
        document.documentElement.style.overflow = "hidden";
        document.documentElement.scrollTop = 0;
      }}
      href={`/${lang}/products/${product.slug}`}
      data-cy="product-result-link"
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

          <Image
            alt={product.name}
            loading="eager"
            width={100}
            className="object-cover object-center"
            height={100}
            src={getConfiguredImage({
              src:
                (product?.sync_color_images?.[0]?.images?.[0]?.file_path &&
                  GetImageUrl(
                    product?.sync_color_images?.[0]?.images?.[0]?.file_path
                  )) ||
                (product?.images &&
                  product?.images?.[0]?.file_path &&
                  GetImageUrl(product?.images?.[0]?.file_path)),
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
