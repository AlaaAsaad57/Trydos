import {
  MouseEvent,
  MutableRefObject,
  Ref,
  Touch,
  TouchEvent,
  useRef,
} from "react";
import OfferAvatar from "./OfferAvatar";
import MoreOfferAvatar from "./MoreOfferAvatar";
import { Boutique } from "models/offer";
interface OfferAvatarsProps {
  priority: Boolean;
  boutique: Boutique;
}
function OfferAvatars({ priority, boutique }: OfferAvatarsProps) {
  const ref = useRef<HTMLDivElement>();
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
            name={product.product_name}
            key={index}
            category={product.category_name}
            images={product.product_thumbnail}
            zIndex={index}
          />
        );
      })}
      {boutique?.childCategoriesForProductIds?.length > 5 && (
        <MoreOfferAvatar
          priority={false}
          images={
            "https://res.cloudinary.com/djooohujg/image/upload/f_webp/q_10/1707907006?_a=DATC1RAAZAA0"
          }
          zIndex={100}
          viewed={6}
        />
      )}
    </div>
  );
}

export default OfferAvatars;
