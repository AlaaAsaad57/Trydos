import ImageLoader from "components/global/ImageLoader";
import BorderImage from "./BorderImage";
import { getId } from "utils/functions";
interface OfferSlideItemProps {
  isSingle: boolean;
  priority: boolean;
  offerPhoto: any;
  mykey: number;
}
function OfferSlideItem({
  isSingle,
  priority,
  mykey,
  offerPhoto,
}: OfferSlideItemProps) {
  let id = getId();

  return (
    <div className="offer-slide-item">
      <div className="image-offer">
        <div className="image-inner-shadow" style={{ height: "100%" }} />
        {
          <ImageLoader
            loading="eager"
            id={id}
            priority={mykey < 2}
            noLoader={true}
            style={{ borderRadius: "15px" }}
            fetchPriority={mykey < 2 ? "high" : "low"}
            className="OfferImage"
            src={offerPhoto}
            width={900}
            height={342}
            alt="offer"
          />
        }
        <BorderImage />
      </div>
    </div>
  );
}

export default OfferSlideItem;
