import "styles/productDetails.css";
import "styles/product-body.css";
import {
  GetGlobalProduct,
  GetProductPriceQtyDetails,
} from "serverRequests/product";
import ProductBackButton from "components/products/ProductBackButton";
import ProductPhotoSliderWrapper from "components/Server/product/ProductPhotoSliderWrapper";
import ProductExtendedSliderWrapper from "components/Server/product/ProductExtendedSliderWrapper";
import ProductNameAndBrand from "components/Server/product/ProductNameAndBrand";
import ProductDetailsTextWrapper from "components/Server/product/ProductDetailsTextWrapper";
import ProductGeneralPropertiesWrapper from "components/Server/product/ProductGeneralPropertiesWrapper";
import ProductFeaturesWrapper from "components/Server/product/ProductFeaturesWrapper";
import ProductDescriptorsWrapper from "components/Server/product/ProductDescriptorsWrapper";
import ProductColorsWrapper from "components/Server/product/ProductColorsWrapper";
import ProductExpectedDeleiveryWrapper from "components/Server/product/ProductExpectedDeleiveryWrapper";
import FreeShippingOption from "components/products/FreeShippingOption";
import FreeReturnBadge from "components/products/FreeReturnBadge";
import { getCurrency, GetStarttingSetting } from "serverRequests";
import ProductStoriesWrapper from "components/Server/product/ProductStoriesWrapper";
import ProductBuyersCommentsWrapper from "components/Server/product/ProductBuyersComment/ProductBuyersCommentsWrapper";
import ProductSizesWrapper from "components/Server/product/ProductSizesWrapper";
import ProductSizeReviews from "components/Server/product/ProductSizeReviews";
import ProductFaqSectionWrapper from "components/Server/product/ProductFAQSection/ProductFaqSectionWrapper";

import { Suspense } from "react";
import ProductNameAndBrandSkeleton from "components/skeleton/product/ProductNameAndBrandSkeleton";
import Skeleton from "react-loading-skeleton";
import ProductFooter from "./ProductFooter";
import RelatedProductsSection from "components/Server/product/RelatedProductsSection";

interface ProductPageContentProps {
  params: { lang: string; productId: string };
  searchParams: { color?: string; size?: string };
}

export default async function ProductPageContent({
  params,
  searchParams,
}: ProductPageContentProps) {
  const Params = params;
  const SearchParams = searchParams || {};
  const [country, language] = Params.lang.split("-");
  const GlobalData = GetGlobalProduct({
    slug: Params.productId,
    language,
    country,
  });
  const QtyPricesData = GetProductPriceQtyDetails({
    slug: Params.productId,
    language,
    country,
  });
  const StarttingSettingPromise = GetStarttingSetting({ language, country });
  const currency = getCurrency(country, language);
  const color = SearchParams.color;
  const Size = SearchParams?.size;
  const slug = Params.productId;
  const isRtl = language === "ar" || language === "ku";

  return (
    <>
      <div className="product-details-container w-full relative bg-[#ffffff]">
        <ProductBackButton lang={Params.lang} />
        <div
          className="product-details-slider mt-[12px] relative h-[474px] max-h-[474px]"
          key={`key-${color ?? slug}`}
        >
          <ProductPhotoSliderWrapper
            key={color}
            color={color}
            qtyPromise={QtyPricesData}
            globalPromise={GlobalData}
            language={language}
          />
        </div>

        <Suspense fallback={<></>}>
          <ProductExtendedSliderWrapper
            key={color}
            color={color}
            globalPromise={GlobalData}
            qtyPricePromise={QtyPricesData}
          />
        </Suspense>
        <div className="product-details-body bg-[#ffffff] flex-row relative mt-[3px] pb-[50px]">
          <div
            className={`${isRtl ? "pr-[10px]" : "pl-[10px]"
              } product-info-section bg-[#ffffff] flex-col align-start`}
          >
            <div className="flex-col px-[10px] max-w-full w-full">
              <Suspense
                fallback={<ProductNameAndBrandSkeleton isRtl={isRtl} />}
              >
                <ProductNameAndBrand
                  color={color}
                  globalPromise={GlobalData}
                  isRtl={isRtl}
                />
              </Suspense>
              <Suspense
                fallback={
                  <div
                    className={`${isRtl ? "dir-rtl" : ""} product-details-text`}
                  >
                    <div id="details" className="have-arabic ">
                      <Skeleton width={200} height={13} borderRadius={4} />
                    </div>
                  </div>
                }
              >
                <ProductDetailsTextWrapper
                  globalPromise={GlobalData}
                  isRtl={isRtl}
                />
              </Suspense>
              <Suspense
                fallback={
                  <div
                    className={`${isRtl ? "dir-rtl" : ""} product-details-text`}
                  >
                    <div id="details" className="have-arabic ">
                      <Skeleton width={200} height={13} borderRadius={4} />
                    </div>
                  </div>
                }
              >
                <ProductGeneralPropertiesWrapper
                  globalData={GlobalData}
                  language={language}
                />
                <ProductFeaturesWrapper
                  isRtl={isRtl}
                  globalPromise={GlobalData}
                />
              </Suspense>
            </div>
            <Suspense
              fallback={
                <div
                  className={`${isRtl ? "dir-rtl" : ""} product-details-text`}
                >
                  <div id="details" className="have-arabic ">
                    <Skeleton width={200} height={13} borderRadius={4} />
                  </div>
                </div>
              }
            >
              <ProductDescriptorsWrapper
                isRtl={isRtl}
                priceQtyPromise={QtyPricesData}
              />
            </Suspense>
            <Suspense fallback={<></>}>
              <ProductColorsWrapper
                country={country}
                slug={slug}
                activeColor={color}
                globalPromise={GlobalData}
                isRtl={isRtl}
                language={language}
              />
            </Suspense>

            <div className="flex-col w-full h-auto rounded-[15px] bg-[#FCFCFC] mt-[12px] px-[10px]">
              <Suspense fallback={<></>}>
                <ProductExpectedDeleiveryWrapper
                  StarttingSettingPromise={StarttingSettingPromise}
                  country={country}
                  language={language}
                  globalPromise={QtyPricesData}
                />
                <FreeShippingOption
                  qtyPricePromise={QtyPricesData}
                  lang={Params.lang}
                />
              </Suspense>

              <Suspense fallback={<></>}>
                <FreeReturnBadge
                  qtyPricePromise={QtyPricesData}
                  language={language}
                  isRtl={isRtl}
                />
              </Suspense>
              <Suspense fallback={<></>}>
                <ProductStoriesWrapper
                  globalPromise={GlobalData}
                  language={language}
                />
              </Suspense>
              <Suspense
                fallback={
                  <div className="w-full h-[228px] flex-row gap-[8px]">
                    {[1, 1, 1].map((s) => (
                      <Skeleton
                        key={s}
                        borderRadius={12}
                        width="85%"
                        height="100%"
                      />
                    ))}
                  </div>
                }
              >
                <ProductBuyersCommentsWrapper
                  globalPromise={GlobalData}
                  language={language}
                />
                <ProductFaqSectionWrapper
                  color={color}
                  size={Size}
                  qtyPricePromise={QtyPricesData}
                  language={language}
                />
                <ProductSizesWrapper
                  activeSize={Size}
                  language={language}
                  qtyPricePromise={QtyPricesData}
                  isRtl={isRtl}
                />
                <ProductSizeReviews
                  qtyPricePromise={QtyPricesData}
                  isRtl={isRtl}
                  language={language}
                />
              </Suspense>
            </div>

            <Suspense fallback={<></>}>
              <RelatedProductsSection
                globalPromise={GlobalData}
                language={language}
                country={country}
                currency={currency}
              />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={<></>}>
          <ProductFooter
            GlobalData={GlobalData}
            StarttingSettingPromise={StarttingSettingPromise}
            Params={Params}
            QtyPricesData={QtyPricesData}
            Size={Size}
            language={language}
            currency={currency}
            isRtl={isRtl}
            color={color}
          />
        </Suspense>
      </div>
    </>
  );
}
