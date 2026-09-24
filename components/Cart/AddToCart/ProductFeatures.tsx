import Image from "next/image";
import { useEffect, useRef } from "react";
import { translateFunction } from "utils/functions";
function PropertiesFeaturesInAddToCart() {
  const marqueeRef = useRef(null);
  const requestRef = useRef(null);
  const directionRef = useRef(-1); // start moving left
  const positionRef = useRef(0);

  useEffect(() => {
    const speed = 0.8; // pixels per frame
    const leftPadding = 20; // px space on left
    const rightPadding = 50; // px space on right

    const animate = () => {
      if (!marqueeRef.current) return;

      const containerWidth = marqueeRef.current.parentElement.offsetWidth;
      const contentWidth = marqueeRef.current.offsetWidth;

      // Only move if content is wider than container
      const maxScroll = Math.max(
        contentWidth - containerWidth + rightPadding,
        0
      );

      if (maxScroll === 0) {
        marqueeRef.current.style.transform = `translateX(${leftPadding}px)`;
        return;
      }

      positionRef.current += directionRef.current * speed;

      // Reverse direction at edges (with left and right padding)
      if (positionRef.current <= -maxScroll) {
        directionRef.current = 1; // move right
      } else if (positionRef.current >= leftPadding) {
        directionRef.current = -1; // move left
      }

      marqueeRef.current.style.transform = `translateX(${positionRef.current}px)`;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <div
      className="pl-[2px]"
      style={{
        overflow: "hidden",
        width: "100%",
        position: "relative",
        height: "16px",
      }}
    >
      <div
        ref={marqueeRef}
        style={{
          display: "flex",
          gap: "13px",
          position: "absolute",
          whiteSpace: "nowrap",
          left: 0,
        }}
      >
        <div className={`${"flex-row"} gap-[2px] flex-none`}>
          <Image src="/icons/FastIcon.svg" alt="Fast" width={11} height={11} />
          <div className={` text-[#388CFF] text-[9px] gap-[3px] flex`}>
            <span className="bold">{translateFunction("Fast Packing")}</span>
            <span>
              {translateFunction("& Today Shipping If Buy Before 13:00 Today")}
            </span>
          </div>
        </div>
        <div className={`${"flex-row"} gap-[2px] flex-none`}>
          {/* <Image
            src={"/icons/BestPriceIcon.svg"}
            alt="best-pricee"
            width={11}
            height={11}
          /> */}
          <div className={`text-[#388CFF] text-[9px] gap-[3px] flex`}>
            <span className="bold">{translateFunction("Best Price")}</span>
            <span>{translateFunction("Last 3 Days!")}</span>
          </div>
        </div>

        <div className={`${"flex-row"} gap-[2px] flex-none`}>
          {/* <Image
            src={"/icons/TrendIcon.svg"}
            alt="trend-icon"
            width={11}
            height={11}
          /> */}
          <div className="text-[#FF641A] text-[9px] gap-[3px] flex">
            <span className="bold">{translateFunction("Trend")}</span>
            <span>{translateFunction("Color !")}</span>
          </div>
        </div>

        <div className={`${"flex-row"} gap-[2px] flex-none`}>
          {/* <Image
            src={"/icons/BestSellIcon.svg"}
            alt="best sell"
            width={11}
            height={11}
          /> */}
          <div className={`text-[#513AAF] text-[9px] gap-[3px] flex`}>
            <span className="bold">{translateFunction("Best Sell")}</span>
            <span>{translateFunction("Last Week !")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertiesFeaturesInAddToCart;
