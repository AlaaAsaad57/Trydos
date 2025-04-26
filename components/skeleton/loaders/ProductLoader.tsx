"use client";
import NextLink from "components/global/NextLink";
import { useParams } from "next/navigation";
import React, { Suspense } from "react";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import "styles/productDetails.css";
import "styles/product-body.css";
import EyeIcon from "public/svg/product/EyeIcon.svg";
import BackIcon from "public/svg/listing/backIcon.svg";
import DescriptorBorder from "public/svg/product/descriptorBorder.svg";
import ReturnIcon from "public/svg/product/ReturnIcon.svg";
import FreeReturnIcon from "public/svg/product/FreeReturnIcon.svg";
import QualityIcon from "public/svg/product/QualityIcon.svg";
import VerifiedIcon from "public/svg/product/Verified.svg";
import Flag from "public/svg/product/flag.svg";
import Image from "node_modules/next/image";
import ProductDetailsSlider from "components/products/ProductDetailsSlider";
import Skeleton from "node_modules/react-loading-skeleton/dist";
import { useAppStore } from "store";
import ProductViews from "components/products/ProductViews";
import ProductDetailsText from "components/products/ProductDetailsText";
import ProductColors from "components/products/ProductColors";
import ProductDescriptors from "components/products/ProductDescriptors";
import CameraShots from "components/products/CameraShots";
import ProductStories from "components/products/ProductStories";
import ProductSizes from "components/products/ProductSizes";
import ProductShippingOption from "components/products/ProductShippingOption";
import FreeShippingOption from "components/products/FreeShippingOption";
function ProductLoader({ product }) {
  const { lang } = useParams();
  const { currency } = useAppStore();
  const color = product?.active_color;
  // @ts-ignore
  const [country, languageVariable] = lang?.split("-");
  return (
    <div
      style={{
        zIndex: "99999999999999",
        top: "100px",
      }}
      className="fixed bg-[#fafafa] min-h-screen  flex    w-screen  overflow-hidden"
    >
      <div className="product-details-container w-full">
        <div className="back-bar align-center w-100 flex-row">
          <NextLink
            data={{
              is_full_home: true,
              href: "../",
            }}
            ariaLabel={`Back`}
            href={"../"}
            data-cy="backIcon_productPage"
            className={`back-icon flex-row`}
          >
            <BackIcon />
          </NextLink>
        </div>

        <div className="product-details-slider">
          <div className="embla">
            <div className="embla__container">
              {product?.id
                ? (product?.images ?? [product?.image])?.map((img, i) => (
                    <div
                      className="embla__slide product-slider-images"
                      key={`img-product-${i}`}
                    >
                      <Image
                        width={320}
                        height={464}
                        priority={i === 0}
                        loading={"eager"}
                        alt={product?.name}
                        src={getConfiguredImage({
                          src: img,
                          width: 500,
                          height: 700,
                        })}
                        unoptimized
                      />
                    </div>
                  ))
                : Array.from({ length: 3 }).map((img, i) => (
                    <div
                      className="embla__slide product-slider-images"
                      key={`img-product-${i}`}
                    >
                      <Skeleton width={320} height={464} borderRadius="15px" />
                    </div>
                  ))}
            </div>
          </div>
        </div>
        <Suspense fallback={<></>}>
          <ProductDetailsSlider product={product} currency={currency} />
        </Suspense>
        <div className="product-details-body flex-row relative">
          <Suspense
            fallback={
              <div className="view-count absolute flex-row align-center">
                <EyeIcon />

                <span className="m-0">
                  <Skeleton className="m-0" count={1} width={20} height={10} />
                </span>
              </div>
            }
          >
            <ProductViews
              product={{
                name: product?.name,
                id: product?.id,
                categories: product?.categories,
              }}
            />
          </Suspense>

          <div className="product-info-section flex-col align-start">
            <div className="product-brand-logo">
              {product?.brand?.icon && (
                <img
                  width={"auto"}
                  height={18}
                  src={product?.brand?.icon}
                  alt={product?.brand?.name}
                />
              )}
            </div>
            <div className="product-text-section flex-row align-center">
              <div className="product-name" data-cy="productName_productPage">
                {product?.name}
              </div>
              <div className="product-category">
                {product?.category?.icon && (
                  <img
                    width={15}
                    height={15}
                    src={product?.category?.icon}
                    alt={product?.category?.name}
                  />
                )}
              </div>
              <span className="separtor">|</span>

              <div className="product-category-name">
                {product?.category?.name}
              </div>
            </div>
            {product?.details ? (
              <ProductDetailsText
                product={product?.sync_color_images}
                details={product?.details}
              />
            ) : (
              <div className="product-details-text">
                <Skeleton width={300} height={100} />
              </div>
            )}

            <div className="flex-row product-properties w-100">
              <div className="flex-row product-property-row">
                <QualityIcon />
                <span>
                  {translateFunction("Good Quality Product", languageVariable)}
                </span>
              </div>
              <div className="flex-row product-property-row">
                <VerifiedIcon />
                <span>
                  {translateFunction("Verified by trydos", languageVariable)}
                </span>
              </div>
              <div className="flex-row product-property-row">
                <Flag />
                <span>
                  {translateFunction("Made In Turkey", languageVariable)}
                </span>
              </div>
            </div>
            <div className="flex-row product-descriptors-row">
              {product?.descriptors?.map((descriptor, key) => {
                return (
                  <div
                    className="flex-row product-descriptor relative align-center"
                    key={`product-descriptor-${key}`}
                  >
                    <DescriptorBorder className="descriptor-border absolute" />
                    <div className="descriptor-icon">
                      <img
                        width={20}
                        height={20}
                        src={descriptor.descriptor_group.icon}
                      />
                    </div>
                    <div className="descriptor-value flex-col">
                      <div className="descriptor-name">
                        {descriptor.descriptor_group.name}
                      </div>
                      <div className="descriptor-values flex-row">
                        {descriptor?.descriptors?.map(
                          (sub_descriptor, index) => (
                            <div
                              className="sub-descriptor align-center flex-row"
                              key={`sub-descriptor-${index}`}
                            >
                              {index !== 0 && (
                                <span className="descriptor-separtor">|</span>
                              )}
                              <span className="desc-value">
                                {sub_descriptor.value}
                              </span>
                              {sub_descriptor.descriptor?.icon && (
                                <img
                                  width={15}
                                  height={15}
                                  alt={sub_descriptor.descriptor.name}
                                  src={sub_descriptor.descriptor.icon}
                                />
                              )}
                              {sub_descriptor.descriptor?.name && (
                                <span className="sub-descriptor-name">
                                  {sub_descriptor.descriptor?.name}
                                </span>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Suspense>
              <ProductDescriptors />
            </Suspense>
            <Suspense fallback={<></>}>
              <ProductColors
                colors={product?.sync_color_images || []}
                ProductColorsArray={product?.colors}
              />
            </Suspense>
            <Suspense fallback={<></>}>
              <CameraShots images={product?.images || []} />
            </Suspense>
            <Suspense fallback={<></>}>
              <ProductStories />
            </Suspense>
            <Suspense fallback={<></>}>
              <ProductSizes
                sizes={
                  product?.choice_options?.filter((s) => s.title == "Size")[0]
                    ?.options || []
                }
              />
            </Suspense>
            <Suspense>
              <ProductShippingOption />
            </Suspense>
            {product?.shipping_cost === 0 && (
              <Suspense>
                <FreeShippingOption lang={lang} />
              </Suspense>
            )}
            <div
              className={`product-shipping justify-start product-colors product-sizes flex-col align-start relative`}
            >
              <div
                className="colors-label flex-row align-center"
                data-cy="FreeReturn"
              >
                <FreeReturnIcon />
                <div className="flex-col" style={{ marginLeft: "20px" }}>
                  <span>
                    {translateFunction("Free Return", languageVariable)}
                  </span>
                  <span className="label-description">
                    {translateFunction(
                      "Return Is Completely Free Without Any Extras",
                      languageVariable
                    )}
                  </span>
                </div>
              </div>
              <div className="address-container flex-row justify-center align-center h-[10px] mt-0"></div>
              <div className="yellow-label flex-row align-center">
                <div
                  className="colors-label flex-row align-center "
                  data-cy="CountDaysAfterReciving"
                >
                  <ReturnIcon />
                  <span style={{ marginLeft: "20px" }}>
                    {translateFunction(
                      "Within 3 Days After Receiving The Product, You Can Return It Without Conditions Or Reasons With Complete Ease And Get The Amount Back",
                      languageVariable
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="product-details-footer z-[999999999]"
          style={{
            bottom: "initial",
            top: " calc(100vh - 277px)",
          }}
        >
          <div className="product-info-container">
            <div className="product-info-price">
              {product?.offer_price > 0 && (
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
                  {(currency?.exchange_rate &&
                    RoundPrice({
                      num: product?.price,
                      rate: currency?.exchange_rate,
                      points: 0,
                    })) ?? <Skeleton width={30} height={10} />}
                </div>
              )}
              <div className="product-new-price">
                {(currency?.exchange_rate &&
                  RoundPrice({
                    num: product?.offer_price,
                    rate: currency?.exchange_rate,
                    points: 0,
                  })) ?? <Skeleton width={30} height={10} />}
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
                    alt="truck"
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
                  alt="truck"
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
                  alt="deliveryman"
                  src="/svg/deliveryman.svg"
                />
                <span>
                  {translateFunction("Ship To You Accepted", languageVariable)}{" "}
                  2 June
                </span>
              </div>
            </div>
          </div>
          <ProductFooterSkeleton />
        </div>
      </div>
    </div>
  );
}

export default ProductLoader;
export const ProductFooterSkeleton = () => {
  return (
    <div className="product-options-container">
      <div className={`add-cart-button`} data-cy="ProductQuantityFinished">
        <Skeleton width={90} height={70} />
      </div>
      <div className="options-container" data-cy="InteraCtionBoX">
        <div className={`product-option-item`} data-cy="LoveSymbol">
          <Skeleton width={30} height={30} />
        </div>
        <div className={`product-option-item`} data-cy="LoveSymbol">
          <Skeleton width={30} height={30} />
        </div>
        <div className={`product-option-item`} data-cy="LoveSymbol">
          <Skeleton width={30} height={30} />
        </div>
        <div className={`product-option-item`} data-cy="LoveSymbol">
          <Skeleton width={30} height={30} />
        </div>
      </div>
    </div>
  );
};
