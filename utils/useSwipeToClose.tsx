import { useRef, useState, useCallback, useEffect } from "react";

interface SwipeToCloseOptions {
  threshold?: number; // Minimum distance in pixels to trigger close
  velocityThreshold?: number; // Minimum velocity to trigger close regardless of distance
  animationDuration?: number; // Duration of animation in ms
  onClose: () => void;
  enabled?: boolean;
}

interface SwipeState {
  isDragging: boolean;
  startY: number;
  currentY: number;
  deltaY: number;
  velocity: number;
}

export const useSwipeToClose = ({
  threshold = 100,
  velocityThreshold = 0.3,
  animationDuration = 300,
  onClose,
  enabled = true,
}: SwipeToCloseOptions) => {
  const elementRef = useRef<HTMLDivElement>(null);

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    startY: 0,
    currentY: 0,
    deltaY: 0,
    velocity: 0,
  });

  const [transform, setTransform] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const lastMoveTime = useRef(0);
  const startTime = useRef(0);

  const resetPosition = useCallback(() => {
    if (!elementRef.current) return;

    setIsAnimating(true);
    setTransform(0);

    elementRef.current.style.transition = `transform ${animationDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
    elementRef.current.style.transform = "translateY(0px)";

    setTimeout(() => {
      setIsAnimating(false);
      if (elementRef.current) {
        elementRef.current.style.transition = "";
      }
    }, animationDuration);
  }, [animationDuration]);

  const closeWithAnimation = useCallback(() => {
    if (!elementRef.current) return;

    setIsAnimating(true);
    const elementHeight = elementRef.current.offsetHeight;

    elementRef.current.style.transition = `transform ${animationDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
    elementRef.current.style.transform = `translateY(${elementHeight}px)`;

    setTimeout(() => {
      onClose();
      setIsAnimating(false);
      if (elementRef.current) {
        elementRef.current.style.transition = "";
        elementRef.current.style.transform = "";
      }
    }, animationDuration);
  }, [onClose, animationDuration]);

  const calculateVelocity = useCallback((deltaY: number, deltaTime: number) => {
    if (deltaTime === 0) return 0;
    return Math.abs(deltaY) / deltaTime;
  }, []);

  const handleStart = useCallback(
    (clientY: number) => {
      if (!enabled || isAnimating) return;

      const currentTime = Date.now();
      startTime.current = currentTime;
      lastMoveTime.current = currentTime;

      setSwipeState((prev) => ({
        ...prev,
        isDragging: true,
        startY: clientY,
        currentY: clientY,
        deltaY: 0,
        velocity: 0,
      }));

      // Remove any existing transition
      if (elementRef.current) {
        elementRef.current.style.transition = "";
      }
    },
    [enabled, isAnimating]
  );

  const handleMove = useCallback(
    (clientY: number) => {
      if (!swipeState.isDragging || !enabled || isAnimating) return;

      const currentTime = Date.now();
      const deltaY = clientY - swipeState.startY;
      const deltaTime = currentTime - lastMoveTime.current;

      // Only allow downward swipe
      if (deltaY < 0) return;

      const velocity = calculateVelocity(deltaY, deltaTime);
      lastMoveTime.current = currentTime;

      setSwipeState((prev) => ({
        ...prev,
        currentY: clientY,
        deltaY,
        velocity,
      }));

      // Apply transform immediately for smooth dragging
      setTransform(deltaY);
      if (elementRef.current) {
        // elementRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    },
    [
      swipeState.isDragging,
      swipeState.startY,
      enabled,
      isAnimating,
      calculateVelocity,
    ]
  );

  const handleEnd = useCallback(() => {
    if (!swipeState.isDragging || !enabled) return;

    const { deltaY, velocity } = swipeState;
    const shouldClose = deltaY > threshold || velocity > velocityThreshold;

    setSwipeState((prev) => ({
      ...prev,
      isDragging: false,
    }));

    if (shouldClose) {
      closeWithAnimation();
    } else {
      resetPosition();
    }
  }, [
    swipeState,
    threshold,
    velocityThreshold,
    enabled,
    closeWithAnimation,
    resetPosition,
  ]);

  // Touch events
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      // Only handle if touch starts at the top of the scrollable container
      const target = e.target as HTMLElement;
      const scrollContainer = target.closest("[data-swipe-container]");

      if (scrollContainer && scrollContainer.scrollTop > 0) {
        return; // Don't handle swipe if content is scrolled
      }

      handleStart(e.touches[0].clientY);
    },
    [handleStart]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (swipeState.isDragging) {
        e.preventDefault(); // Prevent scrolling while swiping
        handleMove(e.touches[0].clientY);
      }
    },
    [swipeState.isDragging, handleMove]
  );

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse events (for desktop testing)
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const scrollContainer = target.closest("[data-swipe-container]");

      if (scrollContainer && scrollContainer.scrollTop > 0) {
        return;
      }

      handleStart(e.clientY);
    },
    [handleStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (swipeState.isDragging) {
        e.preventDefault();
        handleMove(e.clientY);
      }
    },
    [swipeState.isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Setup event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    // Touch events
    element.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd);

    // Mouse events (for desktop)
    element.addEventListener("mousedown", handleMouseDown);

    if (swipeState.isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    enabled,
    swipeState.isDragging,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  ]);

  return {
    ref: elementRef,
    isDragging: swipeState.isDragging,
    transform,
    isAnimating,
    swipeState,
  };
};
