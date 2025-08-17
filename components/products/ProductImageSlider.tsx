"use client";
import useEmblaCarousel, { UseEmblaCarouselType } from "embla-carousel-react";
import React, { useEffect } from "react";

import {
  GA_EVENT_NAMES,
  GA_GLOBAL_PLATFORM,
  GA_GLOBAL_SCREEN,
} from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { RoundPrice } from "utils/functions";
import auth from "services/auth";
import { useAppStore } from "store";
function ProductImagesSlider({ children }) {
  const { SelectedProduct, currency } = useAppStore();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    dragFree: false,
    containScroll: "trimSnaps",
    align: "start",
  });
  useEffect(() => {
    GAevent({
      action: GA_EVENT_NAMES.SCREEN_VIEW,
      params: {
        screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
        screen_path: window.location.pathname,
      },
    });
  }, []);
  useEffect(() => {
    if (emblaApi && SelectedProduct) {
      // Function to send GA events for visible slides
      const sendGAEventsForVisibleSlides = () => {
        const currentIndex = emblaApi.selectedScrollSnap();
        const slidesInView = emblaApi.slidesInView();

        // Call GA event for each slide that is in view
        slidesInView.forEach((slideIndex) => {
          GAevent({
            action: GA_EVENT_NAMES.VIEW_IMAGE,
            params: {
              image_index: slideIndex,
              user_id_custom: auth.UserID(),
              item_id: SelectedProduct.id,
              item_name: SelectedProduct?.name,
              brand: SelectedProduct?.brand?.name,
              brand_id: SelectedProduct?.brand?.id,
              category:
                SelectedProduct?.category?.name ||
                SelectedProduct?.categories?.[0]?.name,
              category_id:
                SelectedProduct?.category?.id ||
                SelectedProduct?.categories?.[0]?.id,
              price: RoundPrice({
                num: SelectedProduct?.offer_price,
                rate: currency?.exchange_rate,
                returnNumber: true,
                language: "en",
              }),
            },
          });
        });
      };

      // Send initial GA events for slides currently in view
      setTimeout(() => {
        sendGAEventsForVisibleSlides();
      }, 100);

      // Listen for slide changes
      const handleSlidesChanged = (e, evt) => {
        sendGAEventsForVisibleSlides();
      };

      const handleSelect = (e, evt) => {
        sendGAEventsForVisibleSlides();
      };

      const handleSettle = (e, evt) => {
        sendGAEventsForVisibleSlides();
      };

      emblaApi.on("slidesChanged", handleSlidesChanged);
      emblaApi.on("select", handleSelect);
      emblaApi.on("settle", handleSettle);

      return () => {
        emblaApi.off("slidesChanged", handleSlidesChanged);
        emblaApi.off("select", handleSelect);
        emblaApi.off("settle", handleSettle);
      };
    }
  }, [emblaApi, SelectedProduct, currency]);
  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">{children}</div>
    </div>
  );
}

export default ProductImagesSlider;
