import Image from "next/image";
import {
  getConfiguredImage,
  GetImageUrl,
  RoundPrice,
  getVideoUrl,
  getUrlofProduct,
} from "utils/server";
import ProductPhotosWrapper from "./ProductPhotosWrapper";
import NextLink from "components/global/NextLink";
import VerifiedIcon from "public/svg/listing/VerifiedIcon";
import { ProductLabelsAnimated } from "components/products/ProductLabelsAnimated";
import { OldPrice } from "./OldPrice";
import { RenderPrice } from "./RenderPrice";
import FlashDealBanner from "components/products/FlashDealBanner";
import ProductButtonWrapper from "./ProductButtonWrapper";
import "styles/product-card.css";
import ProductColorsWrapper from "components/clientWrapper/product/ProductColorsWrapper";
import ImageAvatar from "components/ListingPage/ImageAvatar";
import StackedSlider from "./StackedColors";
import ProductColorsBottomSheet from "./ProductColorsBottomSheet";
import ProductColorsCards from "./ProductColorsCards";
function ProductWrapper({
  images,
  videos,
  id,
  color = null,
  slug,
  name,
  category_tree,
  language,
  labels,
  brand,
  currency,
  is_redeem,
  endDate,
  is_flashDeal,
  redeem_price,
  price,
  offer_price,
  flash_deal_price,
  country,
  Sliders = false,
  InitialProductData,
}) {
  let isRtl = language === "ar" || language === "ku";
  let isFlash: any = null;

  let flash_price = offer_price ?? price;
  if (is_flashDeal && endDate) {
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
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
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
  if (isFlash) {
    flash_price = flash_deal_price ?? offer_price ?? price;
  }

  const shouldShowOrangeBorder = () => {
    if (isFlash || is_redeem) {
      return true;
    }
    return false;
  };

  const rearrangedImages = () => {
    if (
      !InitialProductData?.sync_color_images ||
      InitialProductData?.sync_color_images.length === 0
    )
      return [];
    const [first, ...rest] = InitialProductData?.sync_color_images;
    const middleIndex = Math.floor(rest.length / 2);
    const newArray = [
      ...rest.slice(0, middleIndex),
      first,
      ...rest.slice(middleIndex),
    ];
    return newArray;
  };
  let initialIndex = 0;
  if (InitialProductData?.sync_color_images?.length > 0) {
    const [first, ...rest] = InitialProductData?.sync_color_images;

    initialIndex = Math.floor(rest.length / 2);
  }

  return (
    <div
      id={`product_${slug}`}
      className={`${is_redeem && `product_redeem`}  relative flex`}
    >
      {Sliders && (
        <ProductColorsBottomSheet id={id}>
          <ProductColorsCards
            currency={currency}
            shouldShowOrangeBorder={() => shouldShowOrangeBorder()}
            country={country}
            language={language}
            slug={slug}
            InitialProductData={InitialProductData}
          />
        </ProductColorsBottomSheet>
      )}
      {color && (
        <ProductColorsWrapper product={InitialProductData}>
          <StackedSlider
            disableSlide={true}
            initial_index={initialIndex}
            min_scale={0.6}
            max_scale={1}
            overlap_factor={0.4}
            slide_height={35}
            slide_width={35}
            slidesArray={rearrangedImages().map((_, i) => i)}
          >
            {rearrangedImages().map((img, i) => (
              <div
                key={i}
                className="image-avatar bg-white overflow-visible rounded-50 flex cursor-pointer"
                // Note: Width/Height on this child are now controlled by the parent wrapper
              >
                <ImageAvatar
                  priority={true}
                  width={35}
                  height={35}
                  // logic for isActive is optional here as the parent handles visual focus
                  isActive={i === initialIndex}
                  image={getConfiguredImage({
                    src: GetImageUrl(img.images[0]?.file_path),
                    height: 60,
                  })}
                  name={i === initialIndex ? "#FF5F61" : "#1D1D1D"}
                  alt={name}
                />
              </div>
            ))}
          </StackedSlider>
        </ProductColorsWrapper>
      )}
      <NextLink
        // onClick={() => {
        //   if (ProductData?.is_redeem) {
        //     let text = document.querySelector(
        //       `#counter-${product.product_id}`
        //     )?.textContent;
        //     if (text) text = text.match(/\d+/)[0];
        //     if (text?.length)
        //       localStorage.setItem(
        //         "counter",
        //         JSON.stringify({
        //           counter: text,
        //           product_id: product?.product_id,
        //         })
        //       );
        //   }
        //   storeCookies();
        // }}

        ariaLabel={`go to product ${name} ${language}`}
        href={getUrlofProduct(color, language, country, slug)}
        className="product-container  align-center flex-col relative pb-[12px]"
        data-cy="product_link"
        id={slug}
      >
        {Sliders ? (
          <div
            className={`product-container-slider h-[290px] duration-300 w-full relative`}
          >
            <ProductPhotosWrapper>
              {videos && videos.length > 0 ? (
                <>
                  {videos.map((video, idx) => (
                    <div
                      key={idx}
                      className="embla__slide flex-shrink-0"
                      style={{
                        width: `${200}px`,
                        height: "100%",
                      }}
                    >
                      <div className="flex w-full h-[290px] relative" key={idx}>
                        {/* <BorderImage isBig={true} /> */}
                        <div
                          className={
                            "inset-shadow-img w-[200px] h-[290px] rounded-15 absolute "
                          }
                        />
                        <video
                          src={getVideoUrl(videos[idx], {
                            width: 400,
                            height: 580,
                          })}
                          autoPlay
                          loop
                          muted
                          playsInline
                          controls={false}
                          style={{
                            border: shouldShowOrangeBorder()
                              ? "1px solid #FF6200"
                              : "1px solid #d3d3d3",
                          }}
                          className={`${
                            is_redeem && "product-media-redeem-show"
                          } w-[200px] h-[290px] border-[#d3d3d387] object-cover object-[top_center] border-[1px] rounded-15 z-10`}
                        />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {images?.map((image, idx) => (
                    <div
                      key={idx}
                      className="embla__slide flex-shrink-0"
                      style={{
                        width: `${200}px`,
                        height: "100%",
                      }}
                    >
                      <div className="flex w-full h-[290px] relative" key={idx}>
                        {/* <BorderImage isBig={true} /> */}
                        <div className="inset-shadow-img w-[200px] h-[290px] rounded-15 absolute " />
                        <Image
                          width={400}
                          height={580}
                          loading="eager"
                          quality={100}
                          fetchPriority="auto"
                          src={getConfiguredImage({
                            src: GetImageUrl(image),
                            width: 400,
                            height: 580,
                          })}
                          style={{
                            border: shouldShowOrangeBorder()
                              ? "1px solid #FF6200"
                              : "1px solid #d3d3d3",
                          }}
                          className={`${
                            is_redeem && "product-media-redeem-show"
                          } w-[200px] h-[290px] border-[#d3d3d387] object-cover object-[top_center] border-[1px] rounded-15 z-10`}
                          alt={name || "alt"}
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </ProductPhotosWrapper>
          </div>
        ) : (
          <div
            className="product-photos z-10 min-h-[290px]  max-h-[290px] overflow-visible w-100 justify-start align-center flex-col"
            style={{
              position: "static",
              opacity: "1",
              zIndex: "4",
            }}
          >
            <div
              className={`product-container-slider h-[290px] duration-300 w-full relative`}
            >
              <div className="inset-shadow-img w-[200px] h-[290px] rounded-15 absolute " />
              <Image
                width={400}
                height={580}
                quality={100}
                loading="eager"
                fetchPriority="auto"
                style={{
                  borderRadius: "15px",
                  zIndex: "3",
                  border: Boolean(shouldShowOrangeBorder())
                    ? "1px solid #FF6200"
                    : "1px solid #d3d3d3",
                }}
                src={getConfiguredImage({
                  src: GetImageUrl(images[0]),
                  width: 400,
                  height: 580,
                })}
                className={`${
                  is_redeem && "product-media-redeem-show"
                } w-[200px] h-[290px] object-cover object-[top_center]`}
                alt={name || "alt"}
              />
            </div>
          </div>
        )}
        <div
          style={{
            direction: isRtl ? "rtl" : "ltr",
          }}
          className="product-body pl-[13px] pr-[15px] z-10 flex-1 mt-[8px] w-100 flex-col align-start justify-start max-h-[60px] min-h-[30px]"
        >
          <div
            className="prouct-details max-w-full whitespace-normal inline-block  text-left align-top overflow-hidden  regular-text text-[#3c3c3c] text-[10px] max-h-[28px]"
            data-cy="productName"
          >
            <span className="flex-row align-center justify-start gap-[4px]">
              {brand?.icon ? (
                <img
                  src={GetImageUrl(brand.icon)}
                  alt={brand.name || "Brand"}
                  className="h-[15px]  object-cover w-[30px] inline-block ml-[7px]"
                  loading="eager"
                  draggable="false"
                />
              ) : (
                <div className="h-[15px] w-[49.358px] bg-gray-200 rounded" />
              )}
              {brand?.is_verified === 1 && <VerifiedIcon />}
            </span>
            <p
              className={`${isRtl && "dir-rtl"} truncate w-full max-w-full`}
              data-cy="product-name"
            >
              {[name, ...category_tree?.map((s) => s)]
                ?.filter((s) => typeof s === "string")
                ?.join(" | ")}
            </p>
          </div>
          {labels?.length > 0 && <ProductLabelsAnimated labels={labels} />}
        </div>
        {isFlash && (
          <FlashDealBanner
            initial={isFlash}
            language={language}
            end_data={endDate}
          />
        )}
        <div
          style={{
            direction: isRtl ? "rtl" : "ltr",
          }}
          className="product-footer justify-between pl-[17.5px] pr-[15px] left-0 bottom-[10px] absolute w-100 flex-row align-center max-h-[30px]"
        >
          <div className={`${isRtl && "dir-rtl"} price-label flex`}>
            {price !== offer_price && offer_price !== 0 && (
              <OldPrice
                price={RoundPrice({
                  num: price,
                  rate: currency?.exchange_rate,
                  points: currency?.decimal_digits,
                })}
              />
            )}

            <RenderPrice
              currency={currency}
              flash_price={flash_price}
              is_redeem={is_redeem}
              offer_price={offer_price}
              price={price}
            />

            <span className="currency-label light-text color-dark-gray flex f-10">
              {currency?.symbol}
            </span>
          </div>
        </div>
      </NextLink>
      <ProductButtonWrapper
        InitialProductData={InitialProductData}
        slug={slug}
        currency={currency}
        endDate={endDate}
        flash_deal_price={flash_deal_price}
        is_flashDeal={is_flashDeal}
        id={id}
        is_redeem={is_redeem}
        language={language}
        offer_price={offer_price}
        price={price}
        redeem_price={redeem_price}
      />
    </div>
  );
}

export default ProductWrapper;
