import "styles/productDetails.css";
import "styles/product-body.css";
import EyeIcon from "public/svg/product/EyeIcon.svg";
import BackIcon from "public/svg/listing/backIcon.svg";
import DescriptorBorder from "public/svg/product/descriptorBorder.svg";
import ReturnIcon from "public/svg/product/ReturnIcon.svg";
import FreeReturnIcon from "public/svg/product/FreeReturnIcon.svg";

import {
  getConfiguredImage,
  getProductMeta,
  translateFunction,
} from "utils/functions";
import { notFound } from "next/navigation";
import { getProducts } from "store/homepage/cachedActions";
import NextLink from "components/global/NextLink";
import Image from "next/image";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import ProductViews from "components/products/ProductViews";
import Skeleton from "react-loading-skeleton";
import QualityIcon from "public/svg/product/QualityIcon.svg";
import VerifiedIcon from "public/svg/product/Verified.svg";
import Flag from "public/svg/product/flag.svg";
import ProductDescriptors from "components/products/ProductDescriptors";
import { getPrice } from "utils/tinyUtils";
const ProductFooterSection = dynamic(
  () => import("components/products/ProductFooterSection"),
  {
    ssr: false,
    loading: () => <ProductFooterSkeleton />,
  }
);
const ProductDetailsSlider = dynamic(
  () => import("components/products/ProductDetailsSlider"),
  {
    ssr: false,
  }
);
const ProductDetailsText = dynamic(
  () => import("components/products/ProductDetailsText"),
  {
    ssr: false,
  }
);
const ProductStories = dynamic(
  () => import("components/products/ProductStories"),
  {
    ssr: false,
  }
);
const ProductSizes = dynamic(() => import("components/products/ProductSizes"), {
  ssr: false,
});
const ProductShippingOption = dynamic(
  () => import("components/products/ProductShippingOption"),
  {
    ssr: false,
  }
);
const FreeShippingOption = dynamic(
  () => import("components/products/FreeShippingOption"),
  {
    ssr: false,
  }
);
const ProductColors = dynamic(
  () => import("components/products/ProductColors"),
  {
    ssr: false,
  }
);
const CameraShots = dynamic(() => import("components/products/CameraShots"), {
  ssr: false,
});
export const runtime = "nodejs";
export const preferredRegion = ["bom1", "sin1"]; // For Middle East users

export async function generateMetadata({ params, searchParams }) {
  const productId = params.productId;
  try {
    const metaData = await getProductMeta({
      productId,
      lang: params.lang,
      color: searchParams.color,
    });
    if (!metaData?.name) {
      notFound();
    }
    return {
      title: `${metaData?.name} ${
        searchParams.color ? `- ${searchParams.color}` : ""
      }`,
      description: `${metaData.details}`,
      openGraph: {
        title: `${metaData?.name} ${
          searchParams.color && `- ${searchParams.color}`
        }`,
        description: `${metaData.details}`,
        images: [
          {
            url: getConfiguredImage({
              src: metaData.photo.file_path,
              width: 600,
              height: 315,
            }),
            width: 600,
            height: 315,
          },
        ],
      },
    };
  } catch (error) {
    notFound();
  }
}
export const dynamicParams = true;
export async function generateStaticParams({ params }) {
  try {
    const products = await getProducts({
      lang: params.lang ? params.lang.split("-")[1] : null,
      country: params.lang ? params.lang.split("-")[0] : null,
    });
    return products.map((product) => ({
      productId: product,
      lang: params.lang,
    }));
  } catch (error) {
    console.log(error);
    return [];
  }
}
export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);

interface Props {
  params: {
    lang: string;
    productId: string;
  };
  searchParams: {
    color: string;
  };
}
async function Page({ params, searchParams }: Props) {
  let [countryVariable, languageVariable] = params.lang.split("-");
  const getProductData = async () => {
    try {
      let response = await fetch(
        process.env.NEXT_PUBLIC_API_BASE_URL +
          `/api/${params.lang}/products/${params.productId}`,
        {
          next: {
            revalidate: parseInt(
              process.env.NEXT_PUBLIC_REVALIDATE_PRODUCT_DETAILS
            ),
            tags: [`product-details product-${params.productId}`],
          },
        }
      );
      let data = await response.json();
      return data;
    } catch (error) {
      console.log(error);
    }
  };
  const getCurrency = async () => {
    try {
      let response = await fetch(
        process.env.NEXT_PUBLIC_API_BASE_URL + `/api/${params.lang}/currency`,
        {
          next: {
            revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_CURRENCY),
          },
        }
      );
      let data = await response.json();
      return data.data.currency;
    } catch (error) {
      console.log(error);
    }
  };
  let [product, currency] = await Promise.all([
    getProductData(),
    getCurrency(),
  ]);
  const color = searchParams.color;
  return (
    <div className="product-details-container w-full">
      <div className="back-bar align-center w-100 flex-row">
        <NextLink
          data={{
            is_full_home: true,
          }}
          ariaLabel={`Back `}
          href={"../"}
          data-cy="backIcon_productPage"
          className={`back-icon flex-row`}
        >
          <BackIcon />
        </NextLink>
      </div>

      <div className="product-details-slider" key={`key-${color}`}>
        <div className="embla">
          <div className="embla__container">
            {getImages(product, color).images.map((img, i) => (
              <div className="embla__slide product-slider-images" key={img}>
                <Image
                  width={320}
                  height={464}
                  priority={i === 0}
                  loading={"eager"}
                  alt={product.name}
                  src={getConfiguredImage({
                    src: img,
                    width: 500,
                    height: 700,
                  })}
                  unoptimized
                />
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
              name: product.name,
              id: product.id,
              categories: product.categories,
            }}
          />
        </Suspense>

        <div className="product-info-section flex-col align-start">
          <div className="product-brand-logo">
            {product?.brand?.icon && (
              <img
                width={"auto"}
                height={18}
                src={product.brand.icon}
                alt={product.brand.name}
              />
            )}
          </div>
          <div className="product-text-section flex-row align-center">
            <div className="product-name" data-cy="productName_productPage">
              {product.name}
            </div>
            <div className="product-category">
              {product?.category?.icon && (
                <img
                  width={15}
                  height={15}
                  src={product.category.icon}
                  alt={product.category.name}
                />
              )}
            </div>
            <span className="separtor">|</span>

            <div className="product-category-name">
              {product.category?.name}
            </div>
          </div>
          <Suspense
            fallback={
              <div className="product-details-text">
                <div
                  id="details"
                  className="have-arabic"
                  dangerouslySetInnerHTML={{
                    __html: product?.details ?? "",
                  }}
                />
              </div>
            }
          >
            <ProductDetailsText
              product={product.sync_color_images}
              details={product.details}
            />
          </Suspense>
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
                  key={key}
                  className="flex-row product-descriptor relative align-center"
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
                      {descriptor?.descriptors?.map((sub_descriptor, index) => (
                        <div
                          className="sub-descriptor align-center flex-row"
                          key={index}
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
                      ))}
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
              colors={product.sync_color_images || []}
              ProductColorsArray={product.colors}
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
          {product.shipping_cost === 0 && (
            <Suspense>
              <FreeShippingOption lang={params.lang} />
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

      <div className="product-details-footer z-[999999999]">
        <div className="product-info-container">
          <div className="product-info-price">
            {product?.offer_price > 0 && (
              <div className="product-old-price">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="2">
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
                {getPrice(product?.price, languageVariable, currency) ?? (
                  <Skeleton width={30} height={10} />
                )}
              </div>
            )}
            <div className="product-new-price">
              {getPrice(
                product?.offer_price || product?.price,
                languageVariable,
                currency
              ) ?? <Skeleton width={30} height={10} />}
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
              <img width={15} height={15} alt="truck" src="/svg/redtruck.svg" />
              <span>{translateFunction("Free Return", languageVariable)}</span>
            </div>
            <div className="product-prop-item">
              <img
                width={10}
                height={15}
                alt="deliveryman"
                src="/svg/deliveryman.svg"
              />
              <span>
                {translateFunction("Ship To You Accepted", languageVariable)} 2
                June
              </span>
            </div>
          </div>
        </div>

        <ProductFooterSection product={product} currency={currency} />
      </div>

      {/* <ProductFooterSection /> */}
    </div>
  );
}

export default Page;
const getImages = (productData, color): { images: any[] } => {
  if (color && color.length > 0 && productData?.sync_color_images) {
    return productData?.sync_color_images?.filter(
      (s) => s.color_name === color
    )[0];
  } else if (
    productData?.sync_color_images &&
    productData?.sync_color_images[0]?.images?.length > 0
  ) {
    return productData?.sync_color_images[0];
  }
  return productData ?? { images: [productData.thumbnail] };
};
const ProductFooterSkeleton = () => {
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
