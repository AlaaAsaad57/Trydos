"use client";
import "styles/globals.css";
import { useRef, useState, useEffect } from "react";

export const Page = () => {
  try {
    return (
      <div className="w-full flex-col">
        <div className="w-full h-full flex items-center justify-center">
          <StackedSlider />
        </div>
        <ExampleUsage />
      </div>
    );
  } catch (error) {
    throw error;
  }
};
export default Page;

export function StackedSlider() {
  const SLIDE_WIDTH = 50; // Works for 30, 50, 200
  const MAX_SCALE = 1;
  const MIN_SCALE = 0.7;
  const OVERLAP_FACTOR = 0.4;
  const MAX_DRAG = SLIDE_WIDTH * 3;
  const THRESHOLD = 0.3; // 30% of slide width

  const slides = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const INITIAL_INDEX = Math.floor(slides.length / 2);

  const [activeIndex, setActiveIndex] = useState(INITIAL_INDEX);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [initialIndex, setInitialIndex] = useState(INITIAL_INDEX);

  const startX = useRef(0);
  const containerRef = useRef(null);
  const dragDistanceRef = useRef(0); // Track drag distance

  const handleStart = (e) => {
    setIsDragging(true);
    startX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    dragDistanceRef.current = 0;
    setInitialIndex(activeIndex);
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const delta = currentX - startX.current;

    if (e.cancelable) e.preventDefault();

    dragDistanceRef.current = Math.abs(delta); // Update drag distance
    const clamped = Math.max(Math.min(delta, MAX_DRAG), -MAX_DRAG);
    setDragOffset(clamped);

    const thresholdDistance = SLIDE_WIDTH * THRESHOLD;

    let slidesMoved = 0;
    if (Math.abs(clamped) >= thresholdDistance) {
      slidesMoved = Math.floor(Math.abs(clamped) / thresholdDistance);
      slidesMoved = clamped > 0 ? -slidesMoved : slidesMoved;
    }

    const newIndex = Math.min(
      Math.max(initialIndex + slidesMoved, 0),
      slides.length - 1
    );

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragOffset(0);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const options = { passive: false };

    el.addEventListener("touchstart", handleStart, options);
    el.addEventListener("touchmove", handleMove, options);
    el.addEventListener("touchend", handleEnd);

    el.addEventListener("mousedown", handleStart);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);

    return () => {
      el.removeEventListener("touchstart", handleStart);
      el.removeEventListener("touchmove", handleMove);
      el.removeEventListener("touchend", handleEnd);

      el.removeEventListener("mousedown", handleStart);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
    };
  }, [isDragging, dragOffset]);

  const getSlideStyle = (index) => {
    const distanceFromActive = index - activeIndex;
    const dragRatio = dragOffset / SLIDE_WIDTH;
    const offsetFactor = distanceFromActive + (isDragging ? dragRatio : 0);

    const offsetX = offsetFactor * SLIDE_WIDTH * OVERLAP_FACTOR;
    const abs = Math.abs(offsetFactor);
    const scale = Math.max(MAX_SCALE - abs * 0.1, MIN_SCALE);
    const zIndex = 100 - Math.round(abs * 10);

    return {
      transform: `translateX(${offsetX}px) scale(${scale})`,
      zIndex,
      transition: isDragging ? "none" : "transform 0.3s ease",
      left: "50%",
      marginLeft: -SLIDE_WIDTH / 2,
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[200px] flex items-center justify-center overflow-visible touch-none select-none"
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {slides.map((slide, index) => (
        <div
          key={index}
          onClick={() => {
            if (dragDistanceRef.current < 5) {
              setActiveIndex(index);
              setDragOffset(0);
            }
          }}
          className="absolute w-auto h-auto flex flex-col items-center justify-center"
          style={getSlideStyle(index)}
        >
          <img
            src={`https://placehold.co/200x200?text=${slide}`}
            alt={`Slide ${slide}`}
            className="w-[50px] h-[50px] rounded-full border-4 border-white shadow-lg object-cover"
          />
          <p
            className={`mt-4 text-center text-gray-700 font-medium transition-opacity duration-300 ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            Slide #{slide}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------- Usage example below ----------------

function useSlideTransition<T>({
  step,
  duration = 300,
  detectDirection = true,
  directionOverride,
  onTransitionStart,
  onTransitionEnd,
}: {
  step: T;
  duration?: number;
  detectDirection?: boolean;
  directionOverride?: "left" | "right" | "up" | "down";
  onTransitionStart?: (from: T, to: T) => void;
  onTransitionEnd?: (to: T) => void;
}) {
  const [current, setCurrent] = useState(step);
  const [previous, setPrevious] = useState<T | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [direction, setDirection] = useState<"left" | "right" | "up" | "down">(
    "right"
  );

  useEffect(() => {
    if (step === current || isTransitioning) return;

    onTransitionStart?.(current, step);
    setPrevious(current);
    setIsTransitioning(true);

    const calcDirection = (): typeof direction => {
      if (directionOverride) return directionOverride;
      if (typeof step === "number" && typeof current === "number") {
        return step > current ? "right" : "left";
      }
      return "right";
    };

    if (detectDirection || directionOverride) {
      setDirection(calcDirection());
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCurrent(step);
      setPrevious(null);
      setIsTransitioning(false);
      onTransitionEnd?.(step);
    }, duration);
  }, [step]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    currentStep: current,
    previousStep: previous,
    direction,
    isTransitioning,
    duration,
  };
}

// --- Component: SlideWidget ---
function SlideWidget({
  step,
  children,
  duration = 400,
}: {
  step: number;
  children: React.ReactNode[];
  duration?: number;
}) {
  const { currentStep, previousStep, direction, isTransitioning } =
    useSlideTransition<number>({
      step,
      duration,
    });

  const Current = children[currentStep] as React.ReactNode;
  const Previous =
    previousStep !== null ? (children[previousStep] as React.ReactNode) : null;

  const baseClasses =
    "absolute top-0 left-0 w-full h-full transition-transform ease-in-out";

  const getEnterClass = () => {
    if (!isTransitioning) return "translate-x-0";
    if (direction === "left") return "translate-x-full";
    if (direction === "right") return "-translate-x-full";
    if (direction === "up") return "translate-y-full";
    if (direction === "down") return "-translate-y-full";
    return "translate-x-0";
  };

  const getExitClass = () => {
    if (direction === "left") return "-translate-x-full";
    if (direction === "right") return "translate-x-full";
    if (direction === "up") return "-translate-y-full";
    if (direction === "down") return "translate-y-full";
    return "translate-x-full";
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {Previous && isTransitioning && (
        <div
          key={`prev-${previousStep}`}
          className={`${baseClasses} ${getExitClass()} z-10`}
          style={{ transitionDuration: `${duration}ms` }}
        >
          {Previous}
        </div>
      )}

      <div
        key={`curr-${currentStep}`}
        className={`${baseClasses} ${getEnterClass()} z-20`}
        style={{ transitionDuration: `${duration}ms` }}
      >
        {Current}
      </div>
    </div>
  );
}

// --- Function: ExampleUsage ---
export function ExampleUsage() {
  const [step, setStep] = useState(0);
  const total = 3;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <div className="w-full max-w-md h-[300px] border rounded-lg shadow relative">
        <SlideWidget step={step}>
          {[
            <div className="flex items-center justify-center w-full h-full bg-red-100 text-xl font-bold">
              Step 0
            </div>,
            <div className="flex items-center justify-center w-full h-full bg-blue-100 text-xl font-bold">
              Step 1
            </div>,
            <div className="flex items-center justify-center w-full h-full bg-green-100 text-xl font-bold">
              Step 2
            </div>,
          ]}
        </SlideWidget>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
        >
          Prev
        </button>
        <button
          onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
          className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}
