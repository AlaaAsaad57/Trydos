const OfferPhotosSlider = dynamic(() => import("./OfferPhotosSlider"));
const QuickEventBar = dynamic(() => import("./QuickEventBar"));
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import dynamic from "next/dynamic";
import OfferSlideItem from "./OfferSlideItem";
import OfferAvatars from "./OfferAvatars";
import NextLink from "Hooks/NextLink";
interface QuickOfferWidjetProps {
  offer: { photos: string[] };
  onClick: Function;
}
function QuickOfferWidjet({ offer, onClick }: QuickOfferWidjetProps) {
  const language: string = useSelector((state: any) => state.homepage.language);
  const { ref, inView, entry } = useInView({
    /* Optional options */
    threshold: 0.3,
  });
  return (
    <NextLink
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
            quality={60}
            priority={false}
            style={{
              position: "absolute",
              filter: "brightness(203%)",
              top: "0px",
              left: "0px",
              borderRadius: "15px",
              zIndex: "1",
            }}
            objectFit="cover"
            objectPosition="center"
            src={
              "https://res.cloudinary.com/djooohujg/image/upload/q_50/w_800/f_avif/1708506792?_a=DATC1RAAZAA0&w=800&q=60"
            }
          />

          <div className="offer-blured" />
          <div className="offer-container">
            <div className="offer-logo"></div>
            <div className="offer-category"></div>
            <div className="offer-desc">
              {translate("Mango Famous Turkish Brand Best Offers", language)}
            </div>
            <QuickEventBar />
            {offer.photos.length > 1 ? (
              <OfferPhotosSlider
                myKey={4}
                extended={false}
                priority={false}
                boutique={null}
                OfferPhotos={offer.photos}
              />
            ) : (
              <div className="offer-slider-container">
                <OfferSlideItem
                  mykey={4}
                  offerPhoto={null}
                  priority={true}
                  isSingle={true}
                />
                <OfferAvatars boutique={null} priority={true} />
              </div>
            )}
          </div>
        </>
      )}
    </NextLink>
  );
}

export default QuickOfferWidjet;
