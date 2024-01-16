import React from "react";
import LogoOffer from "public/svg/offerlogo.svg";
import ManIcon from "public/svg/manIcon.svg";
import WomanIcon from "public/svg/WomanIcon.svg";
import OfferPhotosSlider from "./OfferPhotosSlider";
import KidsIcon from "public/svg/KidsIcon.svg";
import QuickEventBar from "./QuickEventBar";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
function QuickOfferWidjet({ offer, onClick }) {
  const language = useSelector((state) => state.homepage.language);
  const { ref, inView, entry } = useInView({
    /* Optional options */
    threshold: 0,
  });
  return (
    <Link
      ref={ref}
      prefetch={false}
      href={"/listing"}
      className="offer-widget quick-widget"
      aria-label={`Go To listing Page`}
      onClick={() => onClick()}
    >
      {inView && (
        <>
          <div className="offer-blured-background" />
          <div className="offer-blured" />
          <div className="offer-container">
            <div className="offer-logo">
              <LogoOffer />
            </div>
            <div className="offer-category">
              <ManIcon />
              <WomanIcon />
              <KidsIcon />
            </div>
            <div className="offer-desc">
              {translate("Mango Famous Turkish Brand Best Offers", language)}
            </div>
            <OfferPhotosSlider OfferPhotos={offer.photos} />
          </div>
          <QuickEventBar />
        </>
      )}
    </Link>
  );
}

export default QuickOfferWidjet;
