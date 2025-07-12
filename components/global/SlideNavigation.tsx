import { useEffect, useState, useRef } from "react";
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
export function SlideWidget({
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
    "absolute top-0 left-0 w-full h-full transition-transform ease-in-out flex items-end";

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

export { useSlideTransition };
export default SlideWidget;
