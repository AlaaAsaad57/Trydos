"use client";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { getConfiguredImage } from "utils/functions";
import CloseIcon from "components/Home/Stories/CloseIcon";
import { useAppStore } from "store";
import { DisableScroll, EnableScroll, GetImageUrl, whenUserIdReady } from "utils/tinyUtils";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import auth from "services/auth";
function ProductDetailsSlider({ images, productGA, resetLoader = true }: any) {
  const { setIsNavigating, setIsProductPage } = useAppStore();
  const [imageShow, showImage] = useState(-1);
  const [emblaRef1, emblaApi] = useEmblaCarousel({
    startIndex: 0,
    dragFree: false,
    containScroll: "trimSnaps",
    align: "start",
  });

  useEffect(() => {
    let elements;
    setIsNavigating(true);
    if (resetLoader) {
      EnableScroll();
      setIsNavigating(null);
    }

    if (resetLoader) {
      elements = document.querySelectorAll(".product-slider-images");
      if (productGA)
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
      if (!productGA) return;
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
    if (!productGA) return;
    let engagementTimeoutId: NodeJS.Timeout | null = null;

    const launchEvents = (userId: any) => {
      const activeUserId =
        userId ??
        auth.UserID() ??
        useAppStore.getState().userProfile?.id ??
        useAppStore.getState().user?.id;

      GAevent({
        action: GA_EVENT_NAMES.VIEW_PRODUCT_EVENT,
        params: {
          user_id_custom: activeUserId,
          ...productGA,
        },
      });

      const handleTwentySecondAction = () => {
        if (!productGA) return;

        GAevent({
          action: GA_EVENT_NAMES.VIEW_ITEM_PRODUCT,
          params: {
            user_id_custom:
              auth.UserID() ??
              useAppStore.getState().userProfile?.id ??
              useAppStore.getState().user?.id ??
              activeUserId,
            engagement_time: 20,
            ...productGA,
          },
        });
      };

      // Set up the 20-second timeout
      engagementTimeoutId = setTimeout(handleTwentySecondAction, 20000);
    };

    const cleanup = whenUserIdReady(launchEvents, () => auth.UserID());

    return () => {
      cleanup();
      if (engagementTimeoutId) {
        clearTimeout(engagementTimeoutId);
      }
    };
  }, [productGA?.item_id]);

  return (
    <>
      {imageShow >= 0 && (
        <div className="fixed cursor-pointer bg-[#0000004d] flex justify-center items-center h-screen w-screen top-0 left-0 p-4 z-9999999999">
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
                    quality={100}
                    className="object-contain"
                    alt={productGA.item_name}
                    src={getConfiguredImage({
                      src: GetImageUrl(img),
                      width: 500,
                      height: 700,
                      q: 100,
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
