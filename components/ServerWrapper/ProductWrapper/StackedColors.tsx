function StackedSlider({
  slide_width = 22,
  slide_height = 22,
  max_scale = 1,
  className = "",
  min_scale = 0.6,
  overlap_factor = 0.4,
  slidesArray = [],
  initial_index = 0,
  disableSlide = false,
  child_data_cy = "",
  children,
}) {
  const SLIDE_WIDTH = slide_width; // Works for 30, 50, 200
  const SLIDE_HEIGHT = slide_height == 0 ? slide_width : slide_height;
  const MAX_SCALE = max_scale;
  const MIN_SCALE = min_scale;
  const OVERLAP_FACTOR = overlap_factor;
  const slides = slidesArray;
  const getSlideStyle = (index) => {
    const distanceFromActive = index - initial_index;
    const offsetFactor = distanceFromActive + 0;
    const offsetX = offsetFactor * SLIDE_WIDTH * OVERLAP_FACTOR;
    const abs = Math.abs(offsetFactor);
    const scale = Math.max(MAX_SCALE - abs * 0.1, MIN_SCALE);
    const zIndex = 100 - Math.round(abs * 10);

    return {
      transform: `translateX(${offsetX}px) scale(${scale})`,
      zIndex,
      transition: "transform 0.3s ease",
      left: "50%",
      marginLeft: -SLIDE_WIDTH / 2,
    };
  };

  return (
    <div
      className={`relative w-full slider_slide h-[${
        SLIDE_HEIGHT + 10
      }px]  flex items-center justify-center no-navigate overflow-visible touch-none select-none ${className}`}
    >
      {children.map((slide, index) => {
        let isActive = initial_index === index;
        return (
          <div
            key={index}
            className={`${
              disableSlide ? "pointer-events-none no-navigate" : ""
            } absolute w-auto h-auto flex flex-col items-center justify-center`}
            style={getSlideStyle(index)}
            data-cy={child_data_cy}
          >
            {slide}
          </div>
        );
      })}
    </div>
  );
}
export default StackedSlider;
