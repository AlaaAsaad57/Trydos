export const runtime = "nodejs";
export const preferredRegion = "bom1";
export const dynamic = "force-dynamic";
import "styles/productDetails.css";
import "styles/product-body.css";
import FreeReturnIcon from "public/svg/product/FreeReturnIcon.svg";
import MalicanIcon from "public/svg/MailcanIcon.svg";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import Image from "next/image";
import { Suspense } from "react";
import Skeleton from "react-loading-skeleton";
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
// import CameraShots from "components/products/CameraShots";
import ProductBackButton from "components/products/ProductBackButton";
import FlashDealBanner from "components/products/FlashDealBanner";
// import FeaturedBanner from "components/products/FeaturedBanner";
import { ProductPagePropsType } from "models/componentType/productTypes/productPagePropsType";
import ProductsLabels from "components/products/ProductsLabels";
import { GetProductData } from "utils/pagesDataRequests/ProductPageData";
import { generateCodeCurrency } from "../../MetaData";
import { redirect } from "next/navigation";
import {
  getCurrencyFromCache,
  getProductFromCache,
  RedisGet,
  RedisSet,
  StoreCurrency,
  storeProduct,
} from "Server Requests/radis";
import { fetchCurrency } from "Server Requests";
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
// export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
// For Middle East users

export async function generateMetadata({ params, searchParams }) {
  try {
    let cachedData = await RedisGet(`${params.productId}-${params.lang}`);
    if (cachedData) {
      return typeof cachedData === "string" ? JSON.parse(cachedData) : {};
    } else {
      const metaData = await generateProductMetaData({ params, searchParams });

      // @ts-ignore
      if (metaData?.error) {
        redirect(`/${params.lang}?message=product_not_found`);
      }
      RedisSet(`${params.productId}-${params.lang}`, JSON.stringify(metaData));
      return metaData;
    }
  } catch (error) {
    redirect(`/${params.lang}?message=product_not_found`);
  }
}
async function getCurrency(country, language) {
  try {
    let cachedCurrency = await getCurrencyFromCache(country);

    if (typeof cachedCurrency === "string") {
      return { ...JSON.parse(cachedCurrency), redis: true };
    }
    if (cachedCurrency?.exchange_rate) {
      return cachedCurrency;
    } else {
      let currencyData = await fetchCurrency(language, country);
      let currency = { ...currencyData.data.currency, redis: false };

      StoreCurrency(country, currency);
      return currency;
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
      return data.product;
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

      return {
        ...productData,
        ...(socialData ?? {}),
        redis: false,
      };
    }
  } catch (error) {
    return null;
  }
}
async function Page({ params, searchParams }: ProductPagePropsType) {
  try {
    let [countryVariable, languageVariable] = params.lang.split("-");
    let start = process.hrtime.bigint();

    let [product, currency] = await Promise.all([
      GetProductDataFunc(params),
      getCurrency(countryVariable, languageVariable),
    ]);
    let end = process.hrtime.bigint();

    const color = searchParams.color;
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
          `/${params.lang}/product/${params.productId}`,
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
          return "rounded-tl-[15px] rounded-bl-[15px]";
        }
        if (index === length - 1) {
          return "rounded-tr-[15px] rounded-br-[15px]";
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
                stroke-width="0.5"
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
                  stroke-width="0.5"
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
                  stroke-width="0.5"
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
                stroke-width="0.5"
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

          <div className="flex-col gap-[20px] mx-[5px] w-[150px] h-[19px] absolute top-[58px] left-[5px] z-[999999999]">
            {product.label_names && (
              <ProductsLabels
                isProduct={true}
                labels={
                  typeof product.label_names === "string"
                    ? JSON.parse(product.label_names)
                    : product.label_names
                }
              />
            )}
          </div>
          <ProductBackButton productId={params.productId} lang={params.lang} />
          <div
            className="product-details-slider relative h-[474px] max-h-[474px]"
            key={`key-${color}`}
          >
            {product?.videos?.[0] && (
              <div className="absolute z-[999] bottom-[6px] right-[6px]">
                <ProductVideo
                  language={languageVariable}
                  videos={product?.videos?.[0]}
                />
              </div>
            )}
            <ProductImagesSlider>
              {getImages(product, color)?.images?.map((img, i) => (
                <div
                  className={`${getRoundedClass(
                    i,
                    getImages(product, color)?.images?.length
                  )} embla__slide product-slider-images relative`}
                  key={img?.file_path}
                >
                  {i === 0 && (
                    <>
                      {product?.categories?.[0]?.icon && (
                        <span className="rounded-[6px] rounded-bl-[15px] bg-[#513AAF] z-50 flex items-center justify-center w-[25px] h-[25px] bottom-0 left-[0px] absolute">
                          <MalicanIcon />
                        </span>
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
                    </>
                  )}
                  {getImageBorder(i, getImages(product, color)?.images?.length)}
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
                </div>
              ))}
            </ProductImagesSlider>
          </div>
          <Suspense key={`${product?.slug}-${color}`} fallback={<></>}>
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
          </Suspense>
          <div className="product-details-body bg-[#ffffff] flex-row relative mt-[3px] pb-[50px]">
            <div className="product-info-section bg-[#ffffff] flex-col align-start">
              <div className="flex-col px-[10px] max-w-full">
                <div className="product-brand-logo flex-row items-center gap-[11px]">
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
                <div className="product-text-section flex-row align-center h-auto">
                  <div
                    className="text-[#1D1D1D] regular capitalize text-[13px]"
                    data-cy="productName_productPage"
                  >
                    {getProductText()}
                  </div>
                </div>
                <ProductDetailsText
                  product={product.sync_color_images}
                  details={product.details}
                  paramsGA={{
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
                <ProductGeneralProperties
                  languageVariable={params.lang?.split("-")?.[1]}
                />
              </div>
              {product?.descriptors && product?.descriptors?.length > 0 && (
                <ProductDescriptors descriptors={product.descriptors} />
              )}
              <Suspense fallback={<></>}>
                {product.sync_color_images?.length > 1 && (
                  <ProductColors
                    colors={product.sync_color_images || []}
                    ProductColorsArray={product.colors}
                  />
                )}
              </Suspense>
              {/* <Suspense fallback={<></>}>
                <CameraShots images={product?.images || []} />
              </Suspense> */}

              {/* <Suspense>
                <ProductShippingOption days={product.shipping_days} />
              </Suspense> */}
              <div className="flex-col w-full h-auto rounded-[15px] bg-[#FCFCFC] mt-[12px] px-[10px]">
                <ExpectedDeleiveryBanner
                  lang={params.lang}
                  days={product.shipping_days}
                />
                {product.shipping_cost === 0 && (
                  <FreeShippingOption lang={params.lang} />
                )}
                <div
                  className={`product-shipping h-auto  rounded-none p-0 py-[8px]  justify-start product-colors  flex-col align-start relative`}
                >
                  <div className="colors-label flex-col" data-cy="FreeReturn">
                    <FreeReturnIcon />
                    <div className="flex-col text-[#1d1d1d] medium text-[11px]">
                      <span>
                        {translateFunction("Free Return", languageVariable)}
                      </span>
                      <span className="label-description text-[#1d1d1d] regular text-[9px]">
                        {translateFunction(
                          "Return Is Completely Free Without Any Extras",
                          languageVariable
                        )}
                      </span>
                      <div className="flex-row gap-[4px] items-start justify-start mt-[8px]">
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
              <ProductsBuyersComments
                comments={product?.comments}
                lang={params.lang}
              />
              <FAQSection comments={product?.comments} lang={params.lang} />
              {product?.choice_options?.filter(
                (s) => s.title?.toLowerCase() === "size"
              )[0]?.options?.length > 0 && (
                <ProductSizes
                  sizes={
                    product?.choice_options?.filter(
                      (s) => s.title?.toLowerCase() === "size"
                    )[0]?.options || []
                  }
                />
              )}
              {product?.choice_options?.filter(
                (s) => s.title?.toLowerCase() === "size"
              )[0]?.options?.length > 0 && (
                <ProductSizesReview lang={params.lang} />
              )}
            </div>
          </div>

          <div className="product-details-footer alternate-product-details-footer z-[999999999]">
            <div className="product-info-container">
              <div className="product-info-price">
                {product?.offer_price !== product.price && (
                  <div className="product-old-price">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="100%"
                      height="2"
                    >
                      <line
                        id="Line_1104"
                        data-name="Line 1104"
                        x2="100%"
                        transform="translate(0 1)"
                        fill="none"
                        stroke="#C4C2C2"
                        strokeWidth="2"
                      />
                    </svg>
                    {RoundPrice({
                      num: product?.price,
                      language: languageVariable,
                      rate: currency?.exchange_rate,
                    }) ?? <Skeleton width={30} height={10} />}
                  </div>
                )}
                <div className="product-new-price">
                  {RoundPrice({
                    num: product?.offer_price,
                    language: languageVariable,
                    rate: currency?.exchange_rate,
                  }) ?? <Skeleton width={30} height={10} />}
                </div>
                <div className="product-currency">
                  {currency?.symbol ?? (
                    <Skeleton
                      containerClassName="flex items-center"
                      className="flex items-center"
                      width={20}
                      height={10}
                    />
                  )}
                </div>
                <div className="info-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                  >
                    <g
                      id="Group_10807"
                      data-name="Group 10807"
                      transform="translate(-65 -464)"
                    >
                      <g
                        id="Group_10756"
                        data-name="Group 10756"
                        transform="translate(65 464)"
                      >
                        <path
                          id="Subtraction_1"
                          data-name="Subtraction 1"
                          d="M.262,9.636a.258.258,0,0,1-.156-.054.29.29,0,0,1-.1-.3L.675,7.091A4.792,4.792,0,0,1,0,4.636,4.554,4.554,0,0,1,4.458,0,4.554,4.554,0,0,1,8.914,4.636,4.555,4.555,0,0,1,4.458,9.273a4.341,4.341,0,0,1-2.5-.794L.409,9.589A.238.238,0,0,1,.262,9.636ZM4.416,6.982a.571.571,0,1,0,.562.571A.558.558,0,0,0,4.416,6.982Zm.115-4.55a.879.879,0,0,1,.954.88c0,.432-.183.7-.7,1.023a1.433,1.433,0,0,0-.817,1.288v.1c0,.319.171.518.447.518.255,0,.4-.162.426-.469.021-.445.181-.669.714-1a1.684,1.684,0,0,0-.987-3.16A1.8,1.8,0,0,0,2.812,2.6a1.186,1.186,0,0,0-.115.518.386.386,0,0,0,.413.434c.224,0,.349-.108.43-.372A.951.951,0,0,1,4.531,2.432Z"
                          transform="translate(0 2.364)"
                          fill="#8e8e8e"
                        />
                        <path
                          id="Path_21380"
                          data-name="Path 21380"
                          d="M10.677,9.661a.259.259,0,0,1-.157.055.237.237,0,0,1-.147-.047L8.824,8.559l-.017.011a5.314,5.314,0,0,0,.4-2.036A5.089,5.089,0,0,0,4.227,1.352a4.724,4.724,0,0,0-1.094.127A4.326,4.326,0,0,1,6.325.079a4.555,4.555,0,0,1,4.457,4.636,4.778,4.778,0,0,1-.675,2.455l.664,2.189a.287.287,0,0,1-.094.3Z"
                          transform="translate(0.23 0.466)"
                          fill="#8e8e8e"
                        />
                        <rect
                          id="Rectangle_4714"
                          data-name="Rectangle 4714"
                          width="11.536"
                          height="12"
                          transform="translate(0.464)"
                          fill="none"
                        />
                      </g>
                    </g>
                  </svg>
                </div>
              </div>
              <div className="product-info-properties">
                <div className="product-prop-item">
                  {translateFunction(
                    "All Inclusive Without Additions",
                    languageVariable
                  )}
                </div>
                {product?.shipping_cost === 0 && (
                  <div className="product-prop-item">
                    <img
                      width={15}
                      height={15}
                      alt={translateFunction("truck", languageVariable)}
                      src="/svg/greentruck.svg"
                    />
                    <span>
                      {translateFunction("Free Shipping", languageVariable)}
                    </span>
                  </div>
                )}
                <div className="product-prop-item">
                  <img
                    width={15}
                    height={15}
                    alt={translateFunction("truck", languageVariable)}
                    src="/svg/redtruck.svg"
                  />
                  <span>
                    {translateFunction("Free Return", languageVariable)}
                  </span>
                </div>
                <div className="product-prop-item">
                  <img
                    width={10}
                    height={15}
                    alt={translateFunction("deliveryman", languageVariable)}
                    src="/svg/deliveryman.svg"
                  />
                  <span>
                    {translateFunction(
                      "Ship To You Accepted",
                      languageVariable
                    )}{" "}
                    {translateFunction("2 June", languageVariable)}
                  </span>
                </div>
              </div>
            </div>

            <ProductFooterSection product={product} currency={currency} />
          </div>

          {/* <ProductFooterSection /> */}
        </div>
      </>
    );
  } catch (error) {
    throw error;
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
