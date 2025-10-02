"use client";
import { useParams } from "next/navigation";
import React from "react";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import "styles/productDetails.css";
import "styles/product-body.css";
import MalicanIcon from "public/svg/MailcanIcon.svg";
import ExpectedIcon from "public/svg/expectedDelevery.svg";
import FreeShippingIcon from "public/svg/product/FreeShipping.svg";
import BuyersCommentIcon from "public/svg/product/BuyersCommentsIcon.svg";
import FreeReturnIcon from "public/svg/product/FreeReturnIcon.svg";
import VerifiedIcon from "public/svg/product/Verified.svg";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";
import { useAppStore } from "store";
import ProductColors from "components/products/ProductColors";
import { GetImageUrl } from "utils/tinyUtils";
import ProductVideo from "components/products/ProductVideo";
import ProductImagesSlider from "components/products/ProductImageSlider";
import FlashDealBanner from "components/products/FlashDealBanner";
import ProductDetailsSlider from "components/products/ProductDetailsSlider";
import ProductDetailsText from "components/products/ProductDetailsText";
import ProductGeneralProperties from "components/products/ProductGeneralProperties";
import ReturnDaysDetails from "components/products/ReturnDays.Details";
import StoriesSkeleton from "../StoriesSkeleton";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
function ProductLoader({ product }) {
  const { lang } = useParams();
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
    if (product?.flash_deal_details?.end_date || product?.flash_deal_end_date) {
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
  const params = useParams();
  const { currency, isNavigating } = useAppStore();
  const color = product?.active_color;
  // @ts-ignore
  const [country, languageVariable] = lang?.split("-");
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

  return (
    <div
      style={{
        zIndex: "99999999999999",
        top: "100px",
      }}
      className="fixed max-w-[1365px] mx-auto bg-[#fafafa] min-h-screen  flex  w-screen  overflow-hidden items-start"
    >
      <div
        className="product-details-container w-full relative bg-[#ffffff] max-h-[calc(100vh-275px)]"
        style={{
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* <ProductBackButton productId={params.productId} lang={params.lang} /> */}
        <div
          className="product-details-slider mim-h-[464px] relative h-[474px] max-h-[474px]"
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
          <ProductImagesSlider language={languageVariable}>
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
                      product?.flash_deal_end_date) && (
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

        <ProductDetailsSlider
          resetLoader={false}
          images={getImages(product, color)?.images}
          currency={currency}
          productGA={null}
        />

        <div className="product-details-body bg-[#ffffff] flex-row relative mt-[3px] pb-[50px]">
          <div className="product-info-section bg-[#ffffff] flex-col align-start">
            <div className="flex-col px-[10px] max-w-full w-full">
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
                language={(params?.lang as string)?.split("-")?.[1]}
              />
              <ProductGeneralProperties
                languageVariable={(params?.lang as string)?.split("-")?.[1]}
              />
            </div>
            {/* {product?.descriptors && product?.descriptors?.length > 0 && (
                <ProductDescriptors descriptors={product.descriptors} />
              )} */}

            {product.sync_color_images?.length > 1 && (
              <ProductColors
                product={product}
                currency={currency}
                params={params}
              />
            )}

            <div className="flex-col w-full h-auto rounded-[15px] bg-[#FCFCFC] mt-[12px] px-[10px]">
              <div
                className="py-[8px] gap-[1px] flex-col  w-full h-auto text-[#1D1D1D] text-[9px] regular rounded-none"
                style={{
                  borderBottom: "#D3D3D37f 1px solid",
                }}
              >
                <ExpectedIcon />
                <span className="flex-row gap-[12px] items-center">
                  {translateFunction(
                    "Expected Delivery Date",
                    languageVariable
                  )}

                  <svg
                    id="Group_14553"
                    data-name="Group 14553"
                    xmlns="http://www.w3.org/2000/svg"
                    width="9.996"
                    height="9.996"
                    viewBox="0 0 9.996 9.996"
                  >
                    <path
                      id="Subtraction_1"
                      data-name="Subtraction 1"
                      d="M.218,8.027a.215.215,0,0,1-.13-.045A.242.242,0,0,1,.009,7.73L.562,5.907A3.992,3.992,0,0,1,0,3.862,3.794,3.794,0,0,1,3.713,0,3.793,3.793,0,0,1,7.425,3.862,3.794,3.794,0,0,1,3.713,7.724,3.616,3.616,0,0,1,1.63,7.063L.341,7.987A.2.2,0,0,1,.218,8.027ZM3.679,5.816a.476.476,0,1,0,.468.476A.465.465,0,0,0,3.679,5.816Zm.1-3.79a.732.732,0,0,1,.795.733c0,.36-.152.583-.582.852a1.194,1.194,0,0,0-.68,1.073v.085c0,.266.142.431.372.431.213,0,.335-.135.355-.391.017-.371.151-.557.6-.83a1.4,1.4,0,0,0-.822-2.632,1.5,1.5,0,0,0-1.464.818.988.988,0,0,0-.1.431.321.321,0,0,0,.344.361c.187,0,.29-.09.358-.31A.792.792,0,0,1,3.775,2.025Z"
                      transform="translate(0 1.969)"
                      fill="#c4c2c2"
                    />
                    <path
                      id="Path_21380"
                      data-name="Path 21380"
                      d="M9.417,8.061a.216.216,0,0,1-.131.045.2.2,0,0,1-.122-.039l-1.29-.924-.015.009a4.426,4.426,0,0,0,.335-1.7A4.239,4.239,0,0,0,4.045,1.14a3.935,3.935,0,0,0-.911.106A3.6,3.6,0,0,1,5.792.079,3.794,3.794,0,0,1,9.5,3.941a3.98,3.98,0,0,1-.562,2.045L9.5,7.81a.239.239,0,0,1-.079.251Z"
                      transform="translate(-0.332 0.375)"
                      fill="#c4c2c2"
                    />
                    <rect
                      id="Rectangle_4714"
                      data-name="Rectangle 4714"
                      width="9.61"
                      height="9.996"
                      transform="translate(0.386)"
                      fill="none"
                    />
                  </svg>
                </span>
                <span
                  className={` w-max text-[#1D1D1D] text-[12px] regular mt-[3px] items-center flex  `}
                >
                  <span className="pr-[4px]"></span>
                  <span className="bold text-[#1D1D1D] text-[12px]  mx-[1px]">
                    <Skeleton width="35" height="15" borderRadius={16} />|{" "}
                    <Skeleton width="35" height="15" borderRadius={16} />
                    {translateFunction("Work Days")}{" "}
                    {translateFunction("At Your Address In", languageVariable)}
                    <span className="capitalize px-[3px]">
                      <Skeleton width="100%" height="100%" borderRadius={16} />
                    </span>
                  </span>
                </span>
              </div>
              <div
                className={`product-colors h-auto p-0 product-sizes flex-col align-start relative py-[8px]  rounded-none`}
                style={{
                  borderBottom: "#D3D3D37f 1px solid",
                }}
              >
                <div className="flex-col" data-cy="FreeShipping">
                  <FreeShippingIcon />
                  <div className="flex-col text-[#1d1d1d] medium text-[11px]">
                    <span>{translateFunction("Free Shipping")}</span>
                    <span className="text-[#1d1d1d] regular text-[9px]">
                      {translateFunction(
                        "Shipping Is Completely Free Without Any Extras"
                      )}
                    </span>
                    <div className="flex-row gap-[4px] items-start justify-start mt-[8px]">
                      <span>
                        <svg
                          data-cy="deleiveryuaranteeIcon"
                          xmlns="http://www.w3.org/2000/svg"
                          width="13.999"
                          height="14"
                          viewBox="0 0 13.999 14"
                        >
                          <g
                            id="Group_12949"
                            data-name="Group 12949"
                            transform="translate(0 0)"
                          >
                            <path
                              id="refund"
                              d="M2.252,5c.2-.229.389-.87.779-.643.308.3-.231.63-.338.917A.259.259,0,1,1,2.252,5Zm-.67,1.707c.136-.275.151-.94.586-.823a.26.26,0,0,1,.139.34c-.172.255-.127.883-.551.807a.26.26,0,0,1-.173-.324ZM1.376,8.529c.06-.3-.1-.95.353-.947a.259.259,0,0,1,.222.292c-.1.291.1.872-.316.923a.26.26,0,0,1-.259-.268Zm.271,1.814c-.02-.308-.339-.89.1-1.006.433,0,.28.6.408.888a.259.259,0,0,1-.5.118Zm.96,1.82c-.339-.052-.384-.543-.537-.8a.259.259,0,1,1,.48-.2C2.627,11.471,3.165,12.063,2.607,12.163Zm1.29.943a.262.262,0,0,1-.189.437c-.3-.059-.456-.431-.657-.638a.259.259,0,1,1,.413-.314,6.507,6.507,0,0,0,.433.515ZM5.128,14.59a2.465,2.465,0,0,1-.732-.455.26.26,0,0,1-.046-.365c.3-.308.629.231.915.339a.261.261,0,0,1-.137.48Zm1.643.644c-.271-.093-1.045-.192-.9-.6.214-.376.665.06.972.09a.261.261,0,0,1-.075.508Zm8.6-6.831a7.229,7.229,0,0,1-7.26,7,.26.26,0,0,1,0-.519A6.7,6.7,0,0,0,14.857,8.4,6.462,6.462,0,0,0,4,3.65H5.025a.26.26,0,0,1,0,.52H3.382a.269.269,0,0,1-.259-.276V2.348a.259.259,0,1,1,.519,0v.926A6.98,6.98,0,0,1,15.375,8.4Z"
                              transform="translate(-1.376 -1.403)"
                              fill="#26c13f"
                            />
                            <g id="box" transform="translate(4.122 3.777)">
                              <path
                                id="Path_22820"
                                data-name="Path 22820"
                                d="M6.94,1.071H2.566a.691.691,0,0,0-.691.691V6.827a.691.691,0,0,0,.691.691H6.94a.691.691,0,0,0,.691-.691V1.762A.691.691,0,0,0,6.94,1.071ZM7.4,6.827a.46.46,0,0,1-.46.46H2.566a.46.46,0,0,1-.46-.46V1.762a.46.46,0,0,1,.46-.46H3.717V3.06a.347.347,0,0,0,.5.31L4.7,3.127a.116.116,0,0,1,.1,0l.486.241a.344.344,0,0,0,.5-.308V1.3H6.94a.46.46,0,0,1,.46.46Z"
                                transform="translate(-1.875 -1.071)"
                                fill="#1d1d1d"
                              />
                              <path
                                id="Path_22821"
                                data-name="Path 22821"
                                d="M5.744,10.446H4.363a.346.346,0,0,0-.345.345v1.076a.346.346,0,0,0,.345.345H5.744a.346.346,0,0,0,.345-.345V10.792A.346.346,0,0,0,5.744,10.446ZM4.478,11.561a.115.115,0,0,1,.115-.115h.921a.115.115,0,1,1,0,.23H4.593A.115.115,0,0,1,4.478,11.561Zm1.036-.345H4.593a.115.115,0,1,1,0-.23h.921a.115.115,0,1,1,0,.23Z"
                                transform="translate(-3.097 -6.418)"
                                fill="#1d1d1d"
                              />
                              <path
                                id="Path_22822"
                                data-name="Path 22822"
                                d="M11.008,14.023H9.729a.115.115,0,1,0,0,.23h1.278a.115.115,0,1,0,0-.23Z"
                                transform="translate(-6.289 -8.457)"
                                fill="#1d1d1d"
                              />
                              <path
                                id="Path_22823"
                                data-name="Path 22823"
                                d="M11.482,12.77h-.921a.115.115,0,1,0,0,.23h.921a.115.115,0,1,0,0-.23Z"
                                transform="translate(-6.763 -7.743)"
                                fill="#1d1d1d"
                              />
                            </g>
                          </g>
                        </svg>
                      </span>
                      <div className="flex-col text-[#1d1d1d] medium text-[11px]">
                        <span>{translateFunction("Delivery Guarantee")}</span>

                        <span className="text-[#1d1d1d] regular text-[9px]">
                          {translateFunction("You Will Get A")}
                          <span className="text-[#388CFF]"> 25% </span>{" "}
                          <span className="text-[#388CFF]">
                            {translateFunction("Refund")}
                          </span>{" "}
                          {translateFunction(
                            "Of The Product Price If Shipping Is Delayed"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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

            <StoriesSkeleton />
            <div className="w-full flex-col">
              <div className="flex-col px-[10px]">
                <BuyersCommentIcon />
                <div className="flex-row gap-[11px] items-baseline text-[#1d1d1d] regular text-[11px]">
                  <span>
                    {translateFunction("Buyers Comment", languageVariable)}
                  </span>
                  <svg
                    id="Group_14553"
                    data-name="Group 14553"
                    xmlns="http://www.w3.org/2000/svg"
                    width="9.996"
                    height="9.996"
                    viewBox="0 0 9.996 9.996"
                  >
                    <path
                      id="Subtraction_1"
                      data-name="Subtraction 1"
                      d="M.218,8.027a.215.215,0,0,1-.13-.045A.242.242,0,0,1,.009,7.73L.562,5.907A3.992,3.992,0,0,1,0,3.862,3.794,3.794,0,0,1,3.713,0,3.793,3.793,0,0,1,7.425,3.862,3.794,3.794,0,0,1,3.713,7.724,3.616,3.616,0,0,1,1.63,7.063L.341,7.987A.2.2,0,0,1,.218,8.027ZM3.679,5.816a.476.476,0,1,0,.468.476A.465.465,0,0,0,3.679,5.816Zm.1-3.79a.732.732,0,0,1,.795.733c0,.36-.152.583-.582.852a1.194,1.194,0,0,0-.68,1.073v.085c0,.266.142.431.372.431.213,0,.335-.135.355-.391.017-.371.151-.557.6-.83a1.4,1.4,0,0,0-.822-2.632,1.5,1.5,0,0,0-1.464.818.988.988,0,0,0-.1.431.321.321,0,0,0,.344.361c.187,0,.29-.09.358-.31A.792.792,0,0,1,3.775,2.025Z"
                      transform="translate(0 1.969)"
                      fill="#c4c2c2"
                    />
                    <path
                      id="Path_21380"
                      data-name="Path 21380"
                      d="M9.417,8.061a.216.216,0,0,1-.131.045.2.2,0,0,1-.122-.039l-1.29-.924-.015.009a4.426,4.426,0,0,0,.335-1.7A4.239,4.239,0,0,0,4.045,1.14a3.935,3.935,0,0,0-.911.106A3.6,3.6,0,0,1,5.792.079,3.794,3.794,0,0,1,9.5,3.941a3.98,3.98,0,0,1-.562,2.045L9.5,7.81a.239.239,0,0,1-.079.251Z"
                      transform="translate(-0.332 0.375)"
                      fill="#c4c2c2"
                    />
                    <rect
                      id="Rectangle_4714"
                      data-name="Rectangle 4714"
                      width="9.61"
                      height="9.996"
                      transform="translate(0.386)"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>
              <HortiznalScrollBar
                id="comments-buyers-bar-loading"
                className="flex-row w-full gap-[4px]"
              >
                {Array.from({ length: 5 }).map((s, i) => {
                  return (
                    <div
                      key={i}
                      className={`comment-item rounded-[15px] flex-col justify-between min-w-[330px] max-w-[${90}%] w-full bg-[#F8F8F8] min-h-[111px] py-[8px] px-[10px]`}
                      style={{
                        position: "relative",
                      }}
                    >
                      <div className="w-full flex-col">
                        <div className="flex-row items-center">
                          <div className="comment-photo">
                            <Skeleton
                              width={20}
                              height={20}
                              borderRadius={"50%"}
                            />
                          </div>
                          <div className="comment-content capitalize">
                            <div
                              className="comment-source text-[#1D1D1D] text-[9px] regular"
                              data-cy="Source-Of-Comment"
                            >
                              <Skeleton
                                width="35"
                                height="15"
                                borderRadius={16}
                              />
                            </div>
                          </div>
                        </div>
                        <div
                          className="comment-date text-[9px]"
                          data-cy="Date-Of-Comment"
                        >
                          <Skeleton width="35" height="15" borderRadius={16} />
                        </div>
                        <div className="comment-text regular text-[#1d1d1d] text-[11px] mt-[0px]">
                          <Skeleton width="35" height="15" borderRadius={16} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </HortiznalScrollBar>
              <div className="flex-row pl-[10px] pr-[3px] justify-between w-full items-center">
                <div className="flex-row  gap-[4px] text-[#1d1d1d] text-[9px] regular"></div>
                <div className="flex-row gap-[4px] text-[9px] text-[#1d1d1d]">
                  <Skeleton width="80" height="15" borderRadius={4} />
                </div>
              </div>
            </div>
            {/* <FAQSection comments={product?.comments} lang={params.lang} /> */}
            {/* {product?.choice_options?.filter(
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
              )} */}
          </div>
        </div>
      </div>

      <div
        className="product-details-footer max-h-[76px] min-h-[76px] z-[999999999]"
        style={{
          bottom: "initial",
          top: " calc(100vh - 177px)",
        }}
      >
        <div className="product-info-container">
          <div className="product-info-price">
            {product?.offer_price >= 0 && (
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
                {(currency?.exchange_rate &&
                  product?.price &&
                  RoundPrice({
                    num: product?.price,
                    rate: currency?.exchange_rate,
                    points: 0,
                    language: languageVariable,
                  })) ?? <Skeleton width={30} height={10} />}
              </div>
            )}
            <div className="product-new-price">
              {(currency?.exchange_rate &&
                product?.offer_price &&
                RoundPrice({
                  num: product?.offer_price,
                  rate: currency?.exchange_rate,
                  points: 0,
                  language: languageVariable,
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
                {translateFunction("Ship To You Accepted")}{" "}
                {translateFunction("2 June")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductLoader;
export const ProductFooterSkeleton = () => {
  return (
    <div className="product-options-container">
      <div className={`add-cart-button`}>
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
