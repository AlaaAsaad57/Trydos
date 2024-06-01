import OfferSlideItem from "./OfferSlideItem";
import OfferAvatars from "./OfferAvatars";
import { Boutique } from "models/offer";
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
  return (
    <div
      className="offer-slider-container"
      style={{ marginTop: extended && "39px" }}
    >
      <div className="slider-container">
        {OfferPhotos.map((offerPhoto, key) => (
          <OfferSlideItem
            mykey={myKey}
            offerPhoto={offerPhoto}
            isSingle={false}
            priority={priority}
            key={key}
          />
        ))}
      </div>
      <OfferAvatars boutique={boutique} priority={false} />
    </div>
  );
}

export default OfferPhotosSlider;
