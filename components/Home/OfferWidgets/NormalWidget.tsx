"use client";
import OfferSlideItem from "./OfferSlideItem";
import { encode_utf8, getConfiguredImage } from "utils/functions";
import OfferAvatars from "./OfferAvatars";

import Image from "next/image";
import { Boutique } from "models/offer";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { dispatchRouteChangeEvent } from "Hooks/events";

import OfferPhotosSlider from "./OfferPhotosSlider";

interface NormalWidgetProps {
  boutique: Boutique;
  myKey: number;
  onClick: Function;
}
const NormalWidget = ({ boutique, myKey, onClick }: NormalWidgetProps) => {
  const router = useRouter();

  useEffect(() => {
    if (boutique.description) {
      encode_utf8({
        element: document.querySelectorAll(`#boutique-${boutique.id}`),
        s: boutique.description,
      });
    }
  }, []);
  return (
    <div
      onClick={(e) => {
        // @ts-ignore: Unreachable code error
        if (
          // @ts-ignore: Unreachable code error
          !e.target.closest(".offer-avatar") &&
          // @ts-ignore: Unreachable code error
          !e.target.closest(".offer-category")
        ) {
          router.push(`/boutiques/${boutique.slug}`);
          dispatchRouteChangeEvent("start", { to: "boutique" });
        }
      }}
      aria-label={`Go To listing Page`}
      className="offer-widget"
      key={myKey}
    >
      <>
        {/* {boutique.banners[0] && (
          <Image
            fill
            alt={"imageAlt" + myKey}
            loading={myKey < 2 ? "eager" : "lazy"}
            fetchPriority={myKey < 2 ? "high" : "low"}
            priority={myKey < 2}
            style={{
              position: "absolute",
              top: "0px",
              left: "0px",
              borderRadius: "15px",
              zIndex: "1",
              objectFit: "cover",
              objectPosition: "center",
            }}
            quality={60}
            unoptimized
            src={getConfiguredImage({
              src: boutique?.banners[0],
              width: 900,
              height: 342,
            })}
          />
        )}
        <div className="offer-blured" id={`blured-${boutique.id}`} /> */}
        <div className="offer-container cursor-pointer">
          <div className="offer-logo">
            {boutique.icon ? (
              <Image
                id={"img-" + boutique.id}
                className="object-contain"
                alt={boutique.name}
                loading={myKey < 2 ? "eager" : "lazy"}
                fetchPriority={myKey < 2 ? "high" : "low"}
                priority={myKey < 2}
                style={{
                  maxWidth: "187px",
                  width: "auto",
                  height: "20px",
                }}
                width={20}
                height={20}
                src={boutique?.icon?.replace(
                  "/upload",
                  `/upload/h_50/f_webp/q_auto`
                )}
              />
            ) : (
              boutique.name
            )}
          </div>
          <div className="offer-category">
            {boutique.mainCategoriesForProductIds.map((category, key) => {
              // @ts-ignore
              if (category?.flat_photo_path?.includes(".svg")) {
                return (
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      dispatchRouteChangeEvent("start", { to: "boutique" });
                      router.push(
                        `/boutiques/${boutique.slug}?categories=${category.category_id}`
                      );
                    }}
                    key={key}
                  >
                    <Image
                      id={"img-" + boutique.id}
                      alt={boutique.name}
                      loading={myKey < 2 ? "eager" : "lazy"}
                      fetchPriority={myKey < 2 ? "high" : "low"}
                      priority={myKey < 2}
                      width={12}
                      height={12}
                      // @ts-ignore
                      src={category.flat_photo_path?.replace(
                        "/upload",
                        `/upload/h_50/f_webp/q_auto`
                      )}
                    />
                  </div>
                );
              } else
                return (
                  <div
                    aria-label={`${category.category_name} products page`}
                    key={key}
                    onClick={(e) => {
                      e.preventDefault();
                      dispatchRouteChangeEvent("start", { to: "boutique" });
                      router.push(
                        `/boutiques/${boutique.slug}?categories=${category.category_id}`
                      );
                    }}
                  >
                    <Image
                      id={"img-" + boutique.id}
                      alt={boutique.name}
                      loading={myKey < 2 ? "eager" : "lazy"}
                      fetchPriority={myKey < 2 ? "high" : "low"}
                      priority={myKey < 2}
                      width={12}
                      height={12}
                      // @ts-ignore
                      src={category?.flat_photo_path?.file_path?.replace(
                        "/upload",
                        `/upload/h_50/f_webp/q_auto`
                      )}
                    />
                  </div>
                );
            })}
          </div>
          <div className="offer-desc" id={`boutique-${boutique.id}`}></div>
          {boutique.banners.length > 1 ? (
            <OfferPhotosSlider
              key={myKey}
              extended={false}
              myKey={myKey}
              priority={myKey < 2}
              boutique={boutique}
              OfferPhotos={boutique.banners}
            />
          ) : (
            <div className="offer-slider-container">
              <OfferSlideItem
                mykey={myKey}
                offerPhoto={boutique.banners[0]}
                priority={myKey < 2}
                isSingle={true}
              />
              <OfferAvatars boutique={boutique} priority={myKey < 2} />
            </div>
          )}
        </div>
      </>
    </div>
  );
};

export default NormalWidget;
