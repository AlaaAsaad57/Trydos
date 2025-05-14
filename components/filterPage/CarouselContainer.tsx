"use client";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import React from "react";

function CarouselContainer({ children }) {
  const [emblaRef] = useEmblaCarousel({ loop: false }, [
    Autoplay({ delay: 3000 }),
  ]);
  return (
    <div data-cy="embla_embla" className="embla" ref={emblaRef}>
      <div data-cy="embla__container_embla" className="embla__container">
        {children}
      </div>
    </div>
  );
}

export default CarouselContainer;
