"use client";
import useEmblaCarousel from "embla-carousel-react";
import React, { useEffect, useRef } from "react";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import auth from "services/auth";
import { useAppStore } from "store";
function ProductImagesSlider({ children, language, productGA }) {
  const isRtl = language === "ar" || language === "ku";

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    dragFree: false,
    containScroll: "trimSnaps",
    align: "start",
    direction: isRtl ? "rtl" : "ltr",
  });

  useEffect(() => {
    GAevent({
      action: GA_EVENT_NAMES.VIEW_IMAGE,
      params: {
        // image_index: slideIndex,
        user_id_custom: auth.UserID(),
        ...productGA,
      },
    });
    GAevent({
      action: GA_EVENT_NAMES.SCREEN_VIEW,
      params: {
        screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
        screen_path: window.location.pathname,
      },
    });
  }, []);
  return (
    <div className="embla" ref={emblaRef}>
      <div
        className={`embla__container ${
          isRtl ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default ProductImagesSlider;
