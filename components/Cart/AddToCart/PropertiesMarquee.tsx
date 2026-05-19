"use client";
import Image from "next/image";
import React, { useEffect, useMemo, useRef } from "react";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import { formatTimeForAddress } from "utils/tinyUtils";

function PropertiesMarquee({ shipping_cost, languageVariable, shippingDays }) {
  const { settings } = useAppStore();
  const marqueeRef = useRef(null);

  const shippingDate = useMemo(() => {
    const countryDays =
      Number(settings?.["starting_setting"]?.shipping_duration_days) || 0;
    const totalDays = Number(shippingDays || 0) + countryDays;
    if (totalDays <= 0) return null;
    return formatTimeForAddress(
      new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000).toString(),
      languageVariable,
    );
  }, [shippingDays, settings, languageVariable]);
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
        0,
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
            languageVariable,
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
            {shippingDate ?? translateFunction("Soon", languageVariable)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PropertiesMarquee;
