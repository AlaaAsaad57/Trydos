import LogoOffer from "public/svg/offerlogo.svg";
import ManIcon from "public/svg/manIcon.svg";
import WomanIcon from "public/svg/WomanIcon.svg";
const OfferPhotosSlider = dynamic(() => import("./OfferPhotosSlider"));
import KidsIcon from "public/svg/KidsIcon.svg";
const QuickEventBar = dynamic(() => import("./QuickEventBar"));

import { useSelector } from "react-redux";
import { translate } from "utils/functions";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import dynamic from "next/dynamic";
function QuickOfferWidjet({ offer, onClick }: { offer: any; onClick: any }) {
  const language = useSelector((state: any) => state.homepage.language);
  const { ref, inView, entry } = useInView({
    /* Optional options */
    threshold: 0.3,
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
          <Image
            fill
            alt="imageAlt"
            loading="lazy"
            priority={false}
            style={{
              position: "absolute",
              top: "0px",
              left: "0px",
              borderRadius: "15px",
              zIndex: "1",
            }}
            objectFit="cover"
            objectPosition="center"
            src={
              "https://res.cloudinary.com/djooohujg/image/upload/q_50/w_800/f_webp/1708506792?_a=DATC1RAAZAA0&w=800&q=60"
            }
          />
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
            <OfferPhotosSlider
              extended={false}
              priority={false}
              OfferPhotos={offer.photos}
            />
          </div>
          <QuickEventBar />
        </>
      )}
    </Link>
  );
}

export default QuickOfferWidjet;
