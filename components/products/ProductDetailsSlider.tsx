"use client";
import React, { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { getConfiguredImage, RoundPrice } from "utils/functions";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CloseIcon from "components/Home/Stories/CloseIcon";
import { useAppStore } from "store";
import { DisableScroll, EnableScroll, GetImageUrl } from "utils/tinyUtils";
import { ProductDetailsSliderPropsType } from "models/componentType/productTypes/ProductDetailsSliderPropsType";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import auth from "services/auth";
function ProductDetailsSlider({
  currency,
  images,
  productGA,
  resetLoader = true,
}: ProductDetailsSliderPropsType) {
  const { setCurrency, setIsNavigating } = useAppStore();
  const [imageShow, showImage] = useState(-1);
  const [emblaRef1, emblaApi] = useEmblaCarousel({
    startIndex: 0,
    dragFree: false,
    containScroll: "trimSnaps",
    align: "start",
  });

  useEffect(() => {
    let elements;
    if (resetLoader) setIsNavigating(null);
    if (currency) setCurrency(currency);
    if (resetLoader) {
      elements = document.querySelectorAll(".product-slider-images");
      elements.forEach((elem, index) => {
        elem.addEventListener("click", function (e) {
          GAevent({
            action: GA_EVENT_NAMES.ZOOM_IMAGE,
            params: {
              image_index: index,
              user_id_custom: auth.UserID(),
              ...productGA,
            },
          });
          DisableScroll();
          showImage(index);
        });
      });
    }

    return () => {
      if (resetLoader)
        elements.forEach((elem, index) => {
          elem.removeEventListener("click", () => showImage(index));
        });
    };
  }, []);
  useEffect(() => {
    if (emblaApi && imageShow >= 0) {
      emblaApi.scrollTo(imageShow);

      const handleSelect = (e, evt) => {
        const currentIndex = emblaApi.selectedScrollSnap();

        GAevent({
          action: GA_EVENT_NAMES.ZOOM_IMAGE,
          params: {
            image_index: currentIndex,
            user_id_custom: auth.UserID(),
            ...productGA,
          },
        });
      };

      const handleSettle = (e, evt) => {
        const currentIndex = emblaApi.selectedScrollSnap();
      };

      emblaApi.on("select", handleSelect);
      emblaApi.on("settle", handleSettle);

      return () => {
        emblaApi.off("select", handleSelect);
        emblaApi.off("settle", handleSettle);
      };
    }
  }, [emblaApi, imageShow]);
  useEffect(() => {
    const handleTwentySecondAction = () => {
      // Add your 20-second action here

      // Example actions you might want to perform:
      // - Send analytics data
      // - Show a notification
      // - Trigger some business logic
      // - Update component state

      // Example: Track user engagement after 20 seconds
      GAevent({
        action: GA_EVENT_NAMES.VIEW_ITEM_PRODUCT,
        params: {
          user_id_custom: auth.UserID(),
          engagement_time: 20,
          ...productGA,
        },
      });
    };

    // Set up the 20-second timeout
    const timeoutId = setTimeout(handleTwentySecondAction, 20000);
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      {imageShow >= 0 && (
        <div className="fixed cursor-pointer bg-[#0000004d] flex justify-center items-center h-[100vh] w-[100vw] top-0 left-0 p-4 z-[9999999999]">
          <span className="absolute right-3 top-4 z-50">
            {" "}
            <CloseIcon
              close={() => {
                EnableScroll();
                showImage(-1);
              }}
            />
          </span>

          <div className="embla" ref={emblaRef1}>
            <div className="embla__container">
              {images?.map((img, i) => (
                <div
                  className="embla__slide flex justify-center min-w-[98%]"
                  key={img?.file_path}
                  onClick={() => {
                    showImage(i);
                  }}
                >
                  <Image
                    width={320}
                    height={464}
                    style={{
                      height: "auto",
                      maxHeight: "90%",
                      width: "100%",

                      borderRadius: "10px",
                    }}
                    priority={i === 0}
                    loading="eager"
                    alt={productGA.item_name}
                    src={getConfiguredImage({
                      src: GetImageUrl(img),
                      width: 500,
                      height: 700,
                    })}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductDetailsSlider;
