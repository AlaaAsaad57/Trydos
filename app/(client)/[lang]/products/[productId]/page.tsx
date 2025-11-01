export const runtime = "nodejs";
export const preferredRegion = "bom1";
export const dynamic = "force-dynamic";
import "styles/productDetails.css";
import "styles/product-body.css";
import FreeReturnIcon from "public/svg/product/FreeReturnIcon.svg";
import { getConfiguredImage, translateFunction } from "utils/functions";
import Image from "next/image";

import VerifiedIcon from "public/svg/product/Verified.svg";
import ProductDescriptors from "components/products/ProductDescriptors";
import { GetImageUrl } from "utils/tinyUtils";
import { generateProductMetaData } from "./MetaData";
import ProductImagesSlider from "components/products/ProductImageSlider";
import ProductFooterSection from "components/products/ProductFooterSection";
import ProductDetailsSlider from "components/products/ProductDetailsSlider";
import ProductDetailsText from "components/products/ProductDetailsText";
import ProductStories from "components/products/ProductStories";
import FreeShippingOption from "components/products/FreeShippingOption";
import ProductColors from "components/products/ProductColors";
import ProductBackButton from "components/products/ProductBackButton";
import FlashDealBanner from "components/products/FlashDealBanner";
import {
  GetProductData,
  getProductDataFromElastic,
} from "utils/pagesDataRequests/ProductPageData";
import { generateCodeCurrency } from "../../MetaData";
import { redirect } from "next/navigation";
import {
  getCurrencyFromCache,
  getProductFromCache,
  RedisGet,
  RedisSet,
  StoreCurrency,
  storeProduct,
} from "serverRequests/radis";
import { fetchCurrency } from "serverRequests";
import ProductPageError from "components/global/ProductPageError";
import ExpectedDeleiveryBanner from "components/products/ExpectedDeleiveryBanner";
import ProductsBuyersComments from "components/products/ProductsBuyersComments";
import FAQSection from "components/products/FAQSection";
import ProductSizes from "components/products/ProductSizes";
import ProductSizesReview from "components/products/ProductSizesReview";
import ProductGeneralProperties from "components/products/ProductGeneralProperties";
import ReturnDaysDetails from "components/products/ReturnDays.Details";
import ProductVideo from "components/products/ProductVideo";
import DataSourceLogger from "components/global/DataSourceLogger";
import ProductImageIndicator from "components/products/ProductImageIndicator";
import ProductFeatures from "components/products/ProductFeatures";
import VirtualTryOn from "components/products/VirtualTryOn";
import VirtualTryOnWrapper from "components/products/VirtualTryOnWrapper";
import ProductRedeemCounter from "components/products/ProductRedeemCounter";
import PricesRow from "components/Cart/AddToCart/PricesRow";
import { getCookieServer } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
// export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
// For Middle East users

export async function generateMetadata({ params, searchParams }) {
  let Params = await params;
  let SearchParams = await searchParams;
  try {
    let cachedData = await RedisGet(`${Params.productId}-${Params.lang}`);
    if (cachedData) {
      return typeof cachedData === "string" ? JSON.parse(cachedData) : {};
    } else {
      const metaData = await generateProductMetaData({
        params: Params,
        searchParams: SearchParams,
      });
      // @ts-ignore
      if (metaData?.error) {
        redirect(`/${Params.lang}?message=product_not_found`);
      }
      RedisSet(`${Params.productId}-${Params.lang}`, JSON.stringify(metaData));
      return metaData;
    }
  } catch (error) {
    redirect(`/${Params.lang}?message=product_not_found`);
  }
}
async function getCurrency(country, language) {
  try {
    let cachedCurrency = await getCurrencyFromCache(country);

    if (typeof cachedCurrency === "string") {
      return { ...JSON.parse(cachedCurrency), redis: true };
    }
    if (cachedCurrency?.exchange_rate) {
      return { ...cachedCurrency, redis: true };
    } else {
      let currencyData = await fetchCurrency(language, country);
      let currency = { ...currencyData.data.currency };

      StoreCurrency(country, currency);
      return { ...currency, redis: false };
    }
  } catch (error) {
    throw error;
  }
}
async function GetProductDataFunc(params) {
  let slug = params.productId;
  let [country, language] = params.lang.split("-");
  try {
    let data = await getProductFromCache(slug, language, country);

    if (data?.product && data?.product?.images) {
      let elasticData = await getProductDataFromElastic({
        productId: data.product.id,
        lang: language,
        slug: slug,
      });
      return { ...data.product, ...(elasticData ?? {}) };
    } else {
      let { product: productData, socialData } = await GetProductData(params);
      if (
        !productData.details_req &&
        !productData.qtyPriceDetails &&
        productData?.offer_price &&
        productData?.images
      ) {
        storeProduct(
          productData,
          socialData,
          params.productId,
          language,
          country
        );
      }
      let elasticData = await getProductDataFromElastic({
        productId: productData.id,
        lang: language,
        slug: slug,
      });
      return {
        ...productData,
        ...(socialData ?? {}),
        ...(elasticData ?? {}),
        redis: false,
      };
    }
  } catch (error) {
    throw error;
  }
}
async function Page({ params, searchParams }) {
  let Params = await params;
  let SearchParams = await searchParams;
  try {
    let [countryVariable, languageVariable] = Params.lang.split("-");
    let start = process.hrtime.bigint();

    let [product, currency] = await Promise.all([
      GetProductDataFunc(Params),
      getCurrency(countryVariable, languageVariable),
    ]);
    let end = process.hrtime.bigint();

    const color = SearchParams.color;
    const JsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: product?.images,
      description: product.details,
      sku: product.sku,
      brand: {
        "@type": "Brand",
        name: product.brand?.name,
      },
      offers: {
        "@type": "Offer",
        url:
          process.env.NEXT_PUBLIC_REMOTE_FRONT +
          `/${Params.lang}/product/${Params.productId}`,
        priceCurrency: generateCodeCurrency(currency?.code),
        price: product.offer_price * currency.exchange_rate,
        priceValidUntil: "2025-12-31",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.5",
        reviewCount: "15",
      },
    };
    const shouldShowNotifyButton = () => {
      let bool = false;
      if (product.collected_after_ordering === 1) return false;
      if (product?.is_active === false || product.is_country_restricted)
        return true;
      if (product?.variation?.length > 0) {
        bool =
          product?.variation?.filter((s) => s.qty === 0).length ===
          product?.variation?.length;
      } else {
        bool = product.available_quantity === 0;
      }
      return bool;
    };
    if (!product?.id) {
      return <ProductPageError />;
    }
    const getRoundedClass = (index, length) => {
      if (length === 1) return "rounded-[15px]";
      else {
        if (index === 0) {
          return `${
            isRtl
              ? "rounded-tr-[15px] rounded-br-[15px]"
              : "rounded-tl-[15px] rounded-bl-[15px]"
          } `;
        }
        if (index === length - 1) {
          return `${
            isRtl
              ? "rounded-tl-[15px] rounded-bl-[15px]"
              : "rounded-tr-[15px] rounded-br-[15px]"
          }`;
        }
      }
      return "";
    };
    const getImageBorder = (index, length) => {
      if (
        product?.flash_deal_details?.end_date ||
        product?.flash_deal_end_date
      ) {
        if (length === 1)
          return (
            <svg
              className="absolute top-0 left-0 z-55"
              xmlns="http://www.w3.org/2000/svg"
              width="320"
              height="464"
              viewBox="0 0 320 464"
            >
              <g
                id="Rectangle_6484"
                data-name="Rectangle 6484"
                fill="none"
                stroke="#ff6200"
                strokeWidth="0.5"
              >
                <rect width="320" height="464" stroke="none" />
                <rect
                  x="0.25"
                  y="0.25"
                  width="319.5"
                  height="463.5"
                  fill="none"
                />
              </g>
            </svg>
          );
        else {
          if (index === 0) {
            if (isRtl)
              return (
                <svg
                  className="absolute top-0 left-0 z-55"
                  xmlns="http://www.w3.org/2000/svg"
                  width="320"
                  height="464"
                  viewBox="0 0 320 464"
                >
                  <g
                    id="Rectangle_6484"
                    data-name="Rectangle 6484"
                    fill="none"
                    stroke="#ff6200"
                    strokeWidth="0.5"
                  >
                    <path
                      d="M0,0H305a15,15,0,0,1,15,15V449a15,15,0,0,1-15,15H0a0,0,0,0,1,0,0V0A0,0,0,0,1,0,0Z"
                      stroke="none"
                    />
                    <path
                      d="M.25.25H305A14.75,14.75,0,0,1,319.75,15V449A14.75,14.75,0,0,1,305,463.75H.25a0,0,0,0,1,0,0V.25A0,0,0,0,1,.25.25Z"
                      fill="none"
                    />
                  </g>
                </svg>
              );
            else
              return (
                <svg
                  className="absolute top-0 left-0 z-55"
                  xmlns="http://www.w3.org/2000/svg"
                  width="320"
                  height="464"
                  viewBox="0 0 320 464"
                >
                  <g
                    id="Rectangle_6484"
                    data-name="Rectangle 6484"
                    fill="none"
                    stroke="#ff6200"
                    strokeWidth="0.5"
                  >
                    <path
                      d="M15,0H320a0,0,0,0,1,0,0V464a0,0,0,0,1,0,0H15A15,15,0,0,1,0,449V15A15,15,0,0,1,15,0Z"
                      stroke="none"
                    />
                    <path
                      d="M15,.25H319.75a0,0,0,0,1,0,0v463.5a0,0,0,0,1,0,0H15A14.75,14.75,0,0,1,.25,449V15A14.75,14.75,0,0,1,15,.25Z"
                      fill="none"
                    />
                  </g>
                </svg>
              );
          }
          if (index === length - 1) {
            if (isRtl)
              return (
                <svg
                  className="absolute top-0 left-0 z-55"
                  xmlns="http://www.w3.org/2000/svg"
                  width="320"
                  height="464"
                  viewBox="0 0 320 464"
                >
                  <g
                    id="Rectangle_6484"
                    data-name="Rectangle 6484"
                    fill="none"
                    stroke="#ff6200"
                    strokeWidth="0.5"
                  >
                    <path
                      d="M0,0H305a15,15,0,0,1,15,15V449a15,15,0,0,1-15,15H0a0,0,0,0,1,0,0V0A0,0,0,0,1,0,0Z"
                      stroke="none"
                    />
                    <path
                      d="M.25.25H305A14.75,14.75,0,0,1,319.75,15V449A14.75,14.75,0,0,1,305,463.75H.25a0,0,0,0,1,0,0V.25A0,0,0,0,1,.25.25Z"
                      fill="none"
                    />
                  </g>
                </svg>
              );
            else
              return (
                <svg
                  className="absolute top-0 left-0 z-55"
                  xmlns="http://www.w3.org/2000/svg"
                  width="320"
                  height="464"
                  viewBox="0 0 320 464"
                >
                  <g
                    id="Rectangle_6484"
                    data-name="Rectangle 6484"
                    fill="none"
                    stroke="#ff6200"
                    strokeWidth="0.5"
                  >
                    <path
                      d="M15,0H320a0,0,0,0,1,0,0V464a0,0,0,0,1,0,0H15A15,15,0,0,1,0,449V15A15,15,0,0,1,15,0Z"
                      stroke="none"
                    />
                    <path
                      d="M15,.25H319.75a0,0,0,0,1,0,0v463.5a0,0,0,0,1,0,0H15A14.75,14.75,0,0,1,.25,449V15A14.75,14.75,0,0,1,15,.25Z"
                      fill="none"
                    />
                  </g>
                </svg>
              );
          }
          return (
            <svg
              className="absolute top-0 left-0 z-55"
              xmlns="http://www.w3.org/2000/svg"
              width="320"
              height="464"
              viewBox="0 0 320 464"
            >
              <g
                id="Rectangle_6484"
                data-name="Rectangle 6484"
                fill="none"
                stroke="#ff6200"
                strokeWidth="0.5"
              >
                <rect width="320" height="464" stroke="none" />
                <rect
                  x="0.25"
                  y="0.25"
                  width="319.5"
                  height="463.5"
                  fill="none"
                />
              </g>
            </svg>
          );
        }
      }
      return <></>;
    };
    const getProductText = () => {
      let text_info = [];
      text_info.push(product.name);
      product.categories?.map((s) => {
        text_info.push(s.name);
      });
      if (color) {
        const matchingColor = product?.sync_color_images?.find(
          (s) => s.color_option === color || s.color_name === color
        );
        if (matchingColor) {
          text_info.push(matchingColor?.color_name);
        }
      }
      return text_info.join(" | ");
    };
    const isRtl = languageVariable === "ar" || languageVariable === "ku";
    const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
    if (product?.is_redeem) {
      product = {
        ...product,
        is_redeem: !redeemed_ids.find((s) => s.id === product.id),
      };
    }
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JsonLd) }}
        />
        <div className="product-details-container w-full relative bg-[#ffffff]">
          <DataSourceLogger
            dataSourceString={`Product Details DataSource : product details from ${
              product?.redis ? "redis" : "laravel api"
            } , currency from ${currency?.redis ? "redis" : "laravel api"} in ${
              Number(end - start) / 1_000_000
            } ms`}
          />
          <ProductBackButton productId={Params.productId} lang={Params.lang} />
          <div
            className="product-details-slider mt-[12px] relative h-[474px] max-h-[474px]"
            key={`key-${color}`}
          >
            {product?.videos?.[0] && (
              <div
                className={`${
                  isRtl ? "left-[6px]" : "right-[6px]"
                } absolute z-[999] bottom-[6px]  product-video`}
              >
                <ProductVideo
                  language={languageVariable}
                  videos={product?.videos?.[0]}
                />
              </div>
            )}
            <ProductImagesSlider language={languageVariable}>
              {getImages(product, color)?.images?.map((img, i) => (
                <div
                  key={i}
                  className={`${
                    i === 0 ? "z-[99999999]" : "z-[88]"
                  } relative flex`}
                >
                  <div
                    className={`${getRoundedClass(
                      i,
                      getImages(product, color)?.images?.length
                    )} embla__slide product-slider-images relative`}
                    key={img?.file_path}
                  >
                    {getImageBorder(
                      i,
                      getImages(product, color)?.images?.length
                    )}
                    <Image
                      className={`${getRoundedClass(
                        i,
                        getImages(product, color)?.images?.length
                      )} w-[320px] h-[464px]`}
                      width={320}
                      height={464}
                      priority={i === 0}
                      loading={"eager"}
                      alt={product.name}
                      src={getConfiguredImage({
                        src: GetImageUrl(img),
                        width: 500,
                        height: 700,
                      })}
                    />
                    <ProductImageIndicator language={languageVariable} />
                  </div>
                  {i === 0 && (
                    <>
                      {product?.categories?.[0]?.icon && (
                        <VirtualTryOn
                          language={languageVariable}
                          product={{
                            id: product?.id,
                            slug: product?.slug,
                            images: getImages(product, color)?.images,
                          }}
                        />
                      )}

                      {(product?.flash_deal_details?.end_date ||
                        product?.flash_deal_end_date) &&
                        !shouldShowNotifyButton() && (
                          <FlashDealBanner
                            top="top-[0px]"
                            end_data={
                              product?.flash_deal_details?.end_date ||
                              product?.flash_deal_end_date
                            }
                          />
                        )}
                      {product?.is_redeem && (
                        <ProductRedeemCounter
                          language={languageVariable}
                          product_id={product?.id}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </ProductImagesSlider>
          </div>

          <ProductDetailsSlider
            images={getImages(product, color)?.images}
            currency={currency}
            productGA={{
              item_id: product.id,
              item_name: product?.name,
              brand: product?.brand?.name,
              brand_id: product?.brand?.id,
              category:
                product?.category?.name || product?.categories?.[0]?.name,
              category_id:
                product?.category?.id || product?.categories?.[0]?.id,
              price: product?.offer_price,
            }}
          />

          <div className="product-details-body bg-[#ffffff] flex-row relative mt-[3px] pb-[50px]">
            <div
              className={`${
                isRtl ? "pr-[10px]" : "pl-[10px]"
              } product-info-section bg-[#ffffff] flex-col align-start`}
            >
              <div className="flex-col px-[10px] max-w-full w-full">
                <div
                  className={`${
                    isRtl ? "flex-row-reverse" : "flex-row"
                  } product-brand-logo flex-row items-center gap-[11px]`}
                >
                  {product?.brand?.icon && (
                    <img
                      width={"auto"}
                      height={18}
                      src={GetImageUrl(product.brand.icon)}
                      alt={product.brand.name}
                    />
                  )}
                  <span>
                    <VerifiedIcon />
                  </span>
                </div>
                <div
                  className={`${
                    isRtl ? "flex-row-reverse" : "flex-row"
                  } product-text-section  align-center h-auto`}
                >
                  <div
                    className={`${
                      isRtl && "dir-rtl"
                    } text-[#1D1D1D] regular capitalize text-[13px]`}
                    data-cy="productName_productPage"
                  >
                    {getProductText()}
                  </div>
                </div>
                <ProductDetailsText
                  product={product.sync_color_images}
                  details={product.details}
                  language={languageVariable}
                />
                <ProductGeneralProperties
                  languageVariable={Params.lang?.split("-")?.[1]}
                />
                <ProductFeatures
                  language={languageVariable}
                  labels={
                    typeof product.label_names === "string"
                      ? JSON.parse(product.label_names)
                      : product.label_names
                  }
                />
              </div>

              {product?.descriptors && product?.descriptors?.length > 0 && (
                <ProductDescriptors
                  language={languageVariable}
                  descriptors={product.descriptors}
                />
              )}

              {product?.sync_color_images?.filter((s) =>
                product.colors?.find(
                  (color) =>
                    color.option === s.color_option ||
                    color.name === s.color_name
                )
              )?.length > 1 && (
                <ProductColors
                  product={{
                    ...product,
                    sync_color_images: product?.sync_color_images?.filter((s) =>
                      product.colors?.find(
                        (color) =>
                          color.option === s.color_option ||
                          color.name === s.color_name
                      )
                    ),
                  }}
                  currency={currency}
                  params={Params}
                />
              )}
              <div className="flex-col w-full h-auto rounded-[15px] bg-[#FCFCFC] mt-[12px] px-[10px]">
                <ExpectedDeleiveryBanner
                  lang={Params.lang}
                  days={product.shipping_days}
                />
                {product.shipping_cost === 0 && (
                  <FreeShippingOption lang={Params.lang} />
                )}
                <div
                  className={`product-shipping h-auto  rounded-none p-0 py-[8px]  justify-start product-colors  flex-col align-start relative`}
                >
                  <div
                    className={`${
                      isRtl && "items-end"
                    } colors-label w-full flex-col`}
                    data-cy="FreeReturn"
                  >
                    <FreeReturnIcon />
                    <div
                      className={`${
                        isRtl && "dir-rtl"
                      } flex-col text-[#1d1d1d] medium text-[11px]`}
                    >
                      <span>
                        {translateFunction("Free Return", languageVariable)}
                      </span>
                      <span className="label-description text-[#1d1d1d] regular text-[9px]">
                        {translateFunction(
                          "Return Is Completely Free Without Any Extras",
                          languageVariable
                        )}
                      </span>
                      <div
                        className={`${
                          isRtl && "dir-rtl"
                        } flex-row gap-[4px] items-start justify-start mt-[8px]`}
                      >
                        <span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                          >
                            <g
                              id="Group_12947"
                              data-name="Group 12947"
                              transform="translate(0)"
                            >
                              <path
                                id="refund"
                                d="M14.5,5c-.2-.229-.389-.87-.779-.643-.308.3.231.63.338.917A.259.259,0,1,0,14.5,5Zm.67,1.707c-.136-.275-.151-.94-.586-.823a.26.26,0,0,0-.139.34c.172.255.127.883.551.807a.26.26,0,0,0,.173-.324Zm.206,1.823c-.06-.3.1-.95-.353-.947a.259.259,0,0,0-.222.292c.1.291-.1.872.316.923a.26.26,0,0,0,.259-.268ZM15.1,10.344c.02-.308.339-.89-.1-1.006-.433,0-.28.6-.408.888a.259.259,0,0,0,.5.118Zm-.96,1.82c.339-.052.384-.543.537-.8a.259.259,0,1,0-.48-.2C14.125,11.472,13.586,12.063,14.144,12.163Zm-1.291.943a.262.262,0,0,0,.189.437c.3-.059.456-.431.657-.639a.259.259,0,1,0-.413-.314,6.507,6.507,0,0,1-.433.515Zm-1.231,1.485a2.465,2.465,0,0,0,.732-.455.26.26,0,0,0,.046-.365c-.3-.308-.629.231-.915.339a.261.261,0,0,0,.137.48Zm-1.643.644c.271-.093,1.045-.192.9-.6-.214-.376-.665.06-.972.09a.261.261,0,0,0,.075.508ZM1.376,8.4a7.229,7.229,0,0,0,7.261,7,.26.26,0,0,0,0-.52A6.7,6.7,0,0,1,1.894,8.4,6.463,6.463,0,0,1,12.753,3.65H11.726a.26.26,0,0,0,0,.52H13.37a.269.269,0,0,0,.259-.276V2.348a.259.259,0,1,0-.519,0v.926A6.98,6.98,0,0,0,1.376,8.4Z"
                                transform="translate(-1.376 -1.403)"
                                fill="#ff7600"
                              />
                              <g id="box" transform="translate(4.133 3.79)">
                                <path
                                  id="Path_22816"
                                  data-name="Path 22816"
                                  d="M6.921,1.071H2.563a.689.689,0,0,0-.688.688V6.805a.689.689,0,0,0,.688.688H6.921a.689.689,0,0,0,.688-.688V1.759A.689.689,0,0,0,6.921,1.071Zm.459,5.734a.459.459,0,0,1-.459.459H2.563A.459.459,0,0,1,2.1,6.805V1.759A.459.459,0,0,1,2.563,1.3H3.71V3.053a.346.346,0,0,0,.5.308l.484-.242a.115.115,0,0,1,.1,0l.484.24a.343.343,0,0,0,.5-.307V1.3H6.921a.459.459,0,0,1,.459.459Z"
                                  transform="translate(-1.875 -1.071)"
                                  fill="#1d1d1d"
                                />
                                <path
                                  id="Path_22817"
                                  data-name="Path 22817"
                                  d="M5.738,10.446H4.362a.345.345,0,0,0-.344.344v1.072a.344.344,0,0,0,.344.344H5.738a.344.344,0,0,0,.344-.344V10.79A.345.345,0,0,0,5.738,10.446Zm-1.261,1.11a.114.114,0,0,1,.115-.115h.917a.115.115,0,0,1,0,.229H4.591A.115.115,0,0,1,4.477,11.556Zm1.032-.344H4.591a.115.115,0,1,1,0-.229h.917a.115.115,0,1,1,0,.229Z"
                                  transform="translate(-3.1 -6.433)"
                                  fill="#1d1d1d"
                                />
                                <path
                                  id="Path_22818"
                                  data-name="Path 22818"
                                  d="M11,14.023H9.729a.115.115,0,1,0,0,.229H11a.115.115,0,1,0,0-.229Z"
                                  transform="translate(-6.301 -8.478)"
                                  fill="#1d1d1d"
                                />
                                <path
                                  id="Path_22819"
                                  data-name="Path 22819"
                                  d="M11.478,12.77h-.917a.115.115,0,1,0,0,.229h.917a.115.115,0,1,0,0-.229Z"
                                  transform="translate(-6.777 -7.762)"
                                  fill="#1d1d1d"
                                />
                              </g>
                            </g>
                          </svg>
                        </span>
                        <div className="flex-col text-[#1d1d1d] medium text-[11px]">
                          <span>
                            {translateFunction(
                              "Return Guarantee",
                              languageVariable
                            )}
                          </span>

                          <ReturnDaysDetails
                            days={product?.shipping_days}
                            languageVariable={languageVariable}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ProductStories id={product.id} />
              {product?.buyers_comment?.comments.length > 0 && (
                <ProductsBuyersComments
                  recommendation_stats={product?.recommendation_stats}
                  product_id={product.id}
                  comments={product?.buyers_comment}
                  lang={Params.lang}
                />
              )}
              <FAQSection
                product_id={product.id}
                comments={product?.fqa_questions}
                lang={Params.lang}
              />

              {product?.choice_options?.[0]?.options?.length > 0 && (
                <ProductSizes
                  language={languageVariable}
                  sizes={product?.choice_options?.[0]?.options || []}
                />
              )}
              {product?.choice_options?.[0]?.options?.length > 0 && (
                <ProductSizesReview lang={Params.lang} />
              )}
            </div>
          </div>

          <div className="product-details-footer alternate-product-details-footer z-[999999999]">
            <div className="product-info-container p-0 h-[40px] overflow-hidden">
              <PricesRow
                currency={currency}
                language={languageVariable}
                id={product.id}
                offer_price={product.offer_price}
                price={product.price}
                is_redeem={product.is_redeem}
                redeem_price={product.redeem_price}
                shipping_cost={product?.shipping_cost}
                noBorder={true}
              />
            </div>

            <ProductFooterSection product={product} currency={currency} />
            <VirtualTryOnWrapper language={languageVariable} />
          </div>

          {/* <ProductFooterSection /> */}
        </div>
      </>
    );
  } catch (error) {
    LogServerError(error, `/${Params.lang}/products/${Params.productId}`);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export default Page;
const getImages = (productData, color): { images: any[] } => {
  if (color && color.length > 0 && productData?.sync_color_images) {
    const matchingColor = productData?.sync_color_images?.find(
      (s) => s.color_option === color || s.color_name === color
    );
    if (matchingColor) {
      return matchingColor;
    } else {
      return productData?.sync_color_images[0];
    }
  } else if (
    productData?.sync_color_images &&
    productData?.sync_color_images[0]?.images?.length > 0
  ) {
    return productData?.sync_color_images[0];
  }
  return productData;
};
