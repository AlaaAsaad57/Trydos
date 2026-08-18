"use client";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";

function BoutiquePhotoSliderWrapper({ children }) {
  const [emblaRef] = useEmblaCarousel({ loop: false }, [
    Autoplay({ delay: 3000 }),
  ]);
  return (
    <div data-pw="embla_embla" className="embla" ref={emblaRef}>
      <div data-pw="embla__container_embla" className="embla__container">
        {children}
      </div>
    </div>
  );
}

export default BoutiquePhotoSliderWrapper;
