import useEmblaCarousel from "node_modules/embla-carousel-react/esm";
import React from "react";

function ProductPhotosWrapper({ children }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: 0,
    dragFree: false,
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });
  return (
    <div
      className={`overflow-hidden relative `}
      style={{
        width: `${200}px`,
        height: `${291}px`,
        touchAction: "pan-y",
        cursor: "grab",
      }}
    >
      <div className="embla p-0" ref={emblaRef}>
        <div className="embla__container flex">{children}</div>
      </div>
    </div>
  );
}

export default ProductPhotosWrapper;
