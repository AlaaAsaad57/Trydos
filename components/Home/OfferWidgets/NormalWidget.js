import React from "react";
import LogoOffer from "public/svg/offerlogo.svg";
import ManIcon from "public/svg/manIcon.svg";
import WomanIcon from "public/svg/WomanIcon.svg";
import OfferPhotosSlider from "./OfferPhotosSlider";
import KidsIcon from "public/svg/KidsIcon.svg";
import OfferSlideItem from "./OfferSlideItem";
import { useSelector } from "react-redux";
import { translate } from "utils/functions";
import OfferAvatars from "./OfferAvatars";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
const NormalWidget = ({ offer, myKey, onClick }) => {
  const language = useSelector((state) => state.homepage.language);
  const { ref, inView, entry } = useInView({
    /* Optional options */
    threshold: 0,
  });
  return (
    <Link
      ref={ref}
      href={"/listing"}
      prefetch={false}
      aria-label={`Go To listing Page`}
      className="offer-widget"
      key={myKey}
      onClick={() => onClick()}
    >
      {myKey === 0 ? (
        <>
          <>
            <Image
              fill
              alt="imageAlt"
              loading="eager"
              fetchPriority="high"
              priority={true}
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
                "https://res.cloudinary.com/djooohujg/image/upload/f_webp/1708506792?_a=DATC1RAAZAsA0&w=800&q=60"
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
                {translate(
                  "Mango Famous Turkish Brand Best Discounts",
                  language
                )}
              </div>
              {offer.photos.length > 1 ? (
                <OfferPhotosSlider priority={true} OfferPhotos={offer.photos} />
              ) : (
                <div className="offer-slider-container">
                  <OfferSlideItem priority={true} isSingle={true} />
                  <OfferAvatars priority={true} />
                </div>
              )}
            </div>
          </>
        </>
      ) : (
        <>
          {inView && (
            <>
              <Image
                fill
                alt="imageAlt"
                loading="eager"
                fetchPriority="high"
                priority={true}
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
                  "https://res.cloudinary.com/djooohujg/image/upload/f_webp/1708506792?_a=DATC1RAAZAsA0&w=800&q=60"
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
                  {translate(
                    "Mango Famous Turkish Brand Best Discounts",
                    language
                  )}
                </div>
                {offer.photos.length > 1 ? (
                  <OfferPhotosSlider OfferPhotos={offer.photos} />
                ) : (
                  <div className="offer-slider-container">
                    <OfferSlideItem isSingle={true} />
                    <OfferAvatars />
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
      {}
    </Link>
  );
};

export default NormalWidget;
