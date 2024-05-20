import OfferSlideItem from "./OfferSlideItem";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
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
  var settings = {
    dots: false,
    arrows: false,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    slide: null,
    centerPadding: "10px",
    centerMode: true,
  };
  return (
    <div
      className="offer-slider-container"
      style={{ marginTop: extended && "39px" }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
      }}
    >
      <Slider
        {...settings}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          e.nativeEvent.stopImmediatePropagation();
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          e.preventDefault();
          e.nativeEvent.stopImmediatePropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          e.nativeEvent.stopImmediatePropagation();
        }}
      >
        {OfferPhotos.map((offerPhoto, key) => (
          <OfferSlideItem
            mykey={myKey}
            offerPhoto={offerPhoto}
            isSingle={false}
            priority={priority}
            key={key}
          />
        ))}
      </Slider>
      <OfferAvatars boutique={boutique} priority={false} />
    </div>
  );
}

export default OfferPhotosSlider;
