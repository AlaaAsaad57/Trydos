import { useRef, useState, useEffect } from "react";
export default function StackedSlider() {
  const SLIDE_WIDTH = 200;
  const MAX_SCALE = 1;
  const MIN_SCALE = 0.7;
  const OVERLAP_FACTOR = 0.4; // Better for circles
  const MAX_DRAG = SLIDE_WIDTH * 3;
  const THRESHOLD = 0.3; // 30% of slide width to trigger change (60px instead of 200px)
  const slides = [1, 2, 3, 4, 5];
  const INITIAL_INDEX = Math.floor(slides.length / 2);

  const [activeIndex, setActiveIndex] = useState(INITIAL_INDEX);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [initialIndex, setInitialIndex] = useState(INITIAL_INDEX); // Track starting index

  const startX = useRef(0);
  const containerRef = useRef(null);

  const handleStart = (e) => {
    setIsDragging(true);
    startX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    setInitialIndex(activeIndex); // Remember where we started
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const delta = currentX - startX.current;

    if (e.cancelable) e.preventDefault();

    setDragOffset(Math.max(Math.min(delta, MAX_DRAG), -MAX_DRAG));

    // Calculate how many slides to move based on drag distance
    const dragDistance = Math.abs(delta);
    const thresholdDistance = SLIDE_WIDTH * THRESHOLD;

    // For every threshold distance dragged, move one slide
    let slidesMoved = 0;
    if (dragDistance >= thresholdDistance) {
      slidesMoved = Math.floor(dragDistance / thresholdDistance);
      // Apply direction (dragging right = positive delta = decrease index)
      slidesMoved = delta > 0 ? -slidesMoved : slidesMoved;
    }

    // Calculate new index based on initial position
    const newIndex = Math.min(
      Math.max(initialIndex + slidesMoved, 0),
      slides.length - 1
    );

    // Update active index in real-time
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragOffset(0);
    // Active index is already set during dragging, no need to calculate again
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
    const offsetFactor = distanceFromActive + (isDragging ? dragRatio : 0); // ✅ Fixed direction

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
      className="relative w-full h-[300px] flex items-center justify-center overflow-visible touch-none select-none"
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {slides.map((slide, index) => (
        <div
          onClick={() => {
            setActiveIndex(index);
            setDragOffset(0);
          }}
          key={index}
          className="absolute w-auto h-auto flex flex-col items-center justify-center"
          style={getSlideStyle(index)}
        >
          <img
            src={`https://placehold.co/200x200?text=${slide}`}
            alt={`Slide ${slide}`}
            className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg object-cover"
          />
          {
            <p
              className={`${
                index === activeIndex && "opacity-100"
              } opacity-0 transition-all mt-4 text-center text-gray-700 font-medium`}
            >
              Slide #{slide}
            </p>
          }
        </div>
      ))}
    </div>
  );
}
