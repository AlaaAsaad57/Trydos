import NextLink from "components/global/NextLink";
import React from "react";
import { getConfiguredImage } from "utils/functions";
import { useParams } from "next/navigation";
import Image from "next/image";
import { GetImageUrl } from "utils/tinyUtils";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import auth from "services/auth";
import { useAppStore } from "store";

function ProductItem({ product, onClick, index }) {
  const { lang } = useParams();
  const { value, searchResults } = useAppStore();

  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const isRtl = languageVariable === "ar" || languageVariable === "ku";
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
        GAevent({
          action: GA_EVENT_NAMES.SEARCH,
          params: {
            user_id_custom: auth.UserID(),
            search_keyword: value,
            search_item_select: JSON.stringify({
              item_id: product?.product_id,
              item_name: product?.name,
              brand_id: product?.brand?.id,
              category_id: product?.category?.id,
              position: index,
            }),
            search_results: JSON.stringify(
              searchResults.products
                ?.filter((s) => s.product_id !== product.product_id)
                ?.map((s) => ({
                  item_id: s?.product_id,
                  item_name: s?.name,
                  brand_id: s?.brand?.id,
                  category_id: s?.category?.id,
                  price: s?.offer_price,
                }))
            ),
            count_results_search: searchResults?.products?.length,
            limit_results_search: 10,
            search_results_page: 1,
            screen_name: GA_GLOBAL_SCREEN.HOME_SCREEN,
            screen_path: window.location.pathname,
          },
        });
      }}
      href={`/${lang}/products/${product.slug}`}
      data-cy="product-result-link"
    >
      <div
        className={`result-product flex-row ${
          isRtl ? "flex-row-reverse" : " "
        }`}
      >
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
            alt={product.name || "Image"}
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
        <div className={`result-product-text ${isRtl ? " pr-2" : " "}`}>
          {product.name}
        </div>
      </div>
    </NextLink>
  );
}

export default ProductItem;
