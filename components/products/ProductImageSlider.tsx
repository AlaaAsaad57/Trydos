"use client";
import useEmblaCarousel from "embla-carousel-react";
import React, { useEffect } from "react";

import {
  GA_EVENT_NAMES,
  GA_GLOBAL_PLATFORM,
  GA_GLOBAL_SCREEN,
} from "utils/GAEvents";
import { GAevent } from "utils/gtag";
function ProductImagesSlider({ children }) {
  const [emblaRef] = useEmblaCarousel({
    loop: false,
  });
  useEffect(() => {
    GAevent({
      action: GA_EVENT_NAMES.SCREEN_VIEW,
      params: {
        screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
        platform: GA_GLOBAL_PLATFORM.WEB,
        timestamp: new Date().toISOString(),
        screen_path: window.location.pathname,
      },
    });
  }, []);
  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">{children}</div>
    </div>
  );
}

export default ProductImagesSlider;
