import NextLink from "components/global/NextLink";
import { ProductLabelsAnimated } from "components/products/ProductLabelsAnimated";
import Image from "next/image";

import {
  getConfiguredImage,
  GetImageUrl,
  getUrlofProduct,
  RoundPrice,
} from "utils/server";
import { RenderPrice } from "./RenderPrice";
import { OldPrice } from "./OldPrice";
import ProductButtonWrapper from "./ProductButtonWrapper";

function ProductColorsCards({
  InitialProductData,
  language,
  country,
  slug,
  shouldShowOrangeBorder,
  currency,
}) {
  const isRtl = language === "ar" || language === "ku";
  return (
    <div className="w-full pb-[40px] max-w-[1310px] min-h-[60vh] bg-white pt-[10px] flex flex-wrap gap-y-[18px] gap-x-[4px] justify-center items-center">
      {InitialProductData?.sync_color_images?.map((color, i) => (
        <div className="flex relative">
          <NextLink
            data={{
              is_product: true,
              name: InitialProductData.name,

              price: InitialProductData.price,

              offer_price: InitialProductData.offer_price,

              images: [color?.images?.[0]],
            }}
            ariaLabel={`go to product ${InitialProductData?.name} ${language}`}
            href={getUrlofProduct(color?.color_name, language, country, slug)}
            className="product-container  align-center flex-col relative pb-[12px]"
            data-cy="product_link"
            id={slug}
          >
            <div
              className="product-photos z-10 min-h-[290px]  max-h-[290px] overflow-visible w-100 justify-start align-center flex-col"
              style={{
                position: "static",
                opacity: "1",
                zIndex: "4",
              }}
            >
              <div
                className={`product-container-slider h-[290px] duration-300 w-full relative`}
              >
                <div className="inset-shadow-img w-[200px] h-[290px] rounded-15 absolute " />
                <Image
                  width={400}
                  height={580}
                  quality={100}
                  loading="eager"
                  fetchPriority="auto"
                  style={{
                    borderRadius: "15px",
                    zIndex: "3",
                    border: Boolean(shouldShowOrangeBorder())
                      ? "1px solid #FF6200"
                      : "1px solid #d3d3d3",
                  }}
                  src={getConfiguredImage({
                    src: GetImageUrl(color?.images[0]),
                    width: 400,
                    height: 580,
                  })}
                  className={`${
                    InitialProductData?.is_redeem && "product-media-redeem-show"
                  } w-[200px] h-[290px] object-cover object-[top_center]`}
                  alt={InitialProductData?.name}
                />
              </div>
            </div>
            <div
              style={{
                direction: isRtl ? "rtl" : "ltr",
              }}
              className="product-body pl-[13px] pr-[15px] z-10 flex-1 mt-[8px] w-100 flex-col align-start justify-start max-h-[60px] min-h-[30px]"
            >
              <div
                className="prouct-details max-w-full whitespace-normal inline-block  text-left align-top overflow-hidden  regular-text text-[#3c3c3c] text-[10px] max-h-[28px]"
                data-cy="productName"
              >
                <span className="flex-row align-center justify-start gap-[4px]">
                  {InitialProductData.brand?.icon ? (
                    <img
                      src={GetImageUrl(InitialProductData.brand.icon)}
                      alt={InitialProductData.brand.name || "Brand"}
                      className="h-[15px]  object-cover w-[30px] inline-block ml-[7px]"
                      loading="eager"
                      draggable="false"
                    />
                  ) : (
                    <div className="h-[15px] w-[49.358px] bg-gray-200 rounded-sm" />
                  )}
                  {InitialProductData.brand?.is_verified === 1 && (
                    <img src="/icons/VerifiedIcon.svg" />
                  )}
                </span>
                <p
                  className={`${isRtl && "dir-rtl"} truncate w-full max-w-full`}
                  data-cy="product-name"
                >
                  {[
                    InitialProductData.name,
                    ...InitialProductData.categories?.map((s) => s?.name),
                  ]
                    ?.filter((s) => typeof s === "string")
                    ?.join(" | ")}
                </p>
              </div>
              {InitialProductData?.label_names?.length > 0 && (
                <ProductLabelsAnimated
                  labels={InitialProductData?.label_names}
                />
              )}
            </div>
            <div
              style={{
                direction: isRtl ? "rtl" : "ltr",
              }}
              className="product-footer justify-between pl-[17.5px] pr-[15px] left-0 bottom-[10px] absolute w-100 flex-row align-center max-h-[30px]"
            >
              <div className={`${isRtl && "dir-rtl"} price-label flex`}>
                {InitialProductData?.price !==
                  InitialProductData?.offer_price &&
                  InitialProductData?.offer_price !== 0 && (
                    <OldPrice
                      price={RoundPrice({
                        num: InitialProductData?.price,
                        rate: currency?.exchange_rate,
                        points: currency?.decimal_digits,
                      })}
                    />
                  )}

                <RenderPrice
                  currency={currency}
                  flash_price={InitialProductData?.flash_deal_price}
                  is_redeem={InitialProductData?.is_redeem}
                  offer_price={InitialProductData?.offer_price}
                  price={InitialProductData?.price}
                />

                <span className="currency-label light-text color-dark-gray flex f-10">
                  {currency?.symbol}
                </span>
              </div>
            </div>
          </NextLink>
          <ProductButtonWrapper
            InitialProductData={{
              ...InitialProductData,
              sync_color_images: [
                color,
                ...InitialProductData?.sync_color_images.filter(
                  (c) => c.color_name !== color.color_name,
                ),
              ],
            }}
            slug={slug}
            currency={currency}
            endDate={InitialProductData?.endDate}
            flash_deal_price={InitialProductData?.flash_deal_price}
            is_flashDeal={InitialProductData?.endDate}
            id={InitialProductData?.id}
            is_redeem={InitialProductData?.is_redeem}
            language={language}
            offer_price={InitialProductData?.offer_price}
            price={InitialProductData?.price}
            redeem_price={InitialProductData?.redeem_price}
          />
        </div>
      ))}
    </div>
  );
}

export default ProductColorsCards;
