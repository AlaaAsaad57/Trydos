"use client";
import useEmblaCarousel from "embla-carousel-react";
import React, { useEffect, useRef } from "react";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import auth from "services/auth";
import { useAppStore } from "store";
function ProductImagesSlider({ children, language }) {
  const { SelectedProduct, currency } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    dragFree: false,
    containScroll: "trimSnaps",
    align: "start",
    direction: isRtl ? "rtl" : "ltr",
  });
  // Track which slide indexes have already fired a GA event to avoid duplicates
  const sentSlidesRef = useRef<Set<number>>(new Set());

  // Reset sent slides when the product changes
  useEffect(() => {
    sentSlidesRef.current.clear();
  }, [SelectedProduct?.id]);

  // Guarded screen view event to avoid duplicate fires (e.g., React Strict Mode in dev)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pathKey = `__ga_screen_view_sent_${window.location.pathname}`;
    if ((window as any)[pathKey]) return;
    (window as any)[pathKey] = true;

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
      // Function to send GA events for visible slides (deduped per slide)
      const sendGAEventsForVisibleSlides = () => {
        const slidesInView = emblaApi.slidesInView();

        slidesInView.forEach((slideIndex) => {
          if (sentSlidesRef.current.has(slideIndex)) return;
          sentSlidesRef.current.add(slideIndex);

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
              price: SelectedProduct?.offer_price,
            },
          });
        });
      };

      // Send initial GA events for slides currently in view
      setTimeout(() => {
        sendGAEventsForVisibleSlides();
      }, 100);

      // Listen only for selection changes to avoid multiple initial triggers
      const handleSelect = () => {
        sendGAEventsForVisibleSlides();
      };

      emblaApi.on("select", handleSelect);

      return () => {
        emblaApi.off("select", handleSelect);
      };
    }
  }, [emblaApi, SelectedProduct, currency]);
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
