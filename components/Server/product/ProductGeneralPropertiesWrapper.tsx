import ProductGeneralProperties from "components/products/ProductGeneralProperties";
import { Suspense } from "react";
import ProductRating from "./ProductRating";
import { translateFunction } from "utils/server";
import QualityIcon from "public/svg/product/QualityIcon";
import RecomendedIcon from "public/svg/RecomendedIcon";
import Flag from "public/svg/product/flag";
import ProductViews from "components/products/ProductViews";
import { GetProductGeneralData } from "serverRequests/product";

async function ProductGeneralPropertiesWrapper({ globalData, language }) {
  let productGlobalData = await globalData;
  let product = await GetProductGeneralData({
    id: productGlobalData?.id,
  });
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
        <div className="flex-row items-center px-[4px]">
          <span className="bold px-[4px]"> {TotalBuyers()}</span>
          {translateFunction("Buyer Rate", language)}
        </div>
        <span className="px-[5px] text-[10px] text-[#1d1d1d]">|</span>

        <ProductViews views={product.total_views} />

        {product?.good_quality_product && (
          <>
            <span className="px-[5px] text-[10px] text-[#1d1d1d]">|</span>
            <div className="flex-row items-center product-property-row">
              <QualityIcon />
              <span>{translateFunction("Good Quality Product", language)}</span>
            </div>
          </>
        )}
        <span className="px-[5px] text-[10px] text-[#1d1d1d]">|</span>
        <div className="flex-row items-center product-property-row">
          <RecomendedIcon />
          <span>
            {translateFunction("Recommend It By", language)}
            <span className="m-0 px-[3px]">
              {product?.recommendation_stats?.[0]?.count}
            </span>
            <span className="m-0">{translateFunction("Buyer", language)}</span>
          </span>
        </div>
        <span className="px-[5px] text-[10px] text-[#1d1d1d]">|</span>
        <div className="flex-row items-center product-property-row">
          <Flag />
          <span>{translateFunction("Made In Turkey", language)}</span>
        </div>
      </ProductGeneralProperties>
    </Suspense>
  );
}

export default ProductGeneralPropertiesWrapper;
