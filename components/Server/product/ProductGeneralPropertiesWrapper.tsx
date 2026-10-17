import ProductGeneralProperties from "components/products/ProductGeneralProperties";
import { Suspense } from "react";
import ProductRating from "./ProductRating";
import { madeInText, translateFunction } from "utils/server";
import ProductViews from "components/products/ProductViews";
import { GetProductGeneralData } from "serverRequests/product";
import { FlagIcon, VALID_ISO } from "utils/tinyUtils";
import { productHasSizes } from "./productHasSizes";
import { formatCount } from "utils/formatCount";

async function ProductGeneralPropertiesWrapper({
  globalData,
  qtyPricePromise,
  language,
  generalData,
}: {
  globalData: any;
  qtyPricePromise?: any;
  language: string;
  // Ready facts data. Only the /products/temp page passes it (fixed big
  // numbers for testers); the product page fetches it below.
  generalData?: any;
}) {
  let productGlobalData = await globalData;
  if (!productGlobalData?.id) return <></>;

  // Start the facts request now. Do not wait for the price data first.
  const [productQtyData, product] = await Promise.all([
    qtyPricePromise ?? null,
    generalData ??
      GetProductGeneralData({
        id: productGlobalData?.id,
      }),
  ]);
  const originIso = productGlobalData?.origin_country_iso;
  const originText = madeInText(originIso, language);
  const TotalBuyers = () => {
    let total = 0;
    product?.ratingDetails?.map((s) => (total += s.count));
    return total;
  };

  // Same data and same rule as ProductSizesWrapper / ProductSizeReviews, so the
  // sheet shows sizing reviews only when the page shows the size sections.
  const sizes = productQtyData?.sizes;
  const hasSizes = productHasSizes(productQtyData);

  return (
    <Suspense fallback={<></>}>
      <ProductGeneralProperties
        good_quality_product={product?.good_quality_product}
        views={product?.total_views}
        recommendation_stats={product?.recommendation_stats}
        rating_stats={product?.ratingDetails}
        total_rating={product?.final_rating}
        languageVariable={language}
        sizeFitData={product?.size_analysis}
        hasSizes={hasSizes}
        sizes={sizes}
      >
        <ProductRating rating={product.final_rating} />
        {TotalBuyers() > 0 && (
          <div className="flex-row items-center px-[4px]">
            <span className="bold px-[4px]"> {formatCount(TotalBuyers(), language)}</span>
            {translateFunction("Buyer Rate", language)}
          </div>
        )}

        {product.total_views > 0 && (
          <>
            <span className="px-[5px] text-[10px] text-[#1d1d1d]">|</span>
            <ProductViews views={product.total_views} language={language} />
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
                  {formatCount(product?.recommendation_stats?.[0]?.count, language)}
                </span>
                <span className="m-0">
                  {translateFunction("Buyer", language)}
                </span>
              </span>
            </div>
          </>
        )}
        <span className="px-[5px] text-[10px] text-[#1d1d1d]">|</span>
       {originIso&&VALID_ISO.includes(originIso?.toUpperCase())&& <div className="flex-row items-center product-property-row" style={{
        direction:language==='ar'||language==='ku'?'rtl':"ltr"
       }}>
          <FlagIcon iso={originIso?.toUpperCase()} isFromProductPage={true} />
          <span className="mx-1">{originText}</span>
        </div>}
      </ProductGeneralProperties>
    </Suspense>
  );
}

export default ProductGeneralPropertiesWrapper;
