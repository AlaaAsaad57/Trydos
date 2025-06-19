"use client";
import OfferSlideItem from "./OfferSlideItem";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
interface OfferPhotosSliderProps {
  OfferPhotos: { file_path: string }[];
  extended: boolean;
  priority: boolean;

  myKey: number;
}
function OfferPhotosSlider({
  OfferPhotos,

  myKey,
  extended,
  priority,
}: OfferPhotosSliderProps) {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000 }),
  ]);

  return (
    <div
      data-cy="offer_slider_container_length1"
      className="offer-slider-container"
      style={{ marginTop: extended && "39px" }}
    >
      <div data-cy="embla_length1" className="embla" ref={emblaRef}>
        <div data-cy="embla__container_length1" className="embla__container">
          {OfferPhotos.map((offerPhoto, key) => (
            <div
              data-cy="embla__slide_length1"
              className="embla__slide"
              key={key}
            >
              <OfferSlideItem
                mykey={key < 1 ? myKey : 10}
                offerPhoto={offerPhoto}
                isSingle={false}
                priority={priority}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OfferPhotosSlider;
