import OfferSlideItem from "./OfferSlideItem";
import OfferAvatars from "./OfferAvatars";
import { Boutique } from "models/offer";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
interface OfferPhotosSliderProps {
  OfferPhotos: string[];
  extended: boolean;
  priority: boolean;
  boutique: Boutique;
  myKey: number;
}
function OfferPhotosSlider({
  OfferPhotos,
  boutique,
  myKey,
  extended,
  priority,
}: OfferPhotosSliderProps) {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000 }),
  ]);

  return (
    <div
      className="offer-slider-container"
      style={{ marginTop: extended && "39px" }}
    >
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {OfferPhotos.map((offerPhoto, key) => (
            <div className="embla__slide" key={key}>
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
      <OfferAvatars boutique={boutique} priority={false} />
    </div>
  );
}

export default OfferPhotosSlider;
