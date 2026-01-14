"use client";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import { translateFunction } from "utils/functions";

function PropertiesMarquee({ shipping_cost, languageVariable }) {
  const marqueeRef = useRef(null);
  const requestRef = useRef(null);
  const directionRef = useRef(-1); // start moving left
  const positionRef = useRef(0);
  const isRtl = languageVariable === "ar" || languageVariable === "ku";
  useEffect(() => {
    const speed = 0.8; // pixels per frame
    const leftPadding = isRtl ? 50 : 20; // px space on left
    const rightPadding = isRtl ? 20 : 50; // px space on right

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
          gap: "9px",
          position: "absolute",
          whiteSpace: "nowrap",
          ...(!isRtl
            ? { left: 0, flexDirection: "row" }
            : { right: 0, flexDirection: "row-reverse" }),
        }}
      >
        <div className="product-prop-item m-0 flex-none">
          {translateFunction(
            "All Inclusive Without Additions",
            languageVariable
          )}
        </div>
        {shipping_cost === 0 && (
          <div className="product-prop-item m-0 flex-none">
            <img
              width={15}
              height={15}
              alt={translateFunction("truck", languageVariable)}
              src="/icons/greentruck.svg"
            />
            <span>{translateFunction("Free Shipping", languageVariable)}</span>
          </div>
        )}
        <div className="product-prop-item m-0 flex-none">
          <img
            width={15}
            height={15}
            alt={translateFunction("truck", languageVariable)}
            src="/icons/redtruck.svg"
          />
          <span>{translateFunction("Free Return", languageVariable)}</span>
        </div>
        <div className="product-prop-item m-0 flex-none">
          <Image
            src={"/icons/DeleiverIcon.svg"}
            width={11}
            height={11}
            alt="deleivery-icon"
          />
          <span>
            {translateFunction("Ship To You Accepted", languageVariable)}{" "}
            {translateFunction("2 June", languageVariable)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PropertiesMarquee;
