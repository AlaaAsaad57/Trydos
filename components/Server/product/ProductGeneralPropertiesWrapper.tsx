import ProductGeneralProperties from "components/products/ProductGeneralProperties";
import { Suspense } from "react";
import ProductRating from "./ProductRating";
import { madeInText, translateFunction } from "utils/server";
import ProductViews from "components/products/ProductViews";
import { GetProductGeneralData } from "serverRequests/product";
import { FlagIcon } from "utils/tinyUtils";

async function ProductGeneralPropertiesWrapper({ globalData, language }) {
  let productGlobalData = await globalData;
  let product = await GetProductGeneralData({
    id: productGlobalData?.id,
  });
  if(!productGlobalData?.id) return <></>;
  const originIso = productGlobalData?.origin_country_iso;
  const originText = madeInText(originIso, language);
  const TotalBuyers = () => {
    let total = 0;
    product?.ratingDetails?.map((s) => (total += s.count));
    return total;
  };

  return (
    <Suspense fallback={<></>}>
      <ProductGeneralProperties
        good_quality_product={product.good_quality_product}
        views={product?.total_views}
        recommendation_stats={product?.recommendation_stats}
        rating_stats={product?.ratingDetails}
        total_rating={product.final_rating}
        languageVariable={language}
        sizeFitData={product?.size_analysis}
      >
        <ProductRating rating={product.final_rating} />
        {TotalBuyers() > 0 && (
          <div className="flex-row items-center px-[4px]">
            <span className="bold px-[4px]"> {TotalBuyers()}</span>
            {translateFunction("Buyer Rate", language)}
          </div>
        )}

        {product.total_views > 0 && (
          <>
            <span className="px-[5px] text-[10px] text-[#1d1d1d]">|</span>
            <ProductViews views={product.total_views} />
          </>
        )}

        {product?.good_quality_product && TotalBuyers() > 0 && (
          <>
            <span className="px-[5px] text-[10px] text-[#1d1d1d]">|</span>
            <div className="flex-row items-center product-property-row">
              <img src="/icons/QualityIcon.svg" />
              <span>{translateFunction("Good Quality Product", language)}</span>
            </div>
          </>
        )}
        {product?.recommendation_stats?.[0]?.count > 0 && (
          <>
            <span className="px-[5px] text-[10px] text-[#1d1d1d]">|</span>
            <div className="flex-row items-center product-property-row">
              <img src="/icons/RecomendedIcon.svg" />
              <span>
                {translateFunction("Recommend It By", language)}
                <span className="m-0 px-[3px]">
                  {product?.recommendation_stats?.[0]?.count}
                </span>
                <span className="m-0">
                  {translateFunction("Buyer", language)}
                </span>
              </span>
            </div>
          </>
        )}
        <span className="px-[5px] text-[10px] text-[#1d1d1d]">|</span>
       {originIso&& <div className="flex-row items-center product-property-row">
          <FlagIcon iso={originIso} isFromProductPage={true} />
          <span className="mx-1">{originText}</span>
        </div>}
      </ProductGeneralProperties>
    </Suspense>
  );
}

export default ProductGeneralPropertiesWrapper;
