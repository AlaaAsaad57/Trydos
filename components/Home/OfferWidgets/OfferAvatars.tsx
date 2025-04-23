"use client";
import { useRef } from "react";
import OfferAvatar from "./OfferAvatar";
import { Boutique } from "models/offer";
import { useRouter } from "next/navigation";
import MoreOfferAvatar from "./MoreOfferAvatar";
import search from "services/search";

interface OfferAvatarsProps {
  priority: boolean;
  boutique: Boutique;
}
function OfferAvatars({ priority, boutique }: OfferAvatarsProps) {
  const ref = useRef<HTMLDivElement>();
  const router = useRouter();
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
      {boutique?.mainCategoriesForProductIds.map((product, index) => {
        if (index < 7) {
          if (product?.most_viewed_product_thumbnail.file_path)
            return (
              <OfferAvatar
                boutique={boutique}
                name={product.name}
                linkUrl={`/boutique/${boutique.slug}${search.getPageUrl({
                  term: "categories",
                  value: [product],
                })}`}
                key={index}
                category={product.name}
                images={product?.most_viewed_product_thumbnail.file_path}
                zIndex={index + 1}
                priority={priority}
              />
            );
        }
      })}
      {boutique?.childCategoriesForProductIds?.length > 7 && (
        <MoreOfferAvatar
          priority={false}
          images={
            boutique?.childCategoriesForProductIds[7]
              .most_viewed_product_thumbnail.file_path
          }
          zIndex={100}
          viewed={6}
        />
      )}
    </div>
  );
}

export default OfferAvatars;
