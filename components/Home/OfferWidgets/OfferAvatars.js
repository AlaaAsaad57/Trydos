import { useRef } from "react";
import OfferAvatar from "./OfferAvatar";
import MoreOfferAvatar from "./MoreOfferAvatar";
function OfferAvatars({ priority }) {
  const ref = useRef();
  const handleMove = (e) => {
    let elemnts = Array.from(ref.current.children);
    let clientX = e.clientX || e.touches[0]?.clientX;
    let Xmove = Math.abs(
      ((clientX - ref.current.getBoundingClientRect().left) * 100) /
        ref.current.clientWidth +
        5
    );
    elemnts.forEach((element) => {
      element.classList.remove("active-hover");
    });
    let index = parseInt(Xmove / (100 / elemnts.length));
    if (elemnts[index]) {
      elemnts[index].classList.add("active-hover");
    }
  };
  const handleEnd = () => {
    let elemnts = Array.from(ref.current.children);
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
      onMouseLeave={(e) => handleEnd(e)}
      onTouchEnd={(e) => handleEnd(e)}
      onMouseMove={(e) => handleMove(e)}
    >
      <OfferAvatar
        priority={priority}
        images={
          "https://res.cloudinary.com/djooohujg/image/upload/f_webp/q_50/1707907006?_a=DATC1RAAZAA0"
        }
        zIndex={1}
      />
      <OfferAvatar
        priority={priority}
        images={
          "https://res.cloudinary.com/djooohujg/image/upload/f_webp/q_50/1707907006?_a=DATC1RAAZAA0"
        }
        zIndex={2}
      />
      <OfferAvatar
        priority={priority}
        images={
          "https://res.cloudinary.com/djooohujg/image/upload/f_webp/q_50/1707907006?_a=DATC1RAAZAA0"
        }
        zIndex={3}
      />
      <OfferAvatar
        priority={priority}
        images={
          "https://res.cloudinary.com/djooohujg/image/upload/f_webp/q_50/1707907006?_a=DATC1RAAZAA0"
        }
        zIndex={4}
      />
      <OfferAvatar
        priority={priority}
        images={
          "https://res.cloudinary.com/djooohujg/image/upload/f_webp/q_50/1707907006?_a=DATC1RAAZAA0"
        }
        zIndex={5}
      />
      <MoreOfferAvatar
        priority={priority}
        images={
          "https://res.cloudinary.com/djooohujg/image/upload/f_auto/q_auto/1707907006?_a=DATC1RAAZAA0"
        }
        zIndex={100}
        viewed={5}
      />
    </div>
  );
}

export default OfferAvatars;
