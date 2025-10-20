"use client";
import { useRef, useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
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
  disableSlide = false,
  child_data_cy = "",
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
    if (!el || disableSlide) return;

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
      onSlideChange(active_index);
      setActiveIndex(active_index);
    }
  }, [active_index]);
  return (
    <div
      ref={containerRef}
      className={`relative w-full slider_slide h-[${SLIDE_HEIGHT + 10}px]  ${
        disableSlide ? "pointer-events-none no-navigate" : ""
      } flex items-center justify-center no-navigate overflow-visible touch-none select-none ${className}`}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {slides.map((slide, index) => {
        let isActive = activeIndex === index;
        return (
          <div
            key={index}
            onClick={(e) => {
              if (disableSlide) {
                e.stopPropagation();
                e.preventDefault();
              }
              if (dragDistanceRef.current < 5) {
                onSlideChange(index);
                setActiveIndex(index);
                setDragOffset(0);
              }
            }}
            className={`${
              disableSlide ? "pointer-events-none no-navigate" : ""
            } absolute w-auto h-auto flex flex-col items-center justify-center`}
            style={getSlideStyle(index)}
            data-cy={child_data_cy}
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
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: initialSlide,
    dragFree: false,
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });

  const [currentIndex, setCurrentIndex] = useState(initialSlide);

  // Handle slide change
  const handleSlideChange = () => {
    if (!emblaApi) return;
    const newIndex = emblaApi.selectedScrollSnap();
    setCurrentIndex(newIndex);
    onSlideChange(newIndex);
  };

  // Initialize Embla and set up event listeners
  useEffect(() => {
    if (!emblaApi) return;

    // Set initial slide
    if (initialSlide !== 0) {
      emblaApi.scrollTo(initialSlide);
    }

    // Listen for slide changes
    emblaApi.on("select", handleSlideChange);

    return () => {
      emblaApi.off("select", handleSlideChange);
    };
  }, [emblaApi, initialSlide]);

  // Update current index when initialSlide prop changes
  useEffect(() => {
    if (emblaApi && initialSlide !== currentIndex) {
      emblaApi.scrollTo(initialSlide);
    }
  }, [initialSlide, emblaApi, currentIndex]);

  return (
    <div
      className={`overflow-hidden relative ${parentClassName}`}
      style={{
        width: `${slideWidth}px`,
        height: `${slideHeight}px`,
        touchAction: "pan-y",
        cursor: "grab",
      }}
    >
      <div className="embla p-0" ref={emblaRef}>
        <div className="embla__container flex">
          {slidesArray.map((slide, index) => (
            <div
              key={index}
              className="embla__slide flex-shrink-0"
              style={{
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
    </div>
  );
};
