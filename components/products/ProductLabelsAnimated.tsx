"use client";

import { useEffect, useRef, useState } from "react";

interface Label {
  text: string;
  color: string;
}

interface Props {
  labels: Label[];
  displayDuration?: number;
  transitionDuration?: number;
  emptyDuration?: number;
}

export const ProductLabelsAnimated = ({
  labels,
  displayDuration = 2000,
  transitionDuration = 500,
  emptyDuration = 100,
}: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLabel, setShowLabel] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  const currentLabel = labels[currentIndex];

  // Intersection Observer

  // Animation loop
  useEffect(() => {
    let stepTimeout: NodeJS.Timeout;

    const startCycle = () => {
      // Step 1: Show label (invisible initially)
      setShowLabel(true);
      setAnimateIn(false); // Start in hidden state

      // Step 2: Wait a tick, then animate in
      requestAnimationFrame(() => {
        setAnimateIn(true);
      });

      // Step 3: After displayDuration, animate out
      stepTimeout = setTimeout(() => {
        setAnimateIn(false);

        // Step 4: After transitionDuration, hide label
        stepTimeout = setTimeout(() => {
          setShowLabel(false);

          // Step 5: After emptyDuration, show next label
          stepTimeout = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % labels.length);
          }, emptyDuration);
        }, transitionDuration);
      }, displayDuration);
    };
    if (labels.length > 1) startCycle();

    return () => {
      if (labels.length > 1) clearTimeout(stepTimeout);
      if (labels.length > 1) {
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, labels]);
  if (labels.length === 1) {
    return (
      <div
        ref={ref}
        className="relative h-6 min-w-[150px] overflow-hidden select-none"
        style={{ height: "1.5rem" }}
      >
        <span
          key={currentIndex}
          className="absolute will-change-transform transition-all text-[9px]"
          style={{
            color: "#388CFF",
            opacity: 1,
          }}
        >
          {labels[0]?.text}
        </span>
      </div>
    );
  }
  return (
    <div
      ref={ref}
      className="relative h-6 min-w-[150px] overflow-hidden select-none"
      style={{ height: "1.5rem" }}
    >
      {showLabel && (
        <span
          key={currentIndex}
          className="absolute will-change-transform transition-all text-[9px]"
          style={{
            color: "#388CFF",
            opacity: animateIn ? 1 : 0,
            transform: animateIn ? "translateY(0)" : "translateY(12px)",
            transition: `transform ${transitionDuration}ms ease, opacity ${transitionDuration}ms ease`,
          }}
        >
          {currentLabel?.text}
        </span>
      )}
    </div>
  );
};
