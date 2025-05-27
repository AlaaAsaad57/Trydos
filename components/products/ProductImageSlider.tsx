"use client";
import useEmblaCarousel from "embla-carousel-react";
import React from "react";
function ProductImagesSlider({ children }) {
  const [emblaRef] = useEmblaCarousel({
    loop: false,
  });
  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">{children}</div>
    </div>
  );
}

export default ProductImagesSlider;
