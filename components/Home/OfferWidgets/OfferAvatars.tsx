import { useRef } from "react";
import OfferAvatar from "./OfferAvatar";
import MoreOfferAvatar from "./MoreOfferAvatar";
import { Boutique } from "models/offer";
import { useRouter } from "next-nprogress-bar";

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
    >
      {boutique?.childCategoriesForProductIds.map((product, index) => {
        return (
          <OfferAvatar
            // @ts-ignore
            name={product.most_viewed_product_name}
            linkUrl={`/boutiques/${boutique.slug}?categories=${product.slug}`}
            key={index}
            category={product.count_products}
            // @ts-ignore
            images={product?.most_viewed_product_thumbnail}
            zIndex={index + 1}
            priority={priority}
          />
        );
      })}
      {boutique?.childCategoriesForProductIds?.length > 5 && (
        <MoreOfferAvatar
          priority={false}
          images={boutique?.childCategoriesForProductIds[5].product_thumbnail}
          zIndex={100}
          viewed={6}
        />
      )}
    </div>
  );
}

export default OfferAvatars;
