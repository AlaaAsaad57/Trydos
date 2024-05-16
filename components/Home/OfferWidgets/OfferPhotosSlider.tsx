import OfferSlideItem from "./OfferSlideItem";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import OfferAvatars from "./OfferAvatars";
interface OfferPhotosSliderProps {
  OfferPhotos: string[];
  extended: boolean;
  priority: boolean;
}
function OfferPhotosSlider({
  OfferPhotos,
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
    >
      <Slider {...settings}>
        {OfferPhotos.map((offerPhoto, key) => (
          <OfferSlideItem
            offerPhoto={offerPhoto}
            isSingle={false}
            priority={priority}
            key={key}
          />
        ))}
      </Slider>
      <OfferAvatars priority={false} />
    </div>
  );
}

export default OfferPhotosSlider;
