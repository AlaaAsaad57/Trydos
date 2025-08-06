"use client";
import { useRef } from "react";
import OfferAvatar from "./OfferAvatar";
import { useParams } from "next/navigation";
import MoreOfferAvatar from "./MoreOfferAvatar";
import { OfferAvatarsPropsType } from "models/componentType/OfferAvatarsPropsType";
function OfferAvatars({ priority, boutique }: OfferAvatarsPropsType) {
  const ref = useRef<HTMLDivElement>();
  const { lang } = useParams();
  const handleMove = (e: any) => {
    let elemnts: Element[] = Array.from(ref.current.children);
    let clientX = e.clientX || e.touches[0]?.clientX;
    let Xmove: number = Math.abs(
      ((clientX - ref.current.getBoundingClientRect().left) * 100) /
        ref.current.clientWidth +
        5
    );
    elemnts.forEach((element: Element) => {
      element.classList.remove("active-hover");
    });
    let index: number = Math.abs(Xmove / (100 / elemnts.length));
    if (elemnts[Math.round(index)]) {
      elemnts[Math.floor(index)].classList.add("active-hover");
    }
  };
  const handleEnd = () => {
    let elemnts: Element[] = Array.from(ref.current.children);
    elemnts.forEach((element) => {
      element.classList.remove("active-hover");
    });
  };

  return (
    <div
      ref={ref}
      className="offer-avatars-container"
      onTouchStart={(e) => handleMove(e)}
      onTouchMove={(e) => handleMove(e)}
      onMouseLeave={(e) => handleEnd()}
      onTouchEnd={(e) => handleEnd()}
      onMouseMove={(e) => handleMove(e)}
      onClick={() => {}}
    >
      {boutique?.childCategoriesForProductIds.map((product, index) => {
        if (index < 7) {
          if (product?.most_viewed_product_thumbnail)
            return (
              <OfferAvatar
                boutique={boutique}
                name={product.most_viewed_product_name}
                linkUrl={`/filters/boutiques/${boutique.slug}/categories/${product.slug}`}
                key={index}
                category={product.name}
                images={product?.most_viewed_product_thumbnail}
                zIndex={index + 1}
                priority={priority}
              />
            );
        }
      })}
      {boutique?.childCategoriesForProductIds?.length > 7 && (
        <MoreOfferAvatar
          priority={false}
          href={`/${lang}/filters/boutiques/${boutique?.slug}`}
          boutique={boutique}
          images={
            boutique?.childCategoriesForProductIds[7]
              .most_viewed_product_thumbnail
          }
          zIndex={100}
          viewed={6}
        />
      )}
    </div>
  );
}

export default OfferAvatars;
