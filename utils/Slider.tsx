import { useRef, useState, useEffect } from "react";
function StackedSlider({
  slide_width = 50,
  slide_height = 0,
  max_scale = 1,
  className = "",
  min_scale = 0.7,
  overlap_factor = 0.4,
  max_drag = 150,
  threshold = 0.3,
  slidesArray = [],
  initial_index = 0,
  active_index = -1,
  onSlideChange = (index) => {},
  renderSlide = ({ index, isActive, slide_width }) => {
    return (
      <>
        <img
          src={`https://placehold.co/200x200?text=${index}`}
          alt={`Slide ${index}`}
          className={`w-[${slide_width}px] h-[${slide_width}px] rounded-full border-4 border-white shadow-lg object-cover`}
        />
        <p
          className={`mt-4 text-center text-gray-700 font-medium transition-opacity duration-300 ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
        >
          Slide #{index}
        </p>
      </>
    );
  },
}) {
  const SLIDE_WIDTH = slide_width; // Works for 30, 50, 200
  const SLIDE_HEIGHT = slide_height == 0 ? slide_width : slide_height;
  const MAX_SCALE = max_scale;
  const MIN_SCALE = min_scale;
  const OVERLAP_FACTOR = overlap_factor;
  const MAX_DRAG = max_drag;
  const THRESHOLD = threshold; // 30% of slide width

  const slides = slidesArray;
  const INITIAL_INDEX = initial_index;

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
      onSlideChange(newIndex);
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
  useEffect(() => {
    if (active_index > -1) {
      console.log("active_index", active_index);
      onSlideChange(active_index);
      setActiveIndex(active_index);
    }
  }, [active_index]);
  return (
    <div
      ref={containerRef}
      className={`relative w-full slider_slide h-[${
        SLIDE_HEIGHT + 10
      }px] flex items-center justify-center overflow-visible touch-none select-none ${className}`}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {slides.map((slide, index) => {
        let isActive = activeIndex === index;
        return (
          <div
            key={index}
            onClick={() => {
              if (dragDistanceRef.current < 5) {
                onSlideChange(index);
                setActiveIndex(index);
                setDragOffset(0);
              }
            }}
            className="absolute w-auto h-auto flex flex-col items-center justify-center"
            style={getSlideStyle(index)}
          >
            {renderSlide({ index, isActive, slide_width: SLIDE_WIDTH })}
          </div>
        );
      })}
    </div>
  );
}
export default StackedSlider;

export const NormalSlider = ({
  slideWidth = 100,
  slideHeight = 100,
  slidesArray = [1, 1, 1, 1, 1],
  parentClassName = "",
  threshold = 3, // Minimum swipe in px to trigger slide change
  initialSlide = 0,
  renderSlide = ({ index, slide, isActive }) => {
    return <div>{index}</div>;
  },
  onSlideChange = (index) => {},
}) => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(initialSlide);
  const [startX, setStartX] = useState(null);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const slideCount = slidesArray.length;

  const clampIndex = (index) => Math.max(0, Math.min(slideCount - 1, index));

  // Handle swipe start
  const handleStart = (e) => {
    const x = e.type === "mousedown" ? e.clientX : e.touches[0].clientX;
    setStartX(x);
    setIsDragging(true);
  };

  const handleMove = (e) => {
    if (!isDragging || startX === null) return;
    const x = e.type === "mousemove" ? e.clientX : e.touches[0].clientX;
    const dx = x - startX;
    const newTranslate = -currentIndex * slideWidth + dx;
    setTranslateX(newTranslate);
  };

  const handleEnd = (e) => {
    if (!isDragging || startX === null) return;

    const x = e.type === "mouseup" ? e.clientX : e.changedTouches[0].clientX;
    const dx = x - startX;

    if (dx > threshold) {
      onSlideChange(clampIndex(currentIndex - 1));
      setCurrentIndex((prev) => clampIndex(prev - 1));
    } else if (dx < -threshold) {
      onSlideChange(clampIndex(currentIndex + 1));
      setCurrentIndex((prev) => clampIndex(prev + 1));
    }

    setStartX(null);
    setIsDragging(false);
  };

  // Global event listeners for better mouse handling
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
  }, [isDragging, startX, currentIndex, slideWidth, threshold]);

  // Animate to active slide
  useEffect(() => {
    if (!isDragging) {
      setTranslateX(-currentIndex * slideWidth);
    }
  }, [currentIndex, isDragging, slideWidth]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden relative ${parentClassName}`}
      style={{
        width: `${slideWidth}px`,
        height: `${slideHeight}px`,
        touchAction: "pan-y",
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <div
        ref={trackRef}
        className="flex transition-transform duration-300 ease-in-out"
        style={{
          transform: `translateX(${translateX}px)`,
          width: `${slideWidth * slideCount}px`,
          height: "100%",
        }}
      >
        {slidesArray.map((slide, index) => (
          <div
            key={index}
            style={{
              flex: "0 0 auto",
              width: `${slideWidth}px`,
              height: "100%",
            }}
          >
            {renderSlide({
              index,
              slide,
              isActive: index === currentIndex,
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
