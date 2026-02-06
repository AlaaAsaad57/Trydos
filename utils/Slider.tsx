"use client";
import { useRef, useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";

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
              className="embla__slide shrink-0"
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
