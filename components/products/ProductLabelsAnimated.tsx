"use client";

import { useEffect, useState } from "react";

interface Label {
  text: string;
  color: string;
}

interface Props {
  labels: Label[];
  displayDuration?: number; // Total time each label stays visible (including transition)
  transitionDuration?: number;
}

export const ProductLabelsAnimated = ({
  labels,
  displayDuration = 2000,
  transitionDuration = 500,
}: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentLabel = labels[currentIndex];

  useEffect(() => {
    if (labels.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % labels.length);
    }, displayDuration);

    return () => clearInterval(interval);
  }, [labels.length, displayDuration]);

  if (labels.length === 1) {
    return (
      <div className="relative h-6 min-w-[150px] overflow-hidden select-none">
        <span
          className="absolute text-[9px]"
          style={{
            color: labels[0].color,
            opacity: 1,
          }}
        >
          {labels[0].text}
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative h-6 min-w-[150px] overflow-hidden select-none"
      style={{ height: "1.5rem" }}
    >
      <span
        key={currentIndex} // this forces re-animation on each label
        className="absolute will-change-transform text-[9px] transition-all"
        style={{
          color: currentLabel.color,
          opacity: 1,
          transform: "translateY(0)",
          transition: `opacity ${transitionDuration}ms ease, transform ${transitionDuration}ms ease`,
          animation: `fadeSlide ${displayDuration}ms ease`,
        }}
      >
        {currentLabel.text}
      </span>

      {/* CSS animation injected locally */}
      <style jsx>{`
        @keyframes fadeSlide {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          10% {
            opacity: 1;
            transform: translateY(0);
          }
          90% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-12px);
          }
        }
      `}</style>
    </div>
  );
};
