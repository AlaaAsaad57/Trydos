import ProductImageIndicator from "components/products/ProductImageIndicator";
import ProductImagesSlider from "components/products/ProductImageSlider";
import VirtualTryOn from "components/products/VirtualTryOn";

import Image from "next/image";
import { cookies } from "next/headers";

import { getConfiguredImage, GetImageUrl } from "utils/server";
import ProductRedeemCounter from "components/products/ProductRedeemCounter";
import FlashDealBanner from "components/products/FlashDealBanner";

async function ProductPhotoSliderWrapper({
  language,
  globalPromise,
  color,
  qtyPromise,
}) {
  let [globalDetails, qtyPromiseData] = await Promise.all([
    globalPromise,
    qtyPromise,
  ]);

  const isRtl = language === "ar" || language === "ku";
  const isRedeemed = async () => {
    if (!qtyPromiseData?.is_redeem) return false;
    const cookiesStore = await cookies();
    let redeemed: any = cookiesStore.get("redeemd_ids")?.value;
    redeemed = redeemed ? JSON.parse(redeemed) : null;
    if (
      redeemed &&
      redeemed.find((s) => String(s.id) === String(qtyPromiseData.id))
    ) {
      return false;
    } else {
      return true;
    }
  };
  const redeemed_status = await isRedeemed();
  qtyPromiseData = { ...qtyPromiseData, is_redeem: redeemed_status };

  //   utils
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
  const isFlashDeal = () => {
    let endDate = globalDetails.flash_deal_end_date;
    let isFlash: any = false;
    if (endDate) {
      const now = new Date();
      const dealEnd = new Date(endDate);
      dealEnd.setHours(23, 59, 59, 999);
      isFlash = now < dealEnd;
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      const difference = endDateObj.getTime() - now.getTime();
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        isFlash = {
          days: days,
          hours: hours,
          minutes: minutes,
          seconds: seconds,
        };
      } else {
        isFlash = null;
      }
    }

    return isFlash;
  };
  qtyPromiseData = { ...qtyPromiseData, isFlash: isFlashDeal() };
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
    if (globalDetails?.flash_deal_end_date) {
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
          if (!isRtl)
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
  // utils end

  return (
    <ProductImagesSlider language={language}>
      {getImages(globalDetails, color)?.images?.map((img, i) => (
        <div
          key={i}
          className={`${i === 0 ? "z-[99999999]" : "z-[88]"} relative flex`}
        >
          <div
            className={`${getRoundedClass(
              i,
              getImages(globalDetails, color)?.images?.length
            )} embla__slide product-slider-images relative`}
            key={img?.file_path}
          >
            {getImageBorder(i, getImages(globalDetails, color)?.images?.length)}
            <Image
              className={`${getRoundedClass(
                i,
                getImages(globalDetails, color)?.images?.length
              )} w-[320px] h-[464px]`}
              width={320}
              height={464}
              priority={i === 0}
              loading={"eager"}
              alt={globalDetails.name}
              src={getConfiguredImage({
                src: GetImageUrl(img),
                width: 500,
                height: 700,
              })}
            />
            <ProductImageIndicator language={language} />
          </div>
          {i === 0 && (
            <>
              {globalDetails?.categories?.[0]?.icon && (
                <VirtualTryOn
                  language={language}
                  product={{
                    id: globalDetails?.id,
                    slug: globalDetails?.slug,
                    images: getImages(globalDetails, color)?.images,
                  }}
                />
              )}

              {qtyPromiseData?.isFlash && (
                <FlashDealBanner
                  initial={qtyPromiseData?.isFlash}
                  language={language}
                  end_data={globalDetails.flash_deal_end_date}
                />
              )}
              {qtyPromiseData?.is_redeem && (
                <ProductRedeemCounter
                  language={language}
                  product_id={qtyPromiseData.id}
                />
              )}
            </>
          )}
        </div>
      ))}
    </ProductImagesSlider>
  );
}

export default ProductPhotoSliderWrapper;
