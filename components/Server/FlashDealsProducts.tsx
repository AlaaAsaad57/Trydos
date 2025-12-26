import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import NextLink from "components/global/NextLink";
import { translateFunction } from "utils/functions";

import ProductWrapper from "components/ServerWrapper/ProductWrapper";

function FlashDealsProducts({ lang, currencyData, flashDealsProducts }) {
  const [country, language] = lang.split("-");
  const isRtl = language === "ar" || language === "ku";
  const currency = currencyData;
  if (flashDealsProducts?.data?.products?.length === 0) return <></>;
  return (
    <div
      className={`flex-col px-[12px] flex items-start max-w-full w-full mt-[10px]`}
    >
      <NextLink
        href={`/${lang}/flashDeals`}
        data={{ is_boutique: true }}
        className={`flex-row h-[50px] w-full max-w-[1365px] px-[10px] items-center shadow-sm rounded-[15px] bg-[#f3f3f3] regular text-[#5d5d5d] ${
          isRtl ? "flex-row-reverse" : " "
        }`}
      >
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
              fill="#ff6b35"
              stroke="#ff6b35"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className={`ml-[12px] ${isRtl ? "pr-2" : " "}`}>
          {translateFunction("Flash Deals", lang.split("-")[1])}
        </span>
      </NextLink>
      <HortiznalScrollBar
        className="featured-products-container py-[10px] gap-[8px] w-full mt-[12px] flex-row justify-start items-center max-w-[1365px] h-auto pb-[8px] "
        id="featured-products-container"
        dataCy="flashdeals-products-container"
      >
        {flashDealsProducts?.data?.products?.map((product, key) => (
          <ProductWrapper
            key={product?.product_id ?? product?.id}
            category_tree={product?.categories?.map((s) => s.name)}
            labels={product?.label_names}
            InitialProductData={{ ...product, id: product?.product_id }}
            country={country}
            color={product?.sync_color_images?.[0]?.color_name}
            images={product?.sync_color_images?.[0]?.images ?? product?.images}
            videos={product?.videos}
            name={product.name}
            slug={product.slug}
            Sliders={false}
            brand={{
              name: product.brand.name,
              icon: product.brand.icon?.file_path ?? product?.brand,
              is_verified: product.brand.is_verified,
            }}
            redeem_price={product.redeem_price}
            currency={currency}
            endDate={product.flash_deal_end_date}
            flash_deal_price={product.flash_deal_price}
            id={product.id}
            is_flashDeal={product.flash_deal_end_date}
            is_redeem={product.is_redeem}
            language={language}
            offer_price={product.offer_price}
            price={product.price}
          />
        ))}
        {flashDealsProducts?.data?.products?.length > 8 && (
          <NextLink
            href={`/${lang}/flashDeals`}
            data={{ is_boutique: true }}
            className="product-container items-center justify-center min-w-[200px] max-h-[377px] bg-[#0002]  align-center flex-col relative"
          >
            <div className="flex regular rounded-md p-3 items-center justify-center bg-[#5d5d5d] text-white shadow-md shadow-[#fff]">
              {translateFunction("Show More", lang.split("-")[1])}
            </div>
          </NextLink>
        )}
      </HortiznalScrollBar>
    </div>
  );
}

export default FlashDealsProducts;
