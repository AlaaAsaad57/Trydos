import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import NextLink from "components/global/NextLink";
import React from "react";
import { translateFunction } from "utils/functions";
import ProductCard from "./ProductCard";
import DataSourceLogger from "components/global/DataSourceLogger";

async function FlashDealsProducts({
  lang,
  currencyData,
  flashDealsProducts,
  dataSourceString,
}) {
  const [country, language] = lang.split("-");
  const isRtl = language === "ar" || language === "ku";
  const currency = currencyData;
  if (flashDealsProducts?.data?.products?.length === 0) return <></>;
  return (
    <div className={`flex-col px-[12px] flex items-start max-w-full w-full`}>
      <DataSourceLogger dataSourceString={dataSourceString} />

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
        dataCy="featured-products-container"
      >
        {flashDealsProducts?.data?.products?.map((product, key) => (
          <ProductCard
            Sliders={false}
            key={key}
            product={product}
            params={{ lang }}
            currency={currency}
            productColor={null}
            language={language}
          />
        ))}
        <NextLink
          href={`/${lang}/flashDeals`}
          data={{ is_boutique: true }}
          className="product-container items-center justify-center min-w-[200px] max-h-[377px] bg-[#0002]  align-center flex-col relative"
        >
          <div className="flex regular rounded-md p-3 items-center justify-center bg-[#5d5d5d] text-white shadow-md shadow-[#fff]">
            {translateFunction("Show More", lang.split("-")[1])}
          </div>
        </NextLink>
      </HortiznalScrollBar>
    </div>
  );
}

export default FlashDealsProducts;
